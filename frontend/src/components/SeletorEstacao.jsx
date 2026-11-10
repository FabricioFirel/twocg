export default function SeletorEstacao({ estacoes, selecionada, aoMudar }) {
  return (
    <div className="campo">
      <label htmlFor="estacao">Estação</label>
      <select id="estacao" value={selecionada ?? ''} onChange={(e) => aoMudar(e.target.value)}>
        {estacoes.map((e) => (
          <option key={e.id} value={e.id}>
            {e.id} · {e.name} ({e.river}, {e.city}/{e.state})
          </option>
        ))}
      </select>
    </div>
  )
}
