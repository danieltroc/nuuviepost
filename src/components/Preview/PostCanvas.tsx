import { forwardRef } from 'react'
import {
  FORMATS,
  getBrandColor,
  getLayoutById,
  getSlideRole,
  type AnimationSettings,
  type FormatKey,
  type Slide,
} from '../../types'
import type { StoryContent } from '../../lib/storyRenderer'
import { StoryCanvas } from './StoryCanvas'
import './PostCanvas.css'

interface PostCanvasProps {
  format: FormatKey
  eyebrow: string
  slide: Slide
  slideIndex: number
  slideCount: number
  // Story format: what to draw, whether it moves (null = still frame) and
  // a key that restarts the preview animation from t=0.
  storyContent: StoryContent
  animation: AnimationSettings | null
  replayKey: number
}

// The DOM node rendered here is exported 1:1 to PNG, at its native
// pixel dimensions (see useImageExport). Keep it self-contained and
// free of anything that shouldn't end up in the exported image —
// editor-only hints (e.g. "add a photo") belong in PreviewPane instead.
export const PostCanvas = forwardRef<HTMLDivElement, PostCanvasProps>(
  function PostCanvas(
    { format, eyebrow, slide, slideIndex, slideCount, storyContent, animation, replayKey },
    ref,
  ) {
    const { width, height } = FORMATS[format]
    const brandColor = getBrandColor(slide.backgroundColorId)

    // Stories are drawn entirely on one canvas (background, icon, text) with
    // the fixed Figma typography — the same renderer the MP4 export uses.
    if (format === 'story') {
      return (
        <div ref={ref} className="post-canvas" style={{ width, height }}>
          <StoryCanvas
            width={width}
            height={height}
            content={storyContent}
            animation={animation}
            replayKey={replayKey}
          />
        </div>
      )
    }

    const hasImage = Boolean(slide.backgroundImage)
    const layout = getLayoutById(slide.layoutId)
    const role = getSlideRole(slideIndex, slideCount)

    return (
      <div
        ref={ref}
        data-role={role}
        className={[
          'post-canvas',
          hasImage ? 'post-canvas--photo' : 'post-canvas--flat',
          `post-canvas--text-${layout.textPosition}`,
          `post-canvas--align-${layout.textAlign}`,
        ].join(' ')}
        style={{
          width,
          height,
          backgroundColor: hasImage ? undefined : brandColor.background,
          backgroundImage: hasImage ? `url(${slide.backgroundImage})` : undefined,
          color: hasImage ? '#FFFFFF' : brandColor.text,
        }}
      >
        {hasImage && <div className="post-canvas__scrim" />}

        {slideCount > 1 && (
          <div className="post-canvas__counter">
            {slideIndex + 1}/{slideCount}
          </div>
        )}

        {/* Logo / eyebrow placeholder — fixed position, swap for real
            branding once the Figma layout is ready. */}
        <div
          className={`post-canvas__brand ${
            layout.emphasizeLogo ? 'post-canvas__brand--emphasized' : ''
          }`}
        >
          <div className="post-canvas__logo-box">LOGO</div>
          {eyebrow && <span className="post-canvas__eyebrow">{eyebrow}</span>}
        </div>

        <div className="post-canvas__text">{slide.text}</div>

        {layout.showCta && (
          <div className="post-canvas__cta">Zobacz więcej →</div>
        )}
      </div>
    )
  },
)
