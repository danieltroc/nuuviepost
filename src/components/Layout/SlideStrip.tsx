import { MAX_SLIDES, MIN_SLIDES, getSlideRole, type Slide } from '../../types'
import './SlideStrip.css'

interface SlideStripProps {
  slides: Slide[]
  activeIndex: number
  onSelect: (index: number) => void
  onAdd: () => void
  onRemove: (index: number) => void
  onMove: (index: number, direction: -1 | 1) => void
}

const ROLE_LABEL: Record<string, string> = {
  first: 'pierwszy',
  inside: 'wewnętrzny',
  last: 'ostatni',
}

export function SlideStrip({
  slides,
  activeIndex,
  onSelect,
  onAdd,
  onRemove,
  onMove,
}: SlideStripProps) {
  return (
    <div className="slide-strip">
      <div className="slide-strip__list">
        {slides.map((slide, index) => {
          const role = getSlideRole(index, slides.length)
          const isActive = index === activeIndex

          return (
            <div
              key={slide.id}
              className={`slide-strip__item ${isActive ? 'slide-strip__item--active' : ''}`}
            >
              <button
                type="button"
                className="slide-strip__thumb"
                onClick={() => onSelect(index)}
                title={`Slajd ${index + 1} — ${ROLE_LABEL[role]}`}
              >
                {index + 1}
              </button>

              {isActive && (
                <div className="slide-strip__controls">
                  <button
                    type="button"
                    onClick={() => onMove(index, -1)}
                    disabled={index === 0}
                    aria-label="Przesuń slajd w lewo"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(index, 1)}
                    disabled={index === slides.length - 1}
                    aria-label="Przesuń slajd w prawo"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    disabled={slides.length <= MIN_SLIDES}
                    aria-label="Usuń slajd"
                  >
                    Usuń
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        type="button"
        className="slide-strip__add"
        onClick={onAdd}
        disabled={slides.length >= MAX_SLIDES}
      >
        + Dodaj slajd ({slides.length}/{MAX_SLIDES})
      </button>
    </div>
  )
}
