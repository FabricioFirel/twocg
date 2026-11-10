// Componentes para os estados da interface: carregando, erro e vazio.

export function Carregando({ texto = 'Carregando…' }) {
  return (
    <div className="estado" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {texto}
    </div>
  )
}

export function Erro({ erro, aoTentarDeNovo }) {
  return (
    <div className="estado estado-erro" role="alert">
      <p>Não foi possível carregar os dados. {erro?.message}</p>
      <button type="button" onClick={aoTentarDeNovo}>
        Tentar de novo
      </button>
    </div>
  )
}

export function Vazio({ texto }) {
  return (
    <div className="estado estado-vazio" role="status">
      {texto}
    </div>
  )
}
