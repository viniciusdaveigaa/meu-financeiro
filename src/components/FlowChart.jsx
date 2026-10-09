import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, MousePointerClick, RotateCcw } from 'lucide-react'
import { changeMonth, compactNumber, getMonthKey, monthNames, monthShortNames, percentChange } from '../utils/formatters'
import { usePrivacy } from '../context/PrivacyContext'
import { Money } from './ui'

const MODES = [
  { id: 'flow', label: 'Fluxo' },
  { id: 'bars', label: 'Barras' },
  { id: 'balance', label: 'Saldo' },
]
const RANGES = [3, 6, 12]

function useElementWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    setWidth(element.getBoundingClientRect().width)
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}

function niceDomain(min, max, ticks = 4) {
  if (max - min < 1) max = min + 100
  const raw = (max - min) / ticks
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const normalized = raw / magnitude
  const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10) * magnitude
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const values = []
  for (let value = lo; value <= hi + step / 2; value += step) values.push(Math.round(value * 100) / 100)
  return { lo, hi, values }
}

function smoothPath(points) {
  if (!points.length) return ''
  let path = `M${points[0][0]},${points[0][1]}`
  for (let index = 1; index < points.length; index++) {
    const [x0, y0] = points[index - 1]
    const [x1, y1] = points[index]
    const mid = (x0 + x1) / 2
    path += ` C${mid},${y0} ${mid},${y1} ${x1},${y1}`
  }
  return path
}

function barPath(x, yTop, width, yBase, radius = 5) {
  const height = yBase - yTop
  if (Math.abs(height) < 0.5) return ''
  if (height > 0) {
    const r = Math.min(radius, width / 2, height)
    return `M${x},${yBase} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + width - r} Q${x + width},${yTop} ${x + width},${yTop + r} V${yBase} Z`
  }
  const r = Math.min(radius, width / 2, -height)
  return `M${x},${yBase} V${yTop - r} Q${x},${yTop} ${x + r},${yTop} H${x + width - r} Q${x + width},${yTop} ${x + width},${yTop - r} V${yBase} Z`
}

export function FlowChart({ entries, month, onSelectMonth, onResetMonth }) {
  const { hidden } = usePrivacy()
  const [mode, setMode] = useState('flow')
  const [range, setRange] = useState(6)
  const [hover, setHover] = useState(null)
  const [wrapRef, width] = useElementWidth()
  const pointerType = useRef('mouse')

  const currentKey = getMonthKey(new Date())
  const isDifferentFromCurrent = month !== currentKey

  const data = useMemo(() => {
    let running = 0
    return Array.from({ length: range }, (_, index) => {
      const key = changeMonth(month, index - (range - 1))
      const items = entries.filter((item) => item.date?.startsWith(key) && item.affects_balance !== false)
      const income = items.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0)
      const expense = items.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0)
      running += income - expense
      const monthIndex = Number(key.slice(5)) - 1
      return {
        key,
        label: monthShortNames[monthIndex].toLowerCase(),
        fullLabel: `${monthNames[monthIndex]} de ${key.slice(0, 4)}`,
        income,
        expense,
        net: income - expense,
        balance: running
      }
    })
  }, [entries, month, range])

  useEffect(() => setHover(null), [mode, range, month])

  const compactWidth = width < 520
  const height = compactWidth ? 230 : 280
  const pad = { top: 20, right: 14, bottom: 34, left: hidden ? 14 : compactWidth ? 44 : 54 }
  const innerW = Math.max(width - pad.left - pad.right, 10)
  const innerH = height - pad.top - pad.bottom
  const band = innerW / data.length
  const xAt = (index) => pad.left + band * (index + 0.5)

  const scaleValues = mode === 'balance' ? data.flatMap((item) => [item.balance, item.net]) : data.flatMap((item) => [item.income, item.expense])
  const domain = niceDomain(Math.min(0, ...scaleValues), Math.max(0, ...scaleValues))
  const yAt = (value) => pad.top + innerH - ((value - domain.lo) / (domain.hi - domain.lo)) * innerH
  const zeroY = yAt(0)

  const incomePoints = data.map((item, index) => [xAt(index), yAt(item.income)])
  const expensePoints = data.map((item, index) => [xAt(index), yAt(item.expense)])
  const balancePoints = data.map((item, index) => [xAt(index), yAt(item.balance)])
  const areaPath = (points) => `${smoothPath(points)} L${points.at(-1)[0]},${zeroY} L${points[0][0]},${zeroY} Z`

  const totals = data.reduce((acc, item) => ({ income: acc.income + item.income, expense: acc.expense + item.expense }), { income: 0, expense: 0 })
  const averageExpense = totals.expense / data.length
  const best = data.reduce((top, item) => (item.net > top.net ? item : top), data[0])
  const isEmpty = totals.income === 0 && totals.expense === 0
  const barWidth = Math.max(Math.min(band * 0.26, 22), 4)
  const showLabel = (index) => band >= 30 || index % 2 === (data.length - 1) % 2
  const animationKey = `${mode}-${range}-${month}`

  const hovered = hover !== null ? data[hover] : null
  const previous = hover > 0 ? data[hover - 1] : null
  const expenseDelta = hovered && previous ? percentChange(hovered.expense, previous.expense) : null
  const savingsRate = hovered && hovered.income > 0 ? Math.round((hovered.net / hovered.income) * 100) : null

  const handleClick = (index) => {
    if (pointerType.current !== 'mouse' && hover !== index) {
      setHover(index)
      return
    }
    if (data[index].key !== month) onSelectMonth?.(data[index].key)
  }

  return (
    <article className="card chart-card">
      <header className="card-head">
        <div>
          <div className="chart-title-line">
            <span className="eyebrow">Evolução</span>
            {isDifferentFromCurrent && onResetMonth && (
              <button
                type="button"
                className="btn btn-outline btn-xs btn-chart-reset"
                onClick={onResetMonth}
                title="Voltar o gráfico e painel para o mês atual"
              >
                <RotateCcw size={12} />
                <span>Resetar mês</span>
              </button>
            )}
          </div>
          <h3 className="card-title">
            {mode === 'balance' ? 'Saldo acumulado no período' : 'Entradas e saídas'}
          </h3>
        </div>

        <div className="chart-controls">
          <div className="segmented" role="tablist" aria-label="Tipo de gráfico">
            {MODES.map((item) => (
              <button key={item.id} type="button" role="tab" aria-selected={mode === item.id} className={mode === item.id ? 'active' : ''} onClick={() => setMode(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="segmented segmented-small" role="tablist" aria-label="Período do gráfico">
            {RANGES.map((value) => (
              <button key={value} type="button" role="tab" aria-selected={range === value} className={range === value ? 'active' : ''} onClick={() => setRange(value)}>
                {value}M
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="chart-legend">
        {mode === 'balance' ? (
          <>
            <span><i className="dot dot-balance" />Saldo acumulado</span>
            <span><i className="dot dot-net" />Resultado do mês</span>
          </>
        ) : (
          <>
            <span><i className="dot dot-income" />Entradas</span>
            <span><i className="dot dot-expense" />Saídas</span>
            {mode === 'flow' && averageExpense > 0 && <span><i className="dash" />Média de saídas</span>}
          </>
        )}
      </div>

      <div className="chart-canvas" ref={wrapRef} onPointerLeave={(event) => event.pointerType === 'mouse' && setHover(null)}>
        {width > 0 && (
          <svg width={width} height={height} className={`chart-svg ${hover !== null ? 'has-hover' : ''}`} role="img" aria-label="Gráfico de entradas e saídas por mês">
            <defs>
              <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1f9d6b" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#1f9d6b" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e4764c" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#e4764c" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="gradBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1d6453" stopOpacity="0.26" />
                <stop offset="100%" stopColor="#1d6453" stopOpacity="0" />
              </linearGradient>
            </defs>

            {domain.values.map((value) => (
              <g key={value}>
                <line x1={pad.left} x2={width - pad.right} y1={yAt(value)} y2={yAt(value)} className={value === 0 ? 'axis-zero' : 'axis-grid'} />
                {!hidden && (
                  <text x={pad.left - 10} y={yAt(value) + 4} textAnchor="end" className="axis-label">
                    {compactNumber.format(value)}
                  </text>
                )}
              </g>
            ))}

            {hover !== null && <rect x={pad.left + band * hover + 3} y={pad.top - 8} width={band - 6} height={innerH + 8} rx="10" className="hover-band" />}

            <g key={animationKey} className="chart-series">
              {mode === 'flow' && (
                <>
                  <path d={areaPath(incomePoints)} fill="url(#gradIncome)" className="fade-in" />
                  <path d={areaPath(expensePoints)} fill="url(#gradExpense)" className="fade-in" />
                  {averageExpense > 0 && <line x1={pad.left} x2={width - pad.right} y1={yAt(averageExpense)} y2={yAt(averageExpense)} className="avg-line" />}
                  <path d={smoothPath(incomePoints)} pathLength="1" className="line line-income draw" />
                  <path d={smoothPath(expensePoints)} pathLength="1" className="line line-expense draw" />
                  {data.map((item, index) => (
                    <g key={item.key} className={`pt-group ${hover === index ? 'active' : ''}`}>
                      <circle cx={incomePoints[index][0]} cy={incomePoints[index][1]} r="11" className="halo halo-income" />
                      <circle cx={expensePoints[index][0]} cy={expensePoints[index][1]} r="11" className="halo halo-expense" />
                      <circle cx={incomePoints[index][0]} cy={incomePoints[index][1]} r={hover === index ? 5.5 : 3.5} className="pt pt-income" />
                      <circle cx={expensePoints[index][0]} cy={expensePoints[index][1]} r={hover === index ? 5.5 : 3.5} className="pt pt-expense" />
                    </g>
                  ))}
                </>
              )}

              {mode === 'bars' &&
                data.map((item, index) => (
                  <g key={item.key} className={`bar-group ${hover === index ? 'active' : ''}`}>
                    <path d={barPath(xAt(index) - barWidth - 2, yAt(item.income), barWidth, zeroY)} className="bar bar-income" />
                    <path d={barPath(xAt(index) + 2, yAt(item.expense), barWidth, zeroY)} className="bar bar-expense" />
                  </g>
                ))}

              {mode === 'balance' && (
                <>
                  {data.map((item, index) => (
                    <g key={item.key} className={`bar-group ${hover === index ? 'active' : ''}`}>
                      <path d={barPath(xAt(index) - barWidth / 2, yAt(item.net), barWidth, zeroY)} className={`bar ${item.net >= 0 ? 'bar-net-pos' : 'bar-net-neg'}`} />
                    </g>
                  ))}
                  <path d={areaPath(balancePoints)} fill="url(#gradBalance)" className="fade-in" />
                  <path d={smoothPath(balancePoints)} pathLength="1" className="line line-balance draw" />
                  {data.map((item, index) => (
                    <g key={item.key} className={`pt-group ${hover === index ? 'active' : ''}`}>
                      <circle cx={balancePoints[index][0]} cy={balancePoints[index][1]} r="11" className="halo halo-balance" />
                      <circle cx={balancePoints[index][0]} cy={balancePoints[index][1]} r={hover === index ? 5.5 : 3.5} className="pt pt-balance" />
                    </g>
                  ))}
                </>
              )}
            </g>

            {hover !== null && <line x1={xAt(hover)} x2={xAt(hover)} y1={pad.top - 4} y2={pad.top + innerH} className="guide-line" />}

            {data.map((item, index) =>
              showLabel(index) ? (
                <text key={item.key} x={xAt(index)} y={height - 10} textAnchor="middle" className={`axis-month ${item.key === month ? 'current' : ''} ${hover === index ? 'hovered' : ''}`}>
                  {item.label}
                </text>
              ) : null
            )}

            {data.map((item, index) => (
              <rect
                key={item.key}
                x={pad.left + band * index}
                y={0}
                width={band}
                height={height}
                fill="transparent"
                className="hit-area"
                onPointerDown={(event) => { pointerType.current = event.pointerType }}
                onPointerEnter={(event) => event.pointerType === 'mouse' && setHover(index)}
                onClick={() => handleClick(index)}
              />
            ))}
          </svg>
        )}

        {isEmpty && width > 0 && <div className="chart-empty">Sem movimentações neste período</div>}

        {hovered && (
          <div className={`chart-tooltip ${xAt(hover) > width / 2 ? 'to-left' : 'to-right'}`} style={{ left: xAt(hover), top: pad.top }}>
            <strong className="tt-title">{hovered.fullLabel}</strong>
            {mode === 'balance' ? (
              <>
                <div className="tt-row"><span><i className="dot dot-balance" />Saldo acumulado</span><Money value={hovered.balance} /></div>
                <div className="tt-row"><span><i className="dot dot-net" />Resultado do mês</span><Money value={hovered.net} className={hovered.net >= 0 ? 'pos' : 'neg'} /></div>
                <div className="tt-sep" />
                <div className="tt-row muted"><span>Entradas</span><Money value={hovered.income} /></div>
                <div className="tt-row muted"><span>Saídas</span><Money value={hovered.expense} /></div>
              </>
            ) : (
              <>
                <div className="tt-row"><span><i className="dot dot-income" />Entradas</span><Money value={hovered.income} /></div>
                <div className="tt-row"><span><i className="dot dot-expense" />Saídas</span><Money value={hovered.expense} /></div>
                <div className="tt-sep" />
                <div className="tt-row"><span>Resultado</span><Money value={hovered.net} className={hovered.net >= 0 ? 'pos' : 'neg'} /></div>
                {savingsRate !== null && <div className="tt-row muted"><span>Taxa de economia</span><b>{savingsRate}%</b></div>}
              </>
            )}
            {expenseDelta !== null && (
              <div className={`tt-delta ${expenseDelta > 0 ? 'bad' : 'good'}`}>
                {expenseDelta > 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                Saídas {Math.abs(expenseDelta)}% {expenseDelta > 0 ? 'maiores' : 'menores'} que em {previous.label}
              </div>
            )}
            {hovered.key !== month && (
              <div className="tt-hint"><MousePointerClick size={12} />Clique para abrir este mês</div>
            )}
          </div>
        )}
      </div>

      <footer className="chart-summary">
        <div><span>Entradas no período</span><Money value={totals.income} className="pos" /></div>
        <div><span>Saídas no período</span><Money value={totals.expense} className="neg" /></div>
        <div><span>Média mensal de saídas</span><Money value={averageExpense} /></div>
        <div><span>Melhor mês</span>{best && best.net > 0 ? <b>{best.label} · <Money value={best.net} /></b> : <b>—</b>}</div>
      </footer>
    </article>
  )
}
