import { useCallback, useEffect, useState } from 'react'

// Guarda os três estados de uma chamada: carregando, erro e dados.
// "tentarDeNovo" refaz a chamada (botão de nova tentativa).
export function useApi(funcao, dependencias) {
  const [estado, setEstado] = useState({ carregando: true, erro: null, dados: null })
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true
    setEstado((e) => ({ ...e, carregando: true, erro: null }))
    funcao()
      .then((dados) => ativo && setEstado({ carregando: false, erro: null, dados }))
      .catch((erro) => ativo && setEstado({ carregando: false, erro, dados: null }))
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, tentativa])

  const tentarDeNovo = useCallback(() => setTentativa((t) => t + 1), [])
  return { ...estado, tentarDeNovo }
}
