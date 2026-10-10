# Ridgeline Web Co: 3D hero

Paid trial for built by mast: the hero section for Ridgeline Web Co, a fictional one-person web studio on the Gold Coast that builds websites for tradies.

- **Live:** https://ridgeline-hero.vercel.app
- **Recording:** FILL IN (link)
- - **Hours spent:** about 6 hours in total. Roughly 4 of that was building, and about 2 was learning WebGL, GLSL and shader maths, which were new to me.

## Run it

Needs Node 22.

    npm install
    npm run dev      # local dev server
    npm run build    # production build into dist/
    npm run preview  # serve the production build

No API keys and no paid services.

## The 3D concept

The studio is called Ridgeline, so the scene is a mountain range drawn as ridgelines, with dawn light catching the slopes in the accent colour.

- **Desktop:** a pool of amber light follows the cursor across the land, and the ground swells under it.
- **Mobile:** dragging a finger moves the light, tilting the phone nudges it (Android), and scrolling sinks the land behind the page.
- **Always:** the land rolls slowly toward the camera. After 4 seconds without input, the light wanders on its own so the scene never looks frozen.

The scene never sits behind the text. JavaScript measures where the copy ends and passes that to the shader. On desktop the horizon sits under the copy and the mountains only rise to the right of it. On phones and tablets the horizon sits lower and the peaks are capped so they stay below the buttons.

## Library choice: raw WebGL 2, no library

The scene is one grid, one shader program and one draw call per frame. Three.js would bring a scene graph, cameras, materials and loaders that this doesn't need, and even a trimmed Three.js build is far bigger than this whole project. OGL would have been a reasonable lighter choice, but the only part it would replace is the buffer and shader setup in `renderer.js`.

| File | Gzipped |
| --- | --- |
| JavaScript, including both shaders | **5.16 kB** (brief limit: 250 kB) |
| CSS | 1.53 kB |
| HTML | 0.69 kB |

## How it works

    index.html               header, headline, buttons, the canvas
    src/CSS/styles.css       layout, type and colour at 390, 768 and 1440 px
    src/main.js              layout, the animation loop, pausing, reduced motion, fallback
    src/scene/input.js       pointer, scroll and tilt
    src/scene/renderer.js    WebGL setup and drawing
    src/scene/grid.js        builds the flat grid of points and triangles
    src/scene/terrain.vert   shapes the grid into mountains, lights it, applies perspective
    src/scene/terrain.frag   draws the ridgelines and colours the land

1. `grid.js` builds a flat grid of 201 × 133 points joined into triangles.
2. `terrain.vert` runs on the GPU once per point. It gives each point a height from layered noise, projects it with perspective (farther points sit closer to the horizon), and works out how much light it catches from the slope.
3. `terrain.frag` runs once per pixel. It draws a line wherever the row number is a whole number, keeping lines the same thickness in pixels on any slope, and turns lit lines amber.
4. `main.js` measures the page, runs the animation loop, and passes the pointer, scroll and time to the shaders as uniforms.

## Checked against the brief

Measured on the live site in an InPrivate browser window.

| Requirement | Result |
| --- | --- |
| Lighthouse mobile | Performance 100, Accessibility 100, Best Practices 100, SEO 100 |
| LCP / CLS | 0.9 s / 0.001 |
| JavaScript size | 5.16 kB gzipped |
| Console | No errors or warnings |
| Pauses off screen and when the tab is hidden | IntersectionObserver and the visibilitychange event stop the animation loop |
| No WebGL | The canvas is hidden and CSS draws flat ridgelines under the same sky glow |
| `prefers-reduced-motion` | One still frame is drawn, then nothing moves |
| Canvas | `aria-hidden="true"` |
| Keyboard focus | 3 px amber outline on every link and button |
| Tap targets | Header links 44 px tall, buttons 52 px |
| No fake proof | No stats, ratings, testimonials or logos |

## Trade-offs

- **WebGL 2 only.** The shaders use integer maths and `fwidth`, which need WebGL 2. Older browsers get the CSS fallback.
- **No tilt on iPhone.** iOS only shares tilt after a permission pop-up, and a pop-up on first visit felt worse than no tilt. iPhones still get touch, scroll and the wandering light.
- **A placeholder block under the hero.** The brief says hero only, but the scroll effect and the off-screen pause can't be seen on a page that doesn't scroll, and the two buttons need somewhere to go. The block says it's out of scope.
- **Colours are in two places.** The CSS has them as variables and the fragment shader has them as constants. A shader can't read CSS, so changing the accent means editing both.

## With more time

1. Draw the canvas at the screen's full pixel density, so the lines are sharper on high-resolution phones. It currently renders at CSS pixel size.
2. Subset the font to only the characters used (about 90 kB now, could be around 35 kB), and preload it.
3. Test on a real mid-range Android phone and an older iPhone, and tune the grid size from measured frame times.
4. An optional tilt button for iPhone.
5. A one-time intro where the ridgelines draw in from the horizon.

## Credits

- **Archivo** by Omnibus-Type, SIL Open Font License 1.1, installed through Fontsource.
- **Hash constants** in `terrain.vert`: `0x9E3779B1` and `0x85EBCA77` are xxHash's prime constants. `0x2C1B3C6D` and the 15 and 12 bit shifts are from `prospector32` in Chris Wellons' hash-prospector (public domain).
- **Vite** for the dev server and build.
- **AI:** I used Claude as a tutor while building this, as the brief allows. It explained each step, and I typed, ran and debugged the code myself, one stage at a time. HTML, CSS and JavaScript I already knew from my degree. Everything below was new to me on this project:
  - How the GPU draws: vertex and fragment shaders, GLSL, buffers, uniforms, and passing values between shaders
  - The maths of the scene: perspective as division by distance, noise built from a hash, and lighting from surface normals and the dot product
  - Running an animation loop that pauses when the hero is off screen or the tab is hidden, and keeping motion smooth at any frame rate
  - Accessibility for motion: reduced-motion support and a fallback when WebGL isn't available
  - Measuring performance with Lighthouse (LCP, CLS, TBT) and deploying with Vite and Vercel
  - Debugging silent WebGL failures, where nothing draws and no error appears

## Questions

1. The email says $33.05/hr and the brief shows $30/hr. Which rate applies, and is it paid by invoice or as casual employment?
2. Is the placeholder block under the hero OK, or would you rather it was removed?
3. Would you want an opt-in tilt control for iPhone on client sites?
4. Which phone do you use as "mid-range" when you check smoothness?