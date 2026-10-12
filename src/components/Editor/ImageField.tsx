import { useState, type ChangeEvent, type DragEvent } from 'react'
import { Field, Icon } from '../ui/controls'

interface ImageFieldProps {
  id: string
  label: string
  value: string | null
  onChange: (dataUrl: string | null) => void
  hint?: string
}

export function ImageField({ id, label, value, onChange, hint }: ImageFieldProps) {
  const [isDragging, setIsDragging] = useState(false)

  const read = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    read(event.target.files?.[0])
    // allow selecting the same file again after removing it
    event.target.value = ''
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
    read(event.dataTransfer.files[0])
  }

  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="image-field">
        <label
          className={`image-field__drop ${isDragging ? 'image-field__drop--active' : ''}`}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            id={id}
            className="image-field__input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
          {value ? (
            <img className="image-field__thumb" src={value} alt="" />
          ) : (
            <span className="image-field__icon">
              <Icon name="image" />
            </span>
          )}
          <span className="image-field__text">
            {value ? 'Zmień obraz' : 'Wybierz lub upuść plik'}
          </span>
        </label>
        {value && (
          <button
            type="button"
            className="btn btn--icon"
            onClick={() => onChange(null)}
            aria-label="Usuń obraz"
            title="Usuń obraz"
          >
            <Icon name="trash" />
          </button>
        )}
      </div>
    </Field>
  )
}
