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
import { dataHoraUtc, diaHoraCurta, numero } from '../formato'
import { useApi } from '../useApi'
import { Carregando, Erro, Vazio } from './Estados'

function Dica({ active, payload, label, unidade, casas, cor }) {
  if (!active || !payload?.length) return null
  const valor = payload[0].value
  return (
    <div className="dica">
      <span className="dica-data">{dataHoraUtc(label)}</span>
      <span className="dica-valor">
        <i style={{ background: cor }} />
        {valor === null || valor === undefined ? 'Leitura inválida' : `${numero(valor, casas)} ${unidade}`}
      </span>
    </div>
  )
}

function estatisticas(pontos, chave) {
  const valores = pontos.map((p) => p[chave]).filter((v) => v !== null && v !== undefined)
  if (!valores.length) return null
  return {
    min: Math.min(...valores),
    max: Math.max(...valores),
    soma: valores.reduce((a, b) => a + b, 0),
    invalidas: pontos.length - valores.length,
  }
}

function Painel({ titulo, subtitulo, numeros, children }) {
  return (
    <figure className="painel">
      <figcaption className="painel-topo">
        <div>
          <h3>{titulo}</h3>
          <p className="painel-sub">{subtitulo}</p>
        </div>
        <dl className="painel-numeros">
          {numeros.map(([rotulo, valor]) => (
            <div key={rotulo}>
              <dt>{rotulo}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </dl>
      </figcaption>
      <div className="painel-grafico">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </figure>
  )
}

const eixo = { fontSize: 12, tickLine: false, axisLine: false, stroke: 'var(--texto-suave)' }

export default function Graficos({ estacao, horas }) {
  const { carregando, erro, dados, tentarDeNovo } = useApi(
    () => buscarSerie(estacao.id, horas),
    [estacao.id, horas],
  )

  if (carregando)
    return (
      <div className="paineis">
        <Carregando texto="Carregando gráficos…" altura={340} />
        <Carregando texto="Carregando gráficos…" altura={340} />
      </div>
    )
  if (erro) return <Erro erro={erro} aoTentarDeNovo={tentarDeNovo} titulo="Gráficos indisponíveis" />
  if (!dados.points.length)
    return (
      <Vazio
        titulo="Nenhuma leitura no período"
        texto={`Não há medições nas últimas ${horas} horas para esta estação.`}
      />
    )

  const pontos = dados.points
  const nivel = estatisticas(pontos, 'level_m')
  const chuva = estatisticas(pontos, 'rain_mm_h')
  const alerta = estacao.alert_level_m
  const periodo = `${dataHoraUtc(dados.start)} — ${dataHoraUtc(dados.end)}`
  const eixoX = (
    <XAxis dataKey="observed_at" tickFormatter={diaHoraCurta} minTickGap={28} {...eixo} />
  )
  const grade = <CartesianGrid vertical={false} stroke="var(--grade)" />

  // O eixo do nível inclui a cota de alerta para a linha sempre aparecer.
  const topo = nivel ? Math.max(nivel.max, alerta ?? 0) * 1.08 : 'auto'
  const base = nivel ? Math.max(0, nivel.min - (topo - nivel.min) * 0.15) : 'auto'

  return (
    <>
      <div className="paineis">
        <Painel
          titulo="Nível do rio"
          subtitulo={`Metros · ${periodo}`}
          numeros={[
            ['Mín.', nivel ? `${numero(nivel.min)} m` : '—'],
            ['Máx.', nivel ? `${numero(nivel.max)} m` : '—'],
          ]}
        >
          <LineChart data={pontos} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            {grade}
            {eixoX}
            <YAxis
              {...eixo}
              width={44}
              domain={[base, topo]}
              tickFormatter={(v) => numero(v, 1)}
            />
            <Tooltip
              content={<Dica unidade="m" casas={2} cor="var(--serie-nivel)" />}
              cursor={{ stroke: 'var(--texto-suave)', strokeDasharray: '3 3' }}
            />
            {alerta && (
              <ReferenceLine
                y={alerta}
                stroke="var(--critico)"
                strokeDasharray="5 4"
                label={{
                  value: `Cota de alerta ${numero(alerta)} m`,
                  fill: 'var(--texto-suave)',
                  fontSize: 11,
                  position: 'insideTopRight',
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="level_m"
              name="Nível"
              stroke="var(--serie-nivel)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--superficie)' }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </Painel>

        <Painel
          titulo="Chuva"
          subtitulo={`Milímetros por hora · ${periodo}`}
          numeros={[
            ['Pico', chuva ? `${numero(chuva.max, 1)} mm/h` : '—'],
            ['Total', chuva ? `${numero(chuva.soma, 1)} mm` : '—'],
          ]}
        >
          <BarChart
            data={pontos}
            margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
            barCategoryGap={horas > 24 ? 1 : 2}
          >
            {grade}
            {eixoX}
            <YAxis {...eixo} width={44} allowDecimals={false} />
            <Tooltip
              content={<Dica unidade="mm/h" casas={1} cor="var(--serie-chuva)" />}
              cursor={{ fill: 'var(--realce)' }}
            />
            <Bar
              dataKey="rain_mm_h"
              name="Chuva"
              fill="var(--serie-chuva)"
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </Painel>
      </div>

      <details className="tabela-dados">
        <summary>
          Ver os dados em tabela ({pontos.length} horas
          {nivel?.invalidas || chuva?.invalidas
            ? `, ${(nivel?.invalidas ?? 0) + (chuva?.invalidas ?? 0)} leitura(s) inválida(s)`
            : ''}
          )
        </summary>
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                <th scope="col">Data/hora (UTC)</th>
                <th scope="col">Nível (m)</th>
                <th scope="col">Chuva (mm/h)</th>
              </tr>
            </thead>
            <tbody>
              {[...pontos].reverse().map((p) => (
                <tr key={p.observed_at}>
                  <td>{dataHoraUtc(p.observed_at)}</td>
                  <td className={p.level_m === null ? 'invalida' : ''}>
                    {p.level_m === null ? 'inválida' : numero(p.level_m)}
                  </td>
                  <td className={p.rain_mm_h === null ? 'invalida' : ''}>
                    {p.rain_mm_h === null ? 'inválida' : numero(p.rain_mm_h, 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  )
}
