// The modular band from the Figma frame "Instagram story - 2" (3902:631–654)
// and its motion.
//
// 12×2 cells of 77px at (78, 78), read as six 2×2 tiles. Every tile holds
// the same motif — one dot plus three rounded modules — turned one more
// quarter than its left neighbour (0°, 270°, 180°, 90°, 0°, 270°). So when
// every tile turns a quarter clockwise, the pattern shifts one tile to the
// right: the band reads as a ticker that loops seamlessly every 4 steps.
//
// All modules are squares with per-corner radii, so a turn is drawn as a
// morph (radii tween, module grows/shrinks behind the travelling dot)
// rather than a literal rotation.

export interface ModuleColors {
  // Module tone: one colour at three opacities (Figma: #0B0B0B / #141414 /
  // #1B1B1B on black = white at 4.3 / 7.8 / 10.6%).
  tone: string
  alphas: readonly [number, number, number]
  dot: string
}

const ORIGIN_X = 78
const ORIGIN_Y = 78
const CELL = 77
const R = CELL / 2

// Clockwise quarter-turns of each tile in the Figma frame.
const BASE_TURNS = [0, 3, 2, 1, 0, 3]

type Radii = [number, number, number, number] // tl, tr, br, bl

// The motif at 0°, by position clockwise from the top-left cell.
const MOTIF: Array<Radii | 'dot'> = [[R, 0, 0, 0], 'dot', [0, 0, R, R], [0, 0, R, R]]
const POSITIONS = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
] as const

// Tone index per cell (row-major), from Figma; cells that hold a dot in the
// frame get the tone a module would have there once the dot moves on.
const TONES = [
  [2, 1, 2, 1, 2, 1, 2, 1, 0, 1, 2, 2],
  [1, 2, 1, 2, 1, 2, 1, 2, 2, 1, 2, 1],
]

// Rhythm, in beats. A beat is 1/8 of the tempo period (1.25s at "Średnie").
const FIRST_STEP = 2 // let the intro settle before the first turn
const MOVE = 0.45 // portion of a beat spent moving; the rest is stillness
const STAGGER = 0.05 // delay between neighbouring tiles → left-to-right wave
const BLINK_START = 0.62
const BLINK_LENGTH = 0.14
const BLINK_CHANCE = 0.35

const rotateCW = ([tl, tr, br, bl]: Radii): Radii => [bl, tl, tr, br]

function contentAt(position: number, turns: number): Radii | 'dot' {
  let content = MOTIF[(((position - turns) % 4) + 4) % 4]
  if (content === 'dot') return content
  for (let i = 0; i < ((turns % 4) + 4) % 4; i++) content = rotateCW(content)
  return content
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeInOutQuint = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2)
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t))
const easeOutBack = (t: number) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2

// Deterministic "random" per (beat, tile), so preview and export agree.
function hash(a: number, b: number) {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Eyelid: fast close, slightly slower open. 0 = open, 1 = closed.
function blinkAmount(t: number) {
  if (t <= 0 || t >= 1) return 0
  return t < 0.4 ? (t / 0.4) ** 2 : 1 - ((t - 0.4) / 0.6) ** 0.8
}

// Beat position from the shared motion phase (radians; 2π = one period).
export const beatsFromPhase = (phase: number) => (phase * 4) / Math.PI

// `elapsed` (seconds since the start; Infinity for a still frame) drives
// the intro, `phase` the ticker and blinks. Phase 0 + Infinity = the exact
// Figma composition.
export function drawModuleGrid(
  ctx: CanvasRenderingContext2D,
  colors: ModuleColors,
  phase: number,
  elapsed: number,
) {
  const beats = beatsFromPhase(phase)

  ctx.save()
  ctx.globalCompositeOperation = 'source-over'

  for (let tile = 0; tile < BASE_TURNS.length; tile++) {
    const tileBeats = beats - tile * STAGGER
    const local = tileBeats - FIRST_STEP
    let turns = BASE_TURNS[tile]
    let move = 0
    if (local >= 0) {
      const step = Math.floor(local)
      move = easeInOutQuint(clamp01((local - step) / MOVE))
      turns += step
    }
    if (move >= 1) {
      turns += 1
      move = 0
    }

    const tileX = ORIGIN_X + tile * 2 * CELL
    let dotFrom = 0
    let dotTo = 0

    for (let p = 0; p < 4; p++) {
      const a = contentAt(p, turns)
      const b = contentAt(p, turns + 1)
      if (a === 'dot') dotFrom = p
      if (b === 'dot') dotTo = p

      // Module presence: 0 where the dot sits, grows back as it leaves.
      let presence = lerp(a === 'dot' ? 0 : 1, b === 'dot' ? 0 : 1, move)
      const [col, row] = POSITIONS[p]
      const gridCol = tile * 2 + col
      presence *= easeOutExpo(clamp01((elapsed - (0.035 * gridCol + 0.06 * row)) / 0.5))
      if (presence < 0.002) continue

      // The dot is only ever in one of the two states (it moves), so at
      // least one side is a module shape; morph from/to that.
      const from = (a === 'dot' ? b : a) as Radii
      const to = (b === 'dot' ? a : b) as Radii
      const size = CELL * presence
      const cx = tileX + col * CELL + R
      const cy = ORIGIN_Y + row * CELL + R
      ctx.globalAlpha = colors.alphas[TONES[row][gridCol]]
      ctx.fillStyle = colors.tone
      ctx.beginPath()
      ctx.roundRect(
        cx - size / 2,
        cy - size / 2,
        size,
        size,
        from.map((r, i) => lerp(r, to[i], move) * presence),
      )
      ctx.fill()
    }

    // The dot glides to the next corner along the tile edge, stretching in
    // the direction of travel; in the stillness it sometimes blinks.
    const intro = clamp01((elapsed - (0.55 + 0.04 * tile)) / 0.4)
    if (intro <= 0) continue
    const pop = intro >= 1 ? 1 : easeOutBack(intro)
    const [fc, fr] = POSITIONS[dotFrom]
    const [tc, tr] = POSITIONS[dotTo]
    const x = tileX + lerp(fc, tc, move) * CELL + R
    const y = ORIGIN_Y + lerp(fr, tr, move) * CELL + R
    const stretch = Math.sin(Math.PI * move)
    const horizontal = fr === tr
    let rx = R * pop * (1 + (horizontal ? 0.16 : -0.08) * stretch)
    let ry = R * pop * (1 + (horizontal ? -0.08 : 0.16) * stretch)

    const beatIndex = Math.floor(tileBeats)
    if (beatIndex >= 1 && hash(beatIndex, tile) < BLINK_CHANCE) {
      const t = (tileBeats - beatIndex - BLINK_START) / BLINK_LENGTH
      ry *= 1 - 0.9 * blinkAmount(t)
      rx *= 1 + 0.06 * blinkAmount(t)
    }

    ctx.globalAlpha = 1
    ctx.fillStyle = colors.dot
    ctx.beginPath()
    ctx.ellipse(x, y, Math.max(rx, 0.01), Math.max(ry, 0.01), 0, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}
