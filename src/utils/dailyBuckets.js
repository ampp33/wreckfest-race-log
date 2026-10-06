// Per-day bucketing for the admin growth charts, by the *viewer's* local
// day. The database can't do this: it runs in UTC, so a race logged at 8pm
// Central would be filed under the next day (see get_race_log_times() in
// supabase/schema.sql, which returns raw timestamps for exactly this reason).

function startOfLocalDay(value) {
  const d = new Date(value)
  d.setHours(0, 0, 0, 0)
  return d
}

// The local days a range keyword ('1d', '7d', '30d', '90d', '1y', 'all')
// covers, oldest first, ending today. Mirrors resolve_growth_range_start() in
// schema.sql; 'all' starts at the earliest of `timestamps`.
export function growthDays(range, timestamps = []) {
  const today = startOfLocalDay(Date.now())
  const daysBack = n => {
    const d = new Date(today)
    d.setDate(d.getDate() - n)
    return d
  }

  let start
  switch (range) {
    case '1d': start = daysBack(1); break
    case '7d': start = daysBack(6); break
    case '90d': start = daysBack(89); break
    case '1y':
      start = new Date(today)
      start.setFullYear(start.getFullYear() - 1)
      break
    case 'all': {
      const earliest = timestamps.reduce((min, t) => Math.min(min, new Date(t).getTime()), Infinity)
      start = Number.isFinite(earliest) ? startOfLocalDay(earliest) : today
      break
    }
    default: start = daysBack(29) // '30d' and unrecognized values
  }

  const days = []
  for (const d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d))
  }
  return days
}

// How many of `timestamps` fall on each of `days`.
export function countPerDay(timestamps, days) {
  const counts = new Map(days.map(day => [day.getTime(), 0]))
  for (const t of timestamps) {
    const key = startOfLocalDay(t).getTime()
    if (counts.has(key)) counts.set(key, counts.get(key) + 1)
  }
  return days.map(day => ({ day, count: counts.get(day.getTime()) }))
}

// How many of `timestamps` fall on or before each of `days` — a running
// total that includes everything before the range starts.
export function runningTotalPerDay(timestamps, days) {
  const times = timestamps.map(t => new Date(t).getTime()).sort((a, b) => a - b)
  let i = 0
  return days.map(day => {
    const nextDay = new Date(day)
    nextDay.setDate(nextDay.getDate() + 1)
    while (i < times.length && times[i] < nextDay.getTime()) i++
    return { day, count: i }
  })
}
