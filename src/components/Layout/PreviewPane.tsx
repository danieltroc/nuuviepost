import { useEffect, useRef, useState } from 'react'
import { PostCanvas } from '../Preview/PostCanvas'
import { SlideStrip } from './SlideStrip'
import { exportNodeToPng } from '../../hooks/useImageExport'
import { exportStoryVideo, VIDEO_FPS } from '../../lib/exportStoryVideo'
import { getStoryContent } from '../../lib/storyRenderer'
import { downloadBlob } from '../../lib/download'
import { FORMATS, getActiveAnimation, type PostState } from '../../types'
import './PreviewPane.css'

interface PreviewPaneProps {
  post: PostState
  onSelectSlide: (index: number) => void
  onAddSlide: () => void
  onRemoveSlide: (index: number) => void
  onMoveSlide: (index: number, direction: -1 | 1) => void
}

export function PreviewPane({
  post,
  onSelectSlide,
  onAddSlide,
  onRemoveSlide,
  onMoveSlide,
}: PreviewPaneProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const [videoProgress, setVideoProgress] = useState<number | null>(null)
  const [replayKey, setReplayKey] = useState(0)

  const { width, height } = FORMATS[post.format]
  const activeSlide = post.slides[post.activeSlideIndex]
  const animation = getActiveAnimation(post.format, activeSlide, post.animation)
  const storyContent = getStoryContent(activeSlide, post.animation.intensity)
  const isBusy = isExporting || videoProgress !== null

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const observer = new ResizeObserver((entries) => {
      const availableWidth = entries[0].contentRect.width
      const availableHeight = entries[0].contentRect.height
      if (availableWidth <= 0 || availableHeight <= 0) return
      setScale(Math.min(availableWidth / width, availableHeight / height, 1))
    })

    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [width, height])

  const handleDownload = async () => {
    if (!canvasRef.current) return
    setIsExporting(true)
    try {
      const filename =
        post.slides.length > 1
          ? `post-${post.format}-slide-${post.activeSlideIndex + 1}.png`
          : `post-${post.format}.png`
      await exportNodeToPng(canvasRef.current, filename)
    } catch (error) {
      console.error('Nie udało się wyeksportować obrazu', error)
      window.alert('Nie udało się wyeksportować obrazu. Spróbuj ponownie.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadVideo = async () => {
    if (!animation) return
    setVideoProgress(0)
    try {
      const blob = await exportStoryVideo({
        width,
        height,
        content: storyContent,
        settings: animation,
        onProgress: setVideoProgress,
      })
      const suffix = post.slides.length > 1 ? `-slide-${post.activeSlideIndex + 1}` : ''
      downloadBlob(blob, `story${suffix}.mp4`)
    } catch (error) {
      console.error('Nie udało się wyeksportować wideo', error)
      window.alert(
        error instanceof Error ? error.message : 'Nie udało się wyeksportować wideo.',
      )
    } finally {
      setVideoProgress(null)
    }
  }

  return (
    <div className="preview-pane">
      <div ref={wrapperRef} className="preview-pane__stage">
        <div
          className="preview-pane__scaler"
          style={{ width: width * scale, height: height * scale }}
        >
          <div
            style={{
              width,
              height,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <PostCanvas
              ref={canvasRef}
              format={post.format}
              eyebrow={post.eyebrow}
              slide={activeSlide}
              slideIndex={post.activeSlideIndex}
              slideCount={post.slides.length}
              storyContent={storyContent}
              animation={animation}
              replayKey={replayKey}
            />
          </div>

          {/* Editor-only hint — sibling of the exported node, never
              captured by html-to-image. Skipped for stories, whose text
              sits exactly where the hint would. */}
          {!activeSlide.backgroundImage && post.format !== 'story' && (
            <div className="preview-pane__hint">Kliknij "Wybierz plik", by dodać zdjęcie tła</div>
          )}
        </div>
      </div>

      <SlideStrip
        slides={post.slides}
        activeIndex={post.activeSlideIndex}
        onSelect={onSelectSlide}
        onAdd={onAddSlide}
        onRemove={onRemoveSlide}
        onMove={onMoveSlide}
      />

      <div className="preview-pane__footer">
        <span className="preview-pane__dimensions">
          {width} × {height}px
        </span>
        <div className="preview-pane__actions">
          {animation && (
            <button
              type="button"
              className="preview-pane__download preview-pane__download--secondary"
              onClick={() => setReplayKey((key) => key + 1)}
              title="Odtwórz podgląd od początku, tak jak zaczyna się wideo"
            >
              ↺ Od początku
            </button>
          )}
          {animation && (
            <button
              type="button"
              className="preview-pane__download"
              onClick={handleDownloadVideo}
              disabled={isBusy}
              title={`MP4 H.264, ${width}×${height}, ${VIDEO_FPS} fps, ${animation.durationSeconds} s`}
            >
              {videoProgress !== null
                ? `Renderowanie… ${Math.round(videoProgress * 100)}%`
                : 'Pobierz MP4'}
            </button>
          )}
          <button
            type="button"
            className={`preview-pane__download ${animation ? 'preview-pane__download--secondary' : ''}`}
            onClick={handleDownload}
            disabled={isBusy}
          >
            {isExporting ? 'Generowanie…' : animation ? 'Pobierz PNG (klatka)' : 'Pobierz PNG'}
          </button>
        </div>
      </div>
    </div>
  )
}
