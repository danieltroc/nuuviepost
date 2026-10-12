// Deterministic renderer for the animated story background.
//
// Recreates the Figma frame "Instagram story - 1" (1080x1920):
//   - solid base colour
//   - two large white discs (25% opacity, layer blur σ=300, blend: overlay)
//     — a big one bottom-right and a small one top-left
//   - fine two-level grain over everything
// and animates the two discs along slow figure-eight paths. At phase 0
// (and intensity 1) the frame matches the Figma design.
//
// The renderer is a pure function of (phase, baseColor, intensity), so the
// live preview and the frame-by-frame MP4 export draw identical pixels.

interface BlobSpec {
  // Centre and radius of the disc in the Figma frame (px).
  x: number
  y: number
  radius: number
  // Gaussian blur standard deviation (Figma layer blur / 2).
  sigma: number
}

const BLOB_ALPHA = 0.25

const LARGE_BLOB: BlobSpec = { x: 865, y: 1534, radius: 699, sigma: 300 }
const SMALL_BLOB: BlobSpec = { x: 128.5, y: 68.5, radius: 382.5, sigma: 300 }

// Grain: each pixel is one of two grey levels, blended with `overlay`.
// Levels calibrated against the Figma export (mean slightly below 0.5
// darkens the base a little, exactly like the design).
const GRAIN_LOW = 99
const GRAIN_HIGH = 125
const GRAIN_SEED = 0x6e757669

export interface BackgroundRenderer {
  // Base colour + moving blobs. `phase` is in radians; one cycle = 2π.
  drawGradient(phase: number, baseColor: string, intensity: number): void
  // Grain overlay — separate so other layers (icons) can sit under it.
  drawGrain(): void
}

// Radial profile of a disc blurred with a Gaussian, i.e. the alpha at
// distance d from the centre. Integrated numerically once at startup so
// the blur is a cheap radial gradient at draw time (no ctx.filter, which
// Safari lacks and which is slow every frame).
function blurredDiscProfile({ radius, sigma }: BlobSpec, steps = 64) {
  const extent = radius + 3 * sigma
  const cell = Math.max(4, radius / 90)
  const points: number[] = []
  for (let y = -radius + cell / 2; y < radius; y += cell) {
    for (let x = -radius + cell / 2; x < radius; x += cell) {
      if (x * x + y * y <= radius * radius) points.push(x, y)
    }
  }

  const twoSigmaSq = 2 * sigma * sigma
  const norm = (cell * cell) / (Math.PI * twoSigmaSq)
  const profile = new Float32Array(steps + 1)
  for (let i = 0; i <= steps; i++) {
    const d = (i / steps) * extent
    let sum = 0
    for (let p = 0; p < points.length; p += 2) {
      const dx = points[p] - d
      const dy = points[p + 1]
      sum += Math.exp(-(dx * dx + dy * dy) / twoSigmaSq)
    }
    profile[i] = Math.min(1, sum * norm)
  }
  return { profile, extent }
}

function createBlobGradient(ctx: CanvasRenderingContext2D, spec: BlobSpec) {
  const { profile, extent } = blurredDiscProfile(spec)
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, extent)
  for (let i = 0; i < profile.length; i++) {
    gradient.addColorStop(i / (profile.length - 1), `rgba(255,255,255,${profile[i].toFixed(4)})`)
  }
  return { gradient, extent }
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function createGrain(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const image = ctx.createImageData(width, height)
  const rand = mulberry32(GRAIN_SEED)
  const data = image.data
  for (let i = 0; i < data.length; i += 4) {
    const v = rand() < 0.5 ? GRAIN_LOW : GRAIN_HIGH
    data[i] = v
    data[i + 1] = v
    data[i + 2] = v
    data[i + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

export function createBackgroundRenderer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): BackgroundRenderer {
  const large = createBlobGradient(ctx, LARGE_BLOB)
  const small = createBlobGradient(ctx, SMALL_BLOB)
  const grain = createGrain(width, height)

  const drawBlob = (
    blob: { gradient: CanvasGradient; extent: number },
    x: number,
    y: number,
    scale: number,
    alpha: number,
  ) => {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.fillStyle = blob.gradient
    ctx.fillRect(-blob.extent, -blob.extent, blob.extent * 2, blob.extent * 2)
    ctx.restore()
  }

  return {
    drawGradient(phase, baseColor, intensity) {
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.fillStyle = baseColor
      ctx.fillRect(0, 0, width, height)

      // Both blobs pass through their Figma position at phase 0, then
      // trace figure-eights (x:y = 1:2 and 2:1) so they drift across the
      // frame instead of just orbiting.
      const alpha = Math.min(1, BLOB_ALPHA * intensity)
      ctx.globalCompositeOperation = 'overlay'
      drawBlob(
        large,
        LARGE_BLOB.x + 300 * Math.sin(phase),
        LARGE_BLOB.y + 220 * Math.sin(2 * phase),
        1 + 0.1 * Math.sin(phase),
        alpha,
      )
      drawBlob(
        small,
        SMALL_BLOB.x + 280 * Math.sin(2 * phase),
        SMALL_BLOB.y + 300 * Math.sin(phase),
        1 - 0.12 * Math.sin(phase),
        alpha,
      )
      ctx.globalCompositeOperation = 'source-over'
    },

    drawGrain() {
      ctx.globalCompositeOperation = 'overlay'
      ctx.globalAlpha = 1
      ctx.drawImage(grain, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
    },
  }
}
