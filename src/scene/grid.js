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

  const triangles = [];
  const pointsPerRow = columns + 1;

    for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      // The four corners of this cell, as positions in the points list.
      const nearLeft = row * pointsPerRow + column;
      const nearRight = nearLeft + 1;
      const farLeft = nearLeft + pointsPerRow;
      const farRight = farLeft + 1;

      triangles.push(nearLeft, nearRight, farLeft);
      triangles.push(nearRight, farRight, farLeft);
    }
  }
    return {
    points: new Float32Array(points),
    triangles: new Uint16Array(triangles),
  };
  
}