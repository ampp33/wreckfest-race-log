import { reactive } from 'vue'

export const prepRaceStore = reactive({ open: false })

export function openPrepRace() { prepRaceStore.open = true }
export function closePrepRace() { prepRaceStore.open = false }
