import { getFontEmbedCSS, toPng } from 'html-to-image'
import { downloadBlob } from './download'

// Editor-only helpers inside a slide (e.g. "add an image" placeholders)
// carry this attribute and are left out of every export.
const isExported = (node: Node) =>
  !(node instanceof HTMLElement && node.hasAttribute('data-editor-only'))

// Renders a slide node to PNG at its own CSS pixel size (1080×1440 or
// 1080×1920), independent of the screen's pixel density.
async function renderPng(node: HTMLElement, fontEmbedCSS?: string): Promise<Blob> {
  const dataUrl = await toPng(node, {
    pixelRatio: 1,
    cacheBust: true,
    filter: isExported,
    fontEmbedCSS,
  })
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
