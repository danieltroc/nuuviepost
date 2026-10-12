import { toPng } from 'html-to-image'

export async function exportNodeToPng(node: HTMLElement, filename: string) {
  // pixelRatio: 1 keeps the output at the canvas's own CSS pixel size
  // (e.g. 1080x1920), independent of the device's screen density.
  const dataUrl = await toPng(node, { pixelRatio: 1, cacheBust: true })

  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}
