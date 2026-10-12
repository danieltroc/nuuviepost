import { BRAND_COLORS } from '../../types'
import './ColorPicker.css'

interface ColorPickerProps {
  value: string
  onChange: (id: string) => void
  disabled?: boolean
  label?: string
}

export function ColorPicker({
  value,
  onChange,
  disabled,
  label = 'Kolor tła',
}: ColorPickerProps) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      <div className={`color-picker ${disabled ? 'color-picker--disabled' : ''}`}>
        {BRAND_COLORS.map((color) => (
          <button
            key={color.id}
            type="button"
            className="color-picker__swatch"
            style={{
              backgroundColor: color.background,
              outlineColor: color.background,
            }}
            data-selected={color.id === value}
            title={color.label}
            aria-label={color.label}
            aria-pressed={color.id === value}
            onClick={() => onChange(color.id)}
          />
        ))}
      </div>
      {disabled && (
        <p className="field__hint">Widoczny, gdy nie ma wgranego zdjęcia</p>
      )}
    </div>
  )
}
