import { useCallback, useEffect, useRef, useState } from 'react'
import { PostCanvas } from '../Preview/PostCanvas'
import { SlideStrip } from './SlideStrip'
import { Icon } from '../ui/controls'
import { exportNodeToPng, exportNodesToPng } from '../../lib/exportPng'
import { exportStoryVideo, VIDEO_FPS } from '../../lib/exportStoryVideo'
import { getStoryContent } from '../../lib/storyRenderer'
import { downloadBlob, nextExportNumber } from '../../lib/download'
import { FORMATS, getActiveAnimation, type PostState } from '../../types'

interface StageProps {
  post: PostState
  onSelectSlide: (index: number) => void
  onAddSlide: () => void
  onRemoveSlide: (index: number) => void
  onMoveSlide: (index: number, direction: -1 | 1) => void
}

type Busy = null | { kind: 'png' } | { kind: 'all'; done: number } | { kind: 'video'; progress: number }

const pad = (n: number) => String(n).padStart(2, '0')

export function Stage({ post, onSelectSlide, onAddSlide, onRemoveSlide, onMoveSlide }: StageProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const slideNodes = useRef(new Map<string, HTMLDivElement>())
  const [scale, setScale] = useState(0.4)
  const [busy, setBusy] = useState<Busy>(null)
  const [replayKey, setReplayKey] = useState(0)

  const { width, height } = FORMATS[post.format]
  const isStory = post.format === 'story'
  const count = post.slides.length
  const activeSlide = post.slides[post.activeSlideIndex]
  const animation = getActiveAnimation(post.format, activeSlide, post.animation)
  // nuuvie-story-012.mp4, nuuvie-karuzela-013-02.png: a running export
  // number, plus the slide number when there are several slides.
  const baseName = isStory ? 'nuuvie-story' : 'nuuvie-karuzela'
  const slideSuffix = count > 1 ? `-${pad(post.activeSlideIndex + 1)}` : ''
  const fileName = (extension: string) =>
    `${baseName}-${nextExportNumber()}${slideSuffix}.${extension}`

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const observer = new ResizeObserver((entries) => {
      const { width: availableWidth, height: availableHeight } = entries[0].contentRect
      if (availableWidth <= 0 || availableHeight <= 0) return
      setScale(Math.min(availableWidth / width, availableHeight / height, 1))
    })

    observer.observe(viewport)
    return () => observer.disconnect()
  }, [width, height])

  const registerNode = useCallback((id: string, node: HTMLDivElement | null) => {
    if (node) slideNodes.current.set(id, node)
    else slideNodes.current.delete(id)
  }, [])

  const run = async (start: Busy, task: () => Promise<void>, failure: string) => {
    setBusy(start)
    try {
      await task()
    } catch (error) {
      console.error(failure, error)
      window.alert(error instanceof Error && error.message ? error.message : failure)
    } finally {
      setBusy(null)
    }
  }

  const downloadPng = () =>
    run(
      { kind: 'png' },
      async () => {
        if (canvasRef.current) await exportNodeToPng(canvasRef.current, fileName('png'))
      },
      'Nie udało się wyeksportować obrazu.',
    )

  const downloadAll = () =>
    run(
      { kind: 'all', done: 0 },
      () => {
        // One export number for the whole set, so the slides sort together.
        const batch = nextExportNumber()
        return exportNodesToPng(
          post.slides.flatMap((slide, index) => {
            const node = slideNodes.current.get(slide.id)
            return node ? [{ node, filename: `${baseName}-${batch}-${pad(index + 1)}.png` }] : []
          }),
          (done) => setBusy({ kind: 'all', done }),
        )
      },
      'Nie udało się wyeksportować slajdów.',
    )

  const downloadVideo = () =>
    run(
      { kind: 'video', progress: 0 },
      async () => {
        if (!animation) return
        const blob = await exportStoryVideo({
          width,
          height,
          content: getStoryContent(activeSlide, post.animation.intensity),
          settings: animation,
          onProgress: (progress) => setBusy({ kind: 'video', progress }),
        })
        downloadBlob(blob, fileName('mp4'))
      },
      'Nie udało się wyeksportować wideo.',
    )

  const isBusy = busy !== null

  return (
    <main className="stage">
      <header className="stage__bar">
        <div className="stage__meta floating">
          <span className="stage__counter">
            {pad(post.activeSlideIndex + 1)}
            <span className="stage__counter-total"> / {pad(count)}</span>
          </span>
          <span className="stage__size">
            {width} × {height}
          </span>
        </div>

        <div className="stage__actions floating">
          {animation && (
            <button
              type="button"
              className="btn btn--icon"
              onClick={() => setReplayKey((key) => key + 1)}
              aria-label="Odtwórz od początku"
              title="Odtwórz podgląd od początku, tak jak zaczyna się wideo"
            >
              <Icon name="replay" />
            </button>
          )}

          <button type="button" className="btn" onClick={downloadPng} disabled={isBusy}>
            <Icon name="download" />
            {busy?.kind === 'png' ? 'Generowanie…' : animation ? 'PNG (klatka)' : 'PNG'}
          </button>

          {!isStory && count > 1 && (
            <button type="button" className="btn btn--primary" onClick={downloadAll} disabled={isBusy}>
              <Icon name="download" />
              {busy?.kind === 'all' ? `Eksport ${busy.done}/${count}…` : `Wszystkie (${count})`}
            </button>
          )}

          {animation && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={downloadVideo}
              disabled={isBusy}
              title={`MP4 H.264, ${width}×${height}, ${VIDEO_FPS} fps, ${animation.durationSeconds} s`}
            >
              <Icon name="download" />
              {busy?.kind === 'video' ? `Renderowanie ${Math.round(busy.progress * 100)}%` : 'MP4'}
            </button>
          )}
        </div>
      </header>

      <div ref={viewportRef} className="stage__viewport">
        <div className="stage__frame" style={{ width: width * scale, height: height * scale }}>
          <div className="stage__scaler" style={{ width, height, transform: `scale(${scale})` }}>
            <PostCanvas
              ref={canvasRef}
              format={post.format}
              slide={activeSlide}
              intensity={post.animation.intensity}
              animation={animation}
              replayKey={replayKey}
            />
          </div>
        </div>
      </div>

      <SlideStrip
        format={post.format}
        slides={post.slides}
        activeIndex={post.activeSlideIndex}
        intensity={post.animation.intensity}
        onSelect={onSelectSlide}
        onAdd={onAddSlide}
        onRemove={onRemoveSlide}
        onMove={onMoveSlide}
        registerNode={registerNode}
      />
    </main>
  )
}
