const OPCOES = [12, 24, 48]

export default function SeletorJanela({ horas, aoMudar }) {
  return (
    <div className="campo">
      <span id="janela-rotulo">Histórico</span>
      <div className="botoes" role="group" aria-labelledby="janela-rotulo">
        {OPCOES.map((h) => (
          <button
            key={h}
            type="button"
            className={h === horas ? 'ativo' : ''}
            aria-pressed={h === horas}
            onClick={() => aoMudar(h)}
          >
            {h}h
          </button>
        ))}
      </div>
    </div>
  )
}
