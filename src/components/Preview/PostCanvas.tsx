import { forwardRef } from 'react'
import { getStoryContent } from '../../lib/storyRenderer'
import { FORMATS, type AnimationSettings, type FormatKey, type Slide } from '../../types'
import { CarouselSlide } from './CarouselSlide'
import { StoryCanvas } from './StoryCanvas'

interface PostCanvasProps {
  format: FormatKey
  slide: Slide
  // Story only: gradient intensity, whether it moves (null = still frame)
  // and a key that restarts the preview animation from t=0.
  intensity: number
  animation?: AnimationSettings | null
  replayKey?: number
}

// One slide at its native pixel size. The DOM node is what gets exported
// to PNG, so nothing editor-only may live here unless it is marked
// `data-editor-only`.
export const PostCanvas = forwardRef<HTMLDivElement, PostCanvasProps>(function PostCanvas(
  { format, slide, intensity, animation = null, replayKey = 0 },
  ref,
) {
  const { width, height } = FORMATS[format]

  return (
    <div ref={ref} className="post-canvas" style={{ width, height }}>
      {format === 'story' ? (
        // Stories are drawn entirely on one canvas — the same renderer the
        // MP4 export uses.
        <StoryCanvas
          width={width}
          height={height}
          content={getStoryContent(slide, intensity)}
          animation={animation}
          replayKey={replayKey}
        />
      ) : (
        <CarouselSlide slide={slide} />
      )}
    </div>
  )
})
