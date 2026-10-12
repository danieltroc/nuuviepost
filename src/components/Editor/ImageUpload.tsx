import type { ChangeEvent } from 'react'

interface ImageUploadProps {
  value: string | null
  onChange: (dataUrl: string | null) => void
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)

    // allow selecting the same file again after removing it
    event.target.value = ''
  }

  return (
    <div className="field">
      <label className="field__label" htmlFor="background-image">
        Zdjęcie tła
      </label>
      <input
        id="background-image"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />

      {value && (
        <div className="image-upload__preview">
          <img src={value} alt="Podgląd tła" />
          <button type="button" onClick={() => onChange(null)}>
            Usuń zdjęcie
          </button>
        </div>
      )}
    </div>
  )
}
