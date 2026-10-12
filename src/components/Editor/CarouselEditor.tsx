import {
  CAROUSEL_LAYOUTS,
  COVER_STYLES,
  PANEL_COLORS,
  type CarouselLayout,
  type Slide,
} from '../../types'
import { PHOTO_PRESETS, isPhotoPreset } from '../../lib/photos'
import { Field, Section, Segmented, Toggle } from '../ui/controls'
import { ImageField } from './ImageField'
import { EmojiGrid, TextField } from './TextField'

interface CarouselEditorProps {
  slide: Slide
  onChange: (patch: Partial<Slide>) => void
}

const LAYOUT_OPTIONS = (Object.keys(CAROUSEL_LAYOUTS) as CarouselLayout[]).map((value) => ({
  value,
  label: CAROUSEL_LAYOUTS[value].label,
}))

export function CarouselEditor({ slide, onChange }: CarouselEditorProps) {
  const { layout } = slide

  return (
    <>
      <Section title="Layout">
        <Segmented
          label="Layout slajdu"
          value={layout}
          options={LAYOUT_OPTIONS}
          onChange={(value) => onChange({ layout: value })}
        />
        <p className="field__hint">{CAROUSEL_LAYOUTS[layout].hint}</p>
      </Section>

      <Section title="Treść">
        <TextField
          id="headline"
          label="Nagłówek"
          value={slide.text}
          onChange={(text) => onChange({ text })}
          rows={layout === 'cover' ? 3 : 4}
          emoji
          hint={
            layout === 'cover'
              ? 'Każda linia dostaje pasek na szerokość swojego tekstu. Enter = nowa linia.'
              : undefined
          }
        />

        {layout === 'cover' && (
          <>
            <TextField
              id="subtitle"
              label="Podtytuł"
              value={slide.subtitle}
              onChange={(subtitle) => onChange({ subtitle })}
              rows={2}
            />
            <TextField
              id="description"
              label="Opis"
              value={slide.description}
              onChange={(description) => onChange({ description })}
              rows={3}
            />
          </>
        )}

        {layout === 'text' && (
          <TextField
            id="subtitle"
            label="Zdanie pod nagłówkiem"
            value={slide.subtitle}
            onChange={(subtitle) => onChange({ subtitle })}
            rows={2}
            hint="Słowa w *gwiazdkach* trafiają na fioletowy marker."
          />
        )}
      </Section>

      {layout === 'cover' && (
        <Section title="Kolory">
          <div className="cover-style" role="radiogroup" aria-label="Kolory okładki">
            {COVER_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                role="radio"
                aria-checked={style.id === slide.coverStyle}
                className="cover-style__option"
                onClick={() => onChange({ coverStyle: style.id })}
              >
                {/* Mini cover: two bars with "text" on them, two lines of copy. */}
                <span className="cover-style__thumb" style={{ background: style.background }}>
                  <span className="cover-style__bar" style={{ background: style.bar, color: style.headline }}>
                    Aa
                  </span>
                  <span
                    className="cover-style__bar cover-style__bar--short"
                    style={{ background: style.bar, color: style.headline }}
                  >
                    Aa
                  </span>
                  <span className="cover-style__copy" style={{ background: style.text }} />
                  <span className="cover-style__copy cover-style__copy--short" style={{ background: style.text }} />
                </span>
                <span className="cover-style__label">{style.label}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {layout === 'cover' && (
        <Section title="Zdjęcie">
          <div className="photo-grid" role="radiogroup" aria-label="Gotowe zdjęcia">
            {PHOTO_PRESETS.map((photo) => {
              const selected = slide.image === photo.url
              return (
                <button
                  key={photo.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={photo.label}
                  className="photo-grid__item"
                  // Clicking the selected photo again removes it.
                  onClick={() => onChange({ image: selected ? null : photo.url })}
                >
                  <img src={photo.url} alt="" style={{ transform: slide.imageFlip ? 'scaleX(-1)' : undefined }} />
                </button>
              )
            })}
          </div>

          <ImageField
            id="slide-image"
            label="Albo wgraj własne"
            value={isPhotoPreset(slide.image) ? null : slide.image}
            onChange={(image) => onChange({ image })}
            hint="PNG z przezroczystym tłem. Aplikacja nie wycina tła sama."
          />

          {slide.image && (
            <Toggle
              label="Odbij w poziomie"
              checked={slide.imageFlip}
              onChange={(imageFlip) => onChange({ imageFlip })}
            />
          )}
        </Section>
      )}

      {layout === 'feature' && (
        <Section title="Obraz">
          <ImageField
            id="slide-image"
            label="Zrzut ekranu lub zdjęcie"
            // A cover photo left over from another layout isn't a screenshot.
            value={isPhotoPreset(slide.image) ? null : slide.image}
            onChange={(image) => onChange({ image })}
            hint="Wypełnia górne 909 px slajdu, nadmiar jest przycinany."
          />

          {slide.image && !isPhotoPreset(slide.image) && (
            <>
              <Field label={`Kadr w poziomie (${slide.imageX}%)`} htmlFor="image-x">
                <input
                  id="image-x"
                  type="range"
                  className="range"
                  min={0}
                  max={100}
                  value={slide.imageX}
                  onChange={(event) => onChange({ imageX: Number(event.target.value) })}
                />
              </Field>
              <Toggle
                label="Odbij w poziomie"
                checked={slide.imageFlip}
                onChange={(imageFlip) => onChange({ imageFlip })}
              />
            </>
          )}
        </Section>
      )}

      {layout === 'feature' && (
        <>
          <Section title="Panel">
            <div className="swatches" role="radiogroup" aria-label="Kolor panelu">
              {PANEL_COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  role="radio"
                  aria-checked={color.id === slide.panelColorId}
                  aria-label={color.label}
                  title={color.label}
                  className="swatch"
                  style={{ background: color.background }}
                  onClick={() => onChange({ panelColorId: color.id })}
                />
              ))}
            </div>
          </Section>

          <Section
            title="Naklejka"
            aside={
              <button
                type="button"
                className="chip"
                aria-pressed={slide.emoji === ''}
                onClick={() => onChange({ emoji: '' })}
              >
                Bez naklejki
              </button>
            }
          >
            <EmojiGrid selected={slide.emoji} onPick={(emoji) => onChange({ emoji })} />
            <Field label="Albo wpisz własne emoji" htmlFor="sticker-emoji">
              <input
                id="sticker-emoji"
                className="input input--emoji"
                type="text"
                value={slide.emoji}
                onChange={(event) => onChange({ emoji: event.target.value })}
                placeholder="np. 🧠"
              />
            </Field>
          </Section>
        </>
      )}
    </>
  )
}
