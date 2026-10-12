import {
  MAX_SLIDES,
  MIN_SLIDES,
  defaultLayoutIdForRole,
  getLayoutById,
  getSlideRole,
  type Slide,
} from '../types'

let nextSlideId = 1
function createSlideId() {
  return `slide-${Date.now()}-${nextSlideId++}`
}

export function createSlide(overrides: Partial<Slide> = {}): Slide {
  return {
    id: createSlideId(),
    layoutId: defaultLayoutIdForRole('inside'),
    text: '',
    backgroundImage: null,
    backgroundColorId: 'graphite',
    animatedBackground: true,
    storyStyle: 'violet',
    storyModules: true,
    storyCursor: false,
    ...overrides,
  }
}

// A slide's role (first/inside/last) is derived from its position, so a
// layout chosen while a slide was e.g. "last" can become invalid once
// another slide is added after it. Re-point any now-invalid layoutId to
// the default for the slide's current role. Call this after every
// structural change to the slides array (add/remove/move).
export function normalizeSlideLayouts(slides: Slide[]): Slide[] {
  return slides.map((slide, index) => {
    const role = getSlideRole(index, slides.length)
    const layout = getLayoutById(slide.layoutId)
    if (layout.role === role) return slide
    return { ...slide, layoutId: defaultLayoutIdForRole(role) }
  })
}

interface SlidesResult {
  slides: Slide[]
  activeIndex: number
}

export function addSlide(slides: Slide[], afterIndex: number): SlidesResult {
  if (slides.length >= MAX_SLIDES) return { slides, activeIndex: afterIndex }

  const insertAt = afterIndex + 1
  const next = [...slides]
  // The new slide continues the look of the one it's added after.
  const { backgroundColorId, animatedBackground, storyStyle, storyModules, storyCursor } =
    slides[afterIndex]
  next.splice(
    insertAt,
    0,
    createSlide({ backgroundColorId, animatedBackground, storyStyle, storyModules, storyCursor }),
  )

  return { slides: normalizeSlideLayouts(next), activeIndex: insertAt }
}

export function removeSlide(slides: Slide[], index: number): SlidesResult {
  if (slides.length <= MIN_SLIDES) return { slides, activeIndex: index }

  const next = slides.filter((_, i) => i !== index)
  const activeIndex = Math.min(index, next.length - 1)

  return { slides: normalizeSlideLayouts(next), activeIndex }
}

export function moveSlide(slides: Slide[], index: number, direction: -1 | 1): SlidesResult {
  const target = index + direction
  if (target < 0 || target >= slides.length) return { slides, activeIndex: index }

  const next = [...slides]
  ;[next[index], next[target]] = [next[target], next[index]]

  return { slides: normalizeSlideLayouts(next), activeIndex: target }
}
