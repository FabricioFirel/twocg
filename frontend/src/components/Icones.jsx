// Ícones SVG simples (sem biblioteca externa).
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const Gota = (p) => (
  <svg {...base} {...p}>
    <path d="M12 2.7s-6 6.6-6 11.3a6 6 0 0 0 12 0c0-4.7-6-11.3-6-11.3z" />
  </svg>
)
export const Onda = (p) => (
  <svg {...base} {...p}>
    <path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    <path d="M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    <path d="M2 7c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
  </svg>
)
export const Chuva = (p) => (
  <svg {...base} {...p}>
    <path d="M20 16.6A5 5 0 0 0 18 7h-1.3A8 8 0 1 0 4 15.3" />
    <path d="M8 19v2M8 13v2M16 19v2M16 13v2M12 21v2M12 15v2" />
  </svg>
)
export const Relogio = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)
export const Alerta = (p) => (
  <svg {...base} {...p}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
)
export const Ok = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </svg>
)
export const Info = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
)
export const Pino = (p) => (
  <svg {...base} {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)
export const Recarregar = (p) => (
  <svg {...base} {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
)
export const Vazio = (p) => (
  <svg {...base} {...p}>
    <path d="M3 3v18h18" />
    <path d="M7 15h.01M11 15h.01M15 15h.01M19 15h.01" />
  </svg>
)
export const Seta = ({ direcao = 'cima', ...p }) => (
  <svg {...base} {...p} style={{ transform: direcao === 'baixo' ? 'rotate(180deg)' : undefined }}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
)
export const Traco = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12h14" />
  </svg>
)
