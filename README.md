# Hexagonal Cribbage Board

This app draws a cribbage board layout as a template for fabrication. The layout is hexagonal: 3 parallel lanes of holes, grouped in blocks of 5, spiral in from the outer edge in a hexagonal pattern for a total of 120 holes per lane and exactly 2 complete turns around the board. The board can be viewed in a browser (JavaScript canvas), exported as PDF for printing, and exported as SVG for transfer to CAD software. The UI provides export buttons and a canvas to display the shape.

## Running the app

```bash
npm install
npm run dev
```

Open `hexagon.html` in the browser (Vite prints the local URL).

## Coordinate system

- Polar coordinates: `r` in mm, `theta` in radians.
- `theta = 0` at the top vertex of the outer hex.
- Increasing `theta` produces a **clockwise** spiral.
- Holes lie on straight lines between segment endpoints (interpolated in Cartesian space, stored as polar).

## Abstract design

The abstractions are:

- **CribbageBoard** — a cribbage board layout. Has a track that starts at PolarPoint `[INITIAL_RADIUS, 0]` and spirals in toward the center. Each turn of the track around the center is separated from the previous by `TRACK_SPACING`.
- **Track** — a set of 3 parallel lanes with separation `LANE_SPACING` and length `TRACK_LENGTH`. The first lane starts at the track initial location; the initial radius of the 2nd lane is less by `LANE_SPACING`, and the 3rd lane similarly.
- **Lane** — an ordered set of segments, each starting from the endpoint of the previous. Each endpoint is `2π / SEGMENTS_PER_ROUND` radians ahead of its start point so the lane spirals around the board center. The drawn representation of a lane has a background color.
- **Segment** — has a defined start point and end point and contains 5 holes in a line, with padding between groups of holes proportionate to spacing within a group by constant multiplier `PADDING`.
- **Hole** — a point at polar coordinate `(r, theta)`. The drawn representation is a circle 3 mm in diameter centered on the point and a cross comprised of 4 mm lines intersecting at the point.

## Constants

```typescript
INITIAL_RADIUS = 100          // mm
LANE_SPACING = 5              // mm
TRACK_SPACING = 1.5 * LANE_SPACING
TRACK_LENGTH = 120            // holes per lane
PADDING = 1.5
SEGMENTS_PER_ROUND = 12
HOLES_PER_SEGMENT = 5
LANE_COUNT = 3
HOLE_DIAMETER_MM = 3
HOLE_CROSS_LENGTH_MM = 4
```

Derived values:

- `segmentCount = TRACK_LENGTH / HOLES_PER_SEGMENT` → 24 segments per lane
- `vertexCount = segmentCount + 1` → 25 vertices per lane
- `deltaTheta = 2π / SEGMENTS_PER_ROUND` → π/3 radians per segment
- `vertexDeltaRadius = TRACK_SPACING / SEGMENTS_PER_ROUND` → 0.625 mm per segment
- 24 segments ÷ 12 segments per round = **2 complete turns**

## Types

### PolarPoint

```typescript
type PolarPoint = {
  r: number
  theta: number
}
```

### CribbageBoard, Track, Lane, Segment

```typescript
type CribbageBoard = {
  initialRadius: number  // mm; outermost lane start radius
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
  holes: PolarPoint[]    // always HOLES_PER_SEGMENT (5) in current design
  start: PolarPoint
  end: PolarPoint
}
```

## Functions

### `generateCribbageBoard`

Generate a track spiraling clockwise in from the initial location with 3 interleaved lanes, 120 holes per lane, in segments that span π/3 radians.

```typescript
function generateCribbageBoard(
  initialRadius: number = INITIAL_RADIUS,
): CribbageBoard
```

Implementation:

```typescript
const track = generateTrack({ r: initialRadius, theta: 0 }, TRACK_LENGTH, TRACK_SPACING)
return { initialRadius, track }
```

### `generateTrack`

Generate 3 interleaved lanes offset by `LANE_SPACING` mm. Successive spirals of the track should not overlap but leave `TRACK_SPACING` between successive turns.

`deltaRadius` is the radial separation between successive **turns** of the spiral (`TRACK_SPACING`). Per-segment radial step is `deltaRadius / SEGMENTS_PER_ROUND`.

```typescript
function generateTrack(
  startingPoint: PolarPoint,
  numberOfHoles: number,
  deltaRadius: number,
): Track
```

### `generateLane`

Build a hex spiral lane by calling `generateSegment` repeatedly. Each segment runs from `start` to `{ r: start.r - deltaRadius, theta: start.theta + deltaTheta }`. Does not set `bgColor`; `generateTrack` assigns that.

```typescript
function generateLane(
  start: PolarPoint,
  deltaRadius: number,   // radial step between successive segment endpoints
  deltaTheta: number,
  n: number,              // vertex count including first and last
): Pick<Lane, 'segments'>
```

### `generateSegment`

Calculate hole locations along a straight segment between successive vertices of a spiral. Holes are arranged in groups of 5 separated by padding proportionate to the spacing between holes.

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

- **Hex template overlay** (for fabrication): inner and outer hex outlines, 72 radial lines, center cross.
- **Lane backgrounds**: red, green, blue at 50% opacity.
- **Holes**: 3 mm circle + 4 mm cross at each hole location.
- **Exports**: canvas preview, PDF (print-ready), SVG (CAD transfer).
