import {
  TEMPOS,
  VIDEO_DURATIONS,
  type AnimationSettings,
  type TempoKey,
} from '../../types'
import { Field, Segmented, Toggle } from '../ui/controls'

interface AnimationControlsProps {
  enabled: boolean
  settings: AnimationSettings
  onToggle: (enabled: boolean) => void
  onChange: (patch: Partial<AnimationSettings>) => void
  // The intensity slider only affects the violet gradient.
  showIntensity: boolean
}

const TEMPO_OPTIONS = (Object.keys(TEMPOS) as TempoKey[]).map((value) => ({
  value,
  label: TEMPOS[value].label,
}))

const DURATION_OPTIONS = VIDEO_DURATIONS.map((seconds) => ({
  value: String(seconds),
  label: `${seconds} s`,
}))

export function AnimationControls({
  enabled,
  settings,
  onToggle,
  onChange,
  showIntensity,
}: AnimationControlsProps) {
  return (
    <>
      <Toggle
        label="Animacja"
        hint="Eksport MP4: 1080×1920, 30 fps, H.264"
        checked={enabled}
        onChange={onToggle}
      />

      {enabled && (
        <>
          <Field label="Tempo">
            <Segmented
              label="Tempo"
              value={settings.tempo}
              options={TEMPO_OPTIONS}
              onChange={(tempo) => onChange({ tempo })}
            />
          </Field>

          <Field label="Długość wideo">
            <Segmented
              label="Długość wideo"
              value={String(settings.durationSeconds)}
              options={DURATION_OPTIONS}
              onChange={(value) => onChange({ durationSeconds: Number(value) })}
            />
          </Field>

          {showIntensity && (
            <Field
              label={`Intensywność gradientu (${settings.intensity.toFixed(1)}×)`}
              htmlFor="intensity"
            >
              <input
                id="intensity"
                type="range"
                className="range"
                min={0.5}
                max={3}
                step={0.1}
                value={settings.intensity}
                onChange={(event) => onChange({ intensity: Number(event.target.value) })}
              />
            </Field>
          )}
        </>
      )}
    </>
  )
}
