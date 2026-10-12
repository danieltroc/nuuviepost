import { getFontEmbedCSS, toPng } from 'html-to-image'
import { downloadBlob } from './download'

// Editor-only helpers inside a slide (e.g. "add an image" placeholders)
// carry this attribute and are left out of every export.
const isExported = (node: Node) =>
  !(node instanceof HTMLElement && node.hasAttribute('data-editor-only'))

// Safari (WebKit) rasterises the DOM snapshot before the images and fonts
// embedded in it have finished decoding, so a first pass can come out
// without photos or in a fallback font. Chromium and Firefox are fine.
const isWebKit =
  /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Edg\//.test(navigator.userAgent)
const MIN_PASSES = 3
const MAX_PASSES = 8
const PASS_PAUSE_MS = 120

const snapshot = (node: HTMLElement, fontEmbedCSS?: string) =>
  toPng(node, { pixelRatio: 1, filter: isExported, fontEmbedCSS })

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Renders a slide to PNG at its own CSS pixel size (1080×1440 or
// 1080×1920), independent of the screen's pixel density.
async function renderPng(node: HTMLElement, fontEmbedCSS?: string): Promise<Blob> {
  // A story is a single canvas — export its pixels directly. (Going
  // through a DOM snapshot would also come out empty in Safari.)
  const canvas = node.firstElementChild
  if (canvas instanceof HTMLCanvasElement) {
    return new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Nie udało się zapisać obrazu.'))),
        'image/png',
      ),
    )
  }

  let dataUrl = await snapshot(node, fontEmbedCSS)
  if (isWebKit) {
    // Repeat (with a short pause for decoding) until two passes in a row
    // are identical, i.e. everything embedded in the snapshot is drawn.
    for (let pass = 2; pass <= MAX_PASSES; pass++) {
      await pause(PASS_PAUSE_MS)
      const next = await snapshot(node, fontEmbedCSS)
      const settled = next === dataUrl
      dataUrl = next
      if (settled && pass >= MIN_PASSES) break
    }
  }
  return (await fetch(dataUrl)).blob()
}

export async function exportNodeToPng(node: HTMLElement, filename: string) {
  downloadBlob(await renderPng(node), filename)
}

// Exports several slides one after another. The embedded-font CSS is
// built once and reused; a short pause between files keeps browsers from
// dropping downloads that start too close together.
export async function exportNodesToPng(
  items: Array<{ node: HTMLElement; filename: string }>,
  onProgress?: (done: number) => void,
) {
  if (!items.length) return
  const fontEmbedCSS = await getFontEmbedCSS(items[0].node)
  for (let i = 0; i < items.length; i++) {
    downloadBlob(await renderPng(items[i].node, fontEmbedCSS), items[i].filename)
    onProgress?.(i + 1)
    await new Promise((resolve) => setTimeout(resolve, 350))
  }
}
