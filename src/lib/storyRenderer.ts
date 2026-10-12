import { createBackgroundRenderer, type BackgroundRenderer } from './animatedBackground'
import { beatsFromPhase, drawModuleGrid } from './moduleGrid'
import {
  STORY_CURSOR,
  isStoryFontReady,
  renderStoryTextLayer,
  type StoryTextLayer,
} from './storyText'
import { getStoryStyle, type Slide, type StoryStyle } from '../types'

// Everything a story frame shows apart from time.
export interface StoryContent {
  style: StoryStyle
  text: string
  modules: boolean
  cursor: boolean
  // Gradient blob opacity multiplier (violet styles only).
  intensity: number
}

export function getStoryContent(slide: Slide, intensity: number): StoryContent {
  return {
    style: getStoryStyle(slide.storyStyle),
    text: slide.text,
    modules: slide.storyModules,
    cursor: slide.storyCursor,
    intensity,
  }
}

// Draws a whole story frame onto one canvas, back to front:
// background → module band → grain (gradient only) → text → cursor.
// The editor preview, the PNG export and every MP4 frame all go through
// this, so they can't drift apart.
export function createStoryRenderer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  // Built lazily: the grain texture and blur profiles cost ~80ms and are
  // only needed for the gradient background.
  let gradient: BackgroundRenderer | null = null

  // The text is static, so its layer is rendered once and reused for every
  // frame until the text, its colours or the font's load state changes.
  let textCache: { key: string; layer: StoryTextLayer | null } | null = null
  const getTextLayer = (text: string, color: string, markerColor: string | null) => {
    const key = [text, color, markerColor, isStoryFontReady(text)].join('\u0000')
    if (textCache?.key !== key) {
      textCache = {
        key,
        layer: renderStoryTextLayer(text, {
          canvasWidth: width,
          canvasHeight: height,
          color,
          markerColor,
        }),
      }
    }
    return textCache.layer
  }

  return {
    // `phase`: motion cycle in radians (gradient drift, module ticker,
    // cursor blink); `elapsed`: seconds since the start, for the module
    // intro (Infinity = still frame, exactly the Figma composition).
    render(
      { style, text, modules, cursor, intensity }: StoryContent,
      phase: number,
      elapsed: number,
    ) {
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1

      const { background } = style
      if (background.kind === 'gradient') {
        gradient ??= createBackgroundRenderer(ctx, width, height)
        gradient.drawGradient(phase, background.baseColor, intensity)
      } else {
        ctx.fillStyle = background.color
        ctx.fillRect(0, 0, width, height)
      }

      if (modules) drawModuleGrid(ctx, style.modules, phase, elapsed)

      // Grain over the modules too, so they read as part of the background.
      if (background.kind === 'gradient') gradient!.drawGrain()

      const layer = getTextLayer(text, style.textColor, style.markerColor)
      if (!layer) return
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.drawImage(layer.canvas, layer.x, layer.y)

      // Hard on/off, half a beat each — in step with the module ticker.
      const on = beatsFromPhase(phase) % 1 < 0.5
      if (cursor && on) {
        ctx.fillStyle = style.textColor
        ctx.fillRect(layer.cursor.x, layer.cursor.y, STORY_CURSOR.width, STORY_CURSOR.height)
      }
    },
  }
}

export type StoryRenderer = ReturnType<typeof createStoryRenderer>
