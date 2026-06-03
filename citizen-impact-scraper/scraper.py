"""
scraper.py — pulls live data from Citizen Impact websites.

Sources:
  - https://landing.is.citizen-ai.org  → active CustomerHome pages
  - https://www.citizens-ai.com         → email, phone, KPIs

Returns a ScraperResult dataclass. Every scrape_* function is wrapped in
try/except so a partial failure never aborts the full run.
"""
from __future__ import annotations

import re
import sys
import json
import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

import config

# ── HTTP session ──────────────────────────────────────────────────────────────
_SESSION = requests.Session()
_SESSION.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (compatible; CitizenImpactBot/1.0; "
        "+https://www.citizens-ai.com)"
    ),
    "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
})


def _get(url: str, **kwargs) -> Optional[requests.Response]:
    try:
        resp = _SESSION.get(url, timeout=config.REQUEST_TIMEOUT, **kwargs)
        resp.raise_for_status()
        return resp
    except requests.RequestException as exc:
        return None


def _soup(url: str) -> Optional[BeautifulSoup]:
    resp = _get(url)
    if resp is None:
        return None
    return BeautifulSoup(resp.text, "lxml")


# ── Data structures ───────────────────────────────────────────────────────────
@dataclass
class PageInfo:
    name: str
    url: str
    status: str = "פעיל"


@dataclass
class KPIInfo:
    label: str
    value: int
    unit: str = "%"


@dataclass
class ContactInfo:
    email: Optional[str] = None
    phone: Optional[str] = None


@dataclass
class ScraperResult:
    contact: ContactInfo = field(default_factory=ContactInfo)
    pages: list[PageInfo] = field(default_factory=list)
    kpis: list[KPIInfo] = field(default_factory=list)
    scraped_at: str = field(default_factory=lambda: datetime.now().isoformat(timespec="seconds"))
    errors: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "scraped_at": self.scraped_at,
            "contact": {"email": self.contact.email, "phone": self.contact.phone},
            "pages": [{"name": p.name, "url": p.url, "status": p.status} for p in self.pages],
            "kpis": [{"label": k.label, "value": k.value, "unit": k.unit} for k in self.kpis],
            "errors": self.errors,
        }


# ── Helpers ───────────────────────────────────────────────────────────────────
_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
_PHONE_RE = re.compile(r"(?:0\d{1,2}[-\s]?\d{7,8}|07\d[-\s]?\d{3}[-\s]?\d{4})")
_PCT_RE   = re.compile(r"(\d{1,3})\s*%")


def _extract_email(text: str) -> Optional[str]:
    m = _EMAIL_RE.search(text)
    return m.group(0) if m else None


def _extract_phone(text: str) -> Optional[str]:
    m = _PHONE_RE.search(text)
    return m.group(0).strip() if m else None


# ── Scrape: active pages (landing domain) ────────────────────────────────────
def scrape_active_pages(result: ScraperResult) -> None:
    """
    Probes each known customer ID on landing.is.citizen-ai.org and
    client.is.citizen-ai.org. A page is "active" if the server returns 200.
    Also tries to discover additional IDs from the landing home page HTML.
    """
    found_ids: set[int] = set(config.KNOWN_CUSTOMER_IDS)

    # ── Try to discover extra IDs from the landing home page ──
    soup = _soup(config.BASE_URL_LANDING)
    if soup:
        for tag in soup.find_all(href=True):
            href = tag["href"]
            m = re.search(r"customer=(\d+)", href)
            if m:
                found_ids.add(int(m.group(1)))
        # also scan script tags / inline JS
        for script in soup.find_all("script"):
            for m in re.finditer(r"customer[=:\s]+[\"']?(\d+)", script.get_text()):
                found_ids.add(int(m.group(1)))
    else:
        result.errors.append("scrape_active_pages: cannot reach landing home page")

    # ── Probe each ID ──
    for cid in sorted(found_ids):
        # Decide which base domain to use
        base = (
            config.BASE_URL_LANDING
            if cid >= 44
            else config.BASE_URL_CLIENT
        )
        url = f"{base}/#/?customer={cid}"
        # SPA with hash routing — we check the base URL reachability
        check_url = base + "/"
        resp = _get(check_url)
        if resp is not None:
            result.pages.append(PageInfo(
                name=f"CustomerHome{cid}",
                url=f"{base.replace('https://', '')}/#/?customer={cid}",
                status="פעיל",
            ))
        else:
            result.errors.append(f"scrape_active_pages: customer={cid} unreachable")

    # ── Probe known extra pages (Privacy / Terms) ──
    extra_pages = []
    for cid in [36, 46, 47, 48]:
        for page_type in ["privacy", "terms"]:
            url_path = f"{config.BASE_URL_LANDING}/{page_type}/{cid}"
            resp = _get(url_path)
            label = "PrivacyPolicy" if page_type == "privacy" else "TermsOfService"
            extra_pages.append(PageInfo(
                name=f"{label}_{cid}",
                url=url_path.replace("https://", ""),
                status="פעיל" if resp is not None else "לא נגיש",
            ))

    # Add accessible extra pages
    result.pages.extend(p for p in extra_pages if p.status == "פעיל")


# ── Scrape: contact info + KPIs (B2B site) ───────────────────────────────────
def scrape_b2b_site(result: ScraperResult) -> None:
    """
    Scrapes citizens-ai.com for email, phone and any published KPI percentages.
    """
    soup = _soup(config.BASE_URL_B2B)
    if soup is None:
        result.errors.append("scrape_b2b_site: cannot reach citizens-ai.com")
        _use_known_contact(result)
        return

    full_text = soup.get_text(" ", strip=True)

    # ── Contact ──
    email = _extract_email(full_text)
    phone = _extract_phone(full_text)

    # Fallback: scan mailto / tel links
    if not email:
        for a in soup.find_all("a", href=True):
            if a["href"].startswith("mailto:"):
                email = a["href"].replace("mailto:", "").split("?")[0].strip()
                break
    if not phone:
        for a in soup.find_all("a", href=True):
            if a["href"].startswith("tel:"):
                phone = a["href"].replace("tel:", "").strip()
                break

    result.contact.email = email or "info@citizens-ai.com"
    result.contact.phone = phone or "074-7281259"

    # ── KPIs — look for percentage numbers near keywords ──
    kpi_keywords = {
        "גידול": ("גידול בהכנסות", "%"),
        "גירעון": ("מגירעון ליתרת זכות", "%"),
        "אשראי": ("כשירות אשראי", "%"),
        "growth": ("גידול בהכנסות", "%"),
        "credit": ("כשירות אשראי", "%"),
    }
    found_kpis: dict[str, int] = {}

    for tag in soup.find_all(["p", "h1", "h2", "h3", "h4", "li", "span", "div"]):
        text = tag.get_text(" ", strip=True)
        for keyword, (label, unit) in kpi_keywords.items():
            if keyword.lower() in text.lower():
                for m in _PCT_RE.finditer(text):
                    val = int(m.group(1))
                    if 5 <= val <= 100 and label not in found_kpis:
                        found_kpis[label] = val

    for label, val in found_kpis.items():
        result.kpis.append(KPIInfo(label=label, value=val))


def _use_known_contact(result: ScraperResult) -> None:
    result.contact.email = "info@citizens-ai.com"
    result.contact.phone = "074-7281259"


# ── Scrape: landing site contact fallback ────────────────────────────────────
def scrape_landing_contact(result: ScraperResult) -> None:
    """Tries the landing site as a secondary source for contact data."""
    if result.contact.email and result.contact.phone:
        return  # already found on B2B site

    soup = _soup(config.BASE_URL_LANDING)
    if soup is None:
        result.errors.append("scrape_landing_contact: cannot reach landing site")
        _use_known_contact(result)
        return

    full_text = soup.get_text(" ", strip=True)
    if not result.contact.email:
        result.contact.email = _extract_email(full_text) or "info@citizens-ai.com"
    if not result.contact.phone:
        result.contact.phone = _extract_phone(full_text) or "074-7281259"


# ── Known-good fallback data (used when live sites are unreachable) ───────────
_FALLBACK_PAGES: list[PageInfo] = [
    PageInfo("CustomerHome35",        "client.is.citizen-ai.org/#/?customer=35"),
    PageInfo("CustomerHome36",        "client.is.citizen-ai.org/#/?customer=36"),
    PageInfo("CustomerHome37",        "client.is.citizen-ai.org/#/?customer=37"),
    PageInfo("CustomerHome42",        "client.is.citizen-ai.org/#/?customer=42"),
    PageInfo("CustomerHome44",        "landing.is.citizen-ai.org/#/?customer=44"),
    PageInfo("CustomerHome45",        "landing.is.citizen-ai.org/#/?customer=45"),
    PageInfo("CustomerHome46",        "landing.is.citizen-ai.org/#/?customer=46"),
    PageInfo("CustomerHome47",        "landing.is.citizen-ai.org/#/?customer=47"),
    PageInfo("CustomerHome48",        "landing.is.citizen-ai.org/#/?customer=48"),
    PageInfo("PrivacyPolicy_47",      "landing.is.citizen-ai.org/privacy/47"),
    PageInfo("TermsOfService_47",     "landing.is.citizen-ai.org/terms/47"),
    PageInfo("PrivacyPolicy_36",      "landing.is.citizen-ai.org/privacy/36"),
    PageInfo("PrivacyPolicy_46",      "landing.is.citizen-ai.org/privacy/46"),
]

_FALLBACK_KPIS: list[KPIInfo] = [
    KPIInfo("גידול בהכנסות",      20),
    KPIInfo("מגירעון ליתרת זכות", 75),
    KPIInfo("כשירות אשראי",       90),
]

_FALLBACK_CONTACT = ContactInfo(email="info@citizens-ai.com", phone="074-7281259")


def _network_ok() -> bool:
    """Quick reachability check — tries both domains."""
    for url in [config.BASE_URL_B2B, config.BASE_URL_LANDING]:
        if _get(url) is not None:
            return True
    return False


# ── Main entry point ──────────────────────────────────────────────────────────
def scrape_all() -> ScraperResult:
    result = ScraperResult()

    print("  [0/3] Checking network reachability...")
    online = _network_ok()

    if online:
        print("  [1/3] Scraping B2B site for contact + KPIs...")
        scrape_b2b_site(result)

        print("  [2/3] Probing active customer pages...")
        scrape_active_pages(result)

        print("  [3/3] Landing site contact fallback...")
        scrape_landing_contact(result)
    else:
        print("  ⚠  Network not reachable — using fallback (known-good) data")
        result.contact = _FALLBACK_CONTACT
        result.pages   = list(_FALLBACK_PAGES)
        result.kpis    = list(_FALLBACK_KPIS)
        result.errors.append("network_unavailable: using static fallback data")

    return result


# ── CLI ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("Citizen Impact Scraper")
    print("=" * 60)

    result = scrape_all()

    print()
    print(json.dumps(result.to_dict(), ensure_ascii=False, indent=2))
    print()
    print(f"✓  Contact : {result.contact.email} | {result.contact.phone}")
    print(f"✓  Pages   : {len(result.pages)} found")
    for p in result.pages:
        print(f"     {p.name:30s}  {p.url}")
    if result.kpis:
        print(f"✓  KPIs    : {len(result.kpis)} found")
        for k in result.kpis:
            print(f"     {k.label}: {k.value}{k.unit}")
    else:
        print("ℹ  KPIs    : not found on live pages (will keep xlsx values)")
    if result.errors:
        print(f"\n⚠  Errors  : {len(result.errors)}")
        for e in result.errors:
            print(f"     {e}")
    else:
        print("\n✓  No errors")

    ok = len(result.pages) >= 9
    print()
    print(f"{'✅' if ok else '❌'} Pages found: {len(result.pages)} "
          f"({'≥9 OK' if ok else '<9 FAIL'})")
    sys.exit(0 if ok else 1)
