// Mostra datas sempre em UTC, que é o padrão da API.
export function dataHoraUtc(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const dia = d.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' })
  const hora = d.toLocaleTimeString('pt-BR', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' })
  return `${dia} ${hora} UTC`
}

export function horaUtc(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function numero(valor, casas = 2) {
  if (valor === null || valor === undefined) return '—'
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}
