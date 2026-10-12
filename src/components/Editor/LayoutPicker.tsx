import { getLayoutsForRole, type SlideRole } from '../../types'

interface LayoutPickerProps {
  role: SlideRole
  value: string
  onChange: (layoutId: string) => void
}

export function LayoutPicker({ role, value, onChange }: LayoutPickerProps) {
  const options = getLayoutsForRole(role)

  return (
    <div className="field">
      <label className="field__label" htmlFor="layout">
        Layout slajdu
      </label>
      <select
        id="layout"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((layout) => (
          <option key={layout.id} value={layout.id}>
            {layout.label}
          </option>
        ))}
      </select>
    </div>
  )
}
