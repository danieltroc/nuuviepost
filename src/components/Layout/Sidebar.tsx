import { BrandFields } from '../Editor/BrandFields'
import { LayoutPicker } from '../Editor/LayoutPicker'
import { TextForm } from '../Editor/TextForm'
import { ImageUpload } from '../Editor/ImageUpload'
import { ColorPicker } from '../Editor/ColorPicker'
import { AnimationControls } from '../Editor/AnimationControls'
import { StoryStylePicker } from '../Editor/StoryStylePicker'
import { getSlideRole, getStoryStyle, type PostState, type Slide } from '../../types'
import './Sidebar.css'

interface SidebarProps {
  post: PostState
  onChangePost: (patch: Partial<PostState>) => void
  onChangeActiveSlide: (patch: Partial<Slide>) => void
}

const ROLE_LABEL: Record<string, string> = {
  first: 'pierwszy',
  inside: 'wewnętrzny',
  last: 'ostatni',
}

export function Sidebar({ post, onChangePost, onChangeActiveSlide }: SidebarProps) {
  const activeSlide = post.slides[post.activeSlideIndex]
  const role = getSlideRole(post.activeSlideIndex, post.slides.length)
  const isStory = post.format === 'story'

  return (
    <aside className="sidebar">
      <h1 className="sidebar__title">Generator grafik na Instagram</h1>

      <BrandFields
        format={post.format}
        eyebrow={post.eyebrow}
        onChange={onChangePost}
      />

      <div className="sidebar__slide-editor">
        <p className="sidebar__slide-label">
          Slajd {post.activeSlideIndex + 1} z {post.slides.length}
          <span className={`sidebar__role-tag sidebar__role-tag--${role}`}>
            {ROLE_LABEL[role]}
          </span>
        </p>

        {isStory ? (
          // Stories: a fixed set of styles, text always centred, the modular
          // band, an optional cursor and motion.
          <>
            <StoryStylePicker
              value={activeSlide.storyStyle}
              onChange={(storyStyle) => onChangeActiveSlide({ storyStyle })}
            />

            <TextForm
              value={activeSlide.text}
              onChange={(text) => onChangeActiveSlide({ text })}
              hint="Source Code Pro Medium 40 px, wersaliki, zawsze na środku. Enter = nowy akapit."
            />

            <label className="field__check">
              <input
                type="checkbox"
                checked={activeSlide.storyModules}
                onChange={(event) => onChangeActiveSlide({ storyModules: event.target.checked })}
              />
              Moduły (siatka u góry)
            </label>

            <label className="field__check">
              <input
                type="checkbox"
                checked={activeSlide.storyCursor}
                onChange={(event) => onChangeActiveSlide({ storyCursor: event.target.checked })}
              />
              Migający kursor po tekście
            </label>

            <AnimationControls
              enabled={activeSlide.animatedBackground}
              settings={post.animation}
              onToggle={(animatedBackground) => onChangeActiveSlide({ animatedBackground })}
              onChange={(patch) => onChangePost({ animation: { ...post.animation, ...patch } })}
              showIntensity={getStoryStyle(activeSlide.storyStyle).background.kind === 'gradient'}
            />
          </>
        ) : (
          <>
            <LayoutPicker
              role={role}
              value={activeSlide.layoutId}
              onChange={(layoutId) => onChangeActiveSlide({ layoutId })}
            />

            <TextForm
              value={activeSlide.text}
              onChange={(text) => onChangeActiveSlide({ text })}
            />

            <ColorPicker
              value={activeSlide.backgroundColorId}
              onChange={(backgroundColorId) => onChangeActiveSlide({ backgroundColorId })}
              disabled={Boolean(activeSlide.backgroundImage)}
            />

            <ImageUpload
              value={activeSlide.backgroundImage}
              onChange={(backgroundImage) => onChangeActiveSlide({ backgroundImage })}
            />
          </>
        )}
      </div>
    </aside>
  )
}
