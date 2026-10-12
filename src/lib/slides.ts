import { MAX_SLIDES, MIN_SLIDES, SLIDE_DEFAULTS, type Slide } from '../types'

let nextSlideId = 1
function createSlideId() {
  return `slide-${Date.now()}-${nextSlideId++}`
}

interface SlidesResult {
  slides: Slide[]
  activeIndex: number
}

// Adds a slide after `afterIndex`. It continues the look of the slide it
// follows (story style, panel colour) but starts with empty content; in a
// carousel a new slide is a "feature" slide, the layout of every inner
// slide in the Figma design.
export function addSlide(slides: Slide[], afterIndex: number): SlidesResult {
  if (slides.length >= MAX_SLIDES) return { slides, activeIndex: afterIndex }

  const previous = slides[afterIndex]
  const slide: Slide = {
    ...SLIDE_DEFAULTS,
    id: createSlideId(),
    panelColorId: previous.panelColorId,
    animatedBackground: previous.animatedBackground,
    storyStyle: previous.storyStyle,
    storyModules: previous.storyModules,
    storyCursor: previous.storyCursor,
  }

  const insertAt = afterIndex + 1
  const next = [...slides]
  next.splice(insertAt, 0, slide)
  return { slides: next, activeIndex: insertAt }
}

export function removeSlide(slides: Slide[], index: number): SlidesResult {
  if (slides.length <= MIN_SLIDES) return { slides, activeIndex: index }

  const next = slides.filter((_, i) => i !== index)
  return { slides: next, activeIndex: Math.min(index, next.length - 1) }
}

export function moveSlide(slides: Slide[], index: number, direction: -1 | 1): SlidesResult {
  const target = index + direction
  if (target < 0 || target >= slides.length) return { slides, activeIndex: index }

  const next = [...slides]
  ;[next[index], next[target]] = [next[target], next[index]]
  return { slides: next, activeIndex: target }
}
