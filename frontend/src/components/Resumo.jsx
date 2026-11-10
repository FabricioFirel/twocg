import { buscarResumo } from '../api'
import { dataHoraUtc, numero } from '../formato'
import { useApi } from '../useApi'
import { Carregando, Erro, Vazio } from './Estados'

const STATUS = {
  normal: 'Normal',
  atencao: 'Atenção',
  alerta: 'Alerta',
  sem_dados: 'Sem dados',
}
const TENDENCIA = { subindo: '▲ subindo', descendo: '▼ descendo', estavel: '■ estável' }

export default function Resumo({ estacaoId }) {
  const { carregando, erro, dados, tentarDeNovo } = useApi(
    () => buscarResumo(estacaoId),
    [estacaoId],
  )

  if (carregando) return <Carregando texto="Carregando resumo…" />
  if (erro) return <Erro erro={erro} aoTentarDeNovo={tentarDeNovo} />
  if (dados.status === 'sem_dados')
    return <Vazio texto="Esta estação ainda não tem leituras." />

  return (
    <section aria-label="Resumo das últimas leituras" className="cartoes">
      <article className="cartao">
        <h3>Nível do rio</h3>
        <p className="valor">{numero(dados.level_m.value)} m</p>
        <p className="detalhe">
          {TENDENCIA[dados.level_trend] ?? '—'} · {dataHoraUtc(dados.level_m.observed_at)}
        </p>
      </article>
      <article className="cartao">
        <h3>Chuva</h3>
        <p className="valor">{numero(dados.rain_mm_h.value, 1)} mm/h</p>
        <p className="detalhe">{dataHoraUtc(dados.rain_mm_h.observed_at)}</p>
      </article>
      <article className="cartao">
        <h3>Chuva em 24h</h3>
        <p className="valor">{numero(dados.rain_24h_mm, 1)} mm</p>
        <p className="detalhe">acumulado</p>
      </article>
      <article className={`cartao status-${dados.status}`}>
        <h3>Situação</h3>
        <p className="valor">{STATUS[dados.status]}</p>
        <p className="detalhe">
          alerta em {numero(dados.station.alert_level_m)} m
          {dados.invalid_readings_24h > 0 &&
            ` · ${dados.invalid_readings_24h} leitura(s) inválida(s) em 24h`}
        </p>
      </article>
    </section>
  )
}
