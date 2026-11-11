const OPCOES = [12, 24, 48]

export default function SeletorJanela({ horas, aoMudar }) {
  return (
    <div className="segmentado" role="group" aria-label="Período do histórico">
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
  )
}
