import { useState } from 'react'
import { Sidebar } from './components/Layout/Sidebar'
import { PreviewPane } from './components/Layout/PreviewPane'
import { INITIAL_POST_STATE, type PostState, type Slide } from './types'
import { addSlide, moveSlide, removeSlide } from './lib/slides'
import './App.css'

function App() {
  const [post, setPost] = useState<PostState>(INITIAL_POST_STATE)

  const updatePost = (patch: Partial<PostState>) => {
    setPost((prev) => ({ ...prev, ...patch }))
  }

  const updateActiveSlide = (patch: Partial<Slide>) => {
    setPost((prev) => ({
      ...prev,
      slides: prev.slides.map((slide, index) =>
        index === prev.activeSlideIndex ? { ...slide, ...patch } : slide,
      ),
    }))
  }

  const handleAddSlide = () => {
    setPost((prev) => {
      const { slides, activeIndex } = addSlide(prev.slides, prev.activeSlideIndex)
      return { ...prev, slides, activeSlideIndex: activeIndex }
    })
  }

  const handleRemoveSlide = (index: number) => {
    setPost((prev) => {
      const { slides, activeIndex } = removeSlide(prev.slides, index)
      return { ...prev, slides, activeSlideIndex: activeIndex }
    })
  }

  const handleMoveSlide = (index: number, direction: -1 | 1) => {
    setPost((prev) => {
      const { slides, activeIndex } = moveSlide(prev.slides, index, direction)
      return { ...prev, slides, activeSlideIndex: activeIndex }
    })
  }

  return (
    <div className="app">
      <Sidebar
        post={post}
        onChangePost={updatePost}
        onChangeActiveSlide={updateActiveSlide}
      />
      <PreviewPane
        post={post}
        onSelectSlide={(activeSlideIndex) => updatePost({ activeSlideIndex })}
        onAddSlide={handleAddSlide}
        onRemoveSlide={handleRemoveSlide}
        onMoveSlide={handleMoveSlide}
      />
    </div>
  )
}

export default App
