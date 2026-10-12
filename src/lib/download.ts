export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.click()
  // Give the browser a moment to start the download before releasing it.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
