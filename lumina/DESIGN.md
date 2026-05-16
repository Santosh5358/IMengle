---
name: Lumina
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363940'
  surface-container-lowest: '#0b0e14'
  surface-container-low: '#191c22'
  surface-container: '#1d2026'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2eb'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e1e2eb'
  inverse-on-surface: '#2e3037'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#ebb2ff'
  on-secondary: '#520072'
  secondary-container: '#b600f8'
  on-secondary-container: '#fff6fc'
  tertiary: '#faf3ff'
  on-tertiary: '#3c0090'
  tertiary-container: '#e1d2ff'
  on-tertiary-container: '#7213ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#f8d8ff'
  secondary-fixed-dim: '#ebb2ff'
  on-secondary-fixed: '#320047'
  on-secondary-fixed-variant: '#74009f'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d1bcff'
  on-tertiary-fixed: '#23005b'
  on-tertiary-fixed-variant: '#5700c9'
  background: '#10131a'
  on-background: '#e1e2eb'
  surface-variant: '#32353c'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin-desktop: 40px
  container-margin-mobile: 20px
  gutter: 24px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style
The design system is engineered for a premium, high-energy social discovery platform. It targets a Gen-Z and Millennial audience looking for spontaneous but high-quality digital interactions. The emotional response is one of excitement, safety, and futuristic sophistication.

The aesthetic follows a **refined Glassmorphism** approach set against a deep, immersive dark theme. By combining ultra-minimalist layouts with vibrant neon accents, the UI creates a "nightclub in the cloud" atmosphere. Visual hierarchy is maintained through varying levels of transparency and background blurs rather than heavy fills, ensuring the focus remains on the live video stream.

## Colors
The palette is rooted in a "Deep Space" neutral (`#0B0E14`) to provide maximum contrast for the neon primary and secondary colors. 

- **Primary (Electric Cyan):** Used for critical actions, active states, and primary branding. It serves as the "glow" source for the most important UI triggers.
- **Secondary (Neon Purple):** Used for expressive elements, premium features, and decorative gradients.
- **Tertiary (Deep Violet):** Used for background depth and secondary glowing effects to create a multi-dimensional light field.
- **Surface:** Surfaces are never fully opaque; they use a base of `rgba(255, 255, 255, 0.05)` with heavy backdrop blurs.

## Typography
The system utilizes a dual-font strategy. **Montserrat** is reserved for headlines and "Display" moments, providing a geometric, confident, and modern architectural feel. **Inter** handles all functional text, ensuring high legibility even when layered over complex video backgrounds or translucent surfaces.

Upper-case styling should be applied to `label-md` and `label-sm` to create a "technical" or "HUD" (Heads-Up Display) aesthetic suitable for a video-centric interface.

## Layout & Spacing
The layout employs a **Fluid Grid** model with high internal margins to keep the center of the screen clear for video content. 

- **Desktop:** 12-column grid with wide 40px margins. Interface elements are docked to the edges or float as translucent "pods."
- **Mobile:** 4-column grid. Controls are primarily positioned in the bottom 30% of the screen (the "Thumb Zone") to facilitate easy navigation during one-handed use.
- **Rhythm:** All spacing is derived from a 4px/8px baseline, ensuring mathematical harmony between elements even when they are floating.

## Elevation & Depth
Depth is not communicated through traditional drop shadows but through **Backdrop Blurs (Glassmorphism)** and **Inner Glows**.

1.  **Level 1 (Base):** The video stream or the deep neutral background.
2.  **Level 2 (Panels):** `backdrop-filter: blur(20px)` with a 1px border of `rgba(255, 255, 255, 0.1)`.
3.  **Level 3 (Active Elements):** Elements like buttons or active chips use a "Neon Bloom" — a shadow with a high spread and 0px offset using the primary or secondary color at 40-60% opacity.

## Shapes
The design system uses **Rounded (0.5rem base)** geometry to balance the "sharpness" of the neon lights with a friendly, approachable hand-feel. 

- **Cards & Pods:** Use `rounded-xl` (1.5rem) to feel like floating pebbles.
- **Inputs & Small Buttons:** Use the standard `rounded` (0.5rem).
- **Interactive Icons:** Should be housed in circular containers to differentiate them from functional data containers.

## Components

### Buttons
Primary buttons are "Glowing" states. They feature a solid Cyan-to-Purple gradient with a matching color outer glow (bloom). Text should be high-contrast (Black or Deep Navy). Secondary buttons are "Ghost Glass"—transparent with a thin white border and a hover state that increases the backdrop blur.

### Translucent Cards
Cards should have no solid background color. Use a linear gradient stroke (Top-Left to Bottom-Right) from `white/20%` to `white/0%` to simulate light hitting the edge of a glass pane.

### Input Fields
Inputs are minimalist underlines or subtle glass boxes. When focused, the bottom border "lights up" with a Cyan glow, and the label should float upward using a transition of 200ms.

### Video Overlays
Information like "User Name" or "Location" should appear as small, high-blur glass chips in the corners of the video feed. Use `label-sm` typography for these to keep the interface unobtrusive.

### Micro-interactions
Transitions between screens should use a "Zoom & Blur" effect. When a new chat connects, the primary button should pulse with a subtle neon glow to draw the eye.