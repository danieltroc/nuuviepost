import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  canEncodeVideo,
} from 'mediabunny'
import { createStoryRenderer, type StoryContent } from './storyRenderer'
import { loadStoryFont } from './storyText'
import { TEMPOS, type AnimationSettings } from '../types'

export const VIDEO_FPS = 30
// Instagram re-encodes uploads anyway; this is generous enough that the
// grain survives compression instead of turning into blocks.
const VIDEO_BITRATE = 16_000_000

interface ExportOptions {
  width: number
  height: number
  content: StoryContent
  settings: AnimationSettings
  onProgress?: (fraction: number) => void
}

// Renders the story frame by frame — not in real time, so no dropped
// frames — and encodes it to an H.264 MP4 in the browser using WebCodecs.
// Silent video, which Instagram accepts for Stories.
export async function exportStoryVideo({
  width,
  height,
  content,
  settings,
  onProgress,
}: ExportOptions): Promise<Blob> {
  const supported = await canEncodeVideo('avc', {
    width,
    height,
    bitrate: VIDEO_BITRATE,
    frameRate: VIDEO_FPS,
  })
  if (!supported) {
    throw new Error(
      'Ta przeglądarka nie obsługuje kodowania H.264 (WebCodecs). Użyj aktualnego Chrome, Edge lub Safari.',
    )
  }

  await loadStoryFont(content.text)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('Nie udało się utworzyć kontekstu canvas.')
  const renderer = createStoryRenderer(ctx, width, height)

  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target: new BufferTarget(),
  })
  const source = new CanvasSource(canvas, {
    codec: 'avc',
    bitrate: VIDEO_BITRATE,
  })
  output.addVideoTrack(source, { frameRate: VIDEO_FPS })
  await output.start()

  const totalFrames = Math.round(settings.durationSeconds * VIDEO_FPS)
  const omega = (2 * Math.PI) / TEMPOS[settings.tempo].periodSeconds

  try {
    for (let i = 0; i < totalFrames; i++) {
      const time = i / VIDEO_FPS
      renderer.render(content, omega * time, time)
      await source.add(time, 1 / VIDEO_FPS)
      onProgress?.((i + 1) / totalFrames)

      // Let the UI repaint the progress now and then.
      if (i % 10 === 0) await new Promise((resolve) => setTimeout(resolve))
    }
    await output.finalize()
  } catch (error) {
    await output.cancel()
    throw error
  }

  return new Blob([output.target.buffer!], { type: 'video/mp4' })
}
