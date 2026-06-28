---
name: Monochrome Minimalist
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#0b0c0c'
  on-primary: '#ffffff'
  primary-container: '#222222'
  on-primary-container: '#8a8989'
  inverse-primary: '#c8c6c5'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e3e2e2'
  on-secondary-container: '#646464'
  tertiary: '#0c0c0b'
  on-tertiary: '#ffffff'
  tertiary-container: '#232221'
  on-tertiary-container: '#8c8987'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1b1c1c'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#e3e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#e6e2e0'
  tertiary-fixed-dim: '#c9c6c4'
  on-tertiary-fixed: '#1c1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
---

# Design System: Monochrome Minimalist

## Brand & Style
The brand personality is characterized by extreme clarity, high-end sophistication, and a "no-nonsense" professional utility. By utilizing a grayscale foundation, the brand achieves a **Minimalist / Brutalist-Lite** aesthetic. It evokes a sense of timelessness and precision, similar to architectural blueprints or premium editorial design. While maintaining a structural rigor, the subtle introduction of softening elements suggests a brand that is professional yet approachable. The target audience is professionals who value content over decoration and require a high-focus environment.

## Colors
The color strategy is strictly monochromatic to emphasize hierarchy through value rather than hue.
- **Primary (#222222):** An "almost black" used for high-impact elements, primary actions, and headlines to ensure maximum readability and authority.
- **Secondary (#888888):** A mid-tone gray used for supporting information, icons, and secondary interactions.
- **Neutral (#f2f2f2):** A very light gray used for background surfaces and subtle containers to provide a clean, soft canvas that reduces eye strain compared to pure white.
- **Color Mode:** The system is optimized for a Light mode experience that mimics high-quality paper.

## Typography
The typography pairing balances editorial tradition with digital utility.
- **Headlines:** Uses **Source Serif 4**. This adds an editorial, trustworthy, and humanistic touch to the interface, creating a strong contrast against the digital precision of the UI.
- **Body & Labels:** Uses **Inter**. Chosen for its exceptional legibility at small sizes and its neutral, modern character. 
The scale prioritizes vertical rhythm and generous line heights to ensure long-form content is easy to digest.

## Layout & Spacing
The layout follows a disciplined, grid-based approach. We use a base-8 spacing scale to maintain mathematical consistency. The layout model is a fluid grid that collapses into a single column for mobile devices. Margins and gutters are kept tight (16px) to reinforce efficiency, while large blocks of whitespace are used between major sections to provide "breathing room" and visual relief.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and subtle structural definition rather than heavy shadows. 
- Surfaces use container tiers to create hierarchy.
- Interactive states are indicated by color inversion or 1px solid borders.
- While the design remains flat, the slight softening of corners allows for a more modern "layered" feel where elements feel distinct but integrated.

## Shapes
The shape language is **Rounded (8px)**. All containers, buttons, inputs, and cards feature 0.5rem rounded angles. This transition from sharp corners to rounded ones maintains a precision-based feel while creating a sense of approachability and stability.

## Components
- **Buttons:** Rounded corners (8px), high contrast. Primary buttons are solid #222222 with white text. Secondary buttons are outlined.
- **Inputs:** Simple 1px borders (#888888) with 8px corner radius. Borders thicken or turn black (#222222) on focus.
- **Cards:** Defined by 1px solid borders or subtle neutral background fills (#f2f2f2) with standard corner rounding.
- **Chips:** Subtly rounded blocks with "Label" typography, using secondary gray or light neutral backgrounds.
- **Navigation:** Clean, text-heavy links using Inter Medium, with active states marked by a simple underline or bold weight.
