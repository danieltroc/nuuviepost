// Saves a generated file. The link is attached to the document while it is
// clicked (Safari ignores clicks on detached links in some versions), and
// the object URL is kept alive for a few minutes: Safari may first ask
// "allow downloads from this site?" and only then start reading it.
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000)
}
