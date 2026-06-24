'use client';

import { useState } from 'react';

interface DesignPreset {
  id: string;
  name: string;
  tag: string;
  prompt: string;
  preview: React.ReactNode;
}

interface DesignGalleryProps {
  onApply: (prompt: string) => void;
  isGenerating: boolean;
}

// Shared instruction — apply STYLE ONLY, keep all content/logic intact
const STYLE_ONLY = 'Important: keep all existing content, text, data, structure, and logic exactly as they are. Change only the visual design — colors, fonts, spacing, shadows, corner radius, and component styling. Do not change a single word of content.';

type GallerySection = 'shapes' | 'templates' | 'apps' | 'styles';

// ── Mini visual previews ─────────────────────────────────────────────────────

function GlassPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
      <div className="absolute inset-2 rounded-md" style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.4)' }} />
      <div className="absolute bottom-2 right-2 w-6 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.6)' }} />
    </div>
  );
}

function BrutalPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: '#FFE600' }}>
      <div className="absolute inset-x-2 top-2 h-3 rounded-sm" style={{ background: '#FF5C00', border: '2px solid #000', boxShadow: '2px 2px 0 #000' }} />
      <div className="absolute bottom-2 right-2 w-7 h-3 rounded-sm" style={{ background: '#00E0FF', border: '2px solid #000', boxShadow: '2px 2px 0 #000' }} />
    </div>
  );
}

function MinimalPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative bg-white border border-gray-100">
      <div className="absolute inset-x-3 top-3 h-1 rounded-full bg-gray-900" />
      <div className="absolute inset-x-3 top-5 h-0.5 rounded-full bg-gray-200" />
      <div className="absolute bottom-2.5 right-3 w-6 h-2 rounded-md bg-gray-900" />
    </div>
  );
}

function DarkProPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: '#0a0a14' }}>
      <div className="absolute inset-x-2 top-2 h-2.5 rounded-md" style={{ background: '#1a1a2e', border: '1px solid #2dd4bf' }} />
      <div className="absolute bottom-2 right-2 w-7 h-2.5 rounded-md" style={{ background: 'linear-gradient(90deg,#2dd4bf,#06b6d4)', boxShadow: '0 0 8px #2dd4bf' }} />
    </div>
  );
}

function GradientPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: 'linear-gradient(135deg,#f093fb,#f5576c,#4facfe)' }}>
      <div className="absolute inset-2 rounded-md" style={{ background: 'rgba(255,255,255,0.18)' }} />
      <div className="absolute bottom-2 right-2 w-6 h-2 rounded-full bg-white/80" />
    </div>
  );
}

function NeuPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: '#e0e5ec' }}>
      <div className="absolute inset-x-2 top-2.5 h-2.5 rounded-full" style={{ background: '#e0e5ec', boxShadow: 'inset 2px 2px 4px #b8bcc4, inset -2px -2px 4px #fff' }} />
      <div className="absolute bottom-2.5 right-2 w-6 h-2.5 rounded-full" style={{ background: '#e0e5ec', boxShadow: '2px 2px 4px #b8bcc4, -2px -2px 4px #fff' }} />
    </div>
  );
}

function LiquidGlassPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #e0f2fe, #fce7f3, #f3e8ff)' }}>
      <div className="absolute inset-2 rounded-md" style={{ background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: 'inset 0 0 12px -4px rgba(255,255,255,0.5)' }} />
      <div className="absolute bottom-2 right-2 w-6 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.7)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} />
    </div>
  );
}

function M3ExpressivePreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative bg-white">
      <div className="absolute top-2 right-2 w-8 h-3.5" style={{ borderRadius: '12px', background: '#e8def8' }} />
      <div className="absolute inset-x-2 top-7 h-2 rounded-lg" style={{ background: '#f3edf7' }} />
      <div className="absolute bottom-2 right-2 w-7 h-7 rounded-2xl flex items-center justify-center" style={{ background: '#6750a4', boxShadow: '0 2px 6px rgba(103,80,164,0.3)' }}>
        <div className="w-2 h-0.5 bg-white rounded-full" />
      </div>
    </div>
  );
}

function FoodPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative bg-white">
      <div className="absolute inset-x-2 top-2 h-3.5 rounded-lg" style={{ background: 'linear-gradient(135deg,#ff8008,#ffc837)' }} />
      <div className="absolute bottom-2 right-2 w-8 h-2.5 rounded-full" style={{ background: '#ff5722' }} />
      <div className="absolute bottom-2 left-2 w-3 h-2.5 rounded-md bg-gray-100" />
    </div>
  );
}

function FintechPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: '#0f172a' }}>
      <div className="absolute inset-x-2 top-2 h-3 rounded-lg" style={{ background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)' }} />
      <div className="absolute bottom-2 right-2 flex gap-0.5 items-end">
        {[3, 5, 4, 7, 6].map((h, i) => <div key={i} className="w-1 rounded-sm" style={{ height: h, background: '#22c55e' }} />)}
      </div>
    </div>
  );
}

function FitnessPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: '#18181b' }}>
      <div className="absolute inset-x-2 top-2 h-3 rounded-lg" style={{ background: 'linear-gradient(135deg,#a3e635,#22d3ee)' }} />
      <div className="absolute bottom-2 right-2 w-7 h-2.5 rounded-full" style={{ background: '#a3e635', boxShadow: '0 0 6px #a3e635' }} />
    </div>
  );
}

function EcomPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative bg-white">
      <div className="absolute inset-x-2 top-2 grid grid-cols-2 gap-1">
        <div className="h-3 rounded bg-gradient-to-br from-purple-400 to-pink-400" />
        <div className="h-3 rounded bg-gradient-to-br from-blue-400 to-cyan-400" />
      </div>
      <div className="absolute bottom-2 right-2 w-7 h-2 rounded-full bg-gray-900" />
    </div>
  );
}

function SocialPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative bg-white">
      <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-gradient-to-br from-pink-500 to-violet-500" />
      <div className="absolute top-2.5 right-6 left-2 h-1 rounded-full bg-gray-200" />
      <div className="absolute inset-x-2 bottom-2 h-3 rounded-lg bg-gray-100" />
    </div>
  );
}

// ── New famous app previews ──────────────────────────────────────────────────

function WhatsAppPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: '#111b21' }}>
      <div className="absolute inset-x-0 top-0 h-3" style={{ background: '#1f2c34' }} />
      <div className="absolute top-4 right-2 left-4 h-2 rounded-lg" style={{ background: '#005c4b' }} />
      <div className="absolute top-7.5 right-4 left-2 h-2 rounded-lg" style={{ background: '#1f2c34' }} />
      <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full" style={{ background: '#00a884' }} />
    </div>
  );
}

function SpotifyPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: '#121212' }}>
      <div className="absolute inset-x-2 top-2 h-4 rounded-md" style={{ background: 'linear-gradient(180deg,#3d2878,#121212)' }} />
      <div className="absolute bottom-2 right-2 left-2 h-2.5 rounded-full" style={{ background: '#282828' }}>
        <div className="absolute inset-y-0 right-0 w-3/5 rounded-full" style={{ background: '#1db954' }} />
      </div>
    </div>
  );
}

function TikTokPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: '#000' }}>
      <div className="absolute inset-2 rounded-md bg-gradient-to-b from-transparent to-black/60" />
      <div className="absolute bottom-2 right-2 flex flex-col gap-1 items-center">
        <div className="w-3 h-3 rounded-full border border-white/60" />
        <div className="w-2 h-2 rounded-sm" style={{ background: '#fe2c55' }} />
      </div>
      <div className="absolute bottom-2 left-2 right-6 h-1 rounded-full bg-white/30" />
    </div>
  );
}

function ApplePreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: '#f5f5f7' }}>
      <div className="absolute inset-x-2 top-2 h-2 rounded-md bg-white" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }} />
      <div className="absolute inset-x-2 top-5.5 h-3.5 rounded-xl bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} />
      <div className="absolute bottom-2 right-2 w-7 h-2.5 rounded-full" style={{ background: '#007aff' }} />
    </div>
  );
}

function UberPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative bg-white">
      <div className="absolute inset-x-2 top-2 h-4 rounded-md" style={{ background: '#f6f6f6' }}>
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-black" />
      </div>
      <div className="absolute bottom-2 right-2 w-8 h-3 rounded-lg bg-black" />
    </div>
  );
}

function GooglePreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative bg-white">
      <div className="absolute top-2 right-2 flex gap-0.5">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#4285f4' }} />
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#ea4335' }} />
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#fbbc04' }} />
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#34a853' }} />
      </div>
      <div className="absolute inset-x-2 bottom-2 h-3 rounded-full border border-gray-200" />
    </div>
  );
}

// ── Button shape visual previews ─────────────────────────────────────────────

function ButtonShapePreview({ radius, shadow, border }: { radius: string; shadow?: string; border?: string }) {
  return (
    <div className="w-full h-7 flex items-center justify-center">
      <div
        className="w-14 h-5 flex items-center justify-center text-[8px] text-white font-bold"
        style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: radius,
          boxShadow: shadow || '0 2px 6px rgba(0,0,0,0.15)',
          border: border || 'none',
        }}
      >
        Button
      </div>
    </div>
  );
}

function CardShapePreview({ radius, shadow, border }: { radius: string; shadow?: string; border?: string }) {
  return (
    <div className="w-full h-7 flex items-center justify-center">
      <div
        className="w-14 h-5 bg-white flex items-start p-1 gap-1"
        style={{
          borderRadius: radius,
          boxShadow: shadow || '0 2px 8px rgba(0,0,0,0.08)',
          border: border || '1px solid #e5e7eb',
        }}
      >
        <div className="w-2 h-2 rounded-sm bg-gray-200 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-0.5 bg-gray-300 rounded-full mb-0.5 w-full" />
          <div className="h-0.5 bg-gray-200 rounded-full w-3/4" />
        </div>
      </div>
    </div>
  );
}

function InputShapePreview({ radius, style: inputStyle }: { radius: string; style: string }) {
  return (
    <div className="w-full h-7 flex items-center justify-center">
      <div
        className="w-14 h-4 flex items-center px-1.5"
        style={{
          borderRadius: radius,
          background: inputStyle === 'filled' ? '#f1f5f9' : 'white',
          border: inputStyle === 'underline' ? 'none' : `1px solid ${inputStyle === 'filled' ? 'transparent' : '#d1d5db'}`,
          borderBottom: inputStyle === 'underline' ? '2px solid #6366f1' : undefined,
        }}
      >
        <div className="h-0.5 bg-gray-300 rounded-full w-3/5" />
      </div>
    </div>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────

const BUTTON_SHAPES = [
  {
    id: 'square', name: 'Sharp', preview: <ButtonShapePreview radius="4px" />,
    prompt: `Change all buttons in the app to a sharp (square) design: border-radius: 4px, minimum height 48dp, padding: 12px 24px, subtle shadows. ${STYLE_ONLY}`,
  },
  {
    id: 'rounded', name: 'Rounded', preview: <ButtonShapePreview radius="12px" />,
    prompt: `Change all buttons in the app to a rounded design: border-radius: 12px, minimum height 48dp, padding: 12px 24px, soft shadows. ${STYLE_ONLY}`,
  },
  {
    id: 'pill', name: 'Pill', preview: <ButtonShapePreview radius="9999px" />,
    prompt: `Change all buttons in the app to a pill design: border-radius: 9999px, minimum height 48dp, padding: 12px 32px, modern feel. ${STYLE_ONLY}`,
  },
  {
    id: 'outline', name: 'Outline', preview: <ButtonShapePreview radius="10px" border="2px solid #6366f1" shadow="none" />,
    prompt: `Change all buttons in the app to an outline style: transparent background, border: 2px solid with the primary color, border-radius: 10px, minimum height 48dp, padding: 12px 24px, text in the primary color. ${STYLE_ONLY}`,
  },
  {
    id: 'soft', name: 'Soft', preview: <ButtonShapePreview radius="14px" shadow="0 4px 14px rgba(99,102,241,0.25)" />,
    prompt: `Change all buttons to a soft style: border-radius: 14px, minimum height 48dp, padding: 12px 24px, subtle gradient background, soft colored shadow (box-shadow using the button color), a hover effect that lifts the button up. ${STYLE_ONLY}`,
  },
  {
    id: 'brutal-btn', name: 'Brutal', preview: <ButtonShapePreview radius="4px" shadow="3px 3px 0 #000" border="2px solid #000" />,
    prompt: `Change all buttons to a neo-brutalism style: border: 2px solid #000, box-shadow: 3px 3px 0 #000, border-radius: 4px, minimum height 48dp, padding: 12px 24px, bold colorful background, bold text. ${STYLE_ONLY}`,
  },
];

const CARD_SHAPES = [
  {
    id: 'flat', name: 'Flat', preview: <CardShapePreview radius="4px" shadow="none" border="1px solid #e5e7eb" />,
    prompt: `Change all cards to a flat design: no shadows, thin border (#e5e7eb), border-radius: 4px, white background, padding: 16px, internal spacing based on an 8px grid. ${STYLE_ONLY}`,
  },
  {
    id: 'elevated', name: 'Elevated', preview: <CardShapePreview radius="12px" shadow="0 4px 16px rgba(0,0,0,0.08)" border="none" />,
    prompt: `Change all cards to an elevated design: box-shadow: 0 4px 16px rgba(0,0,0,0.08), no border, border-radius: 12px, white background, padding: 16px, internal spacing based on an 8px grid. ${STYLE_ONLY}`,
  },
  {
    id: 'glass-card', name: 'Glass', preview: <CardShapePreview radius="16px" shadow="0 8px 32px rgba(0,0,0,0.06)" border="1px solid rgba(255,255,255,0.5)" />,
    prompt: `Change all cards to a glass style: background: rgba(255,255,255,0.7), backdrop-filter: blur(12px), border: 1px solid rgba(255,255,255,0.5), border-radius: 16px, soft shadow, padding: 16px, internal spacing based on an 8px grid. ${STYLE_ONLY}`,
  },
  {
    id: 'bordered', name: 'Outline', preview: <CardShapePreview radius="8px" shadow="none" border="2px solid #e0e7ff" />,
    prompt: `Change all cards to an outline design: border: 2px solid (subtle border color), no shadow, border-radius: 8px, white background, padding: 16px, internal spacing based on an 8px grid. ${STYLE_ONLY}`,
  },
];

const INPUT_SHAPES = [
  {
    id: 'outlined', name: 'Outlined', preview: <InputShapePreview radius="8px" style="outlined" />,
    prompt: `Change all input fields in the app to an outlined style: border: 1px solid #d1d5db, border-radius: 8px, white background, colored border on focus. ${STYLE_ONLY}`,
  },
  {
    id: 'filled', name: 'Filled', preview: <InputShapePreview radius="8px" style="filled" />,
    prompt: `Change all input fields to a filled style: light gray background (#f1f5f9), no border, border-radius: 8px, lighter background on focus. ${STYLE_ONLY}`,
  },
  {
    id: 'underline', name: 'Underline', preview: <InputShapePreview radius="0px" style="underline" />,
    prompt: `Change all input fields to an underline style: no regular border, only a border-bottom in the primary color, transparent background, minimal look. ${STYLE_ONLY}`,
  },
  {
    id: 'rounded-input', name: 'Rounded', preview: <InputShapePreview radius="9999px" style="outlined" />,
    prompt: `Change all input fields to a rounded style: border-radius: 9999px, thin border, wide horizontal padding, modern look. ${STYLE_ONLY}`,
  },
];

const SCREEN_TEMPLATES = [
  {
    id: 'login-modern', name: 'Modern Login', icon: '🔐', tag: 'Auth',
    prompt: 'Add a clean login screen: text logo at the top, email and password fields (48px height) with placeholders, a full solid-color "Sign in" button, an "or" separator with Google/Apple buttons, "Forgot password" and "Sign up" links. Minimal design, no gradient.',
  },
  {
    id: 'signup-flow', name: 'Multi-step Signup', icon: '📝', tag: 'Auth',
    prompt: 'Add a multi-step signup screen: step 1 - name and email, step 2 - password, step 3 - preferences selection (selectable chips). Animated progress bar at the top, next/back buttons, real-time validation, transition animation between steps. Modern design with Liquid Glass.',
  },
  {
    id: 'profile-premium', name: 'Premium Profile', icon: '👤', tag: 'Profile',
    prompt: 'Add a professional profile screen: round avatar (80px), name and bio, 3 stats in a row (large numbers + small labels), an "Edit profile" outline button, tabs for content. Clean design, no gradient.',
  },
  {
    id: 'dashboard-analytics', name: 'Analytics Dashboard', icon: '📊', tag: 'Dashboard',
    prompt: 'Add a clean analytics dashboard: greeting header with name and date, 4 KPI cards (large bold number + percentage change in green/red + small label), an SVG chart with data points, a "Recent activity" list. Minimal design, no glass, no gradient.',
  },
  {
    id: 'settings-ios', name: 'iOS Settings', icon: '⚙️', tag: 'Settings',
    prompt: 'Add an iOS-style settings screen: grouped list with small headers, each item with a round colored icon, a label, and a right-pointing chevron. Real toggles (switches) for 3 settings, an "Account" section with an avatar, a "General" section, a "Notifications" section, a red "Sign out" button at the bottom. Light gray background, white cards.',
  },
  {
    id: 'product-detail', name: 'Product Page', icon: '🛍️', tag: 'E-Commerce',
    prompt: 'Add a professional product page: large image with dots, product name and bold price, color picker (circles), size picker (chips), a solid sticky "Add to cart" button at the bottom, star rating, description. Clean design like ZARA, no gradient.',
  },
  {
    id: 'chat-ui', name: 'Chat', icon: '💬', tag: 'Messaging',
    prompt: 'Add a chat screen: header with a round avatar + name + green online indicator, a message list (blue bubbles on the right for the user, gray on the left), timestamps, read indicators (✓✓), a sticky input field at the bottom with an animated send button and an attach icon. Subtle pattern background.',
  },
  {
    id: 'onboarding', name: 'Onboarding', icon: '🚀', tag: 'Flow',
    prompt: 'Add an onboarding screen with 3 steps: each step with a large CSS illustration, a bold title, and a short description. Dots indicator, a "Next"/"Get started" button. Clean minimal design.',
  },
  {
    id: 'checkout', name: 'Checkout', icon: '💳', tag: 'E-Commerce',
    prompt: 'Add a checkout screen: order summary (items + prices), styled credit card fields (number/expiry/CVV) with card icons, Apple Pay and Google Pay buttons, a large gradient "Pay" button with the amount, a loading animation on tap. Each field at least 48dp.',
  },
  {
    id: 'search-explore', name: 'Search & Explore', icon: '🔍', tag: 'Discovery',
    prompt: 'Add a search and explore screen: a round sticky search field with an icon, scrollable category chips, "Popular searches" as a list, "Recommended" in a 2-column grid with image cards from picsum.photos. Instant search results animation, a styled empty state.',
  },
  {
    id: 'notifications', name: 'Notifications', icon: '🔔', tag: 'Social',
    prompt: 'Add a notifications screen: tabs (All/Unread), each notification with an avatar, text, relative time (5 min ago), and a blue dot for unread. Notification types: like, comment, new follower, system. Swipe to dismiss. Empty state with a bell icon.',
  },
  {
    id: 'map-view', name: 'Map & Location', icon: '📍', tag: 'Location',
    prompt: 'Add a map screen: a CSS map (street grid) with animated location markers (pulse), a bottom sheet card that slides up with location details, an address search field at the top, a floating "Current location" button. Pin drop animation.',
  },
];

const DESIGN_LANGUAGES: DesignPreset[] = [
  {
    id: 'glass', name: 'Glass', tag: 'Glassmorphism', preview: <GlassPreview />,
    prompt: `Apply a Glassmorphism style to the app: semi-transparent backgrounds with backdrop-filter blur, subtle white borders (rgba(255,255,255,0.3)), soft shadows, a colorful gradient background behind everything, and large corner radius. Use an 8px spacing grid, minimum 44px touch targets, line-height in multiples of 8. No emojis. ${STYLE_ONLY}`,
  },
  {
    id: 'liquid-glass', name: 'Liquid Glass', tag: 'Liquid Glass', preview: <LiquidGlassPreview />,
    prompt: `Apply the Apple Liquid Glass style (2025): light gradient background (#e0f2fe → #fce7f3 → #f3e8ff), cards with background: rgba(255,255,255,0.45), backdrop-filter: blur(12px) saturate(1.8), border: 1px solid rgba(255,255,255,0.35), box-shadow: 0 8px 32px rgba(31,38,135,0.12) and a subtle inset shadow. Large rounded corners (16-20px), transparency and flow. Use an 8px spacing grid, minimum 44px touch targets, line-height in multiples of 8. ${STYLE_ONLY}`,
  },
  {
    id: 'brutal', name: 'Brutalism', tag: 'Neo-Brutalism', preview: <BrutalPreview />,
    prompt: `Apply a Neo-Brutalism style: bold saturated colors, thick black borders (3-4px solid #000), hard non-blurred shadows (box-shadow: 4px 4px 0 #000), large bold fonts, no gradient, slightly rounded corners. Use an 8px spacing grid, minimum 44px touch targets, line-height in multiples of 8. ${STYLE_ONLY}`,
  },
  {
    id: 'minimal', name: 'Minimal', tag: 'Minimal', preview: <MinimalPreview />,
    prompt: `Apply a clean minimalist style: lots of white space, a monochromatic palette (black/white/gray) with a single accent color, a clean font, very subtle shadows or none at all, thin lines, typography as the hero. Use an 8px spacing grid, minimum 44px touch targets, line-height in multiples of 8. ${STYLE_ONLY}`,
  },
  {
    id: 'darkpro', name: 'Dark Pro', tag: 'Dark Pro', preview: <DarkProPreview />,
    prompt: `Apply a professional Dark Mode style: true black background (#000), surface (#1c1c1e), blue accent (#0A84FF), dark cards with border: 1px solid #38383a, high contrast, no glow, no neon. ${STYLE_ONLY}`,
  },
  {
    id: 'gradient', name: 'Gradients', tag: 'Gradient Rich', preview: <GradientPreview />,
    prompt: `Apply a subtle gradient style: muted light gradient background (#f8f9ff → #fff5f5), buttons with a subtle gradient, white cards, soft shadows. No loud colors. ${STYLE_ONLY}`,
  },
  {
    id: 'neu', name: 'Soft UI', tag: 'Neumorphism', preview: <NeuPreview />,
    prompt: `Apply a Neumorphism / Soft UI style: uniform light-gray background (#e0e5ec), components with soft double shadows (light from top-left, shadow at bottom-right) that create an extruded/inset 3D effect, very rounded corners, low contrast. Use an 8px spacing grid, minimum 44px touch targets, line-height in multiples of 8. ${STYLE_ONLY}`,
  },
  {
    id: 'm3-expressive', name: 'M3 Expressive', tag: 'Material 3', preview: <M3ExpressivePreview />,
    prompt: `Apply the Material Design 3 Expressive style: a spatial color palette with primary (#6750a4), secondary (#625b71), tertiary (#7d5260), surface tones (#f3edf7, #e8def8), large rounded FAB buttons (28px radius), cards with surface containers, 35 new shapes — squircle shapes and wavy edges, 8px grid spacing, 48dp touch targets, rich typography with emphasized styles. Use an 8px spacing grid, minimum 44px touch targets, line-height in multiples of 8. ${STYLE_ONLY}`,
  },
];

const APP_STYLES: DesignPreset[] = [
  {
    id: 'whatsapp', name: 'WhatsApp', tag: 'Messaging', preview: <WhatsAppPreview />,
    prompt: `Apply a WhatsApp-style design: dark background (#111b21), header in #1f2c34, green chat bubbles (#005c4b) for the user and dark gray for the other side, a round green FAB button (#00a884), clean typography, thin icons. No gradient, no emojis as icons. ${STYLE_ONLY}`,
  },
  {
    id: 'spotify', name: 'Spotify', tag: 'Music', preview: <SpotifyPreview />,
    prompt: `Apply a Spotify-style design: black background (#121212), cards in #282828, green accent (#1DB954) for buttons and controls only, large white bold titles, clean lists with small images, minimal bottom navigation. No gradient, no glow. ${STYLE_ONLY}`,
  },
  {
    id: 'tiktok', name: 'TikTok', tag: 'Video', preview: <TikTokPreview />,
    prompt: `Apply a TikTok-style design: full black background (#000), white text, red accent (#FE2C55) for primary buttons, round interaction icons on the right side, bottom navigation with 5 tabs, a clean and modern look. No gradient. ${STYLE_ONLY}`,
  },
  {
    id: 'apple', name: 'Apple', tag: 'Minimal', preview: <ApplePreview />,
    prompt: `Apply an Apple-style design: background (#f5f5f7), white cards with border-radius: 16px, subtle shadows (0 1px 3px rgba(0,0,0,0.08)), blue accent (#007AFF) for actions only, lots of white space, SF Pro typography - titles 28px bold letter-spacing -0.5px, body 15px regular. No gradient, no emojis. ${STYLE_ONLY}`,
  },
  {
    id: 'uber', name: 'Uber', tag: 'Rides', preview: <UberPreview />,
    prompt: `Apply an Uber-style design: white background, solid black buttons (#000), cards with background (#f6f6f6), bold black typography, border-radius: 8px, no shadows, no gradient, a sense of efficiency and simplicity. ${STYLE_ONLY}`,
  },
  {
    id: 'google', name: 'Material', tag: 'Google', preview: <GooglePreview />,
    prompt: `Apply a Material Design 3 design: white background, cards with border-radius: 12px, surface tones, round FAB buttons, blue primary color (#4285F4), fields with a rounded border, subtle shadows (0 1px 3px), no gradient. ${STYLE_ONLY}`,
  },
  {
    id: 'food', name: 'Delivery', tag: 'Wolt', preview: <FoodPreview />,
    prompt: `Apply a Wolt/DoorDash-style design: white background, cards with a large image + name + description + star rating + delivery time + price, green accent (#00B37E) for CTA buttons, horizontal category chips, bottom navigation with 4 tabs. No gradient, no emojis. ${STYLE_ONLY}`,
  },
  {
    id: 'fintech', name: 'Fintech', tag: 'Revolut', preview: <FintechPreview />,
    prompt: `Apply a Revolut/Robinhood-style design: clean white background, balance card with large numbers (32px bold), a minimal SVG chart, a clean transactions list, blue accent (#0052FF) for actions, green (#00C805) for positive and red (#FF3B30) for negative. No gradient. ${STYLE_ONLY}`,
  },
  {
    id: 'fitness', name: 'Fitness', tag: 'Strava', preview: <FitnessPreview />,
    prompt: `Apply a Strava/Nike Run Club-style design: white background (#fff), bold black titles, large metrics (48px bold), orange accent (#FC4C02) for data and CTAs, clean stat cards, no glow, no neon, no gradient. ${STYLE_ONLY}`,
  },
  {
    id: 'ecom', name: 'Store', tag: 'ZARA', preview: <EcomPreview />,
    prompt: `Apply a ZARA/COS-style design: white background, elegant typography (font-weight: 300, letter-spacing: 2px), large product images, a 2-column grid, bold prices, black "Add" buttons (#000), no gradient, no shadows, absolute minimalism. ${STYLE_ONLY}`,
  },
  {
    id: 'social', name: 'Social', tag: 'Instagram', preview: <SocialPreview />,
    prompt: `Apply an Instagram/Threads-style design: white background (#fff), clean feed cards, round avatars, thin SVG icons (stroke-width: 1.5) for like/comment/share, bottom navigation with 5 tabs, border-bottom: 1px solid #efefef, no gradient. ${STYLE_ONLY}`,
  },
  {
    id: 'booking', name: 'Booking', tag: 'Airbnb', preview: <SocialPreview />,
    prompt: `Apply an Airbnb-style design: white background, cards with large images (border-radius: 12px), small star ratings, accent (#FF5A5F) for CTAs, a round pill search field, lots of white space, font-weight: 600 for titles. No gradient. ${STYLE_ONLY}`,
  },
  {
    id: 'ai-chat', name: 'AI', tag: 'ChatGPT', preview: <ApplePreview />,
    prompt: `Apply a ChatGPT/Claude-style design: white background (#fff), a clean chat interface, message bubbles with a light gray background (#f7f7f8) for AI responses and transparent for the user, a pill input field at the bottom with a send icon, accent (#10A37F), no gradient. ${STYLE_ONLY}`,
  },
  {
    id: 'health', name: 'Health', tag: 'Calm', preview: <ApplePreview />,
    prompt: `Apply a Calm/Headspace-style design: light background (#fafafa), cards with border-radius: 16px, muted pastel colors, a calm blue accent (#4EAAF3), soft typography (font-weight: 400-500), lots of white space, a quiet and soothing look. No strong gradient, no animations. ${STYLE_ONLY}`,
  },
];

function PresetCard({ preset, onApply, disabled }: { preset: DesignPreset; onApply: (prompt: string) => void; disabled: boolean }) {
  return (
    <button
      onClick={() => onApply(preset.prompt)}
      disabled={disabled}
      title={preset.tag}
      className="group flex flex-col gap-1.5 p-2 rounded-xl border border-border/40 bg-surface/40
        hover:border-primary/40 hover:bg-surface/60 active:scale-[0.97] transition-all duration-200
        disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <div className="w-full aspect-[4/3] relative">
        {preset.preview}
        <div className="absolute inset-0 rounded-lg bg-primary/0 group-hover:bg-primary/5 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-white bg-primary/90 px-2 py-1 rounded-md shadow-lg">
            Apply
          </span>
        </div>
      </div>
      <div className="text-left">
        <div className="text-[11px] font-semibold text-text-primary leading-tight">{preset.name}</div>
        <div className="text-[9px] text-text-soft leading-tight">{preset.tag}</div>
      </div>
    </button>
  );
}

function ShapeCard({ name, preview, onApply, disabled }: { name: string; preview: React.ReactNode; onApply: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onApply}
      disabled={disabled}
      className="group flex flex-col items-center gap-1 p-2 rounded-xl border border-border/40 bg-surface/40
        hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97] transition-all duration-200
        disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {preview}
      <span className="text-[10px] font-medium text-text-secondary group-hover:text-primary">{name}</span>
    </button>
  );
}

export default function DesignGallery({ onApply, isGenerating }: DesignGalleryProps) {
  const [section, setSection] = useState<GallerySection>('shapes');

  return (
    <div className="flex flex-col h-full" dir="ltr">
      {/* Section tabs */}
      <div className="flex gap-1 p-3 border-b border-border/50 flex-shrink-0">
        {([
          { id: 'shapes' as GallerySection, label: '🔲 Shapes' },
          { id: 'templates' as GallerySection, label: '📐 Templates' },
          { id: 'apps' as GallerySection, label: '📱 Apps' },
          { id: 'styles' as GallerySection, label: '🎨 Styles' },
        ]).map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
              section === s.id
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-2 border border-transparent'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin p-4">
        {/* ── Component Shapes ──────────────────────────────────────── */}
        {section === 'shapes' && (
          <div className="flex flex-col gap-5">
            <p className="text-xs text-text-secondary leading-relaxed">
              Choose shapes for buttons, cards, and inputs — <span className="font-semibold text-text-primary">just like in Figma</span>.
            </p>

            {/* Button shapes */}
            <div>
              <label className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-2 block">
                Button Shapes
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {BUTTON_SHAPES.map((s) => (
                  <ShapeCard key={s.id} name={s.name} preview={s.preview} onApply={() => onApply(s.prompt)} disabled={isGenerating} />
                ))}
              </div>
            </div>

            <div className="h-px bg-border/60" />

            {/* Card shapes */}
            <div>
              <label className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-2 block">
                Card Shapes
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {CARD_SHAPES.map((s) => (
                  <ShapeCard key={s.id} name={s.name} preview={s.preview} onApply={() => onApply(s.prompt)} disabled={isGenerating} />
                ))}
              </div>
            </div>

            <div className="h-px bg-border/60" />

            {/* Input shapes */}
            <div>
              <label className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-2 block">
                Input Shapes
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {INPUT_SHAPES.map((s) => (
                  <ShapeCard key={s.id} name={s.name} preview={s.preview} onApply={() => onApply(s.prompt)} disabled={isGenerating} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Screen Templates (Figma-quality) ─────────────────────── */}
        {section === 'templates' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-text-secondary leading-relaxed">
              <span className="font-semibold text-text-primary">Figma-quality</span> screen templates — click to add a ready-made screen with links and actions.
            </p>
            <div className="flex flex-col gap-1.5">
              {SCREEN_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onApply(t.prompt)}
                  disabled={isGenerating}
                  className="group flex items-center gap-3 py-3 px-3 rounded-xl border border-border bg-surface
                    hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98] transition-all duration-200
                    disabled:opacity-40 disabled:cursor-not-allowed text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-text-primary">{t.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t.tag}</span>
                    </div>
                    <p className="text-[10px] text-text-soft mt-0.5 line-clamp-1">{t.prompt.slice(0, 60)}...</p>
                  </div>
                  <svg className="w-4 h-4 text-text-soft group-hover:text-primary flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Famous App Styles ─────────────────────────────────────── */}
        {section === 'apps' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-text-secondary leading-relaxed">
              Choose a design from a popular app — <span className="font-semibold text-text-primary">style only, not the content</span>.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {APP_STYLES.map((p) => (
                <PresetCard key={p.id} preset={p} onApply={onApply} disabled={isGenerating} />
              ))}
            </div>
          </div>
        )}

        {/* ── Design Languages ─────────────────────────────────────── */}
        {section === 'styles' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-text-secondary leading-relaxed">
              Choose a design language — <span className="font-semibold text-text-primary">without changing the content</span>.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DESIGN_LANGUAGES.map((p) => (
                <PresetCard key={p.id} preset={p} onApply={onApply} disabled={isGenerating} />
              ))}
            </div>
          </div>
        )}
      </div>

      {isGenerating && (
        <div className="flex items-center justify-center gap-2 py-3 px-4 border-t border-border text-xs text-primary bg-primary/5">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Applying design...
        </div>
      )}
    </div>
  );
}
