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

const COUNTER_KEY = 'nuuviepost:export-count'

// A running number for exported files, remembered in this browser across
// visits: 001, 002, … Every export gets a new one, so a file never has
// the same name as an earlier download (browsers then silently save
// "name 2" next to the old file, which is easy to mix up).
export function nextExportNumber(): string {
  let count: number
  try {
    count = (Number(localStorage.getItem(COUNTER_KEY)) || 0) + 1
    localStorage.setItem(COUNTER_KEY, String(count))
  } catch {
    // Storage unavailable (e.g. private mode): fall back to the time of day.
    const now = new Date()
    count = now.getHours() * 10000 + now.getMinutes() * 100 + now.getSeconds()
  }
  return String(count).padStart(3, '0')
}
