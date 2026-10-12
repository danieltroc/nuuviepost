import { getStoryStyle, type AnimationSettings, type Slide } from '../../types'
import { Section, Toggle } from '../ui/controls'
import { AnimationControls } from './AnimationControls'
import { StoryStylePicker } from './StoryStylePicker'
import { TextField } from './TextField'

interface StoryEditorProps {
  slide: Slide
  animation: AnimationSettings
  onChange: (patch: Partial<Slide>) => void
  onChangeAnimation: (patch: Partial<AnimationSettings>) => void
}

// Stories: a fixed set of styles, text always centred, the modular band,
// an optional cursor and motion.
export function StoryEditor({ slide, animation, onChange, onChangeAnimation }: StoryEditorProps) {
  return (
    <>
      <Section title="Styl">
        <StoryStylePicker
          value={slide.storyStyle}
          onChange={(storyStyle) => onChange({ storyStyle })}
        />
      </Section>

      <Section title="Treść">
        <TextField
          id="story-text"
          label="Tekst"
          value={slide.text}
          onChange={(text) => onChange({ text })}
          rows={5}
          emoji
          hint="Source Code Pro 40 px, wersaliki, zawsze na środku. Enter = nowy akapit."
        />
      </Section>

      <Section title="Dodatki">
        <Toggle
          label="Pasek modułów"
          hint="Siatka z kropkami u góry kadru"
          checked={slide.storyModules}
          onChange={(storyModules) => onChange({ storyModules })}
        />
        <Toggle
          label="Kursor po tekście"
          hint="Migający blok za ostatnią linią"
          checked={slide.storyCursor}
          onChange={(storyCursor) => onChange({ storyCursor })}
        />
      </Section>

      <Section title="Ruch">
        <AnimationControls
          enabled={slide.animatedBackground}
          settings={animation}
          onToggle={(animatedBackground) => onChange({ animatedBackground })}
          onChange={onChangeAnimation}
          showIntensity={getStoryStyle(slide.storyStyle).background.kind === 'gradient'}
        />
      </Section>
    </>
  )
}
