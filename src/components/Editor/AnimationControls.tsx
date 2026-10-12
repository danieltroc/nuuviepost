import {
  TEMPOS,
  VIDEO_DURATIONS,
  type AnimationSettings,
  type TempoKey,
} from '../../types'

interface AnimationControlsProps {
  enabled: boolean
  settings: AnimationSettings
  onToggle: (enabled: boolean) => void
  onChange: (patch: Partial<AnimationSettings>) => void
  // The intensity slider only affects the violet gradient.
  showIntensity: boolean
}

export function AnimationControls({
  enabled,
  settings,
  onToggle,
  onChange,
  showIntensity,
}: AnimationControlsProps) {
  return (
    <div className="field">
      <label className="field__check">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onToggle(event.target.checked)}
        />
        Animacja (eksport MP4)
      </label>

      {enabled && (
        <div className="animation-controls">
          <div className="field">
            <label className="field__label" htmlFor="tempo">
              Tempo
            </label>
            <select
              id="tempo"
              value={settings.tempo}
              onChange={(event) => onChange({ tempo: event.target.value as TempoKey })}
            >
              {Object.entries(TEMPOS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {showIntensity && (
            <div className="field">
              <label className="field__label" htmlFor="intensity">
                Intensywność gradientu ({settings.intensity.toFixed(1)}×)
              </label>
              <input
                id="intensity"
                type="range"
                min={0.5}
                max={3}
                step={0.1}
                value={settings.intensity}
                onChange={(event) => onChange({ intensity: Number(event.target.value) })}
              />
            </div>
          )}

          <div className="field">
            <label className="field__label" htmlFor="duration">
              Długość wideo
            </label>
            <select
              id="duration"
              value={settings.durationSeconds}
              onChange={(event) => onChange({ durationSeconds: Number(event.target.value) })}
            >
              {VIDEO_DURATIONS.map((seconds) => (
                <option key={seconds} value={seconds}>
                  {seconds} s
                </option>
              ))}
            </select>
          </div>

          <p className="field__hint">
            Eksport MP4: 1080×1920, 30 fps, H.264, razem z tekstem.
          </p>
        </div>
      )}
    </div>
  )
}
