import daniel1 from '../assets/photos/daniel-1.webp'
import daniel2 from '../assets/photos/daniel-2.webp'
import daniel3 from '../assets/photos/daniel-3.webp'
import daniel4 from '../assets/photos/daniel-4.webp'
import daniel5 from '../assets/photos/daniel-5.webp'
import daniel6 from '../assets/photos/daniel-6.webp'

// Ready-made cover photos, rendered from the Figma frames "Daniel 1"–
// "Daniel 6" (section 3912:1034). Each is exactly the cover's 661×819
// photo slot with a transparent background and Figma's image adjustments
// baked in, so it needs no fitting.
export const PHOTO_PRESETS = [
  { id: 'daniel-1', label: 'Zdjęcie 1', url: daniel1 },
  { id: 'daniel-2', label: 'Zdjęcie 2', url: daniel2 },
  { id: 'daniel-3', label: 'Zdjęcie 3', url: daniel3 },
  { id: 'daniel-4', label: 'Zdjęcie 4', url: daniel4 },
  { id: 'daniel-5', label: 'Zdjęcie 5', url: daniel5 },
  { id: 'daniel-6', label: 'Zdjęcie 6', url: daniel6 },
] as const

export const isPhotoPreset = (image: string | null) =>
  PHOTO_PRESETS.some((preset) => preset.url === image)
