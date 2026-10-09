// Time bucketing for the admin growth charts, by the *viewer's* local clock.
// The database can't do this: it runs in UTC, so a race logged at 8pm
// Central would be filed under the next day (see get_race_log_bins() in
// supabase/schema.sql, which returns 15-minute UTC bins for exactly this
// reason).

const HOUR_MS = 60 * 60 * 1000

// '1d' plots today's 24 hours; every other range plots whole days.
export function bucketUnit(range) {
  return range === '1d' ? 'hour' : 'day'
}

function startOfBucket(value, unit) {
  const d = new Date(value)
  if (unit === 'hour') d.setMinutes(0, 0, 0)
  else d.setHours(0, 0, 0, 0)
  return d
}

function nextBucket(bucket, unit) {
  // Hours step in absolute time so DST changes neither skip nor repeat one;
  // days step on the calendar so a 23- or 25-hour day still lands on midnight.
  if (unit === 'hour') return new Date(bucket.getTime() + HOUR_MS)
  const d = new Date(bucket)
  d.setDate(d.getDate() + 1)
  return d
}

// The local buckets a range keyword ('1d', '7d', '30d', '90d', '1y', 'all')
// covers, oldest first: today's hours for '1d', otherwise days ending today.
// Mirrors resolve_growth_range_start() in schema.sql; 'all' starts at the
// earliest of `timestamps`.
export function growthBuckets(range, timestamps = []) {
  const today = startOfBucket(Date.now(), 'day')

  if (range === '1d') {
    const tomorrow = nextBucket(today, 'day')
    const hours = []
    for (let h = today; h < tomorrow; h = nextBucket(h, 'hour')) hours.push(h)
    return hours
  }

  const daysBack = n => {
    const d = new Date(today)
    d.setDate(d.getDate() - n)
    return d
  }

  let start
  switch (range) {
    case '7d': start = daysBack(6); break
    case '90d': start = daysBack(89); break
    case '1y':
      start = new Date(today)
      start.setFullYear(start.getFullYear() - 1)
      break
    case 'all': {
      const earliest = timestamps.reduce((min, t) => Math.min(min, new Date(t).getTime()), Infinity)
      start = Number.isFinite(earliest) ? startOfBucket(earliest, 'day') : today
      break
    }
    default: start = daysBack(29) // '30d' and unrecognized values
  }

  const days = []
  for (let d = start; d <= today; d = nextBucket(d, 'day')) days.push(d)
  return days
}

// Buckets that haven't started yet (the rest of today's hours) get null so
// the line stops at now instead of dropping to zero.
function blankFuture(bucket, count) {
  return bucket.getTime() > Date.now() ? null : count
}

// The summed `count` of the `entries` ({ at, count }) falling in each bucket.
export function countPerBucket(entries, buckets, unit) {
  const counts = new Map(buckets.map(b => [b.getTime(), 0]))
  for (const { at, count } of entries) {
    const key = startOfBucket(at, unit).getTime()
    if (counts.has(key)) counts.set(key, counts.get(key) + count)
  }
  return buckets.map(b => ({ bucket: b, count: blankFuture(b, counts.get(b.getTime())) }))
}

// How many of `timestamps` fall before the end of each bucket — a running
// total that includes everything before the range starts.
export function runningTotalPerBucket(timestamps, buckets, unit) {
  const times = timestamps.map(t => new Date(t).getTime()).sort((a, b) => a - b)
  let i = 0
  return buckets.map(b => {
    const end = nextBucket(b, unit).getTime()
    while (i < times.length && times[i] < end) i++
    return { bucket: b, count: blankFuture(b, i) }
  })
}
