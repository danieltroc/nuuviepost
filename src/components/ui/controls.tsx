import type { ReactNode } from 'react'

// Small building blocks shared by the editor panels.

interface SectionProps {
  title: string
  aside?: ReactNode
  children: ReactNode
}

export function Section({ title, aside, children }: SectionProps) {
  return (
    <section className="section">
      <header className="section__head">
        <h2 className="section__title">{title}</h2>
        {aside}
      </header>
      <div className="section__body">{children}</div>
    </section>
  )
}

interface FieldProps {
  label: string
  htmlFor?: string
  action?: ReactNode
  hint?: ReactNode
  children: ReactNode
}

export function Field({ label, htmlFor, action, hint, children }: FieldProps) {
  return (
    <div className="field">
      <div className="field__head">
        <label className="field__label" htmlFor={htmlFor}>
          {label}
        </label>
        {action}
      </div>
      {children}
      {hint && <p className="field__hint">{hint}</p>}
    </div>
  )
}

interface SegmentedProps<T extends string> {
  value: T
  options: ReadonlyArray<{ value: T; label: string; sub?: string }>
  onChange: (value: T) => void
  label: string
}

export function Segmented<T extends string>({ value, options, onChange, label }: SegmentedProps<T>) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className="segmented__option"
          onClick={() => onChange(option.value)}
        >
          <span>{option.label}</span>
          {option.sub && <span className="segmented__sub">{option.sub}</span>}
        </button>
      ))}
    </div>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  hint?: string
}

export function Toggle({ checked, onChange, label, hint }: ToggleProps) {
  return (
    <label className="toggle">
      <span className="toggle__text">
        <span className="toggle__label">{label}</span>
        {hint && <span className="toggle__hint">{hint}</span>}
      </span>
      <input
        type="checkbox"
        className="toggle__input"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="toggle__track" aria-hidden="true" />
    </label>
  )
}

// Stroke icons on a 16px grid.
const ICONS = {
  plus: 'M8 3v10M3 8h10',
  left: 'M9.5 3.5 5 8l4.5 4.5',
  right: 'M6.5 3.5 11 8l-4.5 4.5',
  trash: 'M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5',
  download: 'M8 2.5v8M4.5 7.5 8 11l3.5-3.5M3 13.5h10',
  replay: 'M3.5 8a4.5 4.5 0 1 0 1.4-3.3M3.5 2.5v2.7h2.7',
  image: 'M2.5 3.5h11v9h-11zM2.5 10.5l3-3 2.5 2.5 2-2 3.5 3.5M10.5 6.2h.01',
  close: 'M4 4l8 8M12 4l-8 8',
} as const

export function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg
      className="icon"
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  )
}
