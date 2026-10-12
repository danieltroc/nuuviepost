import {
  STORY_STYLES,
  STORY_STYLE_GROUPS,
  type StoryStyle,
  type StoryStyleGroup,
  type StoryStyleId,
} from '../../types'

interface StoryStylePickerProps {
  value: StoryStyleId
  onChange: (id: StoryStyleId) => void
}

// Mini story thumbnail: background plus two "lines" of text in the style's
// text/marker colours.
function StyleThumb({ style }: { style: StoryStyle }) {
  const background =
    style.background.kind === 'gradient'
      ? `linear-gradient(160deg, #a26af5 0%, ${style.background.baseColor} 45%, #a26af5 100%)`
      : style.background.color
  const line = { background: style.markerColor ?? 'transparent', color: style.textColor }
  return (
    <span className="story-style__thumb" style={{ background }}>
      <span className="story-style__line" style={line}>
        Aa Aa
      </span>
      <span className="story-style__line" style={line}>
        Aa
      </span>
    </span>
  )
}

export function StoryStylePicker({ value, onChange }: StoryStylePickerProps) {
  return (
    <div className="story-style" role="radiogroup" aria-label="Styl story">
      {STORY_STYLES.map((style) => {
        const group = STORY_STYLE_GROUPS[style.group as StoryStyleGroup]
        return (
          <button
            key={style.id}
            type="button"
            role="radio"
            aria-checked={style.id === value}
            className="story-style__option"
            onClick={() => onChange(style.id)}
            title={`${group} — ${style.label}`}
          >
            <StyleThumb style={style} />
            <span className="story-style__text">
              <span className="story-style__group">{group}</span>
              <span className="story-style__label">{style.label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
