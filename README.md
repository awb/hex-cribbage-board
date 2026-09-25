# Hexagonal Cribbage Board

This app draws a cribbage board layout as a template for fabrication. The layout is hexagonal: 3 parallel lanes of holes, grouped in blocks of 5, spiral in from the outer edge. Each lane has a 2-hole READY starter segment, 120 scoring holes (24 groups of 5), and the first lane has a 1-hole WINNER finish. The board can be viewed in a browser (JavaScript canvas), exported as PDF for printing, and exported as SVG for transfer to CAD software.

## Running the app

```bash
npm install
npm run dev
```

Open `hexagon.html` in the browser (Vite prints the local URL, something like [http://localhost:5173/hexagon.html](http://localhost:5173/hexagon.html)).

This app is deployed at [https://awb.github.io/hex-cribbage-board/hexagon.html](https://awb.github.io/hex-cribbage-board/hexagon.html).

## Deployment (GitHub Pages)

Pushes to `main` build and deploy automatically via GitHub Actions.

1. In the repo on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. Merge to `main` (or push directly) to trigger a deploy
3. Open the cribbage board at:
  `https://awb.github.io/hex-cribbage-board/hexagon.html`

Local production preview:

```bash
VITE_BASE=/hex-cribbage-board/ npm run build
npm run preview
```

Then open `/hex-cribbage-board/hexagon.html` on the preview server.

## Coordinate system

- Polar coordinates: `r` in mm, `theta` in radians.
- `theta = 0` at the top vertex of the outer hex (after the drawing rotation).
- Increasing `theta` produces a **clockwise** spiral.
- Holes lie on straight lines between segment endpoints (interpolated in Cartesian space, stored as polar).

## Layout variants

Three layouts share the same board constants and produce the same hole counts. They differ in angular alignment to the hex template.

|                                 | **Dodecagonal**           | **Hexagonal**                                            | **Hexagonal 2** (default)                                |
| ------------------------------- | ------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| `segmentsPerRound`              | 12                        | 12                                                       | 12                                                       |
| `pathStartOffsetInRadians`      | π/6                       | π/6                                                      | π/2                                                      |
| Micro-segment span `deltaTheta` | π/6                       | π/6                                                      | π/6                                                      |
| Spiral                          | 12-sided                  | 6-sided, starts on mid-sides                             | 6-sided, starts on vertices                              |
| Scoring segments per lane       | 24                        | 24                                                       | 24                                                       |
| Scoring holes per lane          | 120                       | 120                                                      | 120                                                      |
| Starter holes per lane          | 2                         | 2                                                        | 2                                                        |
| Finish holes                    | first lane only (1)       | first lane only (1)                                      | first lane only (1)                                      |
| Complete turns                  | 2                         | 2                                                        | 2                                                        |

A UI toggle switches between layouts. Changing the toggle regenerates the board and applies to PDF/SVG export.

```typescript
type LayoutVariant = 'dodecagonal' | 'hexagonal' | 'hexagonal2'

type LayoutConfig = {
  segmentsPerRound: number
  pathStartOffsetInRadians: number
  spiral: SpiralFn
}

const DEFAULT_LAYOUT: LayoutVariant = 'hexagonal2'
```

## Abstract design

- **CribbageBoard** — a cribbage board layout. Has a track that starts at PolarPoint `[INITIAL_RADIUS_MM, 0]` and spirals in toward the center. Each turn of the track around the center is separated from the previous by `TRACK_SPACING_MM`. The outer hex outline is sized from the outermost hole so the track lies entirely inside.
- **Track** — a set of parallel lanes with separation `LANE_SPACING_MM` and scoring length `TRACK_LENGTH_HOLES`. The first lane starts at the track initial location; the initial radial location of the 2nd lane is less by `LANE_SPACING_MM`, and the 3rd lane similarly.
- **Lane** — an ordered set of segments, each starting from the endpoint of the previous. Each lane begins with a starter segment (READY holes at the 4th and 5th positions). The first lane ends with a finish segment (WINNER hole at the 1st position).
- **Segment** — has a defined start point and end point. Scoring segments contain 5 holes in a straight line, with inter-group padding proportionate to hole spacing by `PADDING`.
- **Hole** — a point at polar coordinate `(r, theta)`. Drill-template drawing is a 3 mm circle plus a 4 mm cross; other views draw a 3 mm disk.

## Functional design

### Constants

```typescript
LANE_SPACING_MM = 7
TRACK_SPACING_MM = 1.4 * LANE_SPACING_MM
INITIAL_RADIUS_MM = 150 - TRACK_SPACING_MM
TRACK_LENGTH_HOLES = 120            // scoring holes per lane
PADDING = 1.6                       // multiplier for calculated hole spacing
HOLES_PER_GROUP = 5
STARTER_HOLE_INDICES = [3, 4]       // 4th and 5th of 5
FINISH_HOLE_INDICES = [0]           // 1st of 5, first lane only
LANE_COUNT = 3
FINISH_LANE_INDEX = 0
HOLE_DIAMETER_MM = 3
HOLE_CROSS_LENGTH_MM = 4
TURN_DELTA_RADIUS_MM = LANE_COUNT * LANE_SPACING_MM + TRACK_SPACING_MM
HEX_INRADIUS_PER_SIDE = √3 / 2
```

Artwork constants (colors and padding from hole positions):

```typescript
READY_BOX_PADDING_MM = 3
WINNER_CIRCLE_STROKE_MM = 2         // radius is LANE_SPACING_MM
LANE_LINE_STROKE_MM = 0.35
LANE_LINE_PADDING_MM = 1.5
LOGO_SIDE_MM = 40
LOGO_TRISECT_THETAS = [0, 2π/3, 4π/3]
```

Derived values:

- `segmentCount = TRACK_LENGTH_HOLES / HOLES_PER_GROUP` → 24 scoring segments per lane
- `deltaTheta = 2π / segmentsPerRound` → π/6
- `vertexDeltaRadius = TURN_DELTA_RADIUS_MM / segmentsPerRound`
- `segmentCount / segmentsPerRound = 2` complete turns
- Outline circumradius = (first hole of first lane).r / `HEX_INRADIUS_PER_SIDE` + `TRACK_SPACING_MM`

The outline is a regular hexagon. Its minimum radius (center to a flat) is `(√3/2) × side`. Side equals circumradius, so the circumradius is chosen so that inscribed-circle radius equals the outermost hole radius (first hole on the first lane). That keeps the track inside the hex for every layout.

### Types

```typescript
type PolarPoint = { r: number; theta: number }

type Segment = {
  holes: PolarPoint[]
  start: PolarPoint
  end: PolarPoint
  minimumHoleSpacingMm: number
}

type Lane = {
  segments: Segment[]
  bgColor: string
  minimumHoleSpacingMm: number
}

type Track = {
  lanes: Lane[]
  minimumHoleSpacingMm: number
  outermostTrackRadiusMm: number
  innermostTrackRadiusMm: number
}

type BoardOutline = {
  circumradiusMm: number
  vertices: PolarPoint[]
  innerBoardRadius: number
  sectionLines: { start: PolarPoint; end: PolarPoint }[]
}

type CribbageBoard = {
  initialRadius: number
  layout: LayoutVariant
  outline: BoardOutline
  track: Track
}
```

### Functions

#### `generateCribbageBoard`

Generate a track spiraling clockwise in from the initial location with 3 interleaved lanes, then size the outline from the outermost hole.

```typescript
function generateCribbageBoard(
  initialRadius: number = INITIAL_RADIUS_MM,
  layout: LayoutVariant = DEFAULT_LAYOUT,
): CribbageBoard
```

#### `generateTrack`

Generate 3 interleaved lanes offset by `LANE_SPACING_MM`. Applies `pathStartOffsetInRadians` to each lane start angle. Successive turns leave `TRACK_SPACING_MM` between them. The first lane receives the finish segment.

#### `generateLane`

Build a lane by calling the layout's `spiral` function for vertex endpoints, then `generateSegment` between each consecutive pair. The first segment keeps only the READY holes; scoring segments keep all 5; the optional finish segment keeps the WINNER hole.

#### `generateBoardOutline`

Circumradius = outermost hole radius / `(√3/2)`. Vertices sit at `θ = π/6 + iπ/3`. Three section lines trisect the outline.

#### `generateSegment`

Calculate hole locations along a straight segment between successive vertices. Holes are arranged in groups of 5 separated by padding proportionate to the spacing between holes.

## Rendering

Representations (UI toggle; applies to canvas, PDF, and SVG):

- **Drill template** — outline, light-grey section lines, crosshair holes.
- **Color** — translucent red/green/blue lane ribbons, outline, disk holes.
- **Lined** — grey spiral through hole centers, outline, disk holes.
- **Artwork** — four items, each drawn by its own function:
  - **READY trapezoid** — one trapezoid around the six READY holes on the first segment. The inner and outer sides are parallel to the board outline; the other two sides are rays from the board center. Padding is `READY_BOX_PADDING_MM`.
  - **WINNER circle** — circle of radius `LANE_SPACING_MM` and 2 mm stroke, centered on the single finish hole of the first lane.
  - **LANE_LINE** — thin grey line through the center of each group of 5 holes, extended by `LANE_LINE_PADDING_MM`.
  - **LOGO** — hexagon with 40 mm sides in the board center, trisected at `θ = [0, 2π/3, 4π/3]`.

The three lines that trisect the board outline are light grey (`SECTION_LINE_COLOR`).

The HTML header lists board attributes (outline, spacing, hole counts, layout, view) in a table.
