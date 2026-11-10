import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// O proxy manda as chamadas /api para o Django.
// Por padrão usa a porta 8000. Para usar outra porta, crie o arquivo
// frontend/.env.local com a linha: API_PROXY_TARGET=http://127.0.0.1:8001
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const alvo = env.API_PROXY_TARGET || 'http://127.0.0.1:8000'
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': alvo,
      },
    },
  }
})
