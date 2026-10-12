import '@fontsource/manrope/latin-700.css'
import '@fontsource/manrope/latin-ext-700.css'
import { Fragment, type CSSProperties } from 'react'
import { LOGO_MARK, LOGO_WORDMARK, STICKER_BADGE } from '../../lib/brandAssets'
import { isPhotoPreset } from '../../lib/photos'
import { getCoverStyle, getPanelColor, type Slide } from '../../types'
import './CarouselSlide.css'

interface CarouselSlideProps {
  slide: Slide
}

// Marks parts of the editor preview that must not end up in an exported
// PNG (see exportNodeToPng's filter).
const editorOnly = { 'data-editor-only': '' }

function ImageHint({ children }: { children: string }) {
  return (
    <div className="cs-hint" {...editorOnly}>
      {children}
    </div>
  )
}

function Cover({ slide }: CarouselSlideProps) {
  return (
    <>
      <div className="cs-cover__headline">
        {slide.text.split('\n').map((line, index) => (
          // One block per typed line; an empty line keeps its row but gets no bar.
          <div key={index} className="cs-cover__line">
            {line.trim() && <span className="cs-cover__bar">{line.trim()}</span>}
          </div>
        ))}
      </div>

      <div className="cs-cover__copy">
        {slide.subtitle && <p className="cs-cover__subtitle">{slide.subtitle}</p>}
        {slide.description && <p className="cs-cover__description">{slide.description}</p>}
      </div>

      <div className="cs-cover__photo">
        {slide.image ? (
          <img
            src={slide.image}
            alt=""
            style={{ transform: slide.imageFlip ? 'scaleX(-1)' : undefined }}
          />
        ) : (
          <ImageHint>Zdjęcie (PNG bez tła)</ImageHint>
        )}
      </div>
    </>
  )
}

function Feature({ slide }: CarouselSlideProps) {
  // A cover photo carried over from the cover layout is not a screenshot.
  const image = isPhotoPreset(slide.image) ? null : slide.image

  return (
    <>
      <div className="cs-feature__image">
        {image ? (
          <img
            src={image}
            alt=""
            style={{
              objectPosition: `${slide.imageX}% 50%`,
              transform: slide.imageFlip ? 'scaleX(-1)' : undefined,
            }}
          />
        ) : (
          <ImageHint>Zrzut ekranu lub zdjęcie</ImageHint>
        )}
      </div>

      <p className="cs-feature__headline">{slide.text}</p>

      {slide.emoji && (
        <div className="cs-sticker">
          <svg
            className="cs-sticker__badge"
            width={STICKER_BADGE.width}
            height={STICKER_BADGE.height}
            viewBox={`0 0 ${STICKER_BADGE.width} ${STICKER_BADGE.height}`}
          >
            <path d={STICKER_BADGE.path} fill="#9C5BF8" />
          </svg>
          <span className="cs-sticker__emoji">{slide.emoji}</span>
        </div>
      )}
    </>
  )
}

// "Zdanie z *wyróżnieniem*" → the starred part sits on the violet marker.
function Highlighted({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*([^*]+)\*/).map((part, index) =>
        index % 2 ? (
          <mark key={index} className="cs-text__mark">
            {part}
          </mark>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  )
}

function TextSlide({ slide }: CarouselSlideProps) {
  return (
    <>
      <div className="cs-text__body">
        <p className="cs-text__headline">{slide.text}</p>
        {slide.subtitle && (
          <p className="cs-text__sentence">
            <Highlighted text={slide.subtitle} />
          </p>
        )}
      </div>

      <svg
        className="cs-text__logo-mark"
        width={LOGO_MARK.size}
        height={LOGO_MARK.size}
        viewBox={`0 0 ${LOGO_MARK.size} ${LOGO_MARK.size}`}
      >
        <defs>
          <linearGradient
            id="cs-logo-gradient"
            x1="0"
            x2={LOGO_MARK.size}
            y1="0"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            {LOGO_MARK.gradient.map((stop) => (
              <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
        </defs>
        <path d={LOGO_MARK.path} fill="url(#cs-logo-gradient)" />
      </svg>
      <svg
        className="cs-text__logo-word"
        width={LOGO_WORDMARK.width}
        height={LOGO_WORDMARK.height}
        viewBox={`0 0 ${LOGO_WORDMARK.width} ${LOGO_WORDMARK.height}`}
      >
        {LOGO_WORDMARK.paths.map((d) => (
          <path key={d.slice(0, 24)} d={d} fill="#070707" />
        ))}
      </svg>
    </>
  )
}

// One carousel slide at its native 1080×1440, positioned exactly as in
// Figma. Rendered as DOM so text wraps naturally; exported with
// html-to-image.
export function CarouselSlide({ slide }: CarouselSlideProps) {
  const panel = getPanelColor(slide.panelColorId)

  if (slide.layout === 'feature') {
    return (
      <div className="cs cs--feature" style={{ background: panel.background, color: panel.text }}>
        <Feature slide={slide} />
      </div>
    )
  }

  if (slide.layout === 'cover') {
    const cover = getCoverStyle(slide.coverStyle)
    const colors = {
      background: cover.background,
      color: cover.text,
      '--cover-bar': cover.bar,
      '--cover-headline': cover.headline,
    } as CSSProperties
    return (
      <div className="cs cs--cover" style={colors}>
        <Cover slide={slide} />
      </div>
    )
  }

  return (
    <div className="cs cs--text">
      <TextSlide slide={slide} />
    </div>
  )
}
