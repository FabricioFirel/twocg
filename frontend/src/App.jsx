import { useEffect, useState } from 'react'
import { buscarEstacoes } from './api'
import { Carregando, Erro, Vazio } from './components/Estados'
import Graficos from './components/Graficos'
import Resumo from './components/Resumo'
import SeletorEstacao from './components/SeletorEstacao'
import SeletorJanela from './components/SeletorJanela'
import { dataHoraUtc } from './formato'
import { useApi } from './useApi'

export default function App() {
  const estacoes = useApi(buscarEstacoes, [])
  const [selecionada, setSelecionada] = useState(null)
  const [horas, setHoras] = useState(24)

  // Seleciona a primeira estação assim que a lista chega.
  useEffect(() => {
    if (estacoes.dados?.length && !selecionada) setSelecionada(estacoes.dados[0].id)
  }, [estacoes.dados, selecionada])

  const estacao = estacoes.dados?.find((e) => e.id === selecionada)

  return (
    <>
      <header className="topo">
        <h1>Monitoramento Hidrológico</h1>
        <p className="aviso" role="note">
          <strong>Aviso:</strong> dados sintéticos de estações fictícias. Não use para fins
          operacionais, alertas ou decisões reais.
        </p>
      </header>

      <main className="conteudo">
        {estacoes.carregando && <Carregando texto="Carregando estações…" />}
        {estacoes.erro && <Erro erro={estacoes.erro} aoTentarDeNovo={estacoes.tentarDeNovo} />}
        {estacoes.dados && !estacoes.dados.length && (
          <Vazio texto="Nenhuma estação cadastrada. Rode o seed e a carga do CSV." />
        )}

        {estacao && (
          <>
            <div className="controles">
              <SeletorEstacao
                estacoes={estacoes.dados}
                selecionada={selecionada}
                aoMudar={setSelecionada}
              />
              <SeletorJanela horas={horas} aoMudar={setHoras} />
            </div>

            <h2>
              {estacao.name} <span className="detalhe">· {estacao.river}</span>
            </h2>
            <p className="detalhe">
              Última leitura: {dataHoraUtc(estacao.last_observation_at)}
            </p>

            <Resumo estacaoId={estacao.id} />
            <Graficos estacao={estacao} horas={horas} />
          </>
        )}
      </main>

      <footer className="rodape">Desafio COGMO · horários em UTC</footer>
    </>
  )
}
