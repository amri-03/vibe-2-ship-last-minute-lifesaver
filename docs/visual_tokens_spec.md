# High-Fidelity Visual Token & Spec Sheet
**Theme**: Zen-Editorial / Tactile Paper  
**Status**: Approved (Phase 2 Design Specification)

This specification converts the structural layout of the 2-Page MVP into a concrete visual design system. The theme merges the clean, spacious layouts of physical Japanese paper editorial blocks with clean digital utilities, choosing organic color tones, micro-shadows, and light glassmorphic layers over standard flat SaaS templates.

---

## 1. THE TYPOGRAPHY SYSTEM

Typography is styled using **Lora** (a contemporary serif with brushed curves) for formal editorial structure, combined with **Plus Jakarta Sans** to provide high interface legibility and modern geometric utility.

| Role | Font Family | Size / Tailwind Class | Line Height | Tracking (Letter Spacing) | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Main Clock** | `Lora` (Light) | `text-7xl` or `text-8xl` (4.5rem to 6rem) | `leading-none` | `tracking-tighter` (-0.05em) | Radial dial center time |
| **Page Headers** | `Lora` (Medium) | `text-3xl` (1.875rem) | `leading-tight` (1.25) | `tracking-tight` (-0.025em) | Screen headers, lock screen titles |
| **Section Labels** | `Plus Jakarta Sans` (Bold) | `text-xs` (0.75rem) | `leading-none` | `tracking-widest` (0.15em) | Eyebrow text, uppercase labels |
| **Card Titles** | `Lora` (Medium) | `text-lg` (1.125rem) | `leading-snug` (1.375) | `tracking-normal` (0) | Focus cards, intervention headers |
| **Body & Logs** | `Plus Jakarta Sans` (Regular) | `text-sm` (0.875rem) | `leading-relaxed` (1.6) | `tracking-normal` (0) | Tasks, email drafts, chatbot responses |
| **Metadata & Fields** | `Plus Jakarta Sans` (Medium) | `text-xs` (0.75rem) | `leading-normal` | `tracking-wide` (0.025em) | Time tags, status tags, form inputs |

---

## 2. THE "WARM MINIMALIST" PALETTE

All hex values use organic undertones to mimic heavy natural paper stock, utilizing soft indigo/charcoal for text rather than pure black.

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
        canvas: '#F4F1EA',       // Primary screen backdrop
        cardLinen: '#FAF8F5',    // Base card color (opaque)
        ink: '#12131C',          // Core headers and dark text
        charcoal: '#5C5E6A',     // Secondary body text & metadata
        sage: '#6E826E',         // Active session green / success states
        terracotta: '#D47053',   // Alert banners / task severity indicators
        horizon: '#668FA8',      // Google Calendar blue / synced indicators
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

Input fields for **Email**, **Password**, and **Confirm Password** are designed with tactile cues, providing responsive states to reduce friction.

*   **Resting State**:  
    `bg-cardLinen/40 border border-paperBorder text-ink font-jakarta text-sm rounded-lg px-4 py-3 transition-all duration-300 w-full placeholder:text-charcoal/40`  
    *Visuals*: A clean, translucent input box blending with the linen paper container.
*   **Focus State**:  
    `focus:bg-white focus:border-sage focus:ring-1 focus:ring-sage/30 focus:outline-none`  
    *Visuals*: Clears up to pure white, highlights with a sage green border, and adds a soft, ambient sage green focus ring.
*   **Terracotta Validation Error State**:  
    `border-terracotta bg-terracotta/5 text-terracotta focus:border-terracotta focus:ring-terracotta/30 placeholder:text-terracotta/40`  
    *Visuals*: Low-contrast terracotta/rust background glow, strong terracotta border, and error text coloring.

---

## 4. SETTINGS MODAL INTERACTIVE ELEMENTS

The settings modal handles system configurations and integrations. It sits as a frosted sheet hovering above the main cockpit.

*   **Backdrop Overlay**:  
    `fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/10 backdrop-blur-md`  
    *Visuals*: Light grey wash with a heavy glassmorphic blur (`backdrop-filter: blur(12px)`) that lets the underlying cockpit events bleed through softly.
*   **Modal Card Container**:  
    `bg-cardLinen/90 backdrop-blur-md border border-white/60 p-8 rounded-xl shadow-[0_12px_40px_rgba(28,25,23,0.06)] max-w-lg w-full transition-all duration-500`  
    *Visuals*: Soft white glassmorphic borders with a warm drop shadow.

### 4.1 Google Connect Button (Inside Settings)
*   **Resting State**:  
    `bg-cardLinen/80 border border-paperBorder text-ink font-jakarta text-sm font-medium px-5 py-3 rounded-lg shadow-sm transition-all duration-300`  
    *Visuals*: Clean cream button with subtle border definition.
*   **Hover State**:  
    `hover:bg-white hover:border-horizon/50 hover:shadow-md hover:-translate-y-px`  
    *Visuals*: Soft elevation, glowing blue border.
*   **Authorized State**:  
    `bg-horizon/10 border border-horizon/30 text-horizon cursor-default`  
    *Visuals*: Calm blue background wash, disabled actions.

### 4.2 Gemini API Key Input (Inside Settings)
Uses the standard input state styling. Stored locally or securely in the backend, utilizing a password-type mask (`type="password"`).

---

## 5. COCKPIT VISUAL SPECS (Before/After States)

### 5.1 The Day Dial
*   **Dial Axis Ring**:  
    `border border-paperBorder/60 rounded-full w-48 h-48 relative flex items-center justify-center`
*   **The "Now" Pulsing Dot**:  
    `w-2 h-2 rounded-full bg-sage relative` with a double-layered ripple:  
    `absolute w-4 h-4 rounded-full border border-sage/40 animate-ping`
*   **Calendar Arcs**:  
    *   *Free Time*: No arc overlay.
    *   *Focus Block*: `stroke-sage/30 stroke-[3px]`
    *   *External Calendar Event*: `stroke-horizon/30 stroke-[3px]`

### 5.2 Active Focus Card
*   **Resting / Pending State**:  
    `bg-white/40 backdrop-blur-md border border-white/60 p-8 rounded-xl shadow-md transition-all duration-500`
*   **Active Session Focus State**:  
    `bg-white/80 border border-sage/30 ring-1 ring-sage/10 p-8 rounded-xl shadow-lg scale-[1.01]`  
    *Visuals*: Solidifies, active timer bar turns to `bg-sage/80`.

### 5.3 Slide-up AI Intervention Sheet
*   **Closed State**:  
    `translate-y-full opacity-0 pointer-events-none transition-all duration-500`
*   **Triggered / Active State**:  
    `translate-y-0 opacity-100 bg-gradient-to-tr from-cardLinen via-white/95 to-cardLinen border-t border-paperBorder p-6 rounded-t-2xl shadow-[0_-12px_40px_rgba(28,25,23,0.06)]`  
    *Visuals*: Highlights the top edge (`border-t-terracotta/30` if alert, `border-t-sage/30` if task outline proposal).
