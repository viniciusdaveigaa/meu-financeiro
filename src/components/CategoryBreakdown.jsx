import { useState } from 'react'
import { ChartPie } from 'lucide-react'
import { useCategories } from '../context/CategoryContext'
import { CategoryIcon, Money } from './ui'

const RADIUS = 70
const STROKE = 18
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function CategoryBreakdown({ grouped }) {
  const { getMeta } = useCategories()
  const [active, setActive] = useState(null)
  const sorted = [...grouped].sort((a, b) => b.amount - a.amount)
  const total = sorted.reduce((sum, item) => sum + item.amount, 0)
  const gap = sorted.length > 1 ? 3 : 0

  let offset = 0
  const segments = sorted.map((item) => {
    const length = (item.amount / total) * CIRCUMFERENCE
    const segment = {
      ...item,
      length: Math.max(length - gap, 0.6),
      offset,
      percent: Math.round((item.amount / total) * 100)
    }
    offset += length
    return segment
  })
  const activeItem = segments.find((item) => item.category === active)

  return (
    <article className="card category-card">
      <header className="card-head">
        <div>
          <span className="eyebrow">Distribuição</span>
          <h3 className="card-title">Para onde foi o dinheiro</h3>
        </div>
      </header>

      {sorted.length === 0 ? (
        <div className="empty-state compact">
          <span className="empty-icon"><ChartPie size={22} /></span>
          <p>Nenhuma saída registrada neste mês.</p>
        </div>
      ) : (
        <div className="donut-layout">
          <div className="donut-wrap">
            <svg viewBox="0 0 180 180" className="donut" role="img" aria-label="Gastos por categoria">
              <circle cx="90" cy="90" r={RADIUS} className="donut-track" strokeWidth={STROKE} fill="none" />
              <g transform="rotate(-90 90 90)">
                {segments.map((item) => {
                  const meta = getMeta(item.category)
                  const isActive = active === item.category
                  return (
                    <circle
                      key={item.category}
                      cx="90"
                      cy="90"
                      r={RADIUS}
                      fill="none"
                      stroke={meta.color}
                      strokeWidth={isActive ? STROKE + 7 : STROKE}
                      strokeDasharray={`${item.length} ${CIRCUMFERENCE - item.length}`}
                      strokeDashoffset={-item.offset}
                      className={`donut-seg ${active && !isActive ? 'dim' : ''}`}
                      onMouseEnter={() => setActive(item.category)}
                      onMouseLeave={() => setActive(null)}
                      onClick={() =>
                        setActive((value) => (value === item.category ? null : item.category))
                      }
                    />
                  )
                })}
              </g>
            </svg>
            <div className="donut-center">
              {activeItem ? (
                <>
                  <span>{getMeta(activeItem.category).label}</span>
                  <strong><Money value={activeItem.amount} /></strong>
                  <small>{activeItem.percent}% das saídas</small>
                </>
              ) : (
                <>
                  <span>Total de saídas</span>
                  <strong><Money value={total} /></strong>
                  <small>{sorted.length} {sorted.length === 1 ? 'categoria' : 'categorias'}</small>
                </>
              )}
            </div>
          </div>

          <ul className="cat-legend">
            {segments.map((item) => {
              const meta = getMeta(item.category)
              return (
                <li
                  key={item.category}
                  className={`${active === item.category ? 'active' : ''} ${
                    active && active !== item.category ? 'dim' : ''
                  }`}
                  onMouseEnter={() => setActive(item.category)}
                  onMouseLeave={() => setActive(null)}
                >
                  <CategoryIcon category={item.category} size={34} />
                  <div className="cat-legend-info">
                    <div className="cat-legend-line">
                      <span>{meta.label}</span>
                      <Money value={item.amount} />
                    </div>
                    <div className="bar-track thin">
                      <i style={{ width: `${Math.max(item.percent, 2)}%`, background: meta.color }} />
                    </div>
                  </div>
                  <span className="cat-legend-pct">{item.percent}%</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </article>
  )
}
