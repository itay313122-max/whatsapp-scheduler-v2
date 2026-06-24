'use client';

import { useState, useEffect, useRef } from 'react';
import type { SelectedElement } from './PropertyPanel';
import DesignGallery from './DesignGallery';

interface Screen {
  label: string;
  index: number;
  active: boolean;
}

type SidebarTab = 'ai' | 'gallery' | 'widgets' | 'layers' | 'animations' | 'properties';

interface EditSidebarProps {
  onAIEdit: (prompt: string) => void;
  isGenerating: boolean;
  appName?: string;
  screens: Screen[];
  onNavigate: (index: number) => void;
  onAddScreen: (prompt: string) => void;
  selectedElement: SelectedElement | null;
  onStyleChange: (path: string, property: string, value: string) => void;
  onTextChange: (path: string, text: string) => void;
  onInsertIcon: (path: string, icon: string) => void;
  onDeselect: () => void;
}

function rgbToHex(rgb: string): string {
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return '#000000';
  return '#' + [m[1], m[2], m[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

// ── Section wrapper with consistent spacing ─────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-2 block select-none">
        {label}
      </label>
      {children}
    </div>
  );
}

function OptionGrid({ children, cols = 'grid-cols-2' }: { children: React.ReactNode; cols?: string }) {
  return <div className={`grid ${cols} gap-1.5`}>{children}</div>;
}

function OptionButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`py-2 px-2 min-h-[36px] rounded-lg text-[11px] font-medium border transition-all duration-150 select-none
        ${active
          ? 'border-primary/50 bg-primary/15 text-primary shadow-sm'
          : 'border-border/40 text-text-secondary hover:text-text-primary hover:border-primary/30 hover:bg-primary/5 active:scale-[0.97]'
        }`}
    >
      {children}
    </button>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────

const AI_QUICK_ACTIONS = [
  {
    category: 'Buttons',
    icon: '🔘',
    actions: [
      { label: 'Modern + gradient', prompt: 'Change all buttons to a modern design with gradient, soft shadows, and smooth hover animation' },
      { label: 'Add hover effects', prompt: 'Add hover effects to all buttons - smooth color change, slight scale up, and shadow' },
      { label: 'Rounded buttons', prompt: 'Make all buttons rounded with full border-radius and comfortable padding' },
      { label: 'Outline style', prompt: 'Change the buttons to an outline style - transparent background with a colored border' },
    ],
  },
  {
    category: 'General design',
    icon: '🎨',
    actions: [
      { label: 'Make it modern', prompt: 'Improve the overall design - add a background gradient, soft shadows on cards, and proper spacing' },
      { label: 'Minimalist', prompt: 'Make the design minimalist - remove unnecessary shadows, use calm colors, and lots of white space' },
      { label: 'Add shadows', prompt: 'Add a soft box-shadow to all cards and main elements' },
      { label: 'Entrance animations', prompt: 'Add entrance animations (fade-in, slide-up) to elements on the page. Use CSS keyframes.' },
    ],
  },
  {
    category: 'Layout',
    icon: '📐',
    actions: [
      { label: 'Center content', prompt: 'Center all the main content on the page with max-width and margin auto' },
      { label: 'Sticky header', prompt: 'Make the header sticky/fixed so it stays at the top while scrolling, with backdrop-filter blur' },
      { label: 'Responsive grid', prompt: 'Change the cards/items layout to a responsive CSS Grid with 2-3 columns' },
      { label: 'Add footer', prompt: 'Add a styled footer to the app with links, a small logo, and copyright text' },
    ],
  },
  {
    category: 'Content',
    icon: '📝',
    actions: [
      { label: 'Add icons', prompt: 'Add suitable emoji or SVG icons next to every heading, button, and menu item' },
      { label: 'Improve text', prompt: 'Improve all the text in the app - clearer headings and more engaging descriptions' },
      { label: 'Placeholder images', prompt: 'Add placeholder images from unsplash in appropriate sizes wherever relevant' },
      { label: 'Full RTL', prompt: 'Ensure the entire app is fully RTL - text direction, alignment, and flex-direction' },
    ],
  },
];

const SHAPE_PRESETS = [
  { id: 'square', label: 'Square', radius: '0px', icon: (
    <div className="w-5 h-5 border-2 border-current" style={{ borderRadius: 0 }} />
  )},
  { id: 'rounded-sm', label: 'Small radius', radius: '8px', icon: (
    <div className="w-5 h-5 border-2 border-current" style={{ borderRadius: 4 }} />
  )},
  { id: 'rounded', label: 'Rounded', radius: '16px', icon: (
    <div className="w-5 h-5 border-2 border-current" style={{ borderRadius: 8 }} />
  )},
  { id: 'pill', label: 'Pill', radius: '9999px', icon: (
    <div className="w-7 h-4 border-2 border-current" style={{ borderRadius: 9999 }} />
  )},
  { id: 'circle', label: 'Circle', radius: '50%', icon: (
    <div className="w-5 h-5 border-2 border-current" style={{ borderRadius: '50%' }} />
  )},
];

const LINK_TEMPLATES = [
  { id: 'screen-nav', label: 'Link to screen', icon: '📱', prompt: (text: string) => `Turn "${text}" into a navigation button that goes to another screen in the app. Add a smooth transition animation.` },
  { id: 'url-link', label: 'External link', icon: '🔗', prompt: (text: string) => `Turn "${text}" into an external link that opens in a new window. Add a small link icon.` },
  { id: 'form-save', label: 'Save form', icon: '💾', prompt: (text: string) => `Turn "${text}" into a save button that collects all form fields and saves them to localStorage. Add a success message.` },
  { id: 'auth-login', label: 'Login', icon: '🔐', prompt: (text: string) => `Turn "${text}" into a login button with an email and password form, validation, and error handling. Persist the auth state in localStorage.` },
  { id: 'add-to-cart', label: 'Add to cart', icon: '🛒', prompt: (text: string) => `Turn "${text}" into an "Add to cart" button with an add animation, a navigation badge update, and cart persistence in localStorage.` },
  { id: 'share', label: 'Share', icon: '📤', prompt: (text: string) => `Turn "${text}" into a share button using the Web Share API (with a copy-link fallback). Add a feedback animation.` },
];

const DISPLAY_OPTIONS = [
  { label: 'Block', value: 'block' },
  { label: 'Flex', value: 'flex' },
  { label: 'Grid', value: 'grid' },
  { label: 'Inline', value: 'inline-flex' },
];

const FONT_SIZES = ['11px', '12px', '13px', '15px', '17px', '20px', '24px', '28px', '34px'];

const BUTTON_SIZE_PRESETS = [
  { id: 'sm', label: 'S', padding: '8px 16px', fontSize: '12px' },
  { id: 'md', label: 'M', padding: '12px 24px', fontSize: '14px' },
  { id: 'lg', label: 'L', padding: '16px 32px', fontSize: '16px' },
  { id: 'xl', label: 'XL', padding: '20px 40px', fontSize: '18px' },
];

const SHADOW_PRESETS = [
  { id: 'none', label: 'None', value: 'none' },
  { id: 'xs', label: 'Subtle', value: '0 1px 2px rgba(0,0,0,0.04)' },
  { id: 'sm', label: 'Small', value: '0 1px 3px rgba(0,0,0,0.08)' },
  { id: 'md', label: 'Medium', value: '0 4px 12px rgba(0,0,0,0.1)' },
  { id: 'lg', label: 'Large', value: '0 8px 24px rgba(0,0,0,0.12)' },
];

const AI_RECOMMENDATIONS = [
  { label: 'Improve accessibility', prompt: 'Improve the app accessibility - add aria-labels, good color contrast, and focus states for every interactive element', icon: '♿' },
  { label: 'Add loading states', prompt: 'Add loading states with skeletons or spinners for all components that load data', icon: '⏳' },
  { label: 'Improve responsiveness', prompt: 'Ensure the app is fully responsive - use flexbox, relative sizes, and media queries', icon: '📱' },
  { label: 'Add empty states', prompt: 'Add styled empty states with an icon, heading, and action button for every list or content area', icon: '📭' },
  { label: 'Improve performance', prompt: 'Improve performance - lazy load images, minimize re-renders, and add will-change to animations', icon: '⚡' },
  { label: 'Add micro-interactions', prompt: 'Add micro-interactions - hover and click animations, smooth transitions, and visual feedback for every interaction', icon: '✨' },
];

const ICON_LIBRARY = [
  '⊕', '⊖', '◉', '○', '□', '△', '▽', '◇',
  '→', '←', '↑', '↓', '↗', '↙', '⟳', '⟲',
  '✓', '✕', '⊘', '⊜', '≡', '⋮', '⊞', '⊟',
  '♡', '☆', '⚙', '⌂', '⌕', '✎', '⊛', '⌗',
];

const ANIMATION_PRESETS = [
  {
    category: 'Entrance',
    icon: '🎬',
    animations: [
      { label: 'Fade In', prompt: 'Add a fade-in animation to all the main elements on the page. Each element appears with a small delay after the previous one. Use CSS @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }' },
      { label: 'Slide Up', prompt: 'Add a slide-up animation to all cards and elements. @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }. Add a staggered animation-delay to each element.' },
      { label: 'Scale In', prompt: 'Add a scale-in animation to buttons and cards. @keyframes scaleIn { from { transform: scale(0.9); opacity: 0 } to { transform: scale(1); opacity: 1 } }' },
      { label: 'Slide From Right', prompt: 'Add a right-to-left entrance animation to elements. @keyframes slideRight { from { transform: translateX(30px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }' },
    ],
  },
  {
    category: 'Interaction',
    icon: '👆',
    animations: [
      { label: 'Hover Scale', prompt: 'Add a hover scale effect to all buttons and cards: transition: transform 0.2s ease, box-shadow 0.2s ease. On hover: transform: scale(1.03) and a stronger box-shadow.' },
      { label: 'Press Effect', prompt: 'Add a press (active state) effect to all buttons: active { transform: scale(0.97); transition: transform 0.1s }' },
      { label: 'Glow on Hover', prompt: 'Add a glow effect on hover to primary buttons: box-shadow: 0 0 20px rgba(var(--c-primary), 0.4) on hover' },
      { label: 'Underline Slide', prompt: 'Add an underline animation that slides in on hover for all links and navigation items. Use an ::after pseudo-element with a transition.' },
    ],
  },
  {
    category: 'Transitions',
    icon: '🔄',
    animations: [
      { label: 'Smooth Transitions', prompt: 'Add a smooth transition to all interactive elements: transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1). This includes buttons, cards, input fields, and navigation items.' },
      { label: 'Page Transition', prompt: 'Add a transition animation between screens: when switching screens, the current screen fades out and the new one fades in. Use CSS transitions.' },
      { label: 'Stagger Animation', prompt: 'Add a stagger effect - each list item appears with a 0.05s delay after the previous one. animation-delay: calc(var(--i) * 0.05s) for each item.' },
      { label: 'Parallax Scroll', prompt: 'Add a light parallax effect: the header moves slower than the content while scrolling. Use background-attachment: fixed or transform on scroll.' },
    ],
  },
  {
    category: 'Special',
    icon: '✨',
    animations: [
      { label: 'Pulse Badge', prompt: 'Add a pulse animation to badges and notifications: @keyframes pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.1) } }' },
      { label: 'Skeleton Loading', prompt: 'Add a skeleton loading effect to cards: @keyframes shimmer { from { background-position: -200% 0 } to { background-position: 200% 0 } } with a shifting gray background gradient.' },
      { label: 'Float Effect', prompt: 'Add a floating effect to a main element/logo: @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } } animation: float 3s ease-in-out infinite.' },
      { label: 'Gradient Shift', prompt: 'Add a shifting gradient animation to the header background: @keyframes gradientShift { 0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } } background-size: 200% 200%.' },
    ],
  },
];

const WIDGET_CATEGORIES = [
  {
    category: 'Time & Date',
    icon: '🕐',
    widgets: [
      { label: 'Digital clock', icon: '⏰', prompt: 'Add an interactive digital clock widget that shows hours, minutes, and seconds in real time. Use useEffect with setInterval every second. Modern design with font-family: monospace, large size, and a card background.' },
      { label: 'Analog clock', icon: '🕰️', prompt: 'Add an analog clock widget using SVG. Draw a circle, hour marks, an hour hand (short and thick), a minute hand (long), and a second hand (thin red). Update every second with useEffect. Use transform: rotate() for the hands.' },
      { label: 'Timer / countdown', icon: '⏱️', prompt: 'Add a countdown timer widget. Start/stop/reset buttons. Show minutes:seconds in a large format. Add-time buttons (1 min, 5 min, 10 min). Play an alert when it ends. min-height 48px for all buttons.' },
      { label: 'Stopwatch', icon: '🏃', prompt: 'Add a stopwatch showing hours:minutes:seconds:hundredths. Start, Stop, Reset, and Lap buttons. A numbered list of lap times. font-family: monospace for the display.' },
      { label: 'Calendar', icon: '📅', prompt: 'Add an interactive monthly calendar widget. Show a 7-column grid for the days of the week. Previous/next month buttons. Highlight the current day. Clicking a day selects it. Use a Date object to compute the days.' },
      { label: 'Date picker', icon: '📆', prompt: 'Add a styled date picker. Three select dropdowns for day, month, and year. Or a popup calendar. Show the selected date in a readable format. A "Today" button to select the current day.' },
    ],
  },
  {
    category: 'Charts & Data',
    icon: '📊',
    widgets: [
      { label: 'Bar chart', icon: '📊', prompt: 'Add an SVG-based bar chart widget. Show 5-7 bars with sample data. Labels at the bottom, values at the top of each bar. Gradient colors for the bars. An entrance animation. Responsive to width.' },
      { label: 'Line chart', icon: '📈', prompt: 'Add an SVG-based line chart widget. A smooth line with points. A filled area with a transparent gradient. Axis labels. A tooltip on hover over a point. Realistic sample data.' },
      { label: 'Pie chart', icon: '🥧', prompt: 'Add an SVG-based pie/donut chart widget. 4-5 slices in different colors. A legend with percentages. A donut variant with a number in the center. A rotation animation on entrance.' },
      { label: 'Circular progress', icon: '🔄', prompt: 'Add an SVG-based circular progress meter. A background circle plus a colored arc that fills up. A percentage in the center. A smooth fill animation. +/- buttons to change the value.' },
      { label: 'Stats', icon: '🔢', prompt: 'Add a stats cards widget - 3-4 cards in a grid with: an icon, a large number (display), a small description (caption), and a percentage change (green/red). A count-up animation for the numbers.' },
    ],
  },
  {
    category: 'Media & Content',
    icon: '🎵',
    widgets: [
      { label: 'Audio player', icon: '🎵', prompt: 'Add a styled audio player widget. A large round play/pause button. A progress bar with current/total time. Forward/back buttons. Song name and artist. Shuffle and repeat buttons. Card design.' },
      { label: 'Image carousel', icon: '🎠', prompt: 'Add an interactive image carousel. Left/right arrows. Dots for the current position. A smooth transition. Placeholder images with a gradient background. Optional auto-play.' },
      { label: 'Star rating', icon: '⭐', prompt: 'Add an interactive star rating widget. 5 stars that change color on hover and click. Show the selected rating as a number. Support half stars. Large stars (32px) with a color transition.' },
      { label: 'Image gallery', icon: '🖼️', prompt: 'Add an image gallery in a grid (2-3 columns). Placeholder images with colorful gradients. A lightbox on click (full screen). A close button. An image count.' },
    ],
  },
  {
    category: 'Location & Maps',
    icon: '📍',
    widgets: [
      { label: 'Current location', icon: '📍', prompt: 'Add a location widget showing the current location. A "Find location" button that uses navigator.geolocation.getCurrentPosition. Show latitude and longitude. Show an estimated address. A card with a map icon.' },
      { label: 'Static map', icon: '🗺️', prompt: 'Add an SVG-based static map widget. Draw a simple map or a grid of streets. Mark a location in red with a pulse animation. Location info in a card below. Zoom in/out buttons.' },
      { label: 'Distance calculator', icon: '📏', prompt: 'Add a widget that calculates the distance between two points. Two input fields for origin and destination city (a dropdown of cities). An estimated distance calculation. A travel time display. A car/walking/bus icon.' },
    ],
  },
  {
    category: 'Forms & Input',
    icon: '📝',
    widgets: [
      { label: 'Contact form', icon: '✉️', prompt: 'Add a full contact form: name, email, phone, message (textarea). A submit button with validation. Show a success message after submitting. All fields with min-height 48px and labels.' },
      { label: 'Survey / quiz', icon: '📋', prompt: 'Add a survey widget with 3-4 questions. Multiple-choice questions (radio buttons), a rating question (slider), and an open question (textarea). A progress bar at the top. Next/previous buttons. A summary screen at the end.' },
      { label: 'Advanced search', icon: '🔍', prompt: 'Add an advanced search widget: a search field with an icon, filters (chips), sorting (dropdown), and instant results. A typing animation. Show "No results" in an empty state.' },
      { label: 'Range slider', icon: '🎚️', prompt: 'Add an interactive range slider widget. Show the current value. min/max labels. Two handles for a range (min-max). Color change based on the value. min-height 48px for the touch area.' },
    ],
  },
  {
    category: 'Social & Sharing',
    icon: '🤝',
    widgets: [
      { label: 'Share buttons', icon: '📤', prompt: 'Add a social share buttons widget: WhatsApp (green), Facebook (blue), Twitter/X (black), Email (red), Copy Link. Each button with an icon and min-height 48px. A horizontal row or a bottom sheet.' },
      { label: 'Profile card', icon: '👤', prompt: 'Add a styled profile card: a round gradient avatar, name, description, 3 stats (posts/followers/following), a "Follow" toggle button, a colored top bar.' },
      { label: 'Comments', icon: '💬', prompt: 'Add a comments widget: a list of comments with avatar, name, time, and text. A field to add a new comment. A like button for each comment. Threaded comments (new ones go to the top).' },
      { label: 'News feed', icon: '📰', prompt: 'Add a news feed: news cards with a title, short description, date, category (chip), and an icon. A "Read more" button that expands the card. Pull-to-refresh.' },
    ],
  },
  {
    category: 'Handy Tools',
    icon: '🛠️',
    widgets: [
      { label: 'Calculator', icon: '🧮', prompt: 'Add an interactive calculator: a grid of numbers (0-9), operations (+,-,×,÷), AC and = buttons. A large number display at the top. A calculation history. Buttons with min-height 48px. Dark card design.' },
      { label: 'Shopping list', icon: '🛒', prompt: 'Add an interactive shopping list: add an item with an input field, check off purchased items (strikethrough), swipe to delete, an item count, a "Clear all" button. An empty state when the list is empty.' },
      { label: 'Notes', icon: '📝', prompt: 'Add a notes widget: a list of notes with a title and date. Add a new note with a textarea. A note card color (4 colors to choose from). Note search. A grid layout (2 columns).' },
      { label: 'Habit tracker', icon: '✅', prompt: 'Add a daily habit tracker widget: 5 habits with an icon, name, and checkbox (toggle). An overall progress bar at the top. A streak (consecutive days) for each habit. An "Add new habit" button.' },
    ],
  },
];

const PRESET_SCREENS = [
  { id: 'settings', label: 'Settings', icon: '⚙' },
  { id: 'profile',  label: 'Profile',  icon: '○' },
  { id: 'about',    label: 'About',    icon: '⊘' },
  { id: 'contact',  label: 'Contact',  icon: '✉' },
];

export default function EditSidebar({
  onAIEdit,
  isGenerating,
  appName,
  screens,
  onNavigate,
  onAddScreen,
  selectedElement,
  onStyleChange,
  onTextChange,
  onInsertIcon,
  onDeselect,
}: EditSidebarProps) {
  const [tab, setTab] = useState<SidebarTab>('ai');
  const [aiPrompt, setAIPrompt] = useState('');
  const [text, setText] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Buttons');
  const [expandedAnimCategory, setExpandedAnimCategory] = useState<string | null>('Entrance');
  const [expandedWidgetCategory, setExpandedWidgetCategory] = useState<string | null>('Time & Date');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectedElement) {
      setTab('properties');
      setText(selectedElement.text);
    }
  }, [selectedElement]);

  const isButton = selectedElement?.tag === 'button' || selectedElement?.tag === 'a';
  const isTextEl = selectedElement && ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'label', 'button', 'a', 'li'].includes(selectedElement.tag);

  const handleAISubmit = () => {
    if (!aiPrompt.trim() || isGenerating) return;
    onAIEdit(aiPrompt.trim());
    setAIPrompt('');
  };

  const tabs: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'ai',
      label: 'AI Design',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
      ),
    },
    {
      id: 'gallery',
      label: 'Gallery',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
    },
    {
      id: 'widgets',
      label: 'Widgets',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
        </svg>
      ),
    },
    {
      id: 'layers',
      label: 'Screens',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
        </svg>
      ),
    },
    {
      id: 'animations' as SidebarTab,
      label: 'Animations',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
        </svg>
      ),
    },
    {
      id: 'properties',
      label: 'Properties',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* ── Tab bar — Lovable-style with indicator ─────────────────────── */}
      <div className="flex border-b border-border/40 bg-surface/30 flex-shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            title={t.label}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 min-h-[44px] text-[10px] font-medium transition-all duration-200 relative
              ${tab === t.id ? 'text-primary' : 'text-text-soft hover:text-text-secondary'}`}
          >
            <span className={`transition-transform duration-200 ${tab === t.id ? 'scale-110' : ''}`}>
              {t.icon}
            </span>
            <span>{t.label}</span>
            {selectedElement && t.id === 'properties' && tab !== 'properties' && (
              <span className="absolute top-1.5 end-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
            {tab === t.id && (
              <div className="absolute bottom-0 inset-x-3 h-[2px] bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto scrollbar-thin">

        {/* ── AI Design ──────────────────────────────────────────────── */}
        {tab === 'ai' && (
          <div className="flex flex-col gap-4 p-4">
            {/* Input */}
            <Section label="Custom design request">
              <textarea
                ref={textareaRef}
                value={aiPrompt}
                onChange={(e) => setAIPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAISubmit();
                  }
                }}
                placeholder='e.g. "Make the buttons modern with shadows"'
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-surface/50 border border-border/50 text-text-primary text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none placeholder:text-text-soft transition-all"
              />
              <button
                onClick={handleAISubmit}
                disabled={!aiPrompt.trim() || isGenerating}
                className={`w-full mt-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isGenerating
                    ? 'bg-primary/20 text-primary/60 cursor-wait'
                    : aiPrompt.trim()
                      ? 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98]'
                      : 'bg-surface/30 text-text-soft cursor-not-allowed'
                }`}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    AI designing...
                  </span>
                ) : 'Apply changes'}
              </button>
            </Section>

            <div className="h-px bg-border/60" />

            {/* Quick actions */}
            <Section label="Quick actions">
              <div className="flex flex-col gap-0.5">
                {AI_QUICK_ACTIONS.map((cat) => (
                  <div key={cat.category}>
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-150 ${
                        expandedCategory === cat.category
                          ? 'bg-primary/8 text-primary font-semibold'
                          : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                      }`}
                    >
                      <span className="text-sm">{cat.icon}</span>
                      <span className="flex-1 text-right">{cat.category}</span>
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedCategory === cat.category ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedCategory === cat.category && (
                      <div className="grid grid-cols-2 gap-1.5 mt-1.5 mb-1 pe-2">
                        {cat.actions.map((action) => (
                          <button
                            key={action.label}
                            onClick={() => onAIEdit(action.prompt)}
                            disabled={isGenerating}
                            title={action.prompt}
                            className="py-2 px-2.5 rounded-lg text-[10px] font-medium border border-border text-text-secondary
                              hover:text-primary hover:border-primary/30 hover:bg-primary/5
                              active:scale-[0.97] transition-all duration-150 text-right disabled:opacity-40 leading-tight"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            <div className="h-px bg-border/60" />

            {/* AI Recommendations */}
            <Section label="✨ AI Recommendations">
              <p className="text-[10px] text-text-soft mb-2 leading-relaxed">
                {appName ? `Recommended improvements for ${appName}` : 'Recommended professional improvements'}
              </p>
              <div className="flex flex-col gap-1.5">
                {AI_RECOMMENDATIONS.map((rec) => (
                  <button
                    key={rec.label}
                    onClick={() => onAIEdit(rec.prompt)}
                    disabled={isGenerating}
                    title={rec.prompt}
                    className="flex items-center gap-2.5 py-2 px-3 rounded-lg text-[11px] font-medium border border-border text-text-secondary
                      hover:text-primary hover:border-primary/30 hover:bg-primary/5
                      active:scale-[0.98] transition-all duration-150 text-right disabled:opacity-40"
                  >
                    <span className="text-sm flex-shrink-0">{rec.icon}</span>
                    <span className="flex-1 text-right">{rec.label}</span>
                    <svg className="w-3.5 h-3.5 opacity-40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ── Design Gallery ─────────────────────────────────────────── */}
        {tab === 'gallery' && (
          <DesignGallery onApply={onAIEdit} isGenerating={isGenerating} />
        )}

        {/* ── Widgets ───────────────────────────────────────────────── */}
        {tab === 'widgets' && (
          <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/15 to-cyan-500/10 flex items-center justify-center text-sm">
                🧩
              </div>
              <div>
                <p className="text-xs font-semibold text-text-primary">Widget Library</p>
                <p className="text-[10px] text-text-soft">Add interactive components to your app</p>
              </div>
            </div>

            {WIDGET_CATEGORIES.map((cat) => (
              <div key={cat.category}>
                <button
                  onClick={() => setExpandedWidgetCategory(expandedWidgetCategory === cat.category ? null : cat.category)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-150 ${
                    expandedWidgetCategory === cat.category
                      ? 'bg-primary/8 text-primary font-semibold'
                      : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span className="flex-1 text-right">{cat.category}</span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedWidgetCategory === cat.category ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedWidgetCategory === cat.category && (
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5 mb-1 pe-2">
                    {cat.widgets.map((widget) => (
                      <button
                        key={widget.label}
                        onClick={() => onAIEdit(widget.prompt)}
                        disabled={isGenerating}
                        title={widget.prompt}
                        className="py-2 px-2.5 min-h-[44px] rounded-lg text-[10px] font-medium border border-border text-text-secondary
                          hover:text-primary hover:border-primary/30 hover:bg-primary/5
                          active:scale-[0.97] transition-all duration-150 text-right disabled:opacity-40 leading-tight flex items-center gap-1.5"
                      >
                        <span className="text-sm flex-shrink-0">{widget.icon}</span>
                        <span>{widget.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="h-px bg-border/60" />

            <Section label="Custom widget">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAIPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAISubmit();
                  }
                }}
                placeholder={'e.g. "Add a weather widget with temperature and icon"'}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-surface/50 border border-border/50 text-text-primary text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none placeholder:text-text-soft transition-all"
              />
              <button
                onClick={handleAISubmit}
                disabled={!aiPrompt.trim() || isGenerating}
                className={`w-full mt-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isGenerating
                    ? 'bg-primary/20 text-primary/60 cursor-wait'
                    : aiPrompt.trim()
                      ? 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98]'
                      : 'bg-surface/30 text-text-soft cursor-not-allowed'
                }`}
              >
                {isGenerating ? 'AI adding...' : 'Add widget'}
              </button>
            </Section>
          </div>
        )}

        {tab === 'layers' && (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-border/50">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">App screens</span>
            </div>

            <div className="flex-1 overflow-auto py-1">
              {screens.length > 0 ? (
                screens.map((screen) => (
                  <button
                    key={screen.index}
                    onClick={() => onNavigate(screen.index)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-right text-xs transition-all duration-150 ${
                      screen.active
                        ? 'bg-primary/10 text-primary font-semibold border-e-2 border-primary'
                        : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-colors ${
                      screen.active ? 'bg-primary text-white' : 'bg-surface-2 text-text-soft'
                    }`}>
                      {screen.index + 1}
                    </div>
                    <span className="truncate">{screen.label}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-xl mx-auto mb-3">
                    📱
                  </div>
                  <p className="text-xs text-text-soft">Build an app to see screens</p>
                </div>
              )}
            </div>

            <div className="border-t border-border p-3">
              <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-2">Add screen</p>
              <OptionGrid>
                {PRESET_SCREENS.map((s) => (
                  <OptionButton key={s.id} onClick={() => onAddScreen(`Add a ${s.label} screen to the app`)}>
                    {s.icon} {s.label}
                  </OptionButton>
                ))}
              </OptionGrid>
            </div>
          </div>
        )}

        {/* ── Animations ─────────────────────────────────────────────── */}
        {tab === 'animations' && (
          <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/15 to-pink-500/10 flex items-center justify-center text-sm">
                🎬
              </div>
              <div>
                <p className="text-xs font-semibold text-text-primary">Animations & Effects</p>
                <p className="text-[10px] text-text-soft">Add motion and life to your app</p>
              </div>
            </div>

            {ANIMATION_PRESETS.map((cat) => (
              <div key={cat.category}>
                <button
                  onClick={() => setExpandedAnimCategory(expandedAnimCategory === cat.category ? null : cat.category)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-150 ${
                    expandedAnimCategory === cat.category
                      ? 'bg-primary/8 text-primary font-semibold'
                      : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span className="flex-1 text-right">{cat.category}</span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedAnimCategory === cat.category ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedAnimCategory === cat.category && (
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5 mb-1 pe-2">
                    {cat.animations.map((anim) => (
                      <button
                        key={anim.label}
                        onClick={() => onAIEdit(anim.prompt)}
                        disabled={isGenerating}
                        title={anim.prompt}
                        className="py-2 px-2.5 rounded-lg text-[10px] font-medium border border-border text-text-secondary
                          hover:text-primary hover:border-primary/30 hover:bg-primary/5
                          active:scale-[0.97] transition-all duration-150 text-right disabled:opacity-40 leading-tight"
                      >
                        {anim.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="h-px bg-border/60" />

            <Section label="Custom animation">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAIPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAISubmit();
                  }
                }}
                placeholder='e.g. "Add a bounce animation to the main button"'
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-surface/50 border border-border/50 text-text-primary text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none placeholder:text-text-soft transition-all"
              />
              <button
                onClick={handleAISubmit}
                disabled={!aiPrompt.trim() || isGenerating}
                className={`w-full mt-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isGenerating
                    ? 'bg-primary/20 text-primary/60 cursor-wait'
                    : aiPrompt.trim()
                      ? 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98]'
                      : 'bg-surface/30 text-text-soft cursor-not-allowed'
                }`}
              >
                {isGenerating ? 'AI adding...' : 'Apply animation'}
              </button>
            </Section>
          </div>
        )}

        {/* ── Properties ─────────────────────────────────────────────── */}
        {tab === 'properties' && (
          <div className="flex flex-col gap-4 p-4">
            {selectedElement ? (
              <>
                {/* Element header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-mono font-bold uppercase tracking-wide">
                      &lt;{selectedElement.tag}&gt;
                    </div>
                  </div>
                  <button
                    onClick={onDeselect}
                    title="Deselect"
                    className="p-1.5 rounded-lg hover:bg-surface-2 text-text-soft hover:text-text-primary transition-all active:scale-90"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Text content */}
                {isTextEl && (
                  <Section label="Text">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onBlur={() => onTextChange(selectedElement.path, text)}
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-text-primary text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-all"
                    />
                  </Section>
                )}

                {/* Shape presets — Figma-style */}
                <Section label="Shape">
                  <div className="flex gap-1.5">
                    {SHAPE_PRESETS.map((shape) => (
                      <button
                        key={shape.id}
                        onClick={() => onStyleChange(selectedElement.path, 'borderRadius', shape.radius)}
                        title={shape.label}
                        className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border-2 transition-all ${
                          selectedElement.styles.borderRadius === shape.radius
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border/60 text-text-soft hover:border-primary/30 hover:text-primary hover:bg-primary/5'
                        }`}
                      >
                        {shape.icon}
                        <span className="text-[8px] font-medium">{shape.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-text-soft w-6 flex-shrink-0">
                      {parseInt(selectedElement.styles.borderRadius) || 0}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={parseInt(selectedElement.styles.borderRadius) > 50 ? 50 : parseInt(selectedElement.styles.borderRadius) || 0}
                      onChange={(e) => onStyleChange(selectedElement.path, 'borderRadius', `${e.target.value}px`)}
                      className="flex-1 h-1.5 rounded-full accent-primary"
                    />
                  </div>
                </Section>

                {/* Layout / Display */}
                <Section label="Display">
                  <OptionGrid cols="grid-cols-4">
                    {DISPLAY_OPTIONS.map((d) => (
                      <OptionButton key={d.value} onClick={() => onStyleChange(selectedElement.path, 'display', d.value)}>
                        {d.label}
                      </OptionButton>
                    ))}
                  </OptionGrid>
                </Section>

                {/* Connections & Linking */}
                <Section label="Links & Actions">
                  <p className="text-[10px] text-text-soft mb-1.5 leading-relaxed">Connect an element to an action or screen</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {LINK_TEMPLATES.map((link) => (
                      <button
                        key={link.id}
                        onClick={() => onAIEdit(link.prompt(selectedElement.text || selectedElement.tag))}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 py-2 px-2.5 rounded-lg text-[10px] font-medium border border-border text-text-secondary
                          hover:text-primary hover:border-primary/30 hover:bg-primary/5
                          active:scale-[0.97] transition-all duration-150 text-right disabled:opacity-40 leading-tight"
                      >
                        <span className="text-sm flex-shrink-0">{link.icon}</span>
                        <span>{link.label}</span>
                      </button>
                    ))}
                  </div>
                </Section>

                {/* Icon picker — click to add icon to element */}
                <Section label="Add icon">
                  <p className="text-[10px] text-text-soft mb-1.5 leading-relaxed">Click an icon to add it to the element</p>
                  <div className="grid grid-cols-8 gap-1">
                    {ICON_LIBRARY.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => onInsertIcon(selectedElement.path, icon)}
                        title={`Add ${icon}`}
                        className="aspect-square flex items-center justify-center rounded-md text-sm border border-border
                          hover:border-primary/40 hover:bg-primary/5 active:scale-90 transition-all duration-150"
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </Section>

                {/* Button size */}
                {isButton && (
                  <Section label="Button size">
                    <OptionGrid cols="grid-cols-4">
                      {BUTTON_SIZE_PRESETS.map((s) => (
                        <OptionButton
                          key={s.id}
                          title={`${s.fontSize} / ${s.padding}`}
                          onClick={() => {
                            onStyleChange(selectedElement.path, 'padding', s.padding);
                            onStyleChange(selectedElement.path, 'fontSize', s.fontSize);
                          }}
                        >
                          {s.label}
                        </OptionButton>
                      ))}
                    </OptionGrid>
                  </Section>
                )}

                {/* Font size */}
                {isTextEl && (
                  <Section label="Font size">
                    <div className="flex flex-wrap gap-1.5">
                      {FONT_SIZES.map((size) => (
                        <OptionButton
                          key={size}
                          active={selectedElement.styles.fontSize === size}
                          onClick={() => onStyleChange(selectedElement.path, 'fontSize', size)}
                        >
                          {parseInt(size)}
                        </OptionButton>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Font weight */}
                {isTextEl && (
                  <Section label="Font weight">
                    <OptionGrid cols="grid-cols-3">
                      {[
                        { id: '400', label: 'Regular' },
                        { id: '600', label: 'Bold' },
                        { id: '800', label: 'Heavy' },
                      ].map((w) => (
                        <OptionButton
                          key={w.id}
                          active={selectedElement.styles.fontWeight === w.id || (w.id === '400' && parseInt(selectedElement.styles.fontWeight) < 500)}
                          onClick={() => onStyleChange(selectedElement.path, 'fontWeight', w.id)}
                        >
                          {w.label}
                        </OptionButton>
                      ))}
                    </OptionGrid>
                  </Section>
                )}

                {/* Text align */}
                {isTextEl && (
                  <Section label="Alignment">
                    <OptionGrid cols="grid-cols-3">
                      {[
                        { id: 'right', label: 'Right' },
                        { id: 'center', label: 'Center' },
                        { id: 'left', label: 'Left' },
                      ].map((a) => (
                        <OptionButton
                          key={a.id}
                          active={selectedElement.styles.textAlign === a.id}
                          onClick={() => onStyleChange(selectedElement.path, 'textAlign', a.id)}
                        >
                          {a.label}
                        </OptionButton>
                      ))}
                    </OptionGrid>
                  </Section>
                )}

                {/* Colors — side by side */}
                <Section label="Colors">
                  <div className="flex items-center gap-4">
                    <label className="flex flex-col items-center gap-1.5 cursor-pointer">
                      <input
                        type="color"
                        defaultValue={rgbToHex(selectedElement.styles.color)}
                        onChange={(e) => onStyleChange(selectedElement.path, 'color', e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer border-2 border-border hover:border-primary/40 transition-colors"
                      />
                      <span className="text-[9px] text-text-soft font-medium">Text</span>
                    </label>
                    <label className="flex flex-col items-center gap-1.5 cursor-pointer">
                      <input
                        type="color"
                        defaultValue={rgbToHex(selectedElement.styles.backgroundColor)}
                        onChange={(e) => onStyleChange(selectedElement.path, 'backgroundColor', e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer border-2 border-border hover:border-primary/40 transition-colors"
                      />
                      <span className="text-[9px] text-text-soft font-medium">Background</span>
                    </label>
                    <button
                      onClick={() => onStyleChange(selectedElement.path, 'backgroundColor', 'transparent')}
                      title="Make background transparent"
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-9 h-9 rounded-lg border-2 border-border group-hover:border-red-300 flex items-center justify-center transition-colors"
                        style={{ background: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 12px 12px' }}>
                        <svg className="w-4 h-4 text-text-soft group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </div>
                      <span className="text-[9px] text-text-soft font-medium">Clear</span>
                    </button>
                  </div>
                </Section>

                {/* Shadow */}
                <Section label="Shadow">
                  <OptionGrid cols="grid-cols-5">
                    {SHADOW_PRESETS.map((s) => (
                      <OptionButton
                        key={s.id}
                        title={s.value}
                        onClick={() => onStyleChange(selectedElement.path, 'boxShadow', s.value)}
                      >
                        {s.label}
                      </OptionButton>
                    ))}
                  </OptionGrid>
                </Section>

                {/* Border radius */}
                <Section label="Border radius">
                  <OptionGrid cols="grid-cols-4">
                    {['0px', '4px', '8px', '12px', '16px', '24px', '9999px'].map((r) => (
                      <OptionButton
                        key={r}
                        active={selectedElement.styles.borderRadius === r}
                        onClick={() => onStyleChange(selectedElement.path, 'borderRadius', r)}
                      >
                        {r === '9999px' ? 'Full' : parseInt(r)}
                      </OptionButton>
                    ))}
                  </OptionGrid>
                </Section>

                {/* Padding */}
                <Section label="Padding">
                  <OptionGrid cols="grid-cols-6">
                    {['0px', '4px', '8px', '16px', '24px', '32px'].map((p) => (
                      <OptionButton
                        key={p}
                        onClick={() => onStyleChange(selectedElement.path, 'padding', p)}
                      >
                        {parseInt(p)}
                      </OptionButton>
                    ))}
                  </OptionGrid>
                </Section>

                {/* Opacity */}
                <Section label="Opacity">
                  <OptionGrid cols="grid-cols-5">
                    {['1', '0.9', '0.75', '0.5', '0.25'].map((o) => (
                      <OptionButton
                        key={o}
                        onClick={() => onStyleChange(selectedElement.path, 'opacity', o)}
                      >
                        {Math.round(parseFloat(o) * 100)}%
                      </OptionButton>
                    ))}
                  </OptionGrid>
                </Section>

                {/* Width */}
                <Section label="Width">
                  <OptionGrid cols="grid-cols-4">
                    {[
                      { label: 'Auto', value: 'auto' },
                      { label: '50%', value: '50%' },
                      { label: '100%', value: '100%' },
                      { label: 'Fit', value: 'fit-content' },
                    ].map((w) => (
                      <OptionButton key={w.value} onClick={() => onStyleChange(selectedElement.path, 'width', w.value)}>
                        {w.label}
                      </OptionButton>
                    ))}
                  </OptionGrid>
                </Section>

                {/* AI for this element */}
                <div className="border-t border-border pt-4">
                  <Section label="AI for this element">
                    <div className="flex flex-wrap gap-1.5">
                      {isButton ? (
                        <>
                          <button onClick={() => onAIEdit(`Improve the design of the "${selectedElement.text}" button - add gradient, shadow, and hover animation`)} disabled={isGenerating}
                            className="py-1.5 px-3 rounded-lg text-[10px] font-medium bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 active:scale-[0.97] transition-all disabled:opacity-40">
                            Enhance button
                          </button>
                          <button onClick={() => onAIEdit(`Add a suitable icon to the "${selectedElement.text}" button`)} disabled={isGenerating}
                            className="py-1.5 px-3 rounded-lg text-[10px] font-medium bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 active:scale-[0.97] transition-all disabled:opacity-40">
                            + Icon
                          </button>
                          <button onClick={() => onAIEdit(`Convert the "${selectedElement.text}" button to an outline style`)} disabled={isGenerating}
                            className="py-1.5 px-3 rounded-lg text-[10px] font-medium bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 active:scale-[0.97] transition-all disabled:opacity-40">
                            Outline
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => onAIEdit(`Improve the design of the ${selectedElement.tag} "${selectedElement.text.slice(0, 30)}" - make it more impressive`)} disabled={isGenerating}
                            className="py-1.5 px-3 rounded-lg text-[10px] font-medium bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 active:scale-[0.97] transition-all disabled:opacity-40">
                            Enhance design
                          </button>
                          <button onClick={() => onAIEdit(`Add an entrance animation to the ${selectedElement.tag} element`)} disabled={isGenerating}
                            className="py-1.5 px-3 rounded-lg text-[10px] font-medium bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 active:scale-[0.97] transition-all disabled:opacity-40">
                            + Animation
                          </button>
                        </>
                      )}
                    </div>
                  </Section>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12 px-6">
                <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-text-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
                  </svg>
                </div>
                <p className="text-sm text-text-primary font-medium mb-1.5">Click an element</p>
                <p className="text-[11px] text-text-soft leading-relaxed max-w-[180px]">
                  Click a button, text, or any element in the preview to edit it
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
