// Keeps the latest pointer, scroll and tilt values in one object.
// The animation loop in main.js reads this object once per frame.
export function trackInput(hero) {
  const input = {
    pointerX: 0,         // -1 (left edge of the hero) to 1 (right edge)
    pointerY: 0,         // -1 (bottom edge) to 1 (top edge)
    lastMove: -Infinity, // when the pointer last moved, in milliseconds
    tiltX: 0,            // -1 (phone tipped left) to 1 (tipped right)
    scroll: 0,           // 0 (hero fully in view) to 1 (scrolled out of view)
  };

  // Mouse, pen, or a finger dragging on the screen.
  function onPointerMove(event) {
    const box = hero.getBoundingClientRect();
    input.pointerX = ((event.clientX - box.left) / box.width) * 2 - 1;
    input.pointerY = 1 - ((event.clientY - box.top) / box.height) * 2;
    input.lastMove = performance.now();
  }

  // How far the hero has scrolled up and out of view.
  function onScroll() {
    const box = hero.getBoundingClientRect();
    input.scroll = clamp(-box.top / box.height, 0, 1);
  }

  // Phone tilt. gamma is the left-right tilt in degrees.
  function onTilt(event) {
    if (event.gamma !== null) {
      input.tiltX = clamp(event.gamma / 30, -1, 1);
    }
  }

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('deviceorientation', onTilt);

  return input;
}

// Keeps a value between min and max.
function clamp(value, min, max) {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}