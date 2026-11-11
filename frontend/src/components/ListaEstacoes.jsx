import { dataHoraUtc } from '../formato'
import SeloStatus from './SeloStatus'

// Lista de estações: barra lateral no computador e caixa de seleção no celular.
export default function ListaEstacoes({ estacoes, resumos, selecionada, aoMudar }) {
  return (
    <>
      <div className="campo seletor-celular">
        <label htmlFor="estacao">Estação</label>
        <select id="estacao" value={selecionada ?? ''} onChange={(e) => aoMudar(e.target.value)}>
          {estacoes.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} · {e.river} ({e.city}/{e.state})
            </option>
          ))}
        </select>
      </div>

      <nav className="lista-estacoes" aria-label="Estações">
        <p className="lista-titulo">
          Estações <span className="contador">{estacoes.length}</span>
        </p>
        <ul>
          {estacoes.map((e) => {
            const ativa = e.id === selecionada
            const status = resumos[e.id]?.status
            return (
              <li key={e.id}>
                <button
                  type="button"
                  className={`item-estacao ${ativa ? 'ativa' : ''}`}
                  aria-current={ativa ? 'true' : undefined}
                  onClick={() => aoMudar(e.id)}
                >
                  <span className="item-linha">
                    <span className="item-nome">{e.name}</span>
                    {status && <SeloStatus status={status} compacto />}
                  </span>
                  <span className="item-sub">
                    {e.river} · {e.city}/{e.state}
                  </span>
                  <span className="item-sub item-tempo">
                    {e.id} · {e.last_observation_at ? dataHoraUtc(e.last_observation_at) : 'sem leituras'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
