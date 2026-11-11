import { buscarResumo } from '../api'
import { dataHoraUtc, numero } from '../formato'
import { useApi } from '../useApi'
import { Carregando, Erro, Vazio } from './Estados'
import { Alerta, Chuva, Gota, Onda, Seta, Traco } from './Icones'
import SeloStatus from './SeloStatus'

const TENDENCIA = {
  subindo: { texto: 'Subindo', icone: <Seta width={14} height={14} /> },
  descendo: { texto: 'Descendo', icone: <Seta direcao="baixo" width={14} height={14} /> },
  estavel: { texto: 'Estável', icone: <Traco width={14} height={14} /> },
}

function Indicador({ icone, rotulo, valor, unidade, rodape, selo, children }) {
  return (
    <article className="indicador">
      <header>
        <span className="indicador-icone">{icone}</span>
        <h3>{rotulo}</h3>
        {selo}
      </header>
      <p className="indicador-valor">
        {valor}
        {unidade && <span className="unidade"> {unidade}</span>}
      </p>
      {children}
      {rodape && <p className="indicador-rodape">{rodape}</p>}
    </article>
  )
}

export default function Resumo({ estacaoId }) {
  const { carregando, erro, dados, tentarDeNovo } = useApi(
    () => buscarResumo(estacaoId),
    [estacaoId],
  )

  if (carregando)
    return (
      <div className="indicadores">
        {[0, 1, 2, 3].map((i) => (
          <Carregando key={i} texto="Carregando resumo…" altura={128} />
        ))}
      </div>
    )
  if (erro) return <Erro erro={erro} aoTentarDeNovo={tentarDeNovo} titulo="Resumo indisponível" />
  if (dados.status === 'sem_dados')
    return (
      <Vazio
        titulo="Estação sem leituras"
        texto="Esta estação está cadastrada, mas ainda não enviou nenhuma medição."
      />
    )

  const nivel = dados.level_m.value
  const alerta = dados.station.alert_level_m
  const tendencia = TENDENCIA[dados.level_trend]
  const percentual = alerta && nivel !== null ? Math.min(100, (nivel / alerta) * 100) : null

  return (
    <section aria-label="Resumo das últimas leituras" className="indicadores">
      <Indicador
        icone={<Onda />}
        rotulo="Nível do rio"
        valor={numero(nivel)}
        unidade="m"
        rodape={dataHoraUtc(dados.level_m.observed_at)}
      >
        {tendencia && (
          <span className={`tendencia tendencia-${dados.level_trend}`}>
            {tendencia.icone} {tendencia.texto} nas últimas 3 h
          </span>
        )}
      </Indicador>

      <Indicador
        icone={<Chuva />}
        rotulo="Chuva na última hora"
        valor={numero(dados.rain_mm_h.value, 1)}
        unidade="mm/h"
        rodape={dataHoraUtc(dados.rain_mm_h.observed_at)}
      />

      <Indicador
        icone={<Gota />}
        rotulo="Chuva acumulada"
        valor={numero(dados.rain_24h_mm, 1)}
        unidade="mm"
        rodape="Soma das últimas 24 horas"
      />

      <Indicador
        icone={<Alerta />}
        rotulo="Situação"
        selo={<SeloStatus status={dados.status} />}
        valor={percentual === null ? '—' : `${Math.round(percentual)}%`}
        unidade="da cota"
        rodape={
          dados.invalid_readings_24h > 0
            ? `${dados.invalid_readings_24h} leitura(s) inválida(s) nas últimas 24 h`
            : 'Nenhuma leitura inválida nas últimas 24 h'
        }
      >
        {percentual !== null && (
          <div
            className={`medidor medidor-${dados.status}`}
            role="meter"
            aria-label="Nível em relação à cota de alerta"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percentual)}
          >
            <span style={{ width: `${percentual}%` }} />
            <i style={{ left: '80%' }} title="Atenção (80%)" />
          </div>
        )}
        <p className="indicador-rodape">Cota de alerta: {numero(alerta)} m</p>
      </Indicador>
    </section>
  )
}
