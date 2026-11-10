// Funções que conversam com a API do Django.
const BASE = import.meta.env.VITE_API_URL ?? ''

async function pegar(caminho) {
  const resposta = await fetch(`${BASE}${caminho}`)
  if (!resposta.ok) {
    throw new Error(`A API respondeu com erro ${resposta.status}`)
  }
  return resposta.json()
}

export const buscarEstacoes = () => pegar('/api/stations')

export const buscarResumo = (id) =>
  pegar(`/api/stations/${encodeURIComponent(id)}/summary`)

export const buscarSerie = (id, horas) =>
  pegar(`/api/stations/${encodeURIComponent(id)}/series?hours=${horas}`)
