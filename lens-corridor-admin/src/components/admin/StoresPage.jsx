import { InfoCard, MiniCard, StatusBadge } from './AdminUiPrimitives'

const StoresPage = ({
  currentStore,
  handleStoreDelete,
  openStoreEditor,
  resetStoreForm,
  isReadOnlyUser,
  selectedStoreId,
  setSelectedStoreId,
  storeMessage,
  stores,
  activateScreen,
}) => (
  <>
    <div className="section-grid">
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Store management</p>
            <h4>Store listing and profile updates</h4>
          </div>
          <button
            className="ghost-btn link-btn"
            disabled={isReadOnlyUser}
            onClick={() => {
              if (isReadOnlyUser) {
                return
              }
              resetStoreForm()
              activateScreen('add-store')
            }}
            type="button"
          >
            {isReadOnlyUser ? 'View Only' : 'Add Store'}
          </button>
        </div>
        <div className="mini-grid" style={{ marginBottom: '14px' }}>
          <MiniCard label="Listing" value="Stores" />
          <MiniCard label="Records" value={`${stores.length}`} />
        </div>
        {storeMessage ? (
          <div className="task-item" style={{ marginBottom: '14px' }}>
            <strong>Store status</strong>
            <small>{storeMessage}</small>
          </div>
        ) : null}
        <div className="orders-table-shell">
          <table className="orders-table listing-table listing-table--five">
            <thead>
              <tr>
                <th>Store</th>
                <th>Location</th>
                <th>Reference</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.length === 0 ? (
                <tr>
                  <td><strong className="table-cell-primary">No stores found</strong></td>
                  <td><span className="table-cell-secondary">Add your first store to start assigning employees and orders.</span></td>
                  <td>-</td>
                  <td>-</td>
                  <td><StatusBadge tone="neutral">Empty</StatusBadge></td>
                  <td><span className="table-action-pill">Waiting</span></td>
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
                    <strong className="table-cell-primary">{store.code || '-'}</strong>
                    <small className="table-cell-secondary">{store.managerName || 'Manager pending'}</small>
                  </td>
                  <td>
                    <strong className="table-cell-primary">{store.phone || '-'}</strong>
                    <small className="table-cell-secondary">{store.email || 'No email added'}</small>
                  </td>
                  <td>
                    <StatusBadge tone={store.status === 'Active' ? 'positive' : 'neutral'}>{store.status}</StatusBadge>
                  </td>
                  <td>
                    <button
                      className="ghost-btn"
                      disabled={isReadOnlyUser}
                      onClick={(event) => {
                        event.stopPropagation()
                        if (isReadOnlyUser) {
                          return
                        }
                        openStoreEditor(store.id)
                      }}
                      type="button"
                    >
                      {isReadOnlyUser ? 'View' : 'Update'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
 
    </div>
  </>
)

export default StoresPage
