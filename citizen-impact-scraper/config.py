"""
config.py — loads settings from .env (falls back to .env.example values).
"""
import os
from pathlib import Path
from dotenv import load_dotenv

_here = Path(__file__).parent
load_dotenv(_here / ".env", override=False)
load_dotenv(_here / ".env.example", override=False)

BASE_URL_B2B     = os.getenv("BASE_URL_B2B",     "https://www.citizens-ai.com")
BASE_URL_LANDING = os.getenv("BASE_URL_LANDING",  "https://landing.is.citizen-ai.org")
BASE_URL_CLIENT  = os.getenv("BASE_URL_CLIENT",   "https://client.is.citizen-ai.org")
EXCEL_PATH       = os.getenv("EXCEL_PATH",        "../citizen_impact_full.xlsx")
LOG_PATH         = os.getenv("LOG_PATH",          "logs/update_log.txt")
REQUEST_TIMEOUT  = int(os.getenv("REQUEST_TIMEOUT", "15"))
SCHEDULE_HOUR    = int(os.getenv("SCHEDULE_HOUR",   "6"))
SCHEDULE_MINUTE  = int(os.getenv("SCHEDULE_MINUTE", "0"))

# Known customer IDs to probe on the client/landing domains
KNOWN_CUSTOMER_IDS = [35, 36, 37, 42, 44, 45, 46, 47, 48]
