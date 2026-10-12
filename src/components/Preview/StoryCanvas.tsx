import { useEffect, useRef, useState } from 'react'
import { createStoryRenderer, type StoryContent, type StoryRenderer } from '../../lib/storyRenderer'
import { loadStoryFont } from '../../lib/storyText'
import { TEMPOS, type AnimationSettings } from '../../types'

interface StoryCanvasProps {
  width: number
  height: number
  content: StoryContent
  // Non-null = moving story (as exported to MP4); null = still frame.
  animation: AnimationSettings | null
  // Changing this restarts the preview from t=0 (replays the icon intro).
  replayKey: number
}

export function StoryCanvas({ width, height, content, animation, replayKey }: StoryCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<StoryRenderer | null>(null)
  const latest = useRef({ content, animation })
  const [fontVersion, setFontVersion] = useState(0)
  const isAnimated = animation !== null
  const { style, text, modules, cursor, intensity } = content

  useEffect(() => {
    latest.current = { content, animation }
  })

  // Redraw once the font (and the Polish glyph subset) has actually loaded.
  useEffect(() => {
    let alive = true
    loadStoryFont(text).then(() => alive && setFontVersion((v) => v + 1))
    return () => {
      alive = false
    }
  }, [text])

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d', { alpha: false })
    rendererRef.current = ctx ? createStoryRenderer(ctx, width, height) : null
  }, [width, height])

  // Moving: continuous loop from t=0, restarted when the look changes so
  // the module intro is visible. The phase is accumulated (not
  // derived from elapsed time) so a tempo change speeds up without a jump.
  useEffect(() => {
    if (!isAnimated) return
    let frame = 0
    let phase = 0
    const start = performance.now()
    let last = start
    const tick = (now: number) => {
      const { content, animation } = latest.current
      if (animation) {
        const period = TEMPOS[animation.tempo].periodSeconds
        phase += ((now - last) / 1000) * ((2 * Math.PI) / period)
        rendererRef.current?.render(content, phase, (now - start) / 1000)
      }
      last = now
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isAnimated, width, height, style.id, modules, replayKey])

  // Still: draw the rest pose (the Figma composition) when something changes.
  useEffect(() => {
    if (isAnimated) return
    rendererRef.current?.render(latest.current.content, 0, Infinity)
  }, [isAnimated, style, text, modules, cursor, intensity, fontVersion, width, height])

  return (
    <canvas
      ref={canvasRef}
      className="post-canvas__story"
      width={width}
      height={height}
    />
  )
}
