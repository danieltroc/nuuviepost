import { useRef, useState } from 'react'
import './TextForm.css'

interface TextFormProps {
  value: string
  onChange: (text: string) => void
  hint?: string
}

// Quick picks; any emoji works (e.g. the macOS picker: Ctrl+Cmd+Space).
// They render with the system emoji font — Apple Color Emoji on Mac/iOS.
const EMOJI = [
  '😀', '😂', '😍', '🥰', '😎', '🤔', '🤯', '🥳',
  '🙌', '👏', '👍', '👉', '👇', '✌️', '🙏', '💪',
  '🔥', '✨', '⭐', '⚡', '💜', '❤️', '🖤', '🤍',
  '💡', '🚀', '🎉', '✅', '❌', '📣', '📌', '📈',
  '💬', '👀', '🎯', '🎨', '💻', '📱', '☕', '⏰',
]

export function TextForm({ value, onChange, hint }: TextFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showEmoji, setShowEmoji] = useState(false)

  // Insert at the caret (replacing any selection) and keep the caret after it.
  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? value.length
    const end = textarea?.selectionEnd ?? value.length
    onChange(value.slice(0, start) + emoji + value.slice(end))
    requestAnimationFrame(() => {
      if (!textarea) return
      textarea.focus()
      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
    })
  }

  return (
    <div className="field">
      <div className="text-form__header">
        <label className="field__label" htmlFor="text">
          Treść slajdu
        </label>
        <button
          type="button"
          className="text-form__emoji-toggle"
          onClick={() => setShowEmoji((open) => !open)}
          aria-expanded={showEmoji}
        >
          😊 Emoji
        </button>
      </div>
      <textarea
        ref={textareaRef}
        id="text"
        rows={6}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Wpisz treść, która pojawi się na grafice"
      />
      {showEmoji && (
        <div className="text-form__emoji-grid">
          {EMOJI.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="text-form__emoji"
              onClick={() => insertEmoji(emoji)}
              aria-label={`Wstaw ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      {hint && <p className="field__hint">{hint}</p>}
    </div>
  )
}
