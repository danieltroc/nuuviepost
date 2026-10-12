import {
  BufferTarget,
  EncodedPacket,
  EncodedVideoPacketSource,
  Mp4OutputFormat,
  Output,
} from 'mediabunny'
import { createStoryRenderer, type StoryContent } from './storyRenderer'
import { loadStoryFont } from './storyText'
import { TEMPOS, type AnimationSettings } from '../types'

export const VIDEO_FPS = 30
// Instagram re-encodes uploads anyway; this is generous enough that the
// grain survives compression instead of turning into blocks.
const VIDEO_BITRATE = 16_000_000
// H.264 profiles to try, best first (High, Main, Baseline — all level 4.0,
// the lowest that covers 1080×1920 at 30 fps).
const H264_CODECS = ['avc1.640028', 'avc1.4d0028', 'avc1.42e028']
// How long the encoder may go without consuming or producing anything
// before it counts as hung.
const STALL_MS = 6000

interface ExportOptions {
  width: number
  height: number
  content: StoryContent
  settings: AnimationSettings
  onProgress?: (fraction: number) => void
}

interface Job {
  canvas: HTMLCanvasElement
  width: number
  height: number
  totalFrames: number
  // Draws the frame for a point in time (seconds from the start).
  draw: (time: number) => void
  onProgress?: (fraction: number) => void
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const MAX_QUEUED_FRAMES = 4

// Resolves when the encoder reports it took a frame off its queue — or
// after a short wait, for browsers that never send that `dequeue` event.
function encoderProgress(encoder: VideoEncoder): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer)
      encoder.removeEventListener('dequeue', done)
      resolve()
    }
    const timer = setTimeout(done, 30)
    encoder.addEventListener('dequeue', done)
  })
}

// Resolves with the promise, or rejects once `ms` have passed.
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

async function pickEncoderConfig(width: number, height: number): Promise<VideoEncoderConfig | null> {
  for (const codec of H264_CODECS) {
    const config: VideoEncoderConfig = {
      codec,
      width,
      height,
      bitrate: VIDEO_BITRATE,
      framerate: VIDEO_FPS,
      avc: { format: 'avc' },
    }
    try {
      if ((await VideoEncoder.isConfigSupported(config)).supported) return config
    } catch {
      // try the next profile
    }
  }
  return null
}

// Frame-by-frame encode with WebCodecs: exact timing, no dropped frames,
// faster than real time. The encoder is driven directly and its queue is
// re-checked on a timer as well as on `dequeue` events: some Safari builds
// never fire that event, or stop consuming frames altogether, and a purely
// event-driven loop then hangs forever after the first few frames.
// Throws if the encoder is unavailable or hangs, so a fallback can run.
async function encodeWithWebCodecs(job: Job): Promise<Blob> {
  const config = await pickEncoderConfig(job.width, job.height)
  if (!config) throw new Error('H.264 encoding is not supported')

  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target: new BufferTarget(),
  })
  const source = new EncodedVideoPacketSource('avc')
  output.addVideoTrack(source, { frameRate: VIDEO_FPS })
  await output.start()

  let failure: unknown = null
  let lastActivity = performance.now()
  let writes: Promise<unknown> = Promise.resolve()
  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      lastActivity = performance.now()
      const packet = EncodedPacket.fromEncodedChunk(chunk)
      writes = writes.then(() => source.add(packet, meta)).catch((error) => (failure ??= error))
    },
    error: (error) => (failure ??= error),
  })

  const assertAlive = () => {
    if (failure) throw failure
    if (performance.now() - lastActivity > STALL_MS) throw new Error('Video encoder stalled')
  }

  try {
    encoder.configure(config)
    const frameDuration = 1_000_000 / VIDEO_FPS

    for (let i = 0; i < job.totalFrames; i++) {
      job.draw(i / VIDEO_FPS)
      const frame = new VideoFrame(job.canvas, {
        timestamp: Math.round(i * frameDuration),
        duration: Math.round(frameDuration),
      })
      // A key frame every 2 seconds.
      encoder.encode(frame, { keyFrame: i % (VIDEO_FPS * 2) === 0 })
      frame.close()

      // Backpressure: let the encoder catch up before feeding it more.
      let queued = encoder.encodeQueueSize
      while (queued >= MAX_QUEUED_FRAMES) {
        await encoderProgress(encoder)
        if (encoder.encodeQueueSize < queued) lastActivity = performance.now()
        queued = encoder.encodeQueueSize
        assertAlive()
      }
      assertAlive()

      job.onProgress?.((i + 1) / job.totalFrames)
      // Let the UI repaint the progress now and then.
      if (i % 10 === 0) await sleep(0)
    }

    await withTimeout(encoder.flush(), STALL_MS * 2, 'Video encoder did not finish')
    await writes
    if (failure) throw failure
    encoder.close()
    await output.finalize()
  } catch (error) {
    if (encoder.state !== 'closed') encoder.close()
    // Don't let a stuck muxer keep the fallback waiting.
    await withTimeout(output.cancel(), 1500, 'cancel timed out').catch(() => {})
    throw error
  }

  return new Blob([output.target.buffer!], { type: 'video/mp4' })
}

const RECORDER_TYPES = ['video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1', 'video/mp4']

function pickRecorderType() {
  if (typeof MediaRecorder !== 'function') return null
  return RECORDER_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? null
}

// Fallback: record the canvas in real time with MediaRecorder (a 10 s
// video takes 10 s). Less exact than WebCodecs, but it has been in Safari
// for much longer and uses a different code path.
function recordInRealTime(job: Job, mimeType: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const { canvas } = job
    // Safari only captures frames from a canvas that is in the document.
    canvas.style.cssText =
      'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0.01;pointer-events:none'
    document.body.appendChild(canvas)

    const duration = job.totalFrames / VIDEO_FPS
    const chunks: Blob[] = []
    let timer = 0
    const cleanUp = () => {
      clearInterval(timer)
      stream.getTracks().forEach((track) => track.stop())
      canvas.remove()
    }

    job.draw(0)
    const stream = canvas.captureStream(VIDEO_FPS)
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: VIDEO_BITRATE })
    recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data)
    recorder.onerror = () => {
      cleanUp()
      reject(new Error('Nagrywanie wideo nie powiodło się.'))
    }
    recorder.onstop = () => {
      cleanUp()
      const blob = new Blob(chunks, { type: 'video/mp4' })
      if (blob.size) resolve(blob)
      else reject(new Error('Nagrywanie wideo nie zwróciło żadnych danych.'))
    }

    recorder.start()
    const start = performance.now()
    timer = window.setInterval(() => {
      const time = (performance.now() - start) / 1000
      if (time >= duration) {
        clearInterval(timer)
        if (recorder.state !== 'inactive') recorder.stop()
        return
      }
      job.draw(time)
      job.onProgress?.(time / duration)
    }, 1000 / VIDEO_FPS)
  })
}

// Renders the story to an H.264 MP4 in the browser. Silent video, which
// Instagram accepts for Stories.
export async function exportStoryVideo({
  width,
  height,
  content,
  settings,
  onProgress,
}: ExportOptions): Promise<Blob> {
  await loadStoryFont(content.text)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('Nie udało się utworzyć kontekstu canvas.')
  const renderer = createStoryRenderer(ctx, width, height)
  const omega = (2 * Math.PI) / TEMPOS[settings.tempo].periodSeconds

  const job: Job = {
    canvas,
    width,
    height,
    totalFrames: Math.round(settings.durationSeconds * VIDEO_FPS),
    draw: (time) => renderer.render(content, omega * time, time),
    onProgress,
  }

  if (typeof VideoEncoder === 'function' && typeof VideoFrame === 'function') {
    try {
      return await encodeWithWebCodecs(job)
    } catch (error) {
      console.warn('WebCodecs export failed, falling back to real-time recording:', error)
    }
  }

  const recorderType = pickRecorderType()
  if (recorderType) {
    onProgress?.(0)
    return recordInRealTime(job, recorderType)
  }

  throw new Error(
    'Ta przeglądarka nie potrafi zapisać wideo MP4. Zaktualizuj Safari albo użyj Chrome lub Edge.',
  )
}
