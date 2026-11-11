import { STATUS } from '../status'
import { Alerta, Info, Ok } from './Icones'

const ICONE = { ok: Ok, atencao: Alerta, alerta: Alerta, neutro: Info }

export default function SeloStatus({ status, compacto = false }) {
  const info = STATUS[status] ?? STATUS.sem_dados
  const Icone = ICONE[info.classe]
  return (
    <span className={`selo selo-${info.classe} ${compacto ? 'selo-compacto' : ''}`}>
      <Icone width={compacto ? 12 : 14} height={compacto ? 12 : 14} />
      {info.rotulo}
    </span>
  )
}
