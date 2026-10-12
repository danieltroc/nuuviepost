import { CarouselEditor } from '../Editor/CarouselEditor'
import { StoryEditor } from '../Editor/StoryEditor'
import { Segmented } from '../ui/controls'
import { LOGO_MARK } from '../../lib/brandAssets'
import { FORMATS, type FormatKey, type PostState, type Slide } from '../../types'

interface SidebarProps {
  post: PostState
  onChangePost: (patch: Partial<PostState>) => void
  onChangeActiveSlide: (patch: Partial<Slide>) => void
}

const FORMAT_OPTIONS = (Object.keys(FORMATS) as FormatKey[]).map((value) => ({
  value,
  label: FORMATS[value].label,
  sub: FORMATS[value].ratio,
}))

export function Sidebar({ post, onChangePost, onChangeActiveSlide }: SidebarProps) {
  const activeSlide = post.slides[post.activeSlideIndex]

  return (
    <aside className="sidebar floating">
      <header className="sidebar__brand">
        <svg width={22} height={22} viewBox={`0 0 ${LOGO_MARK.size} ${LOGO_MARK.size}`} aria-hidden="true">
          <defs>
            <linearGradient id="brand-gradient" x1="0" x2={LOGO_MARK.size} y1="0" y2="0" gradientUnits="userSpaceOnUse">
              {LOGO_MARK.gradient.map((stop) => (
                <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
          </defs>
          <path d={LOGO_MARK.path} fill="url(#brand-gradient)" />
        </svg>
        <h1 className="sidebar__name">nuuviepost</h1>
        <span className="sidebar__tag" title={`Wersja ${__BUILD_ID__}, zbudowana ${__BUILD_DATE__} UTC`}>
          v. {__BUILD_ID__}
        </span>
      </header>

      <div className="sidebar__format">
        <Segmented
          label="Format"
          value={post.format}
          options={FORMAT_OPTIONS}
          onChange={(format) => onChangePost({ format })}
        />
      </div>

      <div className="sidebar__scroll">
        {post.format === 'story' ? (
          <StoryEditor
            slide={activeSlide}
            animation={post.animation}
            onChange={onChangeActiveSlide}
            onChangeAnimation={(patch) => onChangePost({ animation: { ...post.animation, ...patch } })}
          />
        ) : (
          <CarouselEditor slide={activeSlide} onChange={onChangeActiveSlide} />
        )}
      </div>
    </aside>
  )
}
