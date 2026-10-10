import { createRenderer } from './scene/renderer.js';
import { trackInput } from './scene/input.js';

// ---------- The page elements we need ----------
const hero = document.querySelector('.hero');
const copy = document.querySelector('.hero-copy');
const canvas = document.querySelector('.hero-scene');

// The same breakpoint the CSS uses for the desktop layout.
const desktop = window.matchMedia('(min-width: 75rem)');

// True when the visitor has asked their device for less motion.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Settings ----------
const DRIFT_SPEED = 0.3;       // how fast the land rolls toward the camera, per second
const POINTER_REST_MS = 4000;  // after this long without moving, the light wanders on its own

// ---------- State ----------

// The layout. Only changes when the page is resized.
let scene = null;

// The values that change every frame.
const frame = {
  horizon: 0,       // where the horizon is right now (it sinks as you scroll)
  drift: 0,         // how far the land has rolled toward the camera
  lightX: 0,        // the pointer light's position on the ground, left to right
  lightDepth: 8,    // the pointer light's distance from the camera
  lightStrength: 1, // how bright the pointer light is
};

let input = null;  // pointer, scroll and tilt, from input.js
let scroll = 0;    // the scroll amount, eased so it moves smoothly

// ---------- Layout ----------

// Works out where the land should sit so it never goes behind the copy.
function composeScene() {
  const heroBox = hero.getBoundingClientRect();
  const copyBox = copy.getBoundingClientRect();

  // Where the copy ends, as a fraction of the hero.
  // 0 is the top or left edge, 1 is the bottom or right edge.
  const copyBottom = (copyBox.bottom - heroBox.top) / heroBox.height;
  const copyRight = (copyBox.right - heroBox.left) / heroBox.width;

  let horizonFromTop;
  let peaksFrom;
  let peakHeight;

  if (desktop.matches) {
    // Desktop: horizon just under the copy, tall peaks to the right of it.
    horizonFromTop = Math.max(copyBottom + 0.06, 0.7);
    peaksFrom = copyRight * 2 - 1;
    peakHeight = 6;
  } else {
    // Phone and tablet: horizon further down, low peaks across the whole width.
    horizonFromTop = Math.min(copyBottom + 0.16, 0.86);
    peaksFrom = -3;
    peakHeight = 3;
  }

  return {
    horizonFromTop: horizonFromTop,
    horizon: 1 - 2 * horizonFromTop, // WebGL counts from -1 (bottom) to 1 (top)
    peaksFrom: peaksFrom,
    peakHeight: peakHeight,
  };
}

// Measures the page and resizes the canvas. Runs at the start and on every resize.
function layout() {
  scene = composeScene();

  // Tell the CSS where the horizon is, so the sky glow lines up with the land.
  hero.style.setProperty('--horizon', scene.horizonFromTop * 100 + '%');

  renderer.resize();
}

// ---------- The pointer light ----------

// Finds the spot on the ground under a point on the screen,
// so the light can sit under the pointer. It runs the perspective maths backwards.
function groundUnder(screenX, screenY) {
  const belowHorizon = Math.max(scene.horizon - screenY, 0.01);

  let depth = 1 / belowHorizon;
  if (depth < 2.5) {
    depth = 2.5;
  }
  if (depth > 12) {
    depth = 12;
  }

  const aspect = Math.max(canvas.clientWidth / canvas.clientHeight, 1);
  const groundX = screenX * depth * aspect;

  return { x: groundX, depth: depth };
}

// Where the light rests across the screen when nothing is steering it: over the peaks.
function restingX() {
  if (desktop.matches) {
    return 0.45;
  }
  return 0.1;
}

// ---------- One step of animation ----------

// Moves everything forward by `seconds` of time.
function update(seconds, now) {
  // 1. The land rolls a little closer.
  frame.drift = frame.drift + seconds * DRIFT_SPEED;

  // 2. Where the light wants to be on screen.
  let targetX;
  let targetY;

  const pointerMovedRecently = now - input.lastMove < POINTER_REST_MS;

  if (pointerMovedRecently) {
    // Follow the pointer.
    targetX = input.pointerX;
    targetY = input.pointerY;
  } else {
    // Wander slowly on its own, nudged sideways by phone tilt.
    targetX = restingX() + 0.35 * Math.sin(frame.drift * 0.7) + 0.5 * input.tiltX;
    targetY = scene.horizon - 0.2 + 0.12 * Math.sin(frame.drift * 1.1);
  }

  const target = groundUnder(targetX, targetY);

  // 3. Ease toward the targets instead of jumping, so the light glides.
  // ease is the fraction of the remaining distance to move this frame.
  const ease = 1 - Math.exp(-seconds * 5);

  frame.lightX = frame.lightX + (target.x - frame.lightX) * ease;
  frame.lightDepth = frame.lightDepth + (target.depth - frame.lightDepth) * ease;
  scroll = scroll + (input.scroll - scroll) * ease;

  // 4. Scrolling lets the land sink behind the page.
  frame.horizon = scene.horizon - 0.3 * scroll;
}

// ---------- The animation loop, paused when nobody can see it ----------

let running = false;
let frameRequest = 0;
let lastTime = 0;
let heroOnScreen = true;

// Runs once per screen refresh, about 60 times a second.
function tick(now) {
  // How long since the last frame, in seconds. Capped so a long pause can't cause a jump.
  const seconds = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  update(seconds, now);
  renderer.draw(scene, frame);

  // Ask for the next frame.
  frameRequest = requestAnimationFrame(tick);
}

function startLoop() {
  running = true;
  lastTime = performance.now();
  frameRequest = requestAnimationFrame(tick);
}

function stopLoop() {
  running = false;
  cancelAnimationFrame(frameRequest);
}

// Runs the loop only while the hero is on screen and the tab is visible.
function updateLoop() {
  const shouldRun = heroOnScreen && !document.hidden;

  if (shouldRun && !running) {
    startLoop();
  }
  if (!shouldRun && running) {
    stopLoop();
  }
}

// Called by the IntersectionObserver when the hero enters or leaves the screen.
function onHeroVisibilityChange(entries) {
  heroOnScreen = entries[0].isIntersecting;
  updateLoop();
}

// ---------- Start ----------

const renderer = createRenderer(canvas);

if (renderer) {
  // Measure the page and draw the first picture.
  layout();
  frame.horizon = scene.horizon;
  const start = groundUnder(restingX(), scene.horizon - 0.2);
  frame.lightX = start.x;
  frame.lightDepth = start.depth;
  renderer.draw(scene, frame);

  // Re-measure and redraw when the window changes size.
  window.addEventListener('resize', function () {
    layout();
    renderer.draw(scene, frame);
  });

    // Reduced motion: stop here, with the one still picture.
  // Otherwise, start the animation.
  if (!reducedMotion) {
    // Start listening to the pointer, scroll and tilt.
    input = trackInput(hero);

    // Pause when the hero scrolls out of view. The -1px margin means "at least
    // one pixel must be showing", not just touching the edge of the screen.
    const observer = new IntersectionObserver(onHeroVisibilityChange, { rootMargin: '-1px' });
    observer.observe(hero);

    // Pause when the tab is hidden.
    document.addEventListener('visibilitychange', updateLoop);
  }
} else {
  // No WebGL: show the CSS fallback instead, at the same horizon.
  hero.classList.add('no-webgl');
  const fallbackScene = composeScene();
  hero.style.setProperty('--horizon', fallbackScene.horizonFromTop * 100 + '%');
}
