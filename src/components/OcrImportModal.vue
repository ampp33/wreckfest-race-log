<template>
  <div
    v-if="open"
    class="fixed inset-0 z-40 flex items-start sm:items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-hidden"
    @mousedown.self="onCancel"
    @keydown.esc.stop="onCancel"
  >
    <div
      class="bg-brand-bg dark:bg-brand-surface-dark rounded-lg shadow-xl w-full max-w-2xl p-4 sm:p-6 max-h-[92svh] sm:max-h-[95vh] overflow-y-auto overscroll-contain border border-brand-border dark:border-brand-border-dark"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ocr-import-title"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 id="ocr-import-title" class="font-display font-black tracking-tighter leading-none text-display-sm text-brand-text dark:text-brand-text-dark">
          Import from <em class="signal">screenshot</em>
        </h2>
        <button
          type="button"
          class="text-brand-muted dark:text-brand-muted-dark hover:text-brand-text dark:hover:text-brand-text-dark"
          aria-label="Close"
          @click="onCancel"
        >
          ✕
        </button>
      </div>

      <!-- Input stage -->
      <div v-if="stage === 'input'">
        <div
          class="rounded border-2 border-dashed border-brand-border dark:border-brand-border-dark p-8 text-center cursor-pointer hover:border-brand-accent transition-colors"
          tabindex="0"
          @click="$refs.fileInput.click()"
          @keydown.enter="$refs.fileInput.click()"
          @dragover.prevent
          @drop.prevent="onDrop"
          @paste="onPaste"
        >
          <p class="font-body text-[15px] text-brand-text dark:text-brand-text-dark mb-1">
            Paste (Ctrl+V), drop, or click to choose the Wreckfest results screenshot
          </p>
          <p class="font-body text-[13px] text-brand-muted dark:text-brand-muted-dark">
            Works with Custom Event or Multiplayer results screens
          </p>
        </div>

        <button
          type="button"
          class="mt-3 w-full font-body text-[15px] text-brand-accent hover:underline"
          @click.stop="$refs.cameraInput.click()"
        >
          📷 Or take a photo with your phone's camera
        </button>

        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileInputChange" />
        <input ref="cameraInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onFileInputChange" />
        <p v-if="errorMessage" class="mt-3 text-sm text-red-600">{{ errorMessage }}</p>
      </div>

      <!-- Processing stage -->
      <div v-else-if="stage === 'processing'" class="py-10 text-center">
        <p class="font-body text-[15px] text-brand-text dark:text-brand-text-dark">{{ statusMessage }}</p>
      </div>

      <!-- Error stage -->
      <div v-else-if="stage === 'error'" class="py-6">
        <p class="text-sm text-red-600 mb-4">{{ errorMessage }}</p>
        <button
          type="button"
          class="font-body text-sm text-brand-accent hover:underline"
          @click="reset"
        >
          Try another image
        </button>
      </div>

      <!-- Review stage -->
      <div v-else-if="stage === 'review'">
        <div class="mb-3">
          <label class="block font-body font-medium uppercase tracking-widest text-[11px] text-brand-muted dark:text-brand-muted-dark mb-1">
            Your in-game name (remembers your row next time)
          </label>
          <input
            v-model="playerName"
            type="text"
            placeholder="e.g. Ampp33"
            class="w-full rounded border border-brand-border dark:border-brand-border-dark bg-brand-bg dark:bg-brand-surface-dark px-3 py-2"
            @input="onPlayerNameInput"
          />
        </div>

        <p class="font-body text-[13px] text-brand-muted dark:text-brand-muted-dark mb-2">
          Click your row below:
        </p>
        <div class="overflow-x-auto rounded border border-brand-border dark:border-brand-border-dark">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left border-b border-brand-border dark:border-brand-border-dark">
                <th class="py-2 px-2">Pos</th>
                <th class="py-2 px-2">Name</th>
                <th class="py-2 px-2">Car</th>
                <th class="py-2 px-2">PI</th>
                <th class="py-2 px-2">Total</th>
                <th class="py-2 px-2">Best lap</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in parsedRows"
                :key="i"
                class="cursor-pointer border-b border-brand-border dark:border-brand-border-dark last:border-0 hover:bg-brand-surface dark:hover:bg-brand-bg-dark"
                :class="selectedIndex === i ? 'bg-brand-accent/10 dark:bg-brand-accent/20' : ''"
                @click="selectedIndex = i"
              >
                <td class="py-2 px-2">{{ row.place || '—' }}</td>
                <td class="py-2 px-2">{{ row.nameRaw || '—' }}</td>
                <td class="py-2 px-2">
                  {{ row.carRaw || '—' }}
                  <span v-if="row.carRaw && !row.vehicleId" class="text-brand-muted dark:text-brand-muted-dark">(no match)</span>
                </td>
                <td class="py-2 px-2">{{ row.performanceIndex ?? '—' }}</td>
                <td class="py-2 px-2">{{ row.totalTimeMs != null ? formatMsToTime(row.totalTimeMs) : '—' }}</td>
                <td class="py-2 px-2">{{ row.lapTimeMs != null ? formatMsToTime(row.lapTimeMs) : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex items-center justify-between gap-3">
          <button type="button" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark hover:text-brand-text dark:hover:text-brand-text-dark" @click="reset">
            Use a different image
          </button>
          <button
            type="button"
            class="font-display font-black uppercase tracking-widest bg-brand-accent text-white px-6 py-3 rounded-none hover:opacity-85 active:opacity-70 transition-opacity disabled:opacity-40"
            :disabled="selectedIndex == null"
            @click="onConfirm"
          >
            Use this row
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { createWorker, PSM } from 'tesseract.js'
import { detectHeaderColumns, detectRowBands, matchNumericCell, cellHasText, parseNumericTime, matchVehicle } from '../utils/ocrParser.js'
import { formatMsToTime } from '../utils/timeFormat.js'
import { prefsStore } from '../stores/prefsStore.js'

let sharedWorker = null
async function getWorker() {
  if (!sharedWorker) sharedWorker = await createWorker('eng')
  return sharedWorker
}

export default {
  name: 'OcrImportModal',
  props: {
    open: { type: Boolean, default: false },
    vehicles: { type: Array, default: () => [] }
  },
  emits: ['update:open', 'confirm'],
  data() {
    return {
      stage: 'input', // input | processing | error | review
      statusMessage: '',
      errorMessage: '',
      parsedRows: [],
      selectedIndex: null,
      playerName: prefsStore.ocrPlayerName || ''
    }
  },
  watch: {
    open(isOpen) {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
        this.reset()
      } else {
        document.body.style.overflow = ''
      }
    }
  },
  beforeUnmount() {
    document.body.style.overflow = ''
  },
  methods: {
    formatMsToTime,
    reset() {
      this.stage = 'input'
      this.errorMessage = ''
      this.parsedRows = []
      this.selectedIndex = null
    },
    onCancel() {
      this.$emit('update:open', false)
    },
    onPlayerNameInput() {
      prefsStore.ocrPlayerName = this.playerName
      this.autoSelectByName()
    },
    onFileInputChange(e) {
      const file = e.target.files && e.target.files[0]
      if (file) this.processFile(file)
      e.target.value = ''
    },
    onDrop(e) {
      const file = e.dataTransfer.files && e.dataTransfer.files[0]
      if (file) this.processFile(file)
    },
    onPaste(e) {
      const items = e.clipboardData && e.clipboardData.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) { this.processFile(file); return }
        }
      }
    },
    async processFile(file) {
      this.stage = 'processing'
      this.statusMessage = 'Reading image…'
      try {
        const img = await loadImage(file)
        await this.analyzeImage(img)
      } catch (err) {
        this.stage = 'error'
        this.errorMessage = err.message || 'Failed to read that image.'
      }
    },
    async analyzeImage(img) {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const { width, height } = canvas

      this.statusMessage = 'Loading OCR engine (first time only)…'
      const worker = await getWorker()

      this.statusMessage = 'Reading table header…'
      const headerRect = { left: Math.round(width * 0.30), top: Math.round(height * 0.18), width: Math.round(width * 0.68), height: Math.round(height * 0.12) }
      const headerWords = await ocrWords(worker, canvas, headerRect, PSM.SPARSE_TEXT)
      const header = detectHeaderColumns(headerWords, width)
      if (!header.ok) {
        throw new Error("Couldn't find a results table in that image (missing: " + header.missing.join(', ') + '). Make sure it\'s the Wreckfest results screen.')
      }

      this.statusMessage = 'Finding rows…'
      let anchors = []
      for (const frac of [0.15, 0.35, 1.0]) {
        const h = Math.min(height - header.headerBottom, Math.round(height * frac))
        const rect = { left: Math.max(0, header.cols.POS.x0 - 15), top: header.headerBottom, width: 95, height: h }
        const candidate = await ocrWords(worker, canvas, rect, PSM.SPARSE_TEXT)
        if (candidate.length > anchors.length) anchors = candidate
        if (anchors.length >= 2 || h >= height - header.headerBottom) break
      }
      const { rows, rowHeight } = detectRowBands(anchors, header.headerBottom, height)
      if (!rows.length) {
        throw new Error("Couldn't find any race rows in that image.")
      }

      this.statusMessage = 'Reading names and cars…'
      const nameLines = await recognizeColumnLines(worker, canvas, { left: header.cols.NAME.x0, top: header.headerBottom, width: header.cols.NAME.x1 - header.cols.NAME.x0, height: height - header.headerBottom })
      const carLines = await recognizeColumnLines(worker, canvas, { left: header.cols.CAR.x0, top: header.headerBottom, width: header.cols.CAR.x1 - header.cols.CAR.x0, height: height - header.headerBottom })

      this.statusMessage = 'Reading times…'
      const realRows = []
      for (const row of rows) {
        const nameCellRect = { x0: header.cols.NAME.x0, x1: header.cols.NAME.x1, y0: row.y0, y1: row.y0 + rowHeight }
        if (!cellHasText(getImageData(ctx, nameCellRect), nameCellRect.x1 - nameCellRect.x0, nameCellRect.y1 - nameCellRect.y0, 4)) break

        const place = matchCell(ctx, posToDigitsColumn(header.cols.POS, rowHeight), row, rowHeight)
        const piCol = classToPiColumn(header.cols.CLASS)
        const performanceIndexStr = matchCell(ctx, piCol, row, rowHeight)
        const timeStr = header.cols.TIME ? matchCell(ctx, header.cols.TIME, row, rowHeight) : ''
        const lapStr = header.cols.BESTLAP ? matchCell(ctx, header.cols.BESTLAP, row, rowHeight) : ''

        const nameRaw = closestLine(nameLines, row)
        const carRaw = closestLine(carLines, row)
        const pi = parseInt(performanceIndexStr, 10)

        realRows.push({
          place: place && !place.includes('?') ? place.replace(/^0+(?=\d)/, '') : null,
          performanceIndex: Number.isNaN(pi) ? null : pi,
          totalTimeMs: parseNumericTime(timeStr),
          lapTimeMs: parseNumericTime(lapStr),
          nameRaw,
          carRaw,
          vehicleId: matchVehicle(carRaw, this.vehicles)
        })
      }

      if (!realRows.length) throw new Error('Found the table but no readable rows in it.')

      this.parsedRows = realRows
      this.stage = 'review'
      this.autoSelectByName()
    },
    autoSelectByName() {
      if (!this.playerName) return
      const target = this.playerName.trim().toLowerCase()
      if (!target) return
      const idx = this.parsedRows.findIndex(r => (r.nameRaw || '').trim().toLowerCase() === target)
      if (idx !== -1) this.selectedIndex = idx
    },
    onConfirm() {
      const row = this.parsedRows[this.selectedIndex]
      if (!row) return
      this.$emit('confirm', {
        place: row.place,
        performanceIndex: row.performanceIndex != null ? String(row.performanceIndex) : undefined,
        lapTimeMs: row.lapTimeMs,
        totalTimeMs: row.totalTimeMs,
        vehicleId: row.vehicleId
      })
      this.$emit('update:open', false)
    }
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load that image file.')) }
    img.src = url
  })
}

async function ocrWords(worker, canvas, rect, psm) {
  const { data } = await worker.recognize(canvas, { rectangle: rect, tessedit_pageseg_mode: psm }, { blocks: true })
  const words = []
  for (const b of data.blocks || []) for (const p of b.paragraphs || []) for (const l of p.lines || []) for (const w of l.words || []) {
    words.push({ text: w.text, x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1, conf: w.confidence })
  }
  return words
}

// Recognizes a whole column's free text (NAME/CAR) in one pass rather than
// per-row crops — much fewer Tesseract calls. Returns per-line text + y-range;
// callers match each row to the nearest line by y-position.
async function recognizeColumnLines(worker, canvas, rect) {
  const { data } = await worker.recognize(canvas, { rectangle: rect, tessedit_pageseg_mode: PSM.SPARSE_TEXT }, { blocks: true })
  const lines = []
  for (const b of data.blocks || []) for (const p of b.paragraphs || []) for (const l of p.lines || []) {
    const text = (l.text || '').trim()
    if (text) lines.push({ text, y0: l.bbox.y0, y1: l.bbox.y1 })
  }
  return lines
}

function closestLine(lines, row) {
  const rowCenter = (row.y0 + row.y1) / 2
  let best = null, bestDist = Infinity
  for (const line of lines) {
    const lineCenter = (line.y0 + line.y1) / 2
    const dist = Math.abs(lineCenter - rowCenter)
    if (dist < bestDist) { bestDist = dist; best = line }
  }
  // Only accept a line if it's reasonably close to this row (not a
  // neighboring row's text bleeding in because this row's cell is empty).
  const rowHeight = row.y1 - row.y0
  return best && bestDist < rowHeight * 3 ? best.text : null
}

function getImageData(ctx, rect) {
  return ctx.getImageData(rect.x0, rect.y0, rect.x1 - rect.x0, rect.y1 - rect.y0).data
}

function matchCell(ctx, col, row, rowHeight) {
  const rect = { x0: col.x0, x1: col.x1, y0: row.y0, y1: row.y1 }
  const w = rect.x1 - rect.x0, h = rect.y1 - rect.y0
  if (w <= 0 || h <= 0) return ''
  const pixels = getImageData(ctx, rect)
  return matchNumericCell(pixels, w, h, 4, rowHeight)
}

// The PI number sits in the right portion of the CLASS column (the left
// portion is the class-letter icon graphic, e.g. red "A" or green "C") — a
// fraction of the column's own width rather than a fixed pixel offset, so it
// scales correctly across resolutions.
function classToPiColumn(classCol) {
  const w = classCol.x1 - classCol.x0
  return { x0: Math.round(classCol.x0 + w * 0.45), x1: classCol.x1 }
}

// The derived POS column spans all the way to the NAME column (since that's
// the only known boundary), but a driver avatar icon sits between the POS
// digits and the name — cropping the full span feeds icon pixels into the
// glyph matcher and produces garbage. The digits themselves occupy a small,
// fairly constant width that scales with font size (row height), same idea
// as the reference median character width.
function posToDigitsColumn(posCol, rowHeight) {
  const digitsWidth = 80 * (rowHeight / 60)
  return { x0: posCol.x0, x1: Math.min(posCol.x1, Math.round(posCol.x0 + digitsWidth)) }
}
</script>
