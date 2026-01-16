document.addEventListener('DOMContentLoaded', () => {
    const clientsList = document.getElementById('clientsList');
    const searchInput = document.getElementById('searchClient');
    const addClientBtn = document.getElementById('addClientBtn');
  
    // Initial render
    renderClients();
  
    // Search listener
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderClients(e.target.value);
      });
    }
  
    // Add client (Basic flow)
    if (addClientBtn) {
      addClientBtn.addEventListener('click', () => {
        openClientNameDialog({
          title: 'Add New Client',
          onSave(name) {
            if (name) {
              const newClient = {
                id: Date.now().toString(),
                name: name.trim(),
                phone: '',
                email: '',
                measurements: {}
              };
              ST.clients.add(newClient);
              renderClients();
            }
          }
        });
      });
    }
  
    // Reusable modal for entering/editing client name
    function openClientNameDialog(options) {
      const { title, initial, onSave } = options;
      
      // Remove existing if any
      const existing = document.getElementById('clientNameModal');
      if (existing) existing.remove();
  
      const el = document.createElement('div');
      el.className = 'modal fade';
      el.id = 'clientNameModal';
      el.setAttribute('tabindex', '-1');
      el.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${title || 'Client Name'}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <input type="text" class="form-control" id="clientNameInput" value="${initial || ''}" placeholder="Enter client name">
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" id="clientNameSaveBtn">Save</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(el);
  
      const modal = new bootstrap.Modal(el);
      modal.show();
  
      const input = el.querySelector('#clientNameInput');
      const saveBtn = el.querySelector('#clientNameSaveBtn');
  
      // Focus input
      el.addEventListener('shown.bs.modal', () => input.focus());
  
      // Save handlers
      const handleSave = () => {
        const val = input.value.trim();
        if (val) {
          onSave(val);
          modal.hide();
        }
      };
  
      saveBtn.addEventListener('click', handleSave);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSave();
      });
  
      // Cleanup
      el.addEventListener('hidden.bs.modal', () => el.remove());
    }
  
    function renderClients(query = '') {
      if (!clientsList) return;
      clientsList.innerHTML = '';
      
      const clients = ST.clients.getAll();
      const filtered = clients.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  
      if (filtered.length === 0) {
        clientsList.innerHTML = '<div class="list-group-item text-muted">No clients found.</div>';
        return;
      }
  
      filtered.forEach(c => {
        const item = document.createElement('div');
        item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        
        // Client info
        const info = document.createElement('div');
        info.innerHTML = `<strong>${c.name}</strong><br><small class="text-muted">${c.phone || 'No phone'}</small>`;
        
        // Actions
        const actions = document.createElement('div');
        
        // Edit Button
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-outline-secondary me-2';
        editBtn.textContent = 'Edit Name';
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openClientNameDialog({
            title: 'Edit Client Name',
            initial: c.name,
            onSave(newName) {
              if (newName && newName !== c.name) {
                ST.clients.update(c.id, { name: newName });
                renderClients(searchInput ? searchInput.value : '');
              }
            }
          });
        });
  
        // Delete Button
        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-sm btn-outline-danger';
        delBtn.textContent = 'Delete';
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`Delete ${c.name}?`)) {
            ST.clients.delete(c.id);
            renderClients(searchInput ? searchInput.value : '');
          }
        });
  
        actions.appendChild(editBtn);
        actions.appendChild(delBtn);
        
        item.appendChild(info);
        item.appendChild(actions);
  
        // Clicking the row (except buttons) could go to details/measurements
        item.addEventListener('click', (e) => {
          if (e.target !== editBtn && e.target !== delBtn) {
            // For now, maybe just log or go to a measurements page
            // window.location.href = `measurements.html?id=${c.id}`;
          }
        });
  
        clientsList.appendChild(item);
      });
    }
  });
