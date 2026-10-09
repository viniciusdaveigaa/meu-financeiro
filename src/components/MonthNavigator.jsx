import { changeMonth, getMonthKey, formatMonthName } from '../utils/formatters'

export function MonthNavigator({ month, onChange }) {
  const [selectedYear, selectedMonth] = month.split('-')
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  const currentYear = new Date().getFullYear()
  const defaultYears = Array.from({ length: 14 }, (_, index) => String(currentYear + 3 - index))
  const years = defaultYears.includes(selectedYear) ? defaultYears : [selectedYear, ...defaultYears].sort((a, b) => Number(b) - Number(a))

  const currentMonthKey = getMonthKey(new Date())
  const isCurrentMonth = month === currentMonthKey

  return (
    <div className="period-navigator-bar">
      <div className="period-nav-group">
        <button
          type="button"
          className="period-step-btn"
          onClick={() => onChange(changeMonth(month, -1))}
          title="Mês anterior"
          aria-label="Mês anterior"
        >
          ‹
        </button>

        <div className="period-selects-container">
          <span className="period-calendar-icon">📅</span>
          <select
            className="period-select"
            value={selectedMonth}
            onChange={(e) => onChange(`${selectedYear}-${e.target.value}`)}
            aria-label="Mês"
          >
            {monthNames.map((name, idx) => (
              <option key={name} value={String(idx + 1).padStart(2, '0')}>
                {name}
              </option>
            ))}
          </select>

          <span className="period-divider">/</span>

          <select
            className="period-select year-select"
            value={selectedYear}
            onChange={(e) => onChange(`${e.target.value}-${selectedMonth}`)}
            aria-label="Ano"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="period-step-btn"
          onClick={() => onChange(changeMonth(month, 1))}
          title="Próximo mês"
          aria-label="Próximo mês"
        >
          ›
        </button>
      </div>

      {!isCurrentMonth && (
        <button
          type="button"
          className="btn-today-pill"
          onClick={() => onChange(currentMonthKey)}
        >
          Voltar para Mês Atual
        </button>
      )}
    </div>
  )
}

