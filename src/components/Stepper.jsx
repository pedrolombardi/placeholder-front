const labels = ['Origem', 'Destino', 'Análise', 'Proposta', 'Homologação', 'Execução', 'Resultado']

export default function Stepper({ current }) {
  return (
    <div className="stepper" aria-label="Etapas da migração">
      {labels.map((label, index) => {
        const number = index + 1
        const state = number < current ? 'done' : number === current ? 'active' : ''
        return (
          <div className={`stepper__item ${state}`} key={label}>
            <div className="stepper__circle">{number < current ? '✓' : number}</div>
            <span>{label}</span>
          </div>
        )
      })}
    </div>
  )
}
