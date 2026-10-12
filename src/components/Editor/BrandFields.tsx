import type { ChangeEvent } from 'react'
import { FORMATS, type FormatKey, type PostState } from '../../types'

interface BrandFieldsProps {
  format: FormatKey
  eyebrow: string
  onChange: (patch: Partial<PostState>) => void
}

// Format and eyebrow apply to the whole post/carousel, not a single
// slide — kept separate from the per-slide editor fields.
export function BrandFields({ format, eyebrow, onChange }: BrandFieldsProps) {
  const handleFormatChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange({ format: event.target.value as FormatKey })
  }

  return (
    <>
      <div className="field">
        <label className="field__label" htmlFor="format">
          Format
        </label>
        <select id="format" value={format} onChange={handleFormatChange}>
          {Object.entries(FORMATS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Stories follow the Figma design, which has no logo/eyebrow block. */}
      {format !== 'story' && (
        <div className="field">
          <label className="field__label" htmlFor="eyebrow">
            Eyebrow / nad logo
          </label>
          <input
            id="eyebrow"
            type="text"
            value={eyebrow}
            onChange={(event) => onChange({ eyebrow: event.target.value })}
            placeholder="np. nazwa marki"
          />
        </div>
      )}
    </>
  )
}
