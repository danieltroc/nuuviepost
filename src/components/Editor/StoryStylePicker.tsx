import {
  STORY_STYLES,
  STORY_STYLE_GROUPS,
  type StoryStyle,
  type StoryStyleGroup,
  type StoryStyleId,
} from '../../types'
import './StoryStylePicker.css'

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
  const groups = Object.keys(STORY_STYLE_GROUPS) as StoryStyleGroup[]

  return (
    <div className="field">
      <span className="field__label">Styl</span>
      <div className="story-style">
        {groups.map((group) => (
          <div key={group} className="story-style__group">
            <span className="story-style__group-label">{STORY_STYLE_GROUPS[group]}</span>
            <div className="story-style__options">
              {STORY_STYLES.filter((style) => style.group === group).map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className="story-style__option"
                  aria-pressed={style.id === value}
                  onClick={() => onChange(style.id)}
                  title={`${STORY_STYLE_GROUPS[group]} — ${style.label}`}
                >
                  <StyleThumb style={style} />
                  <span className="story-style__label">{style.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
