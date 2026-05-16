---
name: Celestial Neon
colors:
  surface: '#11131d'
  surface-dim: '#11131d'
  surface-bright: '#373844'
  surface-container-lowest: '#0c0e18'
  surface-container-low: '#191b26'
  surface-container: '#1d1f2a'
  surface-container-high: '#282934'
  surface-container-highest: '#32343f'
  on-surface: '#e1e1f0'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e1e1f0'
  inverse-on-surface: '#2e303b'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#5de6ff'
  on-secondary: '#00363e'
  secondary-container: '#00cbe6'
  on-secondary-container: '#00515d'
  tertiary: '#ffafd3'
  on-tertiary: '#620040'
  tertiary-container: '#e364a7'
  on-tertiary-container: '#560038'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#a2eeff'
  secondary-fixed-dim: '#2fd9f4'
  on-secondary-fixed: '#001f25'
  on-secondary-fixed-variant: '#004e5a'
  tertiary-fixed: '#ffd8e7'
  tertiary-fixed-dim: '#ffafd3'
  on-tertiary-fixed: '#3d0026'
  on-tertiary-fixed-variant: '#85145a'
  background: '#11131d'
  on-background: '#e1e1f0'
  surface-variant: '#32343f'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 56px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
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
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin: 32px
---

## Brand & Style
The design system embodies a "Celestial Neon" aesthetic, positioning the product as a premium, high-tech platform for modern digital connection. It draws heavily from **Glassmorphism** and **Retro-futurism**, utilizing deep, infinite backgrounds contrasted against vibrant, luminous accents that mimic the glow of nebulae.

The target audience consists of forward-thinking professionals and tech-native creators who value precision and a sophisticated "startup" atmosphere. The UI should evoke a sense of vastness and clarity, using high-quality glass effects and light-refraction metaphors to create depth. Surfaces are not merely flat planes but translucent layers of digital atmosphere, suggesting a "best-in-class" tool that is both powerful and elegantly crafted.

## Colors
The palette is rooted in the "Deep Space Indigo" (#0B0D17) which serves as the primary canvas for all interfaces. This dark base is essential for the neon accents to achieve their intended "glow" effect.

- **Primary (Electric Violet):** Used for core actions, active states, and high-energy branding moments.
- **Secondary (Cyan Nebula):** Used for interactive highlights, data visualization, and secondary call-to-actions.
- **Surface Strategy:** Layers are built using variations of the neutral base with increasing transparency and subtle color tints (1-5% violet/cyan) rather than simple grays.
- **Functional Colors:** Success (Emerald), Warning (Amber), and Error (Crimson) are desaturated slightly to prevent them from clashing with the vibrant neon theme, while maintaining high legibility.

## Typography
The typography utilizes **Montserrat** across all levels to project a clean, geometric, and high-tech personality. 

Large displays and headlines use bold weights with tighter letter spacing to create a commanding, modern presence. Body copy is set with generous line heights to ensure maximum readability against dark, translucent backgrounds. Labels are often transformed to uppercase with increased tracking to mimic technical instrumentation or aerospace readouts. 

Gradient fills (Violet to Cyan) should be applied to `display-lg` and `headline-lg` sparingly to reinforce the Celestial Neon theme in hero sections.

## Layout & Spacing
The layout follows a **Fluid Grid** system based on a 12-column structure for desktop and a 4-column structure for mobile. 

The spacing philosophy is "Airy and Precise." Large margins and significant vertical rhythm (using `xl` and `lg` units) help distinguish this design system as a premium experience, preventing the UI from feeling cluttered. Elements are grouped using a tight 8px base unit to ensure a high-tech, interlocking feel within cards and components, while the overall layout uses expansive whitespace to let the glassmorphism "breathe."

## Elevation & Depth
Depth is created through **Sophisticated Glassmorphism** rather than traditional drop shadows. 

1.  **Backdrop Blur:** Surfaces use a high-density blur (20px to 40px) to simulate frosted glass that obscures the background while retaining light and color.
2.  **Inner Glow Borders:** Instead of dark shadows, containers feature a 1px, semi-transparent border (top and left edges are slightly brighter than bottom and right) to catch the "light" of the neon accents.
3.  **Tonal Stacking:** Higher elevation levels are indicated by increased surface opacity (e.g., Level 1 = 10% opacity, Level 2 = 18% opacity) rather than darker shadows.
4.  **Accent Glows:** A soft, ultra-diffused radial gradient in Violet or Cyan is occasionally placed *behind* cards to suggest they are floating above a light-emitting source.

## Shapes
The shape language is consistently **Rounded**, using a 0.5rem (8px) corner radius for most interface elements. This balance avoids the harshness of a brutalist aesthetic while remaining more structured and professional than a fully "bubbly" or pill-shaped design.

- **Primary Buttons:** Use `rounded-lg` (16px) to stand out as softer, more touchable objects.
- **Containers & Cards:** Use the standard `rounded` (8px) for a precise, modular look.
- **Inputs:** Maintain sharp-yet-soft corners to reinforce the high-tech, geometric feel of the Montserrat typeface.

## Components
- **Buttons:** Primary buttons feature a subtle diagonal gradient (Electric Violet to Cyan Nebula). Ghost buttons utilize the 1px elegant border with a backdrop blur.
- **Chips:** Highly translucent with a `label-sm` font. Active chips use a solid Cyan Nebula fill with dark indigo text for high contrast.
- **Input Fields:** Dark, 5% transparent fills with a 1px violet bottom border that glows (increases in opacity) on focus.
- **Cards:** The core of the design system. They must utilize `backdrop-filter: blur()` and thin borders. Content within cards should have generous internal padding (24px).
- **Checkboxes/Radios:** Custom-styled as "Neon Toggles." When active, they should emit a faint outer glow in the primary color.
- **Lists:** Separated by low-opacity thin lines (10% white) to maintain a sense of lightness and transparency.
- **Interactive States:** Hovering over any interactive element should result in a "Light Refraction" effect—a subtle increase in border brightness or a faint color shift in the backdrop blur.