import { createRenderer } from './scene/renderer.js';

const hero = document.querySelector('.hero');
const copy = document.querySelector('.hero-copy');
const canvas = document.querySelector('.hero-scene');
const renderer = createRenderer(canvas);

// The same breakpoint the CSS uses for the desktop layout.
const desktop = window.matchMedia('(min-width: 75rem)');

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
    horizonFromTop,
    horizon: 1 - 2 * horizonFromTop, // WebGL counts from -1 (bottom) to 1 (top)
    peaksFrom,
    peakHeight,
  };
}

function render() {
  const scene = composeScene();

  // Tell the CSS where the horizon is, so the sky glow lines up with the land.
  hero.style.setProperty('--horizon', `${scene.horizonFromTop * 100}%`);

  renderer.resize();
  renderer.draw(scene);
}

if (renderer) {
  render();
  window.addEventListener('resize', render);
}