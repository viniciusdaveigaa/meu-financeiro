import { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { changeMonth, getMonthKey, monthNames, monthShortNames } from '../utils/formatters'

export function MonthPicker({ month, onChange }) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(Number(month.slice(0, 4)))
  const rootRef = useRef(null)

  const [year, monthNumber] = month.split('-').map(Number)
  const currentKey = getMonthKey(new Date())

  useEffect(() => {
    if (open) setViewYear(year)
  }, [open, year])

  useEffect(() => {
    if (!open) return
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  const select = (key) => {
    onChange(key)
    setOpen(false)
  }

  return (
    <div className="month-picker" ref={rootRef}>
      <button type="button" className="mp-step" onClick={() => onChange(changeMonth(month, -1))} aria-label="Mês anterior">
        <ChevronLeft size={18} />
      </button>

      <button
        type="button"
        className={`mp-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalendarDays size={16} />
        <span className="mp-label">
          {monthNames[monthNumber - 1]} <b>{year}</b>
        </span>
        <ChevronDown size={16} className="mp-caret" />
      </button>

      <button type="button" className="mp-step" onClick={() => onChange(changeMonth(month, 1))} aria-label="Próximo mês">
        <ChevronRight size={18} />
      </button>

      {open && (
        <div className="mp-popover" role="dialog" aria-label="Selecionar mês">
          <div className="mp-year">
            <button type="button" onClick={() => setViewYear((value) => value - 1)} aria-label="Ano anterior">
              <ChevronLeft size={16} />
            </button>
            <strong>{viewYear}</strong>
            <button type="button" onClick={() => setViewYear((value) => value + 1)} aria-label="Próximo ano">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mp-grid">
            {monthShortNames.map((label, index) => {
              const key = `${viewYear}-${String(index + 1).padStart(2, '0')}`
              return (
                <button
                  type="button"
                  key={key}
                  className={`mp-month ${key === month ? 'selected' : ''} ${key === currentKey ? 'current' : ''}`}
                  onClick={() => select(key)}
                  aria-pressed={key === month}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div className="mp-footer">
            <button type="button" className="mp-today" onClick={() => select(currentKey)} disabled={month === currentKey}>
              Ir para o mês atual
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

