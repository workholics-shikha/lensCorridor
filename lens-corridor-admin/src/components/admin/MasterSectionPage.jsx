import { useEffect, useMemo, useState } from 'react'

import { InfoCard, MiniCard, StatusBadge } from './AdminUiPrimitives'
import { buildApiUrl } from '../../lib/api'

const adminBaseUrl = buildApiUrl('')

const buildPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 1) {
    return [1]
  }

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1])
  const normalizedPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)

  const items = []
  normalizedPages.forEach((page, index) => {
    const previousPage = normalizedPages[index - 1]
    if (previousPage && page - previousPage > 1) {
      items.push(`ellipsis-${previousPage}-${page}`)
    }
    items.push(page)
  })

  return items
}

const MasterSectionPage = ({
  closeLensCategoryEditor,
  currentMaster,
  getStatusTone,
  isFrameShapesMaster,
  isLensCategoryEditorOpen,
  masterCountLabel,
  masterError,
  masterLoading,
  normalizedMasterItems,
  openLensCategoryEditor,
  powerTypes = [],
  powerTypesError,
  powerTypesLoading,
  refreshMasterItems,
  selectedMaster,
  selectedMasterIndex,
  setSelectedMasterIndex,
}) => {
  const isLensCategoryMaster = currentMaster.key === 'lens-category'
  const itemsPerPage = 8
  const [page, setPage] = useState(1)
  const [draftPowerTypeIds, setDraftPowerTypeIds] = useState([])
  const [lensCategorySaving, setLensCategorySaving] = useState(false)
  const [lensCategoryForm, setLensCategoryForm] = useState({
    categoryName: '',
    displayLabel: '',
    linkedPricingBand: '',
    description: '',
    usageAndMapping: '',
    priority: '',
    status: 'Active',
    internalCode: '',
  })

  useEffect(() => {
    setPage(1)
  }, [currentMaster.key])

  useEffect(() => {
    if (!isLensCategoryMaster) {
      setDraftPowerTypeIds([])
      setLensCategoryForm({
        categoryName: '',
        displayLabel: '',
        linkedPricingBand: '',
        description: '',
        usageAndMapping: '',
        priority: '',
        status: 'Active',
        internalCode: '',
      })
      return
    }

    const selectedIds = Array.isArray(selectedMaster?.powertype_id)
      ? selectedMaster.powertype_id.map((item) => item?._id || item?.id || item).filter(Boolean)
      : []

    setDraftPowerTypeIds(selectedIds)
    setLensCategoryForm({
      categoryName: selectedMaster?.title ?? '',
      displayLabel: selectedMaster?.detailValues?.[1] ?? '',
      linkedPricingBand: selectedMaster?.detailValues?.[2] ?? '',
      description: selectedMaster?.detailValues?.[3] ?? '',
      usageAndMapping: selectedMaster?.usageAndMapping ?? selectedMaster?.subtitle ?? '',
      priority: selectedMaster?.detailValues?.[4] ?? '',
      status: selectedMaster?.detailValues?.[5] ?? 'Active',
      internalCode: selectedMaster?.detailValues?.[6] ?? '',
    })
  }, [isLensCategoryMaster, selectedMaster, selectedMasterIndex])

  const totalPages = isLensCategoryMaster
    ? Math.max(1, Math.ceil(normalizedMasterItems.length / itemsPerPage))
    : 1

  const paginatedItems = useMemo(() => {
    if (!isLensCategoryMaster) {
      return normalizedMasterItems.map((item, index) => ({ item, absoluteIndex: index }))
    }

    const start = (page - 1) * itemsPerPage
    return normalizedMasterItems
      .slice(start, start + itemsPerPage)
      .map((item, index) => ({ item, absoluteIndex: start + index }))
  }, [isLensCategoryMaster, normalizedMasterItems, page])

  const paginationItems = useMemo(
    () => buildPaginationItems(page, totalPages),
    [page, totalPages]
  )

  useEffect(() => {
    if (!isLensCategoryMaster) {
      return
    }

    const start = (page - 1) * itemsPerPage
    const end = start + itemsPerPage - 1
    if (selectedMasterIndex < start || selectedMasterIndex > end) {
      setSelectedMasterIndex(start)
    }
  }, [isLensCategoryMaster, page, selectedMasterIndex, setSelectedMasterIndex])

  const handleLensCategoryUpdate = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      alert('Admin token missing')
      return
    }

    if (!selectedMaster) {
      alert('No lens category selected')
      return
    }

    setLensCategorySaving(true)

    try {
      const categoryName = lensCategoryForm.categoryName.trim()
      const displayLabel = lensCategoryForm.displayLabel.trim()
      const linkedPricingBand = lensCategoryForm.linkedPricingBand.trim()
      const description = lensCategoryForm.description.trim()
      const usageAndMapping = lensCategoryForm.usageAndMapping.trim()
      const powertype_id = draftPowerTypeIds
      const priorityValue = lensCategoryForm.priority
      const priority = priorityValue === '' || priorityValue === '-' || priorityValue === undefined
        ? 0
        : Number(priorityValue)
      const status = lensCategoryForm.status || 'Active'
      const internalCode = lensCategoryForm.internalCode.trim()
      const id = selectedMaster.id || selectedMaster._id

      if (!categoryName || !displayLabel) {
        throw new Error('Category name and display label are required')
      }

      const res = await fetch(`${adminBaseUrl}/api/masters/lens-category/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryName,
          displayLabel,
          linkedPricingBand,
          description,
          usageAndMapping,
          powertype_id,
          priority,
          status,
          internalCode,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data?.error || data?.message || 'Update failed')
      }

      refreshMasterItems()
      closeLensCategoryEditor()
    } catch (error) {
      alert(error.message || 'Update failed')
    } finally {
      setLensCategorySaving(false)
    }
  }

  if (isLensCategoryMaster && isLensCategoryEditorOpen) {
    return (
      <div className="section-grid">
        <section className="panel detail-panel compact-lens-editor">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Lens category editor</p>
              <h4>{selectedMaster ? `Update ${selectedMaster.title}` : currentMaster.detailTitle}</h4>
            </div>
            <div className="filter-pills">
              <button className="ghost-btn" onClick={closeLensCategoryEditor} type="button">Back To Listing</button>
              <button
                className="primary-btn soft-btn"
                disabled={masterLoading || lensCategorySaving || !selectedMaster}
                onClick={handleLensCategoryUpdate}
                type="button"
              >
                {lensCategorySaving ? 'Updating...' : 'Update Mapping'}
              </button>
            </div>
          </div>

          <div className="info-grid compact-info-grid lens-editor-summary" style={{ marginBottom: '18px' }}>
            <InfoCard label="Status" value={selectedMaster?.status ?? '-'} />
            <InfoCard label="Reference" value={selectedMaster?.code ?? '-'} />
            <InfoCard label="Display Label" value={selectedMaster?.detailValues?.[1] ?? '-'} />
            <InfoCard label="Linked Pricing Band" value={selectedMaster?.detailValues?.[2] ?? '-'} />
          </div>

          {powerTypesError ? (
            <div className="task-item" style={{ marginBottom: '14px' }}>
              <strong>Power types unavailable</strong>
              <small>{powerTypesError}</small>
            </div>
          ) : null}

          <div className="form-wire lens-category-wire lens-editor-layout">
            <section className="lens-editor-card">
              <div className="lens-editor-card-head">
                <div>
                  <p className="eyebrow">Core Details</p>
                  <h5>Category identity and customer-facing copy</h5>
                </div>
              </div>
              <div className="field split compact-field-split">
                <div className="field compact-field">
                  <label>{currentMaster.fields[0]}</label>
                  <input
                    className="input filled"
                    value={lensCategoryForm.categoryName}
                    disabled={masterLoading || lensCategorySaving}
                    onChange={(e) => {
                      setLensCategoryForm((current) => ({ ...current, categoryName: e.target.value }))
                    }}
                  />
                </div>
                <div className="field compact-field">
                  <label>{currentMaster.fields[1]}</label>
                  <input
                    className="input filled"
                    value={lensCategoryForm.displayLabel}
                    disabled={masterLoading || lensCategorySaving}
                    onChange={(e) => {
                      setLensCategoryForm((current) => ({ ...current, displayLabel: e.target.value }))
                    }}
                  />
                </div>
              </div>
              <div className="field split compact-field-split lens-editor-description-row">
                <div className="field compact-field">
                  <label>{currentMaster.fields[2]}</label>
                  <input
                    className="input filled"
                    value={lensCategoryForm.linkedPricingBand}
                    disabled={masterLoading || lensCategorySaving}
                    onChange={(e) => {
                      setLensCategoryForm((current) => ({ ...current, linkedPricingBand: e.target.value }))
                    }}
                  />
                </div>
                <div className="field compact-field">
                  <label>{currentMaster.fields[3]}</label>
                  <textarea
                    className="input filled compact-textarea"
                    value={lensCategoryForm.description}
                    disabled={masterLoading || lensCategorySaving}
                    onChange={(e) => {
                      setLensCategoryForm((current) => ({ ...current, description: e.target.value }))
                    }}
                  />
                </div>
              </div>
              <div className="field compact-field">
                <label>Usage &amp; Mapping</label>
                <textarea
                  className="input filled compact-textarea"
                  value={lensCategoryForm.usageAndMapping}
                  disabled={masterLoading || lensCategorySaving}
                  onChange={(e) => {
                    setLensCategoryForm((current) => ({ ...current, usageAndMapping: e.target.value }))
                  }}
                />
              </div>
            </section>

            <section className="lens-editor-card">
              <div className="lens-editor-card-head">
                <div>
                  <p className="eyebrow">Mapping</p>
                  <h5>Assign supported power types</h5>
                </div>
              </div>
              <div className="field compact-field">
                <label>Power Types</label>
                <div className="compact-powertype-grid">
                  {powerTypesLoading ? (
                    <div className="input filled compact-inline-value">Loading power types...</div>
                  ) : null}
                  {!powerTypesLoading && (powerTypes || []).map((pt) => {
                    const checked = draftPowerTypeIds.includes(pt._id)

                    return (
                      <label
                        className={`compact-powertype-pill ${checked ? 'checked' : ''}`}
                        key={pt._id}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={masterLoading || lensCategorySaving}
                          onChange={(e) => {
                            const nextIds = e.target.checked
                              ? [...new Set([...draftPowerTypeIds, pt._id])]
                              : draftPowerTypeIds.filter((id) => id !== pt._id)

                            setDraftPowerTypeIds(nextIds)
                          }}
                        />
                        <span>
                          {pt.name} <small>({pt.tag || '-'})</small>
                        </span>
                      </label>
                    )
                  })}
                </div>
                <small style={{ color: '#667085' }}>Select one or more power types for this lens category.</small>
              </div>
            </section>

            <section className="lens-editor-card">
              <div className="lens-editor-card-head">
                <div>
                  <p className="eyebrow">Admin Fields</p>
                  <h5>Priority, lifecycle state, and internal code</h5>
                </div>
              </div>
              <div className="field split compact-field-split compact-meta-grid">
                <div className="field compact-field">
                  <label>{currentMaster.fields[4]}</label>
                  <input
                    className="input filled"
                    value={lensCategoryForm.priority}
                    disabled={masterLoading || lensCategorySaving}
                    min="0"
                    onChange={(e) => {
                      setLensCategoryForm((current) => ({ ...current, priority: e.target.value }))
                    }}
                    type="number"
                  />
                </div>
                <div className="field compact-field">
                  <label>{currentMaster.fields[5]}</label>
                  <select
                    className="input filled"
                    value={lensCategoryForm.status}
                    disabled={masterLoading || lensCategorySaving}
                    onChange={(e) => {
                      setLensCategoryForm((current) => ({ ...current, status: e.target.value }))
                    }}
                  >
                    <option value="Active">Active</option>
                    <option value="Review">Review</option>
                    <option value="Expiring">Expiring</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="field compact-field">
                  <label>{currentMaster.fields[6]}</label>
                  <input
                    className="input filled"
                    value={lensCategoryForm.internalCode}
                    disabled={masterLoading || lensCategorySaving}
                    onChange={(e) => {
                      setLensCategoryForm((current) => ({ ...current, internalCode: e.target.value }))
                    }}
                  />
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    )
  }

  if (isLensCategoryMaster) {
    return (
      <div className="section-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Master management</p>
              <h4>{currentMaster.heading}</h4>
            </div>
          </div>
          <div className="mini-grid" style={{ marginBottom: '14px' }}>
            <MiniCard label="Listing" value={currentMaster.col1} />
            <MiniCard label="Records" value={masterLoading ? 'Loading...' : masterCountLabel} />
          </div>
          <div className="orders-table-shell">
            <table className="orders-table listing-table listing-table--five">
              <thead>
                <tr>
                  <th>{currentMaster.col1}</th>
                  <th>{currentMaster.col2}</th>
                  <th>Reference</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {masterLoading ? (
                  <tr>
                    <td><strong className="table-cell-primary">Loading...</strong></td>
                    <td><span className="table-cell-secondary">Fetching latest master records</span></td>
                    <td>-</td>
                    <td><StatusBadge tone="neutral">Please wait</StatusBadge></td>
                    <td><span className="table-action-pill">Waiting</span></td>
                  </tr>
                ) : null}
                {!masterLoading && masterError ? (
                  <tr>
                    <td><strong className="table-cell-primary">Unable to load</strong></td>
                    <td><span className="table-cell-secondary">{masterError}</span></td>
                    <td>-</td>
                    <td><StatusBadge tone="warning">Error</StatusBadge></td>
                    <td><span className="table-action-pill">Retry</span></td>
                  </tr>
                ) : null}
                {!masterLoading && !masterError && normalizedMasterItems.length === 0 ? (
                  <tr>
                    <td><strong className="table-cell-primary">No records</strong></td>
                    <td><span className="table-cell-secondary">No items found for this master section</span></td>
                    <td>-</td>
                    <td><StatusBadge tone="neutral">Empty</StatusBadge></td>
                    <td><span className="table-action-pill">Waiting</span></td>
                  </tr>
                ) : null}
                {!masterLoading && !masterError && paginatedItems.map(({ item: row, absoluteIndex }) => (
                  <tr
                    className={`orders-data-row ${selectedMasterIndex === absoluteIndex ? 'active-card' : ''}`}
                    key={`${row.title}-${absoluteIndex}`}
                    onClick={() => setSelectedMasterIndex(absoluteIndex)}
                  >
                    <td>
                      <strong className="table-cell-primary">{row.title}</strong>
                      <small className="table-cell-secondary">{row.subtitle}</small>
                    </td>
                    <td>
                      <strong className="table-cell-primary">{row.meta}</strong>
                      <small className="table-cell-secondary">Power Type: {row.powerTypeName || 'No mapping'}</small>
                    </td>
                    <td>
                      <strong className="table-cell-primary">{row.code || '-'}</strong>
                      <small className="table-cell-secondary">Ready for mapping update</small>
                    </td>
                    <td>
                      <StatusBadge tone={getStatusTone(row.status)}>{row.status}</StatusBadge>
                    </td>
                    <td>
                      <button
                        className="ghost-btn"
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelectedMasterIndex(absoluteIndex)
                          openLensCategoryEditor(row.id || row._id || row.code)
                        }}
                        type="button"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {normalizedMasterItems.length > itemsPerPage ? (
            <div className="pagination-shell pagination-shell--masters">
              <div className="pagination-summary">
                <strong>
                  Showing {(page - 1) * itemsPerPage + 1}
                  {' '}-{' '}
                  {Math.min(page * itemsPerPage, normalizedMasterItems.length)}
                </strong>
                <small>of {normalizedMasterItems.length} records</small>
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-nav"
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <div className="pagination-track">
                  {paginationItems.map((item) => (
                    typeof item === 'string' ? (
                      <span className="pagination-ellipsis" key={item}>...</span>
                    ) : (
                      <button
                        className={`pagination-chip ${item === page ? 'active' : ''}`}
                        key={item}
                        onClick={() => setPage(item)}
                        type="button"
                      >
                        {item}
                      </button>
                    )
                  ))}
                </div>
                <button
                  className="pagination-nav pagination-nav--next"
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    )
  }

  return (
    <div className="section-grid two-col">
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Master management</p>
            <h4>{currentMaster.heading}</h4>
          </div>
        </div>
        <div className="mini-grid" style={{ marginBottom: '14px' }}>
          <MiniCard label="Listing" value={currentMaster.col1} />
          <MiniCard label="Records" value={masterLoading ? 'Loading...' : masterCountLabel} />
        </div>
        <div className="orders-table-shell">
          <table className="orders-table listing-table listing-table--four">
            <thead>
              <tr>
                <th>{currentMaster.col1}</th>
                <th>{isFrameShapesMaster ? 'Preview / Details' : currentMaster.col2}</th>
                <th>Reference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {masterLoading ? (
                <tr>
                  <td><strong className="table-cell-primary">Loading...</strong></td>
                  <td><span className="table-cell-secondary">Fetching latest master records</span></td>
                  <td>-</td>
                  <td><StatusBadge tone="neutral">Please wait</StatusBadge></td>
                </tr>
              ) : null}
              {!masterLoading && masterError ? (
                <tr>
                  <td><strong className="table-cell-primary">Unable to load</strong></td>
                  <td><span className="table-cell-secondary">{masterError}</span></td>
                  <td>-</td>
                  <td><StatusBadge tone="warning">Error</StatusBadge></td>
                </tr>
              ) : null}
              {!masterLoading && !masterError && normalizedMasterItems.length === 0 ? (
                <tr>
                  <td><strong className="table-cell-primary">No records</strong></td>
                  <td><span className="table-cell-secondary">No items found for this master section</span></td>
                  <td>-</td>
                  <td><StatusBadge tone="neutral">Empty</StatusBadge></td>
                </tr>
              ) : null}
              {!masterLoading && !masterError && paginatedItems.map(({ item: row, absoluteIndex }) => (
                <tr
                  className={`orders-data-row ${selectedMasterIndex === absoluteIndex ? 'active-card' : ''}`}
                  key={`${row.title}-${absoluteIndex}`}
                  onClick={() => setSelectedMasterIndex(absoluteIndex)}
                >
                  <td>
                    <strong className="table-cell-primary">{row.title}</strong>
                    <small className="table-cell-secondary">{row.subtitle}</small>
                  </td>
                  {isFrameShapesMaster ? (
                    <td>
                      <div className="table-cell-stack">
                        <div className="table-image-preview">
                          {row.image ? (
                            <img alt={row.imageAlt || row.title} src={`${adminBaseUrl}${row.image}`} />
                          ) : (
                            <span>No image</span>
                          )}
                        </div>
                        <div>
                          <strong className="table-cell-primary">{row.meta}</strong>
                          <small className="table-cell-secondary">{row.image ? 'Uploaded preview available' : 'Preview pending upload'}</small>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <td>
                      <strong className="table-cell-primary">{row.meta}</strong>
                      <small className="table-cell-secondary">{currentMaster.detailTitle}</small>
                    </td>
                  )}
                  <td>
                    <strong className="table-cell-primary">{row.code || '-'}</strong>
                  </td>
                  <td>
                    <StatusBadge tone={getStatusTone(row.status)}>{row.status}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel detail-panel">
        <p className="eyebrow">Selected master</p>
        <h4>{selectedMaster ? `${currentMaster.detailTitle} - ${selectedMaster.title}` : currentMaster.detailTitle}</h4>
        <div className="info-grid" style={{ marginBottom: '14px' }}>
          <InfoCard label="Status" value={selectedMaster?.status ?? '-'} />
          <InfoCard label="Reference" value={selectedMaster?.code ?? '-'} />
        </div>
        {isFrameShapesMaster ? (
          <div className="task-list" style={{ marginBottom: '14px' }}>
            <div className="task-item">
              <strong>Selected frame shape</strong>
              <small>{selectedMaster?.subtitle ?? '-'}</small>
            </div>
            <div className="task-item">
              <strong>Catalog note</strong>
              <small>{selectedMaster?.meta ?? '-'}</small>
            </div>
            <div className="task-item">
              <strong>Image</strong>
              {selectedMaster?.image ? (
                <div style={{ marginTop: '8px' }}>
                  <img
                    alt={selectedMaster?.title}
                    src={`${adminBaseUrl}${selectedMaster.image}`}
                    style={{ display: 'block', maxWidth: '180px', borderRadius: 10 }}
                  />
                </div>
              ) : (
                <small>No image uploaded</small>
              )}

              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Upload image</label>
                <input
                  className="input filled"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    selectedMaster._pendingImageFile = file || null
                  }}
                />
                <button
                  className="primary-btn soft-btn"
                  style={{ marginTop: 10 }}
                  type="button"
                  onClick={async () => {
                    try {
                      const file = selectedMaster._pendingImageFile
                      if (!file) {
                        alert('Please select an image file')
                        return
                      }

                      const token = localStorage.getItem('adminToken')
                      const formData = new FormData()
                      formData.append('image', file)
                      formData.append('imageAlt', selectedMaster.imageAlt || selectedMaster.title)

                      const res = await fetch(`${adminBaseUrl}/api/frame-shapes/${selectedMaster.id || selectedMaster._id}/image`, {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                        body: formData,
                      })

                      if (!res.ok) {
                        const text = await res.text().catch(() => '')
                        alert(`Upload failed (${res.status})\n${text || 'No response body'}`)
                        return
                      }

                      window.location.reload()
                    } catch (error) {
                      alert(error.message || 'Upload failed')
                    }
                  }}
                >
                  Update Image
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <div className="form-wire">
          {isFrameShapesMaster ? (
            <div className="field">
              <label>{currentMaster.fields[0]}</label>
              <div className="input filled">{selectedMaster?.detailValues?.[0] ?? '-'}</div>
            </div>
          ) : null}

          {currentMaster.key === 'eyepower' ? (
            <div className="eye-power-card">
              <div className="eye-power-header">
                <div>
                  <p className="eye-label">{currentMaster.fields[0]}</p>
                  <h3>{selectedMaster?.detailValues?.[0] ?? '-'}</h3>
                </div>

                <StatusBadge tone={getStatusTone(selectedMaster?.status)}>
                  {selectedMaster?.status ?? 'Active'}
                </StatusBadge>
              </div>

              <div className="field">
                <label>Power Configuration</label>

                <div className="eye-power-grid">
                  <div className="eye-power-pill">
                    <span>SPH</span>
                    <strong>{selectedMaster?.detailValues?.[1] ?? '-'}</strong>
                  </div>

                  <div className="eye-power-pill">
                    <span>CYL</span>
                    <strong>{selectedMaster?.detailValues?.[2] ?? '-'}</strong>
                  </div>

                  <div className="eye-power-pill">
                    <span>Axis</span>
                    <strong>{selectedMaster?.detailValues?.[3] ?? '-'}</strong>
                  </div>
                </div>
              </div>

              <div className="field">
                <label>Additional Details</label>

                <div className="eye-meta-row">
                  <div className="eye-meta-pill">
                    <span>{currentMaster.fields[4]}</span>
                    <strong>{selectedMaster?.detailValues?.[4] ?? '-'}</strong>
                  </div>

                  <div className="eye-meta-pill">
                    <span>{currentMaster.fields[6]}</span>
                    <strong>{selectedMaster?.detailValues?.[6] ?? '-'}</strong>
                  </div>
                </div>
              </div>

              <div className="field">
                <label>{currentMaster.fields[5]}</label>
                <div className="input filled">
                  {selectedMaster?.detailValues?.[5] ?? '-'}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="field">
                <label>{currentMaster.fields[0]}</label>
                <div className="input filled">{selectedMaster?.detailValues?.[0] ?? '-'}</div>
              </div>
              <div className="field">
                <label>{currentMaster.fields[1]}</label>
                <div className="input filled">{selectedMaster?.detailValues?.[1] ?? '-'}</div>
              </div>
              <div className="field">
                <label>{currentMaster.fields[2]}</label>
                <div className="input filled">{selectedMaster?.detailValues?.[2] ?? '-'}</div>
              </div>
              <div className="field">
                <label>{currentMaster.fields[3]}</label>
                <div className="input filled">{selectedMaster?.detailValues?.[3] ?? '-'}</div>
              </div>
              <div className="field split">
                <div>
                  <label>{currentMaster.fields[4]}</label>
                  <div className="input filled">{selectedMaster?.detailValues?.[4] ?? '-'}</div>
                </div>
                <div>
                  <label>{currentMaster.fields[5]}</label>
                  <div className="input filled">{selectedMaster?.detailValues?.[5] ?? '-'}</div>
                </div>
              </div>
              <div className="field">
                <label>{currentMaster.fields[6]}</label>
                <div className="input filled">{selectedMaster?.detailValues?.[6] ?? '-'}</div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default MasterSectionPage
