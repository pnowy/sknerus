import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

const appVersion = process.env.APP_VERSION || 'dev'

const config = defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    devtools(),
    nitro(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
