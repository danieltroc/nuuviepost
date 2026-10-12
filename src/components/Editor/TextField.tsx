import { useRef, useState } from 'react'
import { EMOJI } from '../../lib/emoji'
import { Field } from '../ui/controls'

interface EmojiGridProps {
  onPick: (emoji: string) => void
  selected?: string
}

export function EmojiGrid({ onPick, selected }: EmojiGridProps) {
  return (
    <div className="emoji-grid">
      {EMOJI.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="emoji-grid__item"
          aria-pressed={selected === undefined ? undefined : emoji === selected}
          onClick={() => onPick(emoji)}
          aria-label={`Emoji ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

interface TextFieldProps {
  id: string
  label: string
  value: string
  onChange: (text: string) => void
  rows?: number
  placeholder?: string
  hint?: string
  // Shows the emoji button that inserts at the caret.
  emoji?: boolean
}

export function TextField({
  id,
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
  hint,
  emoji = false,
}: TextFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showEmoji, setShowEmoji] = useState(false)

  // Insert at the caret (replacing any selection) and keep the caret after it.
  const insertEmoji = (picked: string) => {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? value.length
    const end = textarea?.selectionEnd ?? value.length
    onChange(value.slice(0, start) + picked + value.slice(end))
    requestAnimationFrame(() => {
      if (!textarea) return
      textarea.focus()
      textarea.setSelectionRange(start + picked.length, start + picked.length)
    })
  }

  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint}
      action={
        emoji && (
          <button
            type="button"
            className="chip"
            onClick={() => setShowEmoji((open) => !open)}
            aria-expanded={showEmoji}
          >
            😊 Emoji
          </button>
        )
      }
    >
      <textarea
        ref={textareaRef}
        id={id}
        className="input"
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {showEmoji && <EmojiGrid onPick={insertEmoji} />}
    </Field>
  )
}
