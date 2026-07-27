# Hexagonal Cribbage Board

This app draws a cribbage board layout as a template for fabrication. The layout is hexagonal: 3 parallel lanes of holes, grouped in blocks of 5, spiral in from the outer edge for a total of 120 holes per lane and exactly 2 complete turns around the board. The board can be viewed in a browser (JavaScript canvas), exported as PDF for printing, and exported as SVG for transfer to CAD software. The UI provides export buttons, a layout toggle, and a canvas to display the shape.

## Running the app

```bash
npm install
npm run dev
```

Open `hexagon.html` in the browser (Vite prints the local URL, something like [http://localhost:5173/hexagon.html](http://localhost:5173/hexagon.html)).

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
- `theta = 0` at the top vertex of the outer hex.
- Increasing `theta` produces a **clockwise** spiral.
- Holes lie on straight lines between segment endpoints (interpolated in Cartesian space, stored as polar).



## Layout variants

Two layouts share the same board constants (`TRACK_LENGTH`, `LANE_COUNT`, `TRACK_SPACING`, etc.) and both produce 120 holes per lane in groups of 5 via `generateSegment`. They differ in angular alignment to the hex template:


|                                 | **Dodecagonal** (default) | **Hexagonal**                                            |
| ------------------------------- | ------------------------- | -------------------------------------------------------- |
| `segmentsPerRound`              | 12                        | 12                                                       |
| `pathStartOffsetInRadians`      | 0                         | π/6                                                      |
| Micro-segment span `deltaTheta` | π/6                       | π/6                                                      |
| Macro hex edge span             | π/6 (vertex to vertex)    | π/3 (pairs of micro-segments; first/last are half-edges) |
| Segments per lane               | 24                        | 24                                                       |
| Holes per lane                  | 120                       | 120                                                      |
| Complete turns                  | 2                         | 2                                                        |


Hexagonal lanes start and end at edge midpoints (π/6 between vertices at 0 and π/3). Each interior hex edge is two consecutive 5-hole segments; the first and last segment of each lane are the outer half-edges.

A UI toggle switches between layouts. Changing the toggle regenerates the board and applies to PDF/SVG export.

```typescript
type LayoutVariant = 'dodecagonal' | 'hexagonal'

type LayoutConfig = {
  segmentsPerRound: number
  pathStartOffsetInRadians: number
  spiral: SpiralFn
}

const LAYOUTS: Record<LayoutVariant, LayoutConfig> = {
  dodecagonal: { segmentsPerRound: 12, pathStartOffsetInRadians: 0, spiral: dodecagonalSpiral },
  hexagonal: { segmentsPerRound: 12, pathStartOffsetInRadians: Math.PI / 6, spiral: hexagonalSpiral },
}

const DEFAULT_LAYOUT: LayoutVariant = 'dodecagonal'
```



## Abstract design

The abstractions are:

- **CribbageBoard** — a cribbage board layout. Has a track that starts at PolarPoint `[INITIAL_RADIUS, 0]` and spirals in toward the center. Each turn of the track around the center is separated from the previous by `TRACK_SPACING`.
- **Track** — a set of parallel lanes with separation `LANE_SPACING` and length `TRACK_LENGTH`. The first lane starts at the track initial location; the initial radial location of the 2nd lane is less by `LANE_SPACING`, and the 3rd lane similarly.
- **Lane** — an ordered set of segments, each starting from the endpoint of the previous. Each endpoint is `2π / segmentsPerRound` radians ahead of its start point so the lane spirals around the board center. The drawn representation of a lane has a background color.
- **Segment** — has a defined start point and end point and contains 5 holes in a straight line, with padding between groups of holes proportionate to spacing within a group by constant multiplier `PADDING`.
- **Hole** — a point at polar coordinate `(r, theta)`. The drawn representation is a circle 3 mm in diameter centered on the point and a cross comprised of 4 mm lines intersecting at the point.


## Functional design

### Constants

Shared by both layouts:

```typescript
INITIAL_RADIUS = 100                // mm
LANE_SPACING = 5                    // mm
TRACK_SPACING = 1.5 * LANE_SPACING  // mm
TRACK_LENGTH = 120                  // holes per lane
PADDING = 1.5                       // multiplier for calculated hole spacing
HOLES_PER_GROUP = 5                 // holes per segment (always)
LANE_COUNT = 3
HOLE_DIAMETER_MM = 3                // mm
HOLE_CROSS_LENGTH_MM = 4
```

Per-layout values come from `LAYOUTS` (see Layout variants above).

Derived values (computed from active layout):

- `segmentCount = TRACK_LENGTH / HOLES_PER_GROUP` → 24 segments per lane
- `deltaTheta = 2π / segmentsPerRound` → π/6
- `turnDeltaRadius = LANE_COUNT * LANE_SPACING + TRACK_SPACING` → radial drop per full turn
- `vertexDeltaRadius = turnDeltaRadius / segmentsPerRound`
- `segmentCount / segmentsPerRound = 2` complete turns for both layouts



### Types

```typescript
type PolarPoint = {
  r: number
  theta: number
}

type CribbageBoard = {
  initialRadius: number  // mm; outermost lane start radius
  layout: LayoutVariant
  track: Track
}

type Track = {
  lanes: Lane[]
}

type Lane = {
  segments: Segment[]
  bgColor: string        // lane background when rendered
}

type Segment = {
  holes: PolarPoint[]    // always HOLES_PER_GROUP (5)
  start: PolarPoint
  end: PolarPoint
}
```



### Functions



#### `generateCribbageBoard`

Generate a track spiraling clockwise in from the initial location with 3 interleaved lanes and 120 holes per lane.

```typescript
function generateCribbageBoard(
  initialRadius: number = INITIAL_RADIUS,
  layout: LayoutVariant = DEFAULT_LAYOUT,
): CribbageBoard
```

Implementation:

```typescript
const track = generateTrack(
  { r: initialRadius, theta: 0 },
  TRACK_LENGTH,
  TURN_DELTA_RADIUS,
  LAYOUTS[layout],
)
return { initialRadius, layout, track }
```



#### `generateTrack`

Generate 3 interleaved lanes offset by `LANE_SPACING` mm. Applies `pathStartOffsetInRadians` to each lane start angle. Successive spirals of the track should not overlap but leave `TRACK_SPACING` between successive turns.

`deltaRadius` is the radial drop per full turn: `LANE_COUNT * LANE_SPACING + TRACK_SPACING` (same for both layouts). Per-segment radial step is `deltaRadius / segmentsPerRound`.

```typescript
function generateTrack(
  startingPoint: PolarPoint,
  numberOfHoles: number,
  deltaRadius: number,
  layout: LayoutConfig,
): Track
```



#### `generateLane`

Build a lane by calling the layout's `spiral` function for vertex endpoints, then `generateSegment` between each consecutive pair (always 5 holes per segment).

```typescript
function generateLane(
  start: PolarPoint,
  deltaRadius: number,
  deltaTheta: number,
  spiral: SpiralFn,
): Pick<Lane, 'segments'>
```



#### Spiral vertex functions

`dodecagonalSpiral` — returns 25 vertices of a 12-sided spiral (π/6 steps) from the start point.

`hexagonalSpiral` — builds 14 vertices of a 6-sided macro spiral (π/3 steps), inserts Cartesian midpoints between each consecutive pair (13 additional points), omits the first and last points, and returns 25 vertices for 24 segments.

```typescript
type SpiralFn = (
  start: PolarPoint,
  deltaRadius: number,
  deltaTheta: number,
) => PolarPoint[]

SpiralFn dodecagonalSpiral;
SpiralFn hexagonalSpiral;
```

Each `LayoutConfig` includes the `spiral` function to use (`dodecagonalSpiral` or `hexagonalSpiral`).

#### `generateSegment`

Calculate hole locations along a straight segment between successive vertices of a spiral. Holes are arranged in groups of 5 separated by padding proportionate to the spacing between holes. Always called with `n = HOLES_PER_GROUP` (5).

Example: 10 holes with padding 1.5 on a segment 1100 mm long are at these distances from the start point: 75, 175, 275, 375, 475, 625, 725, 825, 925, 1025. Spacing within a group is 100 mm; spacing between groups is 150 mm (= 1.5 × 100).

```typescript
function generateSegment(
  start: PolarPoint,
  end: PolarPoint,
  padding: number,
  n: number,
): Segment
```



## Rendering

- **Hex template overlay** (for fabrication): inner and outer hex outlines, 72 radial lines, center cross (rotated π/6 behind track).
- **Lane backgrounds**: red, green, blue at 50% opacity.
- **Holes**: 3 mm circle + 4 mm cross at each hole location.
- **Layout toggle**: dodecagonal / hexagonal.
- **Exports**: canvas preview, PDF (print-ready), SVG (CAD transfer).

