const LIMA = 'America/Lima'

export function limaToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: LIMA, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const value = (part: string) => Number(parts.find((item) => item.type === part)?.value)
  return { year: value('year'), month: value('month'), day: value('day') }
}

function occurrence(year: number, month: number, day: number) {
  const adjustedDay = month === 2 && day === 29 && !(
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  ) ? 28 : day
  return Date.UTC(year, month - 1, adjustedDay)
}

export function daysUntilBirthday(month: number, day: number, today: { year: number; month: number; day: number }) {
  const start = Date.UTC(today.year, today.month - 1, today.day)
  let next = occurrence(today.year, month, day)
  if (next < start) next = occurrence(today.year + 1, month, day)
  return Math.round((next - start) / 86_400_000)
}
