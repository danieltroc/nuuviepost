import { PHOTO_PRESETS } from './lib/photos'

export const FORMATS = {
  post: { label: 'Karuzela / post', ratio: '3:4', width: 1080, height: 1440 },
  story: { label: 'Story', ratio: '9:16', width: 1080, height: 1920 },
} as const

export type FormatKey = keyof typeof FORMATS

export const MAX_SLIDES = 8
export const MIN_SLIDES = 1

// Carousel layouts, 1:1 from the Figma section "Figma" (3469:204), all
// designed for 1080×1440:
//   cover   — frame "73": headline on tilted violet bars, cut-out photo,
//             subtitle and description
//   feature — frames "74"–"84": screenshot on top, coloured panel with a
//             headline, emoji sticker on the seam
//   text    — frame "82": big headline, a sentence with a highlighted
//             word, Nuuvie logo
export type CarouselLayout = 'cover' | 'feature' | 'text'

export const CAROUSEL_LAYOUTS: Record<CarouselLayout, { label: string; hint: string }> = {
  cover: { label: 'Okładka', hint: 'Nagłówek na paskach + zdjęcie' },
  feature: { label: 'Zrzut + panel', hint: 'Obraz, kolorowy panel, naklejka' },
  text: { label: 'Tekst + logo', hint: 'Nagłówek, zdanie z markerem' },
}

export interface PanelColor {
  id: string
  label: string
  background: string
  text: string
}

// Panel colours of the feature slides in Figma.
export const PANEL_COLORS: PanelColor[] = [
  { id: 'yellow', label: 'Żółty', background: '#F4ED6C', text: '#070707' },
  { id: 'green', label: 'Zielony', background: '#0DAA58', text: '#070707' },
  { id: 'blue', label: 'Niebieski', background: '#7FA7F2', text: '#070707' },
  { id: 'orange', label: 'Pomarańczowy', background: '#FA956B', text: '#070707' },
  { id: 'black', label: 'Czarny', background: '#131313', text: '#FFFFFF' },
]

export function getPanelColor(id: string): PanelColor {
  return PANEL_COLORS.find((c) => c.id === id) ?? PANEL_COLORS[0]
}

export type CoverStyleId = 'light' | 'dark' | 'violet'

export interface CoverStyle {
  id: CoverStyleId
  label: string
  background: string
  // The bars behind the headline and the headline on them.
  bar: string
  headline: string
  // Subtitle and description.
  text: string
}

// Colour versions of the cover. "light" is the Figma frame; the other two
// reuse its palette (violet #8F4BF0, black #070707).
export const COVER_STYLES: CoverStyle[] = [
  { id: 'light', label: 'Jasna', background: '#F8F7F3', bar: '#8F4BF0', headline: '#FFFFFF', text: '#070707' },
  { id: 'dark', label: 'Czarna', background: '#070707', bar: '#8F4BF0', headline: '#FFFFFF', text: '#FFFFFF' },
  { id: 'violet', label: 'Fioletowa', background: '#8F4BF0', bar: '#FFFFFF', headline: '#070707', text: '#FFFFFF' },
]

export function getCoverStyle(id: CoverStyleId): CoverStyle {
  return COVER_STYLES.find((style) => style.id === id) ?? COVER_STYLES[0]
}

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
  // Main text: the headline of a carousel slide / the text of a story.
  text: string

  // --- Carousel (3:4) ---
  layout: CarouselLayout
  // cover: line under the headline block; text: the sentence, where
  // *asterisks* mark the word(s) on the violet marker.
  subtitle: string
  // cover only: small paragraph under the subtitle, and the colour version.
  description: string
  coverStyle: CoverStyleId
  // cover: cut-out photo — a preset from lib/photos or an uploaded
  // transparent PNG (data URL); feature: screenshot.
  image: string | null
  imageFlip: boolean
  // feature: horizontal crop position of the screenshot, 0–100 (%).
  imageX: number
  // feature: panel colour and the emoji on the sticker ('' = no sticker).
  panelColorId: string
  emoji: string

  // --- Story (9:16) ---
  // Motion on (gradient, module band and cursor move; MP4 export) or off
  // (still frame).
  animatedBackground: boolean
  storyStyle: StoryStyleId
  // The modular band at the top (Figma "Instagram story - 2").
  storyModules: boolean
  // Blinking block cursor after the last line of text.
  storyCursor: boolean
}

export interface PostState {
  format: FormatKey
  slides: Slide[]
  activeSlideIndex: number
  animation: AnimationSettings
}

export const SLIDE_DEFAULTS: Omit<Slide, 'id'> = {
  text: '',
  layout: 'feature',
  subtitle: '',
  description: '',
  coverStyle: 'light',
  image: null,
  imageFlip: false,
  imageX: 50,
  panelColorId: 'yellow',
  emoji: '👌',
  animatedBackground: true,
  storyStyle: 'violet',
  storyModules: true,
  storyCursor: false,
}

export const INITIAL_POST_STATE: PostState = {
  format: 'post',
  slides: [
    {
      ...SLIDE_DEFAULTS,
      id: 'slide-1',
      layout: 'cover',
      text: 'Tytuł, który\nzatrzyma\nkciuk',
      subtitle: 'Temat karuzeli.\nW dwóch liniach.',
      description: 'Krótki opis tego, co czeka na kolejnych slajdach',
      image: PHOTO_PRESETS[0].url,
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
