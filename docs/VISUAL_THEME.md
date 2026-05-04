# Inclufy Visual Theme — Design Reference

## Core Visual Identity

The Inclufy visual theme is built around **connected intelligence** — hexagonal network patterns representing the ecosystem's interconnected modules, with human interaction at the center.

## Key Visual Elements

### 1. Hexagonal Network Pattern
- Honeycomb/hexagonal grid as background motif
- Represents interconnected modules and data flow
- White/translucent nodes on gradient backgrounds
- Glowing connection points where modules intersect

### 2. The Green-Blue Gradient
- Left: Inclufy Green (#56a632) — growth, energy
- Right: Inclufy Blue (#005681) — trust, stability
- Signature "BlueGreen fade" from brandbook
- Used in hero sections, backgrounds, overlays

### 3. The Dark Sky Fade
- Dark navy top (#001f3a)
- Blue middle (#005681)
- Green glow bottom-left (#56a632)
- Creme center (#ede7db)
- Used for premium/hero sections

### 4. Connected Nodes
- Glowing white dots connected by thin lines
- Represents data flowing between modules
- Clusters around the Inclufy "in" logo
- Human hand touching = interaction point

### 5. The "in" Logo
- Green circle (#56a632) with navy "in" text (#001f3a)
- Appears as both wordmark "inclufy" and icon "in"
- Always on a solid green circle when used as icon

## CSS Implementation

```css
/* Hexagonal network background */
.hero-network {
  background:
    radial-gradient(ellipse at 0% 100%, rgba(86,166,50,0.4) 0%, transparent 50%),
    radial-gradient(ellipse at 100% 0%, rgba(0,86,129,0.3) 0%, transparent 50%),
    linear-gradient(160deg, #001f3a 0%, #005681 40%, #56a632 100%);
}

/* Connected dots animation */
@keyframes pulse-node {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.3); }
}

/* Green glow effect */
.glow-green {
  box-shadow: 0 0 30px rgba(86,166,50,0.4);
}

/* Blue-green gradient text */
.gradient-text {
  background: linear-gradient(135deg, #005681, #56a632);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## Application Guidelines

| Context | Visual Treatment |
|---|---|
| Hero sections | Dark Sky Fade + hexagonal network + floating nodes |
| Section backgrounds | Alternating creme (#ede7db) and white |
| Cards | White with subtle green/blue left border |
| CTAs | Inclufy Green (#56a632) buttons, navy (#001f3a) text |
| Dark sections | Blue-black (#001f3a) with green glow accents |
| Diagrams | Solution wheels (sales=blue-black, procurement=green) |
| Module icons | Green circle badges with white icons |

## Brand Assets Location

```
/Users/samiloukile/Dropbox/Inclufy Marketing/3. Inclufy- Rebranding/
  Logo/                    — Logo variants (PNG, SVG, ICO)
  300ppi/                  — High-res backgrounds, LinkedIn banners
  Nieuw diagrammen/300ppi/ — Solution diagrams (Sales/Procurement wheel, ProjeXtPal, InclufAI)
  Iconen website/          — Website icons and illustrations
  Solutions/               — Event partner logos (Web Summit, CES, GITEX, etc.)
  Frontpage/               — Client logos (Philips, Unilever)
  Digital Ecosystem/       — Ecosystem section visuals
  Inclufy- Animations/     — Animated assets
  Social Media/            — Social media templates
  Consulting/              — Consulting service visuals
```

## Solution Diagrams

### AI ERP Solutions Wheel (TAARTDIAGRAM)
- Top half (Blue-black #001f3a): Sales Solutions — 9 modules
- Bottom half (Green #56a632): Procurement Solutions — 8 modules
- Center: Inclufy "in" logo with blue-green gradient ring

### ProjeXtPal Flow
- 4-step flow diagram (navy cards, green numbered badges)
- Steps: Real-world assignments, Clear structure, AI-guided feedback, Combined execution

### InclufAI
- Learning flow diagram (high-res PNG available)
