export function floodFill(
  cells: (string | null)[],
  width: number,
  height: number,
  startX: number,
  startY: number,
  fillColor: string | null,
): (string | null)[] {
  const index = startY * width + startX
  const targetColor = cells[index]

  if (targetColor === fillColor) {
    return cells
  }

  const next = [...cells]
  const stack: [number, number][] = [[startX, startY]]

  while (stack.length > 0) {
    const [x, y] = stack.pop()!
    if (x < 0 || x >= width || y < 0 || y >= height) continue

    const i = y * width + x
    if (next[i] !== targetColor) continue

    next[i] = fillColor

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }

  return next
}
