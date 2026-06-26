# High-Fidelity Visual Token & Spec Sheet
**Theme**: Zen-Editorial / Tactile Paper  
**Status**: Approved & Locked (Production-Grade SaaS Specification)  
**Directive Compliance**: Mindset Directive (June 24, 2026) — Practicality Over Flashiness, Cognitive Offloading for the Solo Multi-Tasker

This styling specification details the visual token mappings, interactive state systems, and typography scales for the **Last-Minute Life Saver** web cockpit. In alignment with our production mindset, this system rejects complex "sci-fi" dashboards in favor of a clean, spacious Japanese paper editorial aesthetic. Every design choice is engineered to minimize activation inertia, cognitive noise, and visual stress.

---

## 1. THE TYPOGRAPHY SYSTEM

Our typography pairing utilizes **Lora** (a contemporary editorial serif with brushed curves) to establish a calm, trusted tone for headers and primary focal points, paired with **Plus Jakarta Sans** (a modern humanist sans-serif) to ensure maximum legibility and spatial alignment for telemetry and controls.

| Role | Font Family | Size / Tailwind Class | Line Height | Tracking (Letter Spacing) | Cognitive / UX Intent |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Main Clock** | `Lora` (Light) | `text-7xl` or `text-8xl` (4.5rem to 6rem) | `leading-none` | `tracking-tighter` (-0.05em) | A quiet, readable temporal anchor in the center of the Day Dial. |
| **Page Headers** | `Lora` (Medium) | `text-3xl` (1.875rem) | `leading-tight` (1.25) | `tracking-tight` (-0.025em) | Clean, book-like titles that establish structured visual hierarchy. |
| **Section Labels** | `Plus Jakarta Sans` (Bold) | `text-xs` (0.75rem) | `leading-none` | `tracking-widest` (0.15em) | High-contrast, scannable uppercase headers for quick metadata routing. |
| **Card Titles** | `Lora` (Medium) | `text-lg` (1.125rem) | `leading-snug` (1.375) | `tracking-normal` (0) | Warm, human titles that draw initial attention to focus items. |
| **Body & Logs** | `Plus Jakarta Sans` (Regular) | `text-sm` (0.875rem) | `leading-relaxed` (1.6) | `tracking-normal` (0) | High readability for multi-line documents, email drafts, and chat logs. |
| **Metadata & Fields** | `Plus Jakarta Sans` (Medium) | `text-xs` (0.75rem) | `leading-normal` | `tracking-wide` (0.025em) | Decluttered field labels, timestamps, and active status tags. |

---

## 2. THE "WARM MINIMALIST" PALETTE

All colors are chosen to mimic organic, heavy-grain natural paper stock. Pure black is rejected in favor of deep indigo ink, and alarm tones are desaturated to terracotta to prevent user anxiety.

```
+-------------------------------------------------------------------------+
|  CANVAS: #F4F1EA     CARD: #FAF8F5      INK: #12131C      MUTED: #5C5E6A|
|  (Warm Alabaster)    (Soft Linen)       (Deep Indigo)     (Charcoal)    |
+-------------------------------------------------------------------------+
|  SAGE: #6E826E       TERRACOTTA: #D47053                 HORIZON: #668FA8|
|  (Active Focus)      (Priority Alerts)                   (Google Sync) |
+-------------------------------------------------------------------------+
```

### Tailwind Config & Color Mapping
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        canvas: '#F4F1EA',       // Primary backdrop mimicking natural paper
        cardLinen: '#FAF8F5',    // Frosted, opaque card layouts
        ink: '#12131C',          // High-contrast text & primary borders
        charcoal: '#5C5E6A',     // Secondary body text, logs, and inactive icons
        sage: '#6E826E',         // Active task/timer focus state (calming green)
        terracotta: '#D47053',   // Urgent validation / priority alerts (warm terracotta)
        horizon: '#668FA8',      // Google Calendar synced indicators (horizon blue)
        paperBorder: '#E5DFD3',  // Low-contrast divider and card outline
      },
      fontFamily: {
        lora: ['Lora', 'Georgia', 'serif'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
      }
    }
  }
}
```

---

## 3. MULTI-USER INPUT STATES

Input fields for **Email**, **Password**, and **Confirm Password** utilize strict interactive styling. The focus states use our calming Sage Green color to reassure the user as they type, while error states apply Terracotta to alert them without triggering stress.

*   **Resting State**:  
    `bg-cardLinen/40 border border-paperBorder text-ink font-jakarta text-sm rounded-lg px-4 py-3 transition-all duration-300 w-full placeholder:text-charcoal/40`  
    *Visuals*: Soft, semi-translucent entry boxes that sit flat within the paper container.
*   **Focus State**:  
    `focus:bg-white focus:border-sage focus:ring-1 focus:ring-sage/30 focus:outline-none`  
    *Visuals*: Input fills to solid white, border tightens to sage green, and a soft, desaturated sage ring highlights active cursor focus.
*   **Terracotta Validation Error State**:  
    `border-terracotta bg-terracotta/5 text-terracotta focus:border-terracotta focus:ring-terracotta/30 placeholder:text-terracotta/40`  
    *Visuals*: A gentle warm red wash inside the field container, terracotta border, and desaturated error text.
*   **Accessibility Contract**:  
    Fields must support standard keyboard navigation (`Tab` / `Shift+Tab`) and utilize native HTML autocomplete/masking attributes while maintaining clear, visible focus outlines.

---

## 4. SETTINGS MODAL INTERACTIVE ELEMENTS

Decoupled configurations (Google Calendar OAuth login and Gemini API key inputs) are housed inside a sliding, glassmorphic settings pane. The modal uses a heavy backdrop filter to isolate the dashboard controls from the active configuration workspace, reducing background distraction.

*   **Backdrop Overlay**:  
    `fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/10 backdrop-blur-md`  
    *Visuals*: A soft, translucent screen overlay featuring a `12px` backdrop blur (`backdrop-filter: blur(12px)`) that filters out the busy cockpit charts behind it.
*   **Modal Card Container**:  
    `bg-cardLinen/90 backdrop-blur-md border border-white/60 p-8 rounded-xl shadow-[0_12px_40px_rgba(28,25,23,0.06)] max-w-lg w-full transition-all duration-500`  
    *Visuals*: Heavy card paper texture, soft white double border highlight, and subtle warm-gray ambient shadow.

### 4.1 Google Connect Button (Inside Settings)
*   **Resting State**:  
    `bg-cardLinen/80 border border-paperBorder text-ink font-jakarta text-sm font-medium px-5 py-3 rounded-lg shadow-sm transition-all duration-300`  
    *Visuals*: Flat, tactile card look with a subtle hover offset.
*   **Hover State**:  
    `hover:bg-white hover:border-horizon/50 hover:shadow-md hover:-translate-y-px`  
    *Visuals*: Subtle lift, glowing horizon-blue borders.
*   **Authorized State**:  
    `bg-horizon/10 border border-horizon/30 text-horizon cursor-default`  
    *Visuals*: Soft blue tint, displaying a green checkmark to confirm backend token validation.

### 4.2 Gemini API Key Input (Inside Settings)
Follows the standard input state styling. Implements a secure password-type text mask (`type="password"`) and includes an inline button to reveal the key securely if clicked.

---

## 5. COCKPIT VISUAL SPECS (Before/After States)

### 5.1 The Day Dial
*   **Dial Axis Ring**:  
    `border border-paperBorder/60 rounded-full w-48 h-48 relative flex items-center justify-center`
*   **The "Now" Pulsing Dot**:  
    `w-2 h-2 rounded-full bg-sage relative` with a double-layered ripple:  
    `absolute w-4 h-4 rounded-full border border-sage/40 animate-ping`
*   **Calendar Arcs**:  
    *   *Free Time*: No arc overlay (defaults to the paper border color).
    *   *Focus Block*: `stroke-sage/30 stroke-[3px]` (Soft sage green representing time blocks generated by the AI agent).
    *   *External Calendar Event*: `stroke-horizon/30 stroke-[3px]` (Soft blue representing synced Google Calendar items).

### 5.2 Active Focus Card
*   **Resting / Pending State**:  
    `bg-white/40 backdrop-blur-md border border-white/60 p-8 rounded-xl shadow-md transition-all duration-500`
*   **Active Session Focus State**:  
    `bg-white/80 border border-sage/30 ring-1 ring-sage/10 p-8 rounded-xl shadow-lg scale-[1.01]`  
    *Visuals*: Card gains structure, card border glows softly in sage, and the background shifts closer to opaque white to eliminate transparency distraction during focus.

### 5.3 Slide-up AI Intervention Sheet
*   **Closed State**:  
    `translate-y-full opacity-0 pointer-events-none transition-all duration-500`
*   **Triggered / Active State**:  
    `translate-y-0 opacity-100 bg-gradient-to-tr from-cardLinen via-white/95 to-cardLinen border-t border-paperBorder p-6 rounded-t-2xl shadow-[0_-12px_40px_rgba(28,25,23,0.06)]`  
    *Visuals*: Slides up from the lower edge. Incorporates a thin border glow indicator on the top lip (`border-t-terracotta/30` if alert, `border-t-sage/30` if outline draft proposal) to categorize the advice type.
