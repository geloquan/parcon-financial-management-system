// ─── Date utilities ───────────────────────────────────────────────────────────

export const formatDateTimeLocal = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export const formatDateOnly = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const formatDateTimeDisplay = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Smart relative time: covers seconds → weeks → months → years, plus future dates.
export const formatRelative = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'unknown time'
  const diff = Math.floor((Date.now() - date.getTime()) / 1000) // positive = past
  const abs = Math.abs(diff)
  const future = diff < 0

  if (abs < 45)     return 'just now'
  if (abs < 90)     return future ? 'in a minute'  : 'a minute ago'
  if (abs < 3000) {
    const m = Math.round(abs / 60)
    return future ? `in ${m}m` : `${m}m ago`
  }
  if (abs < 5400)   return future ? 'in an hour'   : 'an hour ago'
  if (abs < 79200) {
    const h = Math.round(abs / 3600)
    return future ? `in ${h}h` : `${h}h ago`
  }
  if (abs < 129600) return future ? 'tomorrow'     : 'yesterday'
  if (abs < 604800) {
    const d = Math.round(abs / 86400)
    return future ? `in ${d} days` : `${d} days ago`
  }
  if (abs < 1209600) return future ? 'in a week'   : 'a week ago'
  if (abs < 2592000) {
    const w = Math.round(abs / 604800)
    return future ? `in ${w} weeks` : `${w} weeks ago`
  }
  if (abs < 5184000) return future ? 'in a month'  : 'a month ago'
  if (abs < 31536000) {
    const mo = Math.round(abs / 2592000)
    return future ? `in ${mo} months` : `${mo} months ago`
  }
  if (abs < 63072000) return future ? 'in a year'  : 'a year ago'
  const y = Math.round(abs / 31536000)
  return future ? `in ${y} years` : `${y} years ago`
}

// For schedule dates (date-only strings like "2025-05-21"):
// Shows "Today", "Yesterday", "Tomorrow", short weekday within the week, or compact date.
// IMPORTANT: append T00:00:00 before parsing a date-only string to avoid UTC midnight
// shifting the date one day back in UTC+8 (Philippine time).
export const formatScheduleDate = (value: string | Date) => {
  const date =
    value instanceof Date
      ? value
      : new Date(typeof value === 'string' && value.length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(date.getTime())) return String(value)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86_400_000)

  if (diffDays === 0)  return 'Today'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays === 1)  return 'Tomorrow'

  const month = date.toLocaleDateString('en-PH', { month: 'short' })
  const day   = date.getDate()

  if (Math.abs(diffDays) < 7) {
    const weekday = date.toLocaleDateString('en-PH', { weekday: 'short' })
    return `${weekday}, ${month} ${day}`
  }

  const year = date.getFullYear()
  return year === new Date().getFullYear()
    ? `${month} ${day}`
    : `${month} ${day}, ${year}`
}

export const formatCompactDate = (value: string | Date) => {
  const date =
    value instanceof Date
      ? value
      : new Date(typeof value === 'string' && value.length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(date.getTime())) return String(value)
  const month = date.toLocaleDateString('en-PH', { month: 'short' })
  const day   = date.getDate()
  const year  = date.getFullYear()
  return year === new Date().getFullYear()
    ? `${month} ${day}`
    : `${month} ${day}, ${year}`
}
