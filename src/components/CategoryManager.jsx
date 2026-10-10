import { useState } from 'react'
import { Check, Info, Palette, Plus, Tag, Trash2, X } from 'lucide-react'
import { colorPalette, iconCatalog } from '../constants/categories'
import { useCategories } from '../context/CategoryContext'
import { useAppDialog } from './Dialog'
import { CategoryIcon } from './ui'

export function CategoryManager() {
  const dialog = useAppDialog()
  const { categories, customCategories, addCategory, deleteCategory } = useCategories()

  const [openCreate, setOpenCreate] = useState(false)
  const [name, setName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('Tag')
  const [selectedColor, setSelectedColor] = useState(colorPalette[0])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!name.trim()) {
      setFormError('Informe um nome para a categoria.')
      return
    }

    setSaving(true)
    const result = await addCategory({
      name: name.trim(),
      iconName: selectedIcon,
      color: selectedColor.color,
      bg: selectedColor.bg
    })
    setSaving(false)

    if (result?.error) {
      setFormError(result.error)
      return
    }

    setName('')
    setSelectedIcon('Tag')
    setSelectedColor(colorPalette[0])
    setOpenCreate(false)
  }

  const handleDelete = async (category) => {
    const confirmed = await dialog.confirm(
      `Deseja remover a categoria “${category.name}”? Os lançamentos que já utilizam essa categoria continuarão preservados no extrato.`,
      { title: 'Remover categoria?', confirmLabel: 'Sim, remover' }
    )
    if (!confirmed) return
    await deleteCategory(category.id)
  }

  const PreviewIcon = iconCatalog[selectedIcon]?.icon || Tag

  return (
    <article className="card category-manager-card">
      <header className="card-head">
        <div>
          <span className="eyebrow">Personalização</span>
          <h3 className="card-title">Categorias Financeiras</h3>
        </div>
        <div className="card-head-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setOpenCreate(!openCreate)}
          >
            {openCreate ? <X size={15} /> : <Plus size={15} />}
            {openCreate ? 'Fechar' : 'Nova categoria'}
          </button>
        </div>
      </header>

      {/* Top Banner KPI */}
      <div className="budget-kpi-banner">
        <div className="kpi-item">
          <span className="kpi-label">Total de categorias</span>
          <strong className="kpi-val">{categories.length}</strong>
        </div>
        <div className="kpi-item">
          <span className="kpi-label">Criadas por você</span>
          <strong className="kpi-val pos">{customCategories.length}</strong>
        </div>
        <div className="kpi-item">
          <span className="kpi-label">Categorias padrão</span>
          <strong className="kpi-val">10</strong>
        </div>
      </div>

      {/* Modal/Form to create new category */}
      {openCreate && (
        <form onSubmit={handleCreate} className="new-category-form">
          <div className="form-head-title">
            <Palette size={18} />
            <h4>Criar nova categoria</h4>
          </div>

          {formError && (
            <div className="auth-alert error" role="alert">
              <span>{formError}</span>
            </div>
          )}

          <div className="category-create-grid">
            {/* Left: Fields */}
            <div className="cat-form-fields">
              <label className="field">
                <span>Nome da categoria</span>
                <input
                  type="text"
                  required
                  placeholder="Ex.: Pets, Investimentos, Cuidados Pessoais"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  autoFocus
                />
              </label>

              {/* Icon Picker */}
              <div className="field">
                <span>Escolha o ícone</span>
                <div className="icon-selector-grid">
                  {Object.entries(iconCatalog).map(([key, item]) => {
                    const IconComp = item.icon
                    const isSelected = selectedIcon === key
                    return (
                      <button
                        type="button"
                        key={key}
                        className={`icon-choice-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedIcon(key)}
                        title={item.label}
                      >
                        <IconComp size={18} />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Color Picker */}
              <div className="field">
                <span>Escolha a cor</span>
                <div className="color-selector-row">
                  {colorPalette.map((item) => {
                    const isSelected = selectedColor.color === item.color
                    return (
                      <button
                        type="button"
                        key={item.color}
                        className={`color-choice-btn ${isSelected ? 'selected' : ''}`}
                        style={{ backgroundColor: item.color }}
                        onClick={() => setSelectedColor(item)}
                        title={item.name}
                      >
                        {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right: Live Preview */}
            <div className="cat-preview-panel">
              <span className="preview-label">Pré-visualização</span>
              <div className="cat-preview-card">
                <span
                  className="cat-preview-icon"
                  style={{
                    backgroundColor: selectedColor.bg,
                    color: selectedColor.color
                  }}
                >
                  <PreviewIcon size={24} />
                </span>
                <strong className="cat-preview-name">
                  {name.trim() || 'Nome da Categoria'}
                </strong>
                <small className="cat-preview-sub">Exemplo no extrato</small>
              </div>
            </div>
          </div>

          <div className="modal-foot">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setOpenCreate(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Cadastrar categoria'}
            </button>
          </div>
        </form>
      )}

      {/* Categories List */}
      <div className="categories-manage-grid">
        {categories.map((catName) => {
          const custom = customCategories.find(
            (c) => c.name.toLowerCase() === catName.toLowerCase() || c.id === catName
          )
          const isCustom = Boolean(custom)

          return (
            <div key={catName} className="cat-manage-item">
              <CategoryIcon category={catName} size={38} />
              <div className="cat-manage-info">
                <strong>{custom ? custom.name : catName}</strong>
                <small className="cat-manage-badge">
                  {isCustom ? 'Personalizada' : 'Padrão'}
                </small>
              </div>
              {isCustom && (
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => handleDelete(custom)}
                  title="Remover categoria"
                  aria-label={`Remover ${custom.name}`}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </article>
  )
}

