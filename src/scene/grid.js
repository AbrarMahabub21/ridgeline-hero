// Builds a flat grid of points.
// Each point is two numbers:
//   across: -1 (left edge) to 1 (right edge)
//   row:     0 (nearest row) to 1 (farthest row)
export function buildGrid(columns, rows) {
  const points = [];

  for (let row = 0; row <= rows; row++) {
    for (let column = 0; column <= columns; column++) {
      points.push((column / columns) * 2 - 1);
      points.push(row / rows);
    }
  }

  return new Float32Array(points);
}