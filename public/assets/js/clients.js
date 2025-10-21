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
      
      // Separator between datasets
      if (idx < datasets.length - 1) {
        const sep = document.createElement('tr'); const td = document.createElement('td'); td.colSpan = 2; td.innerHTML = '<hr class="my-2">'; sep.appendChild(td); tableBody.appendChild(sep);
      }
    });

    // Display style reference images
    displayStyleImages(datasets);

    modal.show();
  }

  function displayStyleImages(datasets) {
    const styleImagesSection = document.getElementById('styleImagesSection');
    const clientStyleImages = document.getElementById('clientStyleImages');
    
    if (!styleImagesSection || !clientStyleImages) return;
    
    // Clear previous images
    clientStyleImages.innerHTML = '';
    
    // Collect all images from all datasets
    let allImages = [];
    datasets.forEach(({ data }) => {
      if (data.styleImages && Array.isArray(data.styleImages)) {
        allImages = allImages.concat(data.styleImages);
      }
    });
    
    if (allImages.length === 0) {
      styleImagesSection.style.display = 'none';
      return;
    }
    
    styleImagesSection.style.display = 'block';
    
    allImages.forEach((imageData, index) => {
      const col = document.createElement('div');
      col.className = 'col-6 col-md-4 col-lg-3';
      
      col.innerHTML = `
        <div class="card">
          <img src="${imageData.dataUrl}" class="card-img-top" style="height: 120px; object-fit: cover; cursor: pointer;" alt="Style reference ${index + 1}" onclick="openImageModal('${imageData.dataUrl}', '${imageData.name}')">
          <div class="card-body p-2">
            <small class="text-muted d-block text-truncate" title="${imageData.name}">${imageData.name}</small>
            <small class="text-muted d-block">${imageData.uploadedAt ? new Date(imageData.uploadedAt).toLocaleDateString() : ''}</small>
          </div>
        </div>
      `;
      
      clientStyleImages.appendChild(col);
    });
  }

  // Function to open image in a modal for full view
  window.openImageModal = function(imageUrl, imageName) {
    // Create a simple modal for image viewing
    const modalHtml = `
      <div class="modal fade" id="imageViewModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${imageName}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center">
              <img src="${imageUrl}" class="img-fluid" alt="${imageName}" style="max-height: 70vh;">
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('imageViewModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Add new modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show the modal
    const imageModal = new bootstrap.Modal(document.getElementById('imageViewModal'));
    imageModal.show();
    
    // Clean up modal after it's hidden
    document.getElementById('imageViewModal').addEventListener('hidden.bs.modal', function() {
      this.remove();
    });
  };

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
        // Create a simple input dialog using Bootstrap modal or inline editing
        const newName = window.prompt ? window.prompt('Edit client name', c.name) : c.name;
        if (newName && newName.trim() && newName !== c.name) { 
          ST.clients.update(c.id, { name: newName.trim() }); 
          render(); 
        }
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
    const name = window.prompt ? window.prompt('New client name') : null;
    if (name && name.trim()) { ST.clients.add(name.trim()); render(); }
  });

  render();
});