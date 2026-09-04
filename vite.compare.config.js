import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
const S = '/tmp/claude-1000/-home-ampp33-Projects-programming-wreckfest-race-log/bcbf8816-6e71-4090-a0c3-cd8c821e4b21/scratchpad/stubs'
const stub = (n, d) => ({ find: new RegExp('^.*/' + d + '/' + n + '\\.js$'), replacement: path.join(S, n + '.js') })
export default defineConfig({ plugins: [vue()], resolve: { alias: [
  stub('trackService','services'), stub('vehicleService','services'), stub('raceService','services'),
  stub('goalService','services'), stub('annotationService','services'), stub('publicStatsService','services'),
  stub('authStore','stores') ] } })
