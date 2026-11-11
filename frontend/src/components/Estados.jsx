import { Alerta, Recarregar, Vazio as IconeVazio } from './Icones'

// Estados da interface: carregando (esqueleto), erro com nova tentativa e vazio.

export function Carregando({ texto = 'Carregando…', altura = 120 }) {
  return (
    <div className="esqueleto" style={{ minHeight: altura }} role="status" aria-live="polite">
      <span className="sr-only">{texto}</span>
    </div>
  )
}

export function Erro({ erro, aoTentarDeNovo, titulo = 'Não foi possível carregar os dados' }) {
  return (
    <div className="estado estado-erro" role="alert">
      <Alerta width={28} height={28} />
      <div>
        <p className="estado-titulo">{titulo}</p>
        <p className="estado-texto">
          {erro?.message ?? 'Verifique se a API está rodando e tente de novo.'}
        </p>
      </div>
      <button type="button" className="botao" onClick={aoTentarDeNovo}>
        <Recarregar width={16} height={16} /> Tentar de novo
      </button>
    </div>
  )
}

export function Vazio({ titulo = 'Sem dados', texto }) {
  return (
    <div className="estado" role="status">
      <IconeVazio width={28} height={28} />
      <div>
        <p className="estado-titulo">{titulo}</p>
        {texto && <p className="estado-texto">{texto}</p>}
      </div>
    </div>
  )
}
