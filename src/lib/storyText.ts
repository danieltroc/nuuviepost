import '@fontsource/source-code-pro/latin-500.css'
import '@fontsource/source-code-pro/latin-ext-500.css'

// Story typography, taken 1:1 from the Figma frames "Instagram story - 1"
// (3899:230) and "Instagram story - 2" (3899:232): Source Code Pro Medium,
// 40px, uppercase, tracking -1.2px, line-height 1.1, 24px between
// paragraphs, centred in a 655px-wide box.
export const STORY_TEXT = {
  fontSize: 40,
  letterSpacing: -1.2,
  lineHeight: 44,
  paragraphGap: 24,
  maxWidth: 655,
} as const

// "Marker" style from story 2: one box behind each line, 36px tall,
// starting 5px below the top of the 44px line box and reaching 9px past
// the glyph ink on both sides. (The Figma boxes were placed by hand and
// drift by up to 5px; this reproduces the intended even padding.) Its
// colour comes from the story style.
export const STORY_HIGHLIGHT = {
  height: 36,
  offsetTop: 5,
  paddingX: 9,
} as const

// Emoji come from the system emoji font — Apple Color Emoji on macOS/iOS.
const FONT_STACK =
  '"Source Code Pro", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
const FONT = `500 ${STORY_TEXT.fontSize}px ${FONT_STACK}`

// Source Code Pro vertical metrics (hhea), used if the browser can't report them.
const FALLBACK_ASCENT = 0.984
const FALLBACK_DESCENT = 0.273

// The text layer is rasterised at 3x and scaled down. Drawn directly at 1x,
// Chrome's glyph smoothing thickens light-on-dark stems from the font's
// true 4.0px to ~4.7px; supersampled, they come out at 4.0px like Figma.
const SUPERSAMPLE = 3

const FONT_PROBE = `500 ${STORY_TEXT.fontSize}px "Source Code Pro"`

// Resolves once every glyph subset the text needs (Latin, Latin Extended
// for Polish letters) is loaded — canvas text doesn't trigger loading on
// its own, it just silently falls back to another font.
export async function loadStoryFont(text: string) {
  await document.fonts.load(FONT_PROBE, toStoryCase(text) || 'A')
}

export function isStoryFontReady(text: string) {
  return document.fonts.check(FONT_PROBE, toStoryCase(text) || 'A')
}

function toStoryCase(text: string) {
  return text.toLocaleUpperCase('pl-PL')
}

const graphemes = new Intl.Segmenter('pl', { granularity: 'grapheme' })

interface Glyph {
  text: string
  advance: number
}

interface StoryLine {
  glyphs: Glyph[]
  // Sum of (advance + letter-spacing) over the line — what CSS centres on.
  width: number
  top: number
}

interface StoryTextLayout {
  lines: StoryLine[]
  height: number
}

function lineWidth(glyphs: Glyph[]) {
  return glyphs.reduce((sum, g) => sum + g.advance + STORY_TEXT.letterSpacing, 0)
}

// Greedy word wrap to the 655px box, paragraph per line break. Runs of
// whitespace collapse to one space and trailing spaces are dropped, so a
// stray space never pushes a line off-centre. A single word wider than the
// box is broken between characters (CSS `word-break: break-word`).
function layoutStoryText(ctx: CanvasRenderingContext2D, text: string): StoryTextLayout {
  ctx.font = FONT
  const measure = (s: string): Glyph[] =>
    Array.from(graphemes.segment(s), ({ segment }) => ({
      text: segment,
      advance: ctx.measureText(segment).width,
    }))
  const space = measure(' ')

  const paragraphs = toStoryCase(text)
    .split('\n')
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const lines: StoryLine[] = []
  let y = 0

  paragraphs.forEach((paragraph, index) => {
    if (index > 0) y += STORY_TEXT.paragraphGap
    let current: Glyph[] = []

    const pushLine = () => {
      lines.push({ glyphs: current, width: lineWidth(current), top: y })
      y += STORY_TEXT.lineHeight
      current = []
    }

    for (const word of paragraph.split(' ')) {
      let glyphs = measure(word)
      const candidate = current.length ? [...current, ...space, ...glyphs] : glyphs
      if (lineWidth(candidate) <= STORY_TEXT.maxWidth) {
        current = candidate
        continue
      }
      if (current.length) pushLine()
      while (lineWidth(glyphs) > STORY_TEXT.maxWidth) {
        let fit = 1
        while (fit < glyphs.length && lineWidth(glyphs.slice(0, fit + 1)) <= STORY_TEXT.maxWidth) fit++
        current = glyphs.slice(0, fit)
        pushLine()
        glyphs = glyphs.slice(fit)
      }
      current = glyphs
    }
    if (current.length) pushLine()
  })

  return { lines, height: y }
}

interface DrawOptions {
  canvasWidth: number
  canvasHeight: number
  color: string
  // Marker box colour, or null for plain text.
  markerColor: string | null
}

// Optional terminal-style block cursor after the last line: one character
// cell wide (Source Code Pro advance 0.6em + tracking), as tall as a marker.
export const STORY_CURSOR = {
  gap: 6,
  width: 0.6 * STORY_TEXT.fontSize + STORY_TEXT.letterSpacing,
  height: STORY_HIGHLIGHT.height,
} as const

export interface StoryTextLayer {
  canvas: HTMLCanvasElement
  // Where to draw the layer on the story canvas.
  x: number
  y: number
  // Top-left of the cursor cell after the last line, in story coordinates.
  cursor: { x: number; y: number }
}

// Room around the 655px box for the marker padding and glyphs that
// overhang their line box (emoji, Ż/Ą diacritics).
const LAYER_MARGIN = 40

let measureContext: CanvasRenderingContext2D | null = null

// Renders the text block once into a transparent layer the size of the
// block (supersampled, then scaled down), to be composited onto every
// frame. Returns null for empty text.
export function renderStoryTextLayer(text: string, options: DrawOptions): StoryTextLayer | null {
  measureContext ??= document.createElement('canvas').getContext('2d')!
  const layout = layoutStoryText(measureContext, text)
  if (!layout.lines.length) return null

  const x = Math.floor((options.canvasWidth - STORY_TEXT.maxWidth) / 2) - LAYER_MARGIN
  const y = Math.round((options.canvasHeight - layout.height) / 2) - LAYER_MARGIN
  const width = STORY_TEXT.maxWidth + LAYER_MARGIN * 2
  const height = layout.height + LAYER_MARGIN * 2

  const big = document.createElement('canvas')
  big.width = width * SUPERSAMPLE
  big.height = height * SUPERSAMPLE
  const bigCtx = big.getContext('2d')!
  bigCtx.scale(SUPERSAMPLE, SUPERSAMPLE)
  bigCtx.translate(-x, -y)
  drawStoryText(bigCtx, layout, options)

  const last = placeLines(layout, options.canvasWidth, options.canvasHeight).at(-1)!
  const cursor = {
    x: last.x + last.line.width + STORY_CURSOR.gap,
    y: last.top + STORY_HIGHLIGHT.offsetTop,
  }

  const layer = document.createElement('canvas')
  layer.width = width
  layer.height = height
  const layerCtx = layer.getContext('2d')!
  layerCtx.imageSmoothingEnabled = true
  layerCtx.imageSmoothingQuality = 'high'
  layerCtx.drawImage(big, 0, 0, width, height)

  return { canvas: layer, x, y, cursor }
}

// Same geometry as Figma: the 655px box sits at x = floor((1080-655)/2),
// so lines centre on 539.5. Vertically the block is always centred.
function placeLines(layout: StoryTextLayout, canvasWidth: number, canvasHeight: number) {
  const centerX = Math.floor((canvasWidth - STORY_TEXT.maxWidth) / 2) + STORY_TEXT.maxWidth / 2
  const blockTop = Math.round((canvasHeight - layout.height) / 2)
  return layout.lines.map((line) => ({
    line,
    x: centerX - line.width / 2,
    top: blockTop + line.top,
  }))
}

function drawStoryText(
  ctx: CanvasRenderingContext2D,
  layout: StoryTextLayout,
  { canvasWidth, canvasHeight, color, markerColor }: DrawOptions,
) {
  if (!layout.lines.length) return

  ctx.save()
  ctx.font = FONT
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'

  // Baseline inside the 44px line box, as CSS places it (half-leading).
  const metrics = ctx.measureText('H')
  const ascent = metrics.fontBoundingBoxAscent || FALLBACK_ASCENT * STORY_TEXT.fontSize
  const descent = metrics.fontBoundingBoxDescent || FALLBACK_DESCENT * STORY_TEXT.fontSize
  const baseline = (STORY_TEXT.lineHeight - ascent - descent) / 2 + ascent

  const placed = placeLines(layout, canvasWidth, canvasHeight)

  if (markerColor) {
    ctx.fillStyle = markerColor
    for (const { line, x, top } of placed) {
      const first = line.glyphs[0]
      const last = line.glyphs[line.glyphs.length - 1]
      const lastX = x + lineWidth(line.glyphs.slice(0, -1))
      const inkLeft = x - ctx.measureText(first.text).actualBoundingBoxLeft
      const inkRight = lastX + ctx.measureText(last.text).actualBoundingBoxRight
      ctx.fillRect(
        inkLeft - STORY_HIGHLIGHT.paddingX,
        top + STORY_HIGHLIGHT.offsetTop,
        inkRight - inkLeft + STORY_HIGHLIGHT.paddingX * 2,
        STORY_HIGHLIGHT.height,
      )
    }
  }

  // Letter-spacing is applied by hand, glyph by glyph: identical in every
  // browser, and emoji sequences stay intact as single graphemes.
  ctx.fillStyle = color
  for (const { line, x, top } of placed) {
    let penX = x
    for (const glyph of line.glyphs) {
      ctx.fillText(glyph.text, penX, top + baseline)
      penX += glyph.advance + STORY_TEXT.letterSpacing
    }
  }

  ctx.restore()
}
