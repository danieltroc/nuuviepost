export const FORMATS = {
  story: { label: 'Story (9:16)', width: 1080, height: 1920 },
  post: { label: 'Post / Karuzela (4:5)', width: 1080, height: 1350 },
  square: { label: 'Post / Karuzela (1:1)', width: 1080, height: 1080 },
} as const

export type FormatKey = keyof typeof FORMATS

export interface BrandColor {
  id: string
  label: string
  background: string
  // Hardcoded pairing — no free font color choice on flat backgrounds,
  // so contrast is always guaranteed.
  text: string
}

// Palette sampled from nuuvie.com (off-white/black/white/graphite base
// with the purple + orange accents used in the logo mark). Swap once
// the Figma brand palette is confirmed.
export const BRAND_COLORS: BrandColor[] = [
  { id: 'off-white', label: 'Off White', background: '#F8F7F3', text: '#0A0A0A' },
  { id: 'white', label: 'Biel', background: '#FFFFFF', text: '#0A0A0A' },
  { id: 'graphite', label: 'Grafit', background: '#242424', text: '#F8F7F3' },
  { id: 'black', label: 'Czerń', background: '#000000', text: '#F8F7F3' },
  { id: 'purple', label: 'Fiolet', background: '#8F4BF0', text: '#FFFFFF' },
  { id: 'orange', label: 'Pomarańcz', background: '#F3350C', text: '#FFFFFF' },
]

export function getBrandColor(id: string): BrandColor {
  return BRAND_COLORS.find((c) => c.id === id) ?? BRAND_COLORS[0]
}

// A slide's role is derived from its position in the carousel, not
// stored — so it stays correct automatically as slides are added,
// removed, or reordered.
export type SlideRole = 'first' | 'inside' | 'last'

export function getSlideRole(index: number, total: number): SlideRole {
  if (index === 0) return 'first'
  if (index === total - 1) return 'last'
  return 'inside'
}

export interface SlideLayout {
  id: string
  label: string
  role: SlideRole
  textPosition: 'top' | 'center' | 'bottom'
  textAlign: 'left' | 'center'
  showCta?: boolean
  emphasizeLogo?: boolean
}

// Placeholder layout catalog: structural variants only (text position /
// alignment, an optional CTA line or an enlarged logo). Swap these for
// the real Figma-designed layouts once available — the id/role contract
// here (one catalog per slide role) is what the rest of the app relies
// on, so new layouts just need to be added to this list.
export const SLIDE_LAYOUTS: SlideLayout[] = [
  { id: 'cover-bottom', label: 'Okładka — tekst na dole', role: 'first', textPosition: 'bottom', textAlign: 'left' },
  { id: 'cover-center', label: 'Okładka — tekst na środku', role: 'first', textPosition: 'center', textAlign: 'center' },

  { id: 'inside-bottom', label: 'Tekst na dole', role: 'inside', textPosition: 'bottom', textAlign: 'left' },
  { id: 'inside-top', label: 'Tekst na górze', role: 'inside', textPosition: 'top', textAlign: 'left' },
  { id: 'inside-center', label: 'Tekst na środku', role: 'inside', textPosition: 'center', textAlign: 'center' },

  { id: 'outro-cta', label: 'Zakończenie — CTA', role: 'last', textPosition: 'center', textAlign: 'center', showCta: true },
  { id: 'outro-summary', label: 'Zakończenie — podsumowanie', role: 'last', textPosition: 'top', textAlign: 'left', emphasizeLogo: true },
]

export function getLayoutsForRole(role: SlideRole): SlideLayout[] {
  return SLIDE_LAYOUTS.filter((layout) => layout.role === role)
}

export function getLayoutById(id: string): SlideLayout {
  return SLIDE_LAYOUTS.find((layout) => layout.id === id) ?? SLIDE_LAYOUTS[0]
}

export function defaultLayoutIdForRole(role: SlideRole): string {
  return getLayoutsForRole(role)[0].id
}

export const MAX_SLIDES = 8
export const MIN_SLIDES = 1

// Animated story background (exported to MP4). One period = one full
// pass of the blobs along their paths; shorter period = faster motion.
export type TempoKey = 'calm' | 'medium' | 'lively'

export const TEMPOS: Record<TempoKey, { label: string; periodSeconds: number }> = {
  calm: { label: 'Spokojne', periodSeconds: 16 },
  medium: { label: 'Średnie', periodSeconds: 10 },
  lively: { label: 'Żywe', periodSeconds: 6 },
}

export const VIDEO_DURATIONS = [5, 10, 15, 30] as const

export interface AnimationSettings {
  tempo: TempoKey
  // Multiplier of the gradient blobs' opacity; 1 = exactly the Figma frame.
  intensity: number // 0.5–3
  durationSeconds: number
}

export const INITIAL_ANIMATION: AnimationSettings = {
  tempo: 'medium',
  intensity: 1.3,
  durationSeconds: 10,
}

// Story styles — the only options a story offers (no free colours or
// photos). Grouped by background; text and marker colours are fixed per
// style so every combination stays legible.
const VIOLET = '#8F4BF0'
const BLACK = '#000000'
const WHITE = '#FFFFFF'
// nuuvie.com page background — light, but deliberately not pure white.
const LIGHT = '#F8F7F3'

export type StoryStyleId =
  | 'violet'
  | 'violet-marker-white'
  | 'dark-marker-violet'
  | 'light-marker-violet'
  | 'light-marker-black'

export type StoryStyleGroup = 'violet' | 'dark' | 'light'

export interface StoryStyle {
  id: StoryStyleId
  group: StoryStyleGroup
  label: string
  // Violet uses the Figma gradient (animatable); dark/light are flat.
  background: { kind: 'gradient'; baseColor: string } | { kind: 'color'; color: string }
  textColor: string
  markerColor: string | null
  // The modular band (Figma "Instagram story - 2"): module tone at three
  // opacities and the dot colour.
  modules: { tone: string; alphas: readonly [number, number, number]; dot: string }
}

// Figma's #0B0B0B / #141414 / #1B1B1B on black, as white opacities.
const MODULES_ON_DARK = [11 / 255, 20 / 255, 27 / 255] as const
const MODULES_ON_VIOLET = [0.05, 0.09, 0.13] as const
const MODULES_ON_LIGHT = [0.035, 0.06, 0.085] as const

export const STORY_STYLE_GROUPS: Record<StoryStyleGroup, string> = {
  violet: 'Fiolet',
  dark: 'Ciemne',
  light: 'Jasne',
}

export const STORY_STYLES: StoryStyle[] = [
  {
    id: 'violet',
    group: 'violet',
    label: 'Biały tekst',
    background: { kind: 'gradient', baseColor: VIOLET },
    textColor: WHITE,
    markerColor: null,
    modules: { tone: WHITE, alphas: MODULES_ON_VIOLET, dot: WHITE },
  },
  {
    id: 'violet-marker-white',
    group: 'violet',
    label: 'Czarny na białym markerze',
    background: { kind: 'gradient', baseColor: VIOLET },
    textColor: BLACK,
    markerColor: WHITE,
    modules: { tone: WHITE, alphas: MODULES_ON_VIOLET, dot: WHITE },
  },
  {
    id: 'dark-marker-violet',
    group: 'dark',
    label: 'Fioletowy marker',
    background: { kind: 'color', color: BLACK },
    textColor: WHITE,
    markerColor: VIOLET,
    modules: { tone: WHITE, alphas: MODULES_ON_DARK, dot: VIOLET },
  },
  {
    id: 'light-marker-violet',
    group: 'light',
    label: 'Fioletowy marker',
    background: { kind: 'color', color: LIGHT },
    textColor: WHITE,
    markerColor: VIOLET,
    modules: { tone: BLACK, alphas: MODULES_ON_LIGHT, dot: VIOLET },
  },
  {
    id: 'light-marker-black',
    group: 'light',
    label: 'Czarny marker',
    background: { kind: 'color', color: LIGHT },
    textColor: WHITE,
    markerColor: BLACK,
    modules: { tone: BLACK, alphas: MODULES_ON_LIGHT, dot: BLACK },
  },
]

export function getStoryStyle(id: StoryStyleId): StoryStyle {
  return STORY_STYLES.find((style) => style.id === id) ?? STORY_STYLES[0]
}

export interface Slide {
  id: string
  layoutId: string
  text: string
  backgroundImage: string | null
  backgroundColorId: string
  // Story format only: motion on (gradient, module band and cursor move;
  // MP4 export) or off (still frame).
  animatedBackground: boolean
  // Story format only.
  storyStyle: StoryStyleId
  // The modular band at the top (Figma "Instagram story - 2").
  storyModules: boolean
  // Blinking block cursor after the last line of text.
  storyCursor: boolean
}

export interface PostState {
  format: FormatKey
  // Brand block (logo placeholder + eyebrow) is shared across every
  // slide of the carousel — everything else lives per-slide below.
  eyebrow: string
  slides: Slide[]
  activeSlideIndex: number
  animation: AnimationSettings
}

export const INITIAL_POST_STATE: PostState = {
  format: 'post',
  eyebrow: 'NUUVIE',
  slides: [
    {
      id: 'slide-1',
      layoutId: defaultLayoutIdForRole('first'),
      text: 'Wpisz treść posta tutaj',
      backgroundImage: null,
      backgroundColorId: 'graphite',
      animatedBackground: true,
      storyStyle: 'violet',
      storyModules: true,
      storyCursor: false,
    },
  ],
  activeSlideIndex: 0,
  animation: INITIAL_ANIMATION,
}

// Returns the animation settings when this story slide should move,
// otherwise null (still frame).
export function getActiveAnimation(
  format: FormatKey,
  slide: Slide,
  animation: AnimationSettings,
): AnimationSettings | null {
  return format === 'story' && slide.animatedBackground ? animation : null
}
