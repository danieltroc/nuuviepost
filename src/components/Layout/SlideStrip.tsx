import { PostCanvas } from '../Preview/PostCanvas'
import { Icon } from '../ui/controls'
import { FORMATS, MAX_SLIDES, MIN_SLIDES, type FormatKey, type Slide } from '../../types'

interface SlideStripProps {
  format: FormatKey
  slides: Slide[]
  activeIndex: number
  intensity: number
  onSelect: (index: number) => void
  onAdd: () => void
  onRemove: (index: number) => void
  onMove: (index: number, direction: -1 | 1) => void
  // Hands each slide's full-size DOM node to the stage, for "export all".
  registerNode: (id: string, node: HTMLDivElement | null) => void
}

const THUMB_HEIGHT = 84

// Filmstrip of live thumbnails: every slide is rendered at full size and
// scaled down, so the strip always shows exactly what will be exported.
export function SlideStrip({
  format,
  slides,
  activeIndex,
  intensity,
  onSelect,
  onAdd,
  onRemove,
  onMove,
  registerNode,
}: SlideStripProps) {
  const { width, height } = FORMATS[format]
  const scale = THUMB_HEIGHT / height
  const isFull = slides.length >= MAX_SLIDES

  return (
    <div className="strip floating">
      <div className="strip__slides">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className="strip__item"
            aria-current={index === activeIndex}
            aria-label={`Slajd ${index + 1}`}
            onClick={() => onSelect(index)}
          >
            <span
              className="strip__thumb"
              style={{ width: width * scale, height: THUMB_HEIGHT }}
            >
              <span
                className="strip__scaler"
                style={{ width, height, transform: `scale(${scale})` }}
              >
                <PostCanvas
                  ref={(node) => registerNode(slide.id, node)}
                  format={format}
                  slide={slide}
                  intensity={intensity}
                />
              </span>
            </span>
            <span className="strip__index">{String(index + 1).padStart(2, '0')}</span>
          </button>
        ))}
      </div>

      <div className="strip__tools">
        <span className="strip__count">
          {slides.length}/{MAX_SLIDES}
        </span>
        <button
          type="button"
          className="btn"
          onClick={onAdd}
          disabled={isFull}
          title={isFull ? `Maksymalnie ${MAX_SLIDES} slajdów` : 'Dodaj slajd za bieżącym'}
        >
          <Icon name="plus" />
          Slajd
        </button>
        <button
          type="button"
          className="btn btn--icon"
          onClick={() => onMove(activeIndex, -1)}
          disabled={activeIndex === 0}
          aria-label="Przesuń slajd w lewo"
          title="Przesuń w lewo"
        >
          <Icon name="left" />
        </button>
        <button
          type="button"
          className="btn btn--icon"
          onClick={() => onMove(activeIndex, 1)}
          disabled={activeIndex === slides.length - 1}
          aria-label="Przesuń slajd w prawo"
          title="Przesuń w prawo"
        >
          <Icon name="right" />
        </button>
        <button
          type="button"
          className="btn btn--icon"
          onClick={() => onRemove(activeIndex)}
          disabled={slides.length <= MIN_SLIDES}
          aria-label="Usuń slajd"
          title="Usuń slajd"
        >
          <Icon name="trash" />
        </button>
      </div>
    </div>
  )
}
