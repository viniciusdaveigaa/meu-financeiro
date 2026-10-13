import { useState, useEffect } from 'react'
import {
  Check,
  CheckCircle2,
  Eye,
  Palette,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Sliders,
  X
} from 'lucide-react'
import {
  DEFAULT_THEME,
  PRESET_THEMES,
  applyTheme,
  detectActivePreset,
  getContrastColor,
  getSavedTheme,
  isValidHex,
  normalizeHex,
  resetToDefaultTheme,
  saveTheme
} from '../utils/theme'
import { useAppDialog } from './Dialog'
import { Money } from './ui'
import { supabase } from '../supabase'

export function ThemeCustomizationModal({ onClose, userId }) {
  const dialog = useAppDialog()
  const [initialTheme] = useState(() => getSavedTheme())
  const [currentTheme, setCurrentTheme] = useState(() => getSavedTheme())
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Aplica preview em tempo real ao alterar qualquer campo
  useEffect(() => {
    applyTheme(currentTheme)
  }, [currentTheme])

  // Se fechar sem salvar, restaura o tema inicial
  const handleCancel = () => {
    applyTheme(initialTheme)
    onClose()
  }

  const handleColorChange = (key, value) => {
    setCurrentTheme((prev) => ({
      ...prev,
      [key]: value
    }))
  }

  const handleHexInput = (key, text) => {
    let clean = text.trim()
    if (!clean.startsWith('#') && clean.length > 0) clean = `#${clean}`
    setCurrentTheme((prev) => ({
      ...prev,
      [key]: clean
    }))
  }

  const handleSelectPreset = (preset) => {
    setCurrentTheme({ ...preset })
    applyTheme(preset)
  }

  const handleResetDefaults = () => {
    setCurrentTheme({ ...DEFAULT_THEME })
    applyTheme(DEFAULT_THEME)
  }

  const handleSave = async () => {
    // Valida todos os campos HEX
    const keys = [
      'primaryColor',
      'accentColor',
      'darkElementsColor',
      'selectedBgColor',
      'interactiveColor'
    ]
    for (const key of keys) {
      if (!isValidHex(currentTheme[key])) {
        return dialog.alert(
          `O código informado para "${key}" não é um HEX válido (ex: #2563EB).`,
          { title: 'Código de cor inválido' }
        )
      }
    }

    saveTheme(currentTheme)
    setSavedSuccess(true)

    // Se estiver logado, salva também no perfil do Supabase para persistir entre dispositivos
    if (userId) {
      try {
        await supabase
          .from('profiles')
          .update({ theme_preferences: currentTheme })
          .eq('id', userId)
      } catch (err) {
        console.warn('Aviso ao sincronizar tema com Supabase:', err)
      }
    }

    setTimeout(() => {
      onClose()
    }, 600)
  }

  const activePresetId = detectActivePreset(currentTheme)
  const activePresetObj = PRESET_THEMES.find((p) => p.id === activePresetId)

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleCancel()
      }}
    >
      <div
        className="modal-sheet theme-modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-modal-title"
      >
        <div className="sheet-handle" />

        {/* Header */}
        <header className="modal-head theme-modal-header">
          <div className="theme-head-title">
            <span className="theme-icon-badge">
              <Palette size={22} />
            </span>
            <div className="theme-head-text">
              <h3 id="theme-modal-title">Personalização de Cores</h3>
              <p>Escolha um tema da nossa galeria ou personalize qualquer cor manualmente.</p>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn modal-close-btn"
            onClick={handleCancel}
            aria-label="Fechar"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="theme-modal-body">
          {/* Preset Palettes Gallery */}
          <section className="theme-section">
            <div className="theme-section-header">
              <div className="theme-section-title">
                <Sparkles size={16} />
                <span>Galeria de Temas Prontos ({PRESET_THEMES.length} opções)</span>
              </div>
              <div className="active-theme-indicator">
                {activePresetId !== 'custom' ? (
                  <span className="badge-theme-preset">
                    <Check size={12} /> {activePresetObj?.name}
                  </span>
                ) : (
                  <span className="badge-theme-custom">
                    Personalizado (Ajuste manual)
                  </span>
                )}
              </div>
            </div>

            <div className="preset-themes-grid">
              {PRESET_THEMES.map((preset) => {
                const isSelected = activePresetId === preset.id

                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`preset-theme-card ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(preset)}
                    title={`Aplicar tema ${preset.name} - ${preset.description}`}
                  >
                    <div className="preset-card-top">
                      <div className="preset-color-circles">
                        <span
                          style={{ background: preset.darkElementsColor }}
                          title="Fundo escuro / Topo"
                        />
                        <span
                          style={{ background: preset.primaryColor }}
                          title="Cor principal"
                        />
                        <span
                          style={{ background: preset.accentColor }}
                          title="Destaque"
                        />
                        <span
                          style={{ background: preset.selectedBgColor }}
                          title="Fundo suave"
                        />
                      </div>
                      {isSelected && (
                        <span className="preset-check-badge">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                    <div className="preset-card-info">
                      <strong className="preset-name">{preset.name}</strong>
                      <small className="preset-desc">{preset.description}</small>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Interactive Live Preview Box */}
          <section className="theme-section">
            <div className="theme-section-title">
              <Eye size={16} />
              <span>Prévia dos Elementos em Tempo Real</span>
            </div>
            <div className="theme-preview-box">
              {/* Top Simulated App Bar */}
              <div
                className="preview-header-bar"
                style={{ background: currentTheme.darkElementsColor }}
              >
                <span className="preview-logo-text">saldo<em>claro</em></span>
                <span
                  className="preview-badge"
                  style={{
                    background: currentTheme.selectedBgColor,
                    color: currentTheme.interactiveColor
                  }}
                >
                  {activePresetId !== 'custom' ? activePresetObj?.name : 'Personalizado'}
                </span>
              </div>

              {/* Sample Card with Values and Buttons */}
              <div className="preview-card-body">
                <div className="preview-meta">
                  <span className="preview-label">Saldo disponível</span>
                  <strong className="preview-val" style={{ color: currentTheme.primaryColor }}>
                    R$ 8.450,00
                  </strong>
                </div>

                <div className="preview-actions-row">
                  <button
                    type="button"
                    className="btn btn-sm preview-btn-primary"
                    style={{
                      background: currentTheme.primaryColor,
                      color: getContrastColor(currentTheme.primaryColor)
                    }}
                  >
                    Botão Principal
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm preview-btn-accent"
                    style={{
                      background: currentTheme.accentColor,
                      color: getContrastColor(currentTheme.accentColor)
                    }}
                  >
                    Destaque
                  </button>
                  <span
                    className="preview-tag-pill"
                    style={{
                      background: currentTheme.selectedBgColor,
                      color: currentTheme.interactiveColor
                    }}
                  >
                    Tag Selecionada
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Detailed Color Pickers */}
          <section className="theme-section">
            <div className="theme-section-title">
              <Sliders size={16} />
              <span>Ajuste Manual e Códigos HEX</span>
            </div>
            <p className="theme-section-hint">
              Altere qualquer cor manualmente com o seletor visual ou informe o código HEX (ex: #2563EB).
            </p>

            <div className="color-fields-grid">
              {/* 1. Elementos em Verde Escuro / Fundo Profundo */}
              <div className="color-field-card">
                <div className="color-field-info">
                  <label htmlFor="color-dark-elements">
                    <strong>Elementos Escuros e Topo</strong>
                  </label>
                  <span>Substitui a topbar e fundos de contraste profundo</span>
                </div>
                <div className="color-field-inputs">
                  <input
                    id="color-dark-elements"
                    type="color"
                    className="color-picker-input"
                    value={normalizeHex(currentTheme.darkElementsColor)}
                    onChange={(e) => handleColorChange('darkElementsColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="hex-text-input"
                    value={currentTheme.darkElementsColor}
                    onChange={(e) => handleHexInput('darkElementsColor', e.target.value)}
                    maxLength={7}
                    placeholder="#0a251f"
                  />
                </div>
              </div>

              {/* 2. Cor Principal */}
              <div className="color-field-card">
                <div className="color-field-info">
                  <label htmlFor="color-primary">
                    <strong>Cor Principal do Aplicativo</strong>
                  </label>
                  <span>Botões primários, títulos e destaques essenciais</span>
                </div>
                <div className="color-field-inputs">
                  <input
                    id="color-primary"
                    type="color"
                    className="color-picker-input"
                    value={normalizeHex(currentTheme.primaryColor)}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="hex-text-input"
                    value={currentTheme.primaryColor}
                    onChange={(e) => handleHexInput('primaryColor', e.target.value)}
                    maxLength={7}
                    placeholder="#10382f"
                  />
                </div>
              </div>

              {/* 3. Cor de Destaque */}
              <div className="color-field-card">
                <div className="color-field-info">
                  <label htmlFor="color-accent">
                    <strong>Cor de Destaque dos Botões e Links</strong>
                  </label>
                  <span>Realces vibrantes, links e ações secundárias</span>
                </div>
                <div className="color-field-inputs">
                  <input
                    id="color-accent"
                    type="color"
                    className="color-picker-input"
                    value={normalizeHex(currentTheme.accentColor)}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="hex-text-input"
                    value={currentTheme.accentColor}
                    onChange={(e) => handleHexInput('accentColor', e.target.value)}
                    maxLength={7}
                    placeholder="#1f9d6b"
                  />
                </div>
              </div>

              {/* 4. Menus e Navegação */}
              <div className="color-field-card">
                <div className="color-field-info">
                  <label htmlFor="color-interactive">
                    <strong>Destaque dos Menus e Navegação</strong>
                  </label>
                  <span>Abas ativas, botões de ação e ícones interativos</span>
                </div>
                <div className="color-field-inputs">
                  <input
                    id="color-interactive"
                    type="color"
                    className="color-picker-input"
                    value={normalizeHex(currentTheme.interactiveColor)}
                    onChange={(e) => handleColorChange('interactiveColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="hex-text-input"
                    value={currentTheme.interactiveColor}
                    onChange={(e) => handleHexInput('interactiveColor', e.target.value)}
                    maxLength={7}
                    placeholder="#164e40"
                  />
                </div>
              </div>

              {/* 5. Fundo Selecionado */}
              <div className="color-field-card">
                <div className="color-field-info">
                  <label htmlFor="color-selected-bg">
                    <strong>Fundo de Elementos Selecionados</strong>
                  </label>
                  <span>Badges suaves, filtros ativos e estados de foco</span>
                </div>
                <div className="color-field-inputs">
                  <input
                    id="color-selected-bg"
                    type="color"
                    className="color-picker-input"
                    value={normalizeHex(currentTheme.selectedBgColor)}
                    onChange={(e) => handleColorChange('selectedBgColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="hex-text-input"
                    value={currentTheme.selectedBgColor}
                    onChange={(e) => handleHexInput('selectedBgColor', e.target.value)}
                    maxLength={7}
                    placeholder="#dcfce7"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <footer className="modal-foot theme-modal-foot">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleResetDefaults}
            title="Voltar ao tema Verde original do aplicativo"
          >
            <RotateCcw size={15} />
            <span>Restaurar tema padrão</span>
          </button>

          <div className="modal-foot-right">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCancel}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSave}
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 size={16} /> Salvo!
                </>
              ) : (
                'Salvar preferências'
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
