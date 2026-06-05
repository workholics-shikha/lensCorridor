import { InfoCard, MiniCard, StatusBadge } from './AdminUiPrimitives'

const StoresPage = ({
  currentStore,
  handleStoreDelete,
  resetStoreForm,
  selectedStoreId,
  setSelectedStoreId,
  storeMessage,
  stores,
  activateScreen,
}) => (
  <>
    <div className="section-grid two-col">
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Store management</p>
            <h4>Dynamic store list, details, and deletion</h4>
          </div>
          <button
            className="ghost-btn link-btn"
            onClick={() => {
              resetStoreForm()
              activateScreen('add-store')
            }}
            type="button"
          >
            Add Store
          </button>
        </div>
        <div className="mini-grid" style={{ marginBottom: '14px' }}>
          <MiniCard label="Stores" value={`${stores.length}`} />
          <MiniCard label="Selected" value={currentStore?.code || '-'} />
        </div>
        {storeMessage ? (
          <div className="task-item" style={{ marginBottom: '14px' }}>
            <strong>Store status</strong>
            <small>{storeMessage}</small>
          </div>
        ) : null}
        <div className="orders-table-shell">
          <table className="orders-table listing-table listing-table--four">
            <thead>
              <tr>
                <th>Store</th>
                <th>Location</th>
                <th>Contact</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stores.length === 0 ? (
                <tr>
                  <td><strong className="table-cell-primary">No stores found</strong></td>
                  <td><span className="table-cell-secondary">Add your first store to start assigning employees and orders.</span></td>
                  <td>-</td>
                  <td><StatusBadge tone="neutral">Empty</StatusBadge></td>
                </tr>
              ) : null}
              {stores.map((store) => (
                <tr
                  className={`orders-data-row ${selectedStoreId === store.id ? 'active-card' : ''}`}
                  key={store.id}
                  onClick={() => setSelectedStoreId(store.id)}
                >
                  <td>
                    <strong className="table-cell-primary">{store.name}</strong>
                    <small className="table-cell-secondary">{store.code}</small>
                  </td>
                  <td>
                    <strong className="table-cell-primary">{store.address?.city || 'No city'}</strong>
                    <small className="table-cell-secondary">{store.address?.state || 'State pending'}</small>
                  </td>
                  <td>
                    <strong className="table-cell-primary">{store.phone || '-'}</strong>
                    <small className="table-cell-secondary">{store.email || 'No email added'}</small>
                  </td>
                  <td>
                    <StatusBadge tone={store.status === 'Active' ? 'positive' : 'neutral'}>{store.status}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel detail-panel">
        <p className="eyebrow">Store details</p>
        <h4>{currentStore ? `${currentStore.name} profile` : 'Select a store'}</h4>
        {currentStore ? (
          <>
            <div className="info-grid">
              <InfoCard label="Store Name" value={currentStore.name} />
              <InfoCard label="Store Code" value={currentStore.code} />
              <InfoCard label="Contact" value={currentStore.phone || '-'} />
              <InfoCard label="Status" value={currentStore.status} />
            </div>
            <div className="info-grid store-form-summary">
              <InfoCard label="Email" value={currentStore.email || '-'} />
              <InfoCard label="Manager" value={currentStore.managerName || '-'} />
              <InfoCard label="City" value={currentStore.address?.city || '-'} />
              <InfoCard label="State / Pincode" value={`${currentStore.address?.state || '-'} / ${currentStore.address?.pincode || '-'}`} />
            </div>
            <div className="task-list" style={{ marginTop: '18px' }}>
              <div className="task-item">
                <strong>Address</strong>
                <small>{currentStore.address?.street || 'No street address added'}</small>
              </div>
              <div className="task-item">
                <strong>Store lifecycle</strong>
                <small>Use delete only if you want to remove this store from active management.</small>
              </div>
            </div>
            <div className="filter-pills" style={{ marginTop: '18px' }}>
              <button className="ghost-btn" onClick={() => handleStoreDelete(currentStore)} type="button">Delete Store</button>
            </div>
          </>
        ) : (
          <div className="task-item">
            <strong>No store selected</strong>
            <small>Select a store from the list or add a new store to view details.</small>
          </div>
        )}
      </section>
    </div>
  </>
)

export default StoresPage
