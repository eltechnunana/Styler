document.addEventListener('DOMContentLoaded', () => {
    const clientsTableBody = document.querySelector('#clientsTable tbody');
    const searchInput = document.getElementById('searchClient');
    const addClientBtn = document.getElementById('addClientBtn');
  
    // Search listener
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderClients(e.target.value);
      });
    }
  
    if (addClientBtn) {
      addClientBtn.addEventListener('click', () => {
        openClientNameDialog({
          title: 'Add New Client',
          onSave(name) {
            if (name) {
              ST.clients.add(name.trim());
              renderClients();
            }
          }
        });
      });
    }
  
    // Reusable modal for entering/editing client name
    function openClientNameDialog(options) {
      const { title, initial, onSave } = options;
      
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
  
      el.addEventListener('shown.bs.modal', () => input.focus());
  
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
  
      el.addEventListener('hidden.bs.modal', () => el.remove());
    }
  
    function renderClients(query = '') {
      if (!clientsTableBody) return;
      clientsTableBody.innerHTML = '';
      
      const clients = ST.clients.all();
      const filtered = clients.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  
      if (filtered.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 2;
        td.className = 'text-muted';
        td.textContent = 'No clients found.';
        tr.appendChild(td);
        clientsTableBody.appendChild(tr);
        return;
      }
  
      filtered.forEach(c => {
        const tr = document.createElement('tr');
        
        const nameTd = document.createElement('td');
        // Link to measurements page with client pre-selected
        const nameLink = document.createElement('a');
        nameLink.href = `index.html?client=${c.id}`;
        nameLink.textContent = c.name;
        nameLink.className = 'text-decoration-none text-dark fw-bold';
        nameTd.appendChild(nameLink);
        tr.appendChild(nameTd);
        
        const actionsTd = document.createElement('td');
        actionsTd.style.whiteSpace = 'nowrap';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-outline-secondary me-2';
        editBtn.textContent = 'Edit';
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
  
        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-sm btn-outline-danger';
        delBtn.textContent = 'Delete';
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`Delete ${c.name}?`)) {
            ST.clients.remove(c.id);
            renderClients(searchInput ? searchInput.value : '');
          }
        });
  
        actionsTd.appendChild(editBtn);
        actionsTd.appendChild(delBtn);
        tr.appendChild(actionsTd);
  
        clientsTableBody.appendChild(tr);
      });
    }
  
    renderClients();
  });
