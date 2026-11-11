import { useEffect, useState } from 'react'
import { buscarEstacoes, buscarResumo } from './api'
import { Carregando, Erro, Vazio } from './components/Estados'
import Graficos from './components/Graficos'
import { Gota, Info, Pino, Relogio } from './components/Icones'
import ListaEstacoes from './components/ListaEstacoes'
import Resumo from './components/Resumo'
import SeletorJanela from './components/SeletorJanela'
import { dataHoraUtc, numero } from './formato'
import { useApi } from './useApi'

// Busca a situação de todas as estações para mostrar na lista lateral.
// Se alguma falhar, a lista funciona normalmente, só sem o selo.
function useSituacoes(estacoes) {
  const [situacoes, setSituacoes] = useState({})
  useEffect(() => {
    if (!estacoes?.length) return
    let ativo = true
    Promise.allSettled(estacoes.map((e) => buscarResumo(e.id))).then((resultados) => {
      if (!ativo) return
      const mapa = {}
      resultados.forEach((r, i) => {
        if (r.status === 'fulfilled') mapa[estacoes[i].id] = r.value
      })
      setSituacoes(mapa)
    })
    return () => {
      ativo = false
    }
  }, [estacoes])
  return situacoes
}

export default function App() {
  const estacoes = useApi(buscarEstacoes, [])
  const situacoes = useSituacoes(estacoes.dados)
  const [selecionada, setSelecionada] = useState(null)
  const [horas, setHoras] = useState(24)

  // Seleciona a primeira estação assim que a lista chega.
  useEffect(() => {
    if (estacoes.dados?.length && !selecionada) setSelecionada(estacoes.dados[0].id)
  }, [estacoes.dados, selecionada])

  const estacao = estacoes.dados?.find((e) => e.id === selecionada)

  return (
    <div className="pagina">
      <header className="topo">
        <div className="topo-interno">
          <div className="marca">
            <span className="marca-logo">
              <Gota width={20} height={20} />
            </span>
            <div>
              <p className="marca-nome">HidroMonitor</p>
              <p className="marca-sub">Monitoramento hidrológico</p>
            </div>
          </div>
          <span className="etiqueta-sintetico">
            <Info width={14} height={14} /> Dados sintéticos
          </span>
        </div>
      </header>

      <div className="aviso" role="note">
        <div className="aviso-interno">
          <Info width={16} height={16} />
          <p>
            <strong>Demonstração.</strong> Todas as estações são fictícias e os dados são
            gerados por script. Não use estas informações para fins operacionais, alertas ou
            decisões reais.
          </p>
        </div>
      </div>

      <div className="corpo">
        {estacoes.carregando && (
          <div className="corpo-cheio">
            <Carregando texto="Carregando estações…" altura={420} />
          </div>
        )}
        {estacoes.erro && (
          <div className="corpo-cheio">
            <Erro
              erro={estacoes.erro}
              aoTentarDeNovo={estacoes.tentarDeNovo}
              titulo="Não foi possível conectar à API"
            />
          </div>
        )}
        {estacoes.dados && !estacoes.dados.length && (
          <div className="corpo-cheio">
            <Vazio
              titulo="Nenhuma estação cadastrada"
              texto="Rode o seed e a carga do CSV (python manage.py load_csv)."
            />
          </div>
        )}

        {estacao && (
          <>
            <aside className="lateral">
              <ListaEstacoes
                estacoes={estacoes.dados}
                resumos={situacoes}
                selecionada={selecionada}
                aoMudar={setSelecionada}
              />
            </aside>

            <main className="principal">
              <section className="cabecalho-estacao">
                <div>
                  <p className="sobretitulo">
                    {estacao.id} · {estacao.river}
                  </p>
                  <h1>{estacao.name}</h1>
                  <p className="meta">
                    <span>
                      <Pino width={14} height={14} /> {estacao.city}/{estacao.state} ·{' '}
                      {numero(estacao.latitude, 3)}, {numero(estacao.longitude, 3)}
                    </span>
                    <span>
                      <Relogio width={14} height={14} /> Última leitura{' '}
                      {dataHoraUtc(estacao.last_observation_at)}
                    </span>
                  </p>
                </div>
                <SeletorJanela horas={horas} aoMudar={setHoras} />
              </section>

              <Resumo estacaoId={estacao.id} />
              {/* Sem leituras: o resumo já mostra o aviso, então não repete nos gráficos. */}
              {estacao.last_observation_at && <Graficos estacao={estacao} horas={horas} />}
            </main>
          </>
        )}
      </div>

      <footer className="rodape">
        <div className="rodape-interno">
          <span>Desafio COGMO · Django REST Framework + React</span>
          <span>
            Horários em UTC ·{' '}
            <a href="/api/docs/" target="_blank" rel="noreferrer">
              Documentação da API
            </a>
          </span>
        </div>
      </footer>
    </div>
  )
}
