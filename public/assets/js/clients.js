document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.querySelector('#clientsTable tbody');
  const addBtn = document.getElementById('addClientBtn');
  const modalEl = document.getElementById('measureModal');
  const modal = modalEl ? new bootstrap.Modal(modalEl) : null;
  const titleEl = document.getElementById('measureTitle');
  const emptyEl = document.getElementById('measureEmpty');
  const tableWrap = document.getElementById('measureTableWrap');
  const tableBody = document.getElementById('measureTableBody');
  const openBtn = document.getElementById('openMeasurementsBtn');

  const FIELD_LABELS = {
    'field-height': 'Height',
    'field-neck': 'Neck',
    'field-shoulder': 'Shoulder',
    'field-chest': 'Chest',
    'field-waist': 'Waist',
    'field-hip': 'Hip',
    'field-arm_length': 'Arm Length',
    'field-sleeve_length': 'Sleeve Length',
    'field-back_width': 'Back Width',
    'field-trouser_length': 'Trouser Length',
    'field-thigh': 'Thigh',
    'field-inseam': 'Inseam'
  };
  const ORDERED_FIELDS = Object.keys(FIELD_LABELS);

  function showMeasurements(client) {
    if (!modal) return;
    titleEl.textContent = `Measurements – ${client.name}`;
    tableBody.innerHTML = '';

    const datasets = ['male','female','custom']
      .map(g => ({ gender: g, data: ST.measurements.get(client.id, g) || ST.measurements.get(client.name, g) }))
      .filter(d => !!d.data);

    if (!datasets.length) {
      // Fallback legacy single dataset
      const legacy = ST.measurements.get(client.id) || ST.measurements.get(client.name);
      if (!legacy) { tableWrap.style.display = 'none'; emptyEl.style.display = 'block'; openBtn.href = `index.html?client=${client.id}`; modal.show(); return; }
      datasets.push({ gender: legacy.gender || 'male', data: legacy });
    }

    // Determine latest dataset for default open link
    const latest = datasets.slice().sort((a,b) => new Date(b.data.savedAt || 0) - new Date(a.data.savedAt || 0))[0];
    openBtn.href = `index.html?client=${client.id}&gender=${latest.gender}`;

    tableBody.innerHTML = '';
    emptyEl.style.display = 'none'; tableWrap.style.display = 'block';

    datasets.forEach(({ gender, data }, idx) => {
      const unit = data.unit || 'cm';
      // Section header
      const hdr = document.createElement('tr');
      const h1 = document.createElement('td'); h1.colSpan = 2; h1.innerHTML = `<strong>${gender.charAt(0).toUpperCase() + gender.slice(1)}</strong>`;
      hdr.appendChild(h1);
      tableBody.appendChild(hdr);

      const savedAt = data.savedAt;
      if (savedAt) {
        const tr = document.createElement('tr');
        const td1 = document.createElement('td'); td1.textContent = 'Last Saved';
        const td2 = document.createElement('td'); td2.textContent = new Date(savedAt).toLocaleString();
        tr.append(td1, td2); tableBody.appendChild(tr);
      }
      const notes = (data.notes || '').trim();
      if (notes) {
        const tr = document.createElement('tr');
        const td1 = document.createElement('td'); td1.textContent = 'Notes';
        const td2 = document.createElement('td'); td2.textContent = notes;
        tr.append(td1, td2); tableBody.appendChild(tr);
      }
      ORDERED_FIELDS.forEach(key => {
        const val = data[key] ?? '';
        if (val !== '') {
          const tr = document.createElement('tr');
          const td1 = document.createElement('td'); td1.textContent = FIELD_LABELS[key];
          const td2 = document.createElement('td'); td2.textContent = `${val} ${unit}`;
          tr.append(td1, td2); tableBody.appendChild(tr);
        }
      });
      
      // Display custom fields
      console.log('Debug: Checking custom fields for', gender, data);
      console.log('Custom fields data:', data.customFields);
      if (data.customFields && Object.keys(data.customFields).length > 0) {
        console.log('Found custom fields:', Object.keys(data.customFields));
        Object.entries(data.customFields).forEach(([fieldName, fieldValue]) => {
          console.log('Processing custom field:', fieldName, '=', fieldValue);
          if (fieldName.trim() && fieldValue !== '') {
            const tr = document.createElement('tr');
            const td1 = document.createElement('td'); td1.textContent = fieldName;
            const td2 = document.createElement('td'); td2.textContent = `${fieldValue} ${unit}`;
            tr.append(td1, td2); tableBody.appendChild(tr);
          }
        });
      } else {
        console.log('No custom fields found or empty object');
      }
      
      // Display photos
      console.log('Debug: Checking photos for', gender, data);
      console.log('Photos data:', data.photos);
      if (data.photos && data.photos.length > 0) {
        console.log('Found photos:', data.photos.length);
        const tr = document.createElement('tr');
        const td1 = document.createElement('td'); td1.textContent = 'Style Photos';
        const td2 = document.createElement('td');
        
        const photoContainer = document.createElement('div');
        photoContainer.className = 'row g-2';
        
        data.photos.forEach((photo, index) => {
          if (photo.src) {
            const photoDiv = document.createElement('div');
            photoDiv.className = 'col-6 col-md-4';
            photoDiv.innerHTML = `
              <div class="position-relative">
                <img src="${photo.src}" class="img-fluid rounded" style="height: 80px; object-fit: cover; width: 100%; cursor: pointer;" 
                     data-bs-toggle="modal" data-bs-target="#photoViewModal" 
                     onclick="showPhotoModal('${photo.src}', '${photo.name}')">
                <small class="text-muted d-block mt-1">${photo.name}</small>
              </div>
            `;
            photoContainer.appendChild(photoDiv);
          }
        });
        
        td2.appendChild(photoContainer);
        tr.append(td1, td2); 
        tableBody.appendChild(tr);
      } else {
        console.log('No photos found or empty array');
      }
      
      // Separator between datasets
      if (idx < datasets.length - 1) {
        const sep = document.createElement('tr'); const td = document.createElement('td'); td.colSpan = 2; td.innerHTML = '<hr class="my-2">'; sep.appendChild(td); tableBody.appendChild(sep);
      }
    });

    modal.show();
  }

  function openClientNameDialog(options) {
    const existing = document.getElementById('clientNameModal');
    let el = existing;
    if (!el) {
      el = document.createElement('div');
      el.className = 'modal fade';
      el.id = 'clientNameModal';
      el.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Client Name</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <input type="text" class="form-control" id="clientNameInput">
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" id="clientNameSaveBtn">Save</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(el);
    }
    const instance = bootstrap.Modal.getOrCreateInstance(el);
    const title = el.querySelector('.modal-title');
    const input = el.querySelector('#clientNameInput');
    const saveBtn = el.querySelector('#clientNameSaveBtn');
    if (title && options && options.title) title.textContent = options.title;
    if (input) input.value = (options && options.initial) || '';
    function handleSave() {
      if (!input) return;
      const value = input.value.trim();
      if (!value) return;
      instance.hide();
      if (options && typeof options.onSave === 'function') {
        options.onSave(value);
      }
    }
    if (saveBtn) {
      saveBtn.onclick = null;
      saveBtn.addEventListener('click', handleSave, { once: true });
    }
    if (input) {
      input.onkeydown = function(e) {
        if (e.key === 'Enter') {
          handleSave();
        }
      };
      setTimeout(() => input.focus(), 150);
    }
    instance.show();
  }

  function render() {
    const list = ST.clients.all();
    tbody.innerHTML = '';
    if (!list.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td'); td.colSpan = 2; td.textContent = 'No clients yet.'; td.className = 'text-muted';
      tr.appendChild(td); tbody.appendChild(tr); return;
    }
    list.forEach(c => {
      const tr = document.createElement('tr');
      const nameTd = document.createElement('td');
      const nameLink = document.createElement('a'); nameLink.href = '#'; nameLink.textContent = c.name;
      nameLink.addEventListener('click', (e) => { e.preventDefault(); showMeasurements(c); });
      nameTd.appendChild(nameLink); tr.appendChild(nameTd);
      const actionsTd = document.createElement('td'); actionsTd.className = 'text-end';

      const viewBtn = document.createElement('button'); viewBtn.className = 'btn btn-sm btn-outline-primary me-2'; viewBtn.innerHTML = '<i class="bi bi-eye"></i>';
      viewBtn.addEventListener('click', () => showMeasurements(c));

      const editBtn = document.createElement('button'); editBtn.className = 'btn btn-sm btn-outline-secondary me-2'; editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
      editBtn.addEventListener('click', () => {
        openClientNameDialog({
          title: 'Edit client name',
          initial: c.name,
          onSave(value) {
            if (value && value !== c.name) {
              ST.clients.update(c.id, { name: value });
              render();
            }
          }
        });
      });

      const delBtn = document.createElement('button'); delBtn.className = 'btn btn-sm btn-outline-danger'; delBtn.innerHTML = '<i class="bi bi-trash"></i>';
      delBtn.addEventListener('click', () => {
        if (confirm(`Delete client "${c.name}"?`)) { 
          ST.clients.remove(c.id); 
          render(); 
          // Trigger dashboard update if on home page
          if (window.renderCounts && typeof window.renderCounts === 'function') {
            window.renderCounts();
          }
        }
      });

      actionsTd.append(viewBtn, editBtn, delBtn); tr.appendChild(actionsTd); tbody.appendChild(tr);
    });
  }

  addBtn.addEventListener('click', () => {
    openClientNameDialog({
      title: 'New client name',
      initial: '',
      onSave(value) {
        if (value) {
          ST.clients.add(value);
          render();
        }
      }
    });
  });

  // Photo modal functionality
  window.showPhotoModal = function(src, name) {
    // Create modal if it doesn't exist
    let photoModal = document.getElementById('photoViewModal');
    if (!photoModal) {
      photoModal = document.createElement('div');
      photoModal.className = 'modal fade';
      photoModal.id = 'photoViewModal';
      photoModal.innerHTML = `
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="photoModalTitle">Style Photo</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body text-center">
              <img id="photoModalImage" class="img-fluid" style="max-height: 70vh;">
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(photoModal);
    }
    
    // Update modal content
    document.getElementById('photoModalTitle').textContent = name || 'Style Photo';
    document.getElementById('photoModalImage').src = src;
    
    // Show modal
    const modal = new bootstrap.Modal(photoModal);
    modal.show();
  };

  render();
});
