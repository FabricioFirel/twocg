import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { buscarSerie } from '../api'
import { dataHoraUtc, horaUtc, numero } from '../formato'
import { useApi } from '../useApi'
import { Carregando, Erro, Vazio } from './Estados'

function Dica({ active, payload, label, unidade, casas }) {
  if (!active || !payload?.length) return null
  const valor = payload[0].value
  return (
    <div className="dica">
      <strong>{dataHoraUtc(label)}</strong>
      <br />
      {valor === null ? 'leitura inválida' : `${numero(valor, casas)} ${unidade}`}
    </div>
  )
}

function Painel({ titulo, descricao, children }) {
  return (
    <figure className="grafico">
      <figcaption>
        <h3>{titulo}</h3>
        <span className="detalhe">{descricao}</span>
      </figcaption>
      <div className="grafico-area">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </figure>
  )
}

export default function Graficos({ estacao, horas }) {
  const { carregando, erro, dados, tentarDeNovo } = useApi(
    () => buscarSerie(estacao.id, horas),
    [estacao.id, horas],
  )

  if (carregando) return <Carregando texto="Carregando gráficos…" />
  if (erro) return <Erro erro={erro} aoTentarDeNovo={tentarDeNovo} />
  if (!dados.points.length)
    return <Vazio texto={`Sem leituras nas últimas ${horas} horas para esta estação.`} />

  const pontos = dados.points
  const eixoX = (
    <XAxis dataKey="observed_at" tickFormatter={horaUtc} minTickGap={24} fontSize={12} />
  )

  return (
    <div className="graficos">
      <Painel
        titulo="Nível do rio (m)"
        descricao={`Últimas ${horas}h · ${dataHoraUtc(dados.start)} a ${dataHoraUtc(dados.end)}`}
      >
        <LineChart data={pontos} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--grade)" />
          {eixoX}
          <YAxis fontSize={12} domain={['auto', 'auto']} unit=" m" width={56} />
          <Tooltip content={<Dica unidade="m" casas={2} />} />
          {estacao.alert_level_m && (
            <ReferenceLine
              y={estacao.alert_level_m}
              stroke="var(--alerta)"
              strokeDasharray="4 4"
              label={{ value: 'alerta', fill: 'var(--alerta)', fontSize: 12, position: 'insideTopRight' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="level_m"
            stroke="var(--nivel)"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </Painel>
      <Painel titulo="Chuva (mm/h)" descricao="Intensidade por hora">
        <BarChart data={pontos} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--grade)" />
          {eixoX}
          <YAxis fontSize={12} unit=" mm" width={56} allowDecimals={false} />
          <Tooltip content={<Dica unidade="mm/h" casas={1} />} />
          <Bar dataKey="rain_mm_h" fill="var(--chuva)" isAnimationActive={false} />
        </BarChart>
      </Painel>
    </div>
  )
}
