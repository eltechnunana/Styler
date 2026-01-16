document.addEventListener('DOMContentLoaded', () => {
  const measurementForm = document.getElementById('measurementForm');
  const unitToggle = document.getElementById('unitToggle');
  const styleImagesInput = document.getElementById('styleImages');
  const uploadImagesBtn = document.getElementById('uploadImagesBtn');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const addCustomFieldBtn = document.getElementById('addCustomField');
  const customFieldsContainer = document.getElementById('customFields');
  const addPhotoBtn = document.getElementById('addPhotoBtn');
  const photoUploadInput = document.getElementById('photoUpload');
  const photoPreviewContainer = document.getElementById('photoPreview');
  const clientNameInput = document.getElementById('clientName'); // Assuming you have a client name input

  let currentUnit = 'cm';
  let uploadedImages = []; // Array to store base64 strings of images
  let stylePhotos = []; // Array for Style Photos section

  // --- Helper Functions ---

  const convertValue = (value, toUnit) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return toUnit === 'in' ? (num / 2.54).toFixed(1) : (num * 2.54).toFixed(1);
  };

  const updatePlaceholders = () => {
    document.querySelectorAll('.measure-input').forEach(input => {
      input.placeholder = input.value ? '' : currentUnit;
    });
    // Update unit labels if you have them next to inputs
    document.querySelectorAll('.unit-label').forEach(label => {
      label.textContent = currentUnit;
    });
  };
  
    // --- Image Handling ---

  if (styleImagesInput) {
      // Trigger input when Upload button is clicked
      if (uploadImagesBtn) {
        uploadImagesBtn.addEventListener('click', () => styleImagesInput.click());
      }

      styleImagesInput.addEventListener('change', async (e) => {
          const files = Array.from(e.target.files);
          
          if (files.length > 0 && imagePreviewContainer) {
            document.getElementById('imagePreviewArea').style.display = 'block';
          }

          for (const file of files) {
              if (!file.type.startsWith('image/')) continue;

               // Compress/Resize image before storing (optional but recommended for localStorage)
              try {
                  const base64 = await resizeImage(file, 800, 800); // Max 800x800
                  uploadedImages.push(base64);
                  displayImagePreview(base64, imagePreviewContainer, uploadedImages);
              } catch (err) {
                  console.error("Error processing image:", err);
              }
          }
           // Clear input so same files can be selected again if needed
           styleImagesInput.value = '';
      });
  }

  // Clear all images button
  const clearAllImagesBtn = document.getElementById('clearAllImages');
  if (clearAllImagesBtn) {
    clearAllImagesBtn.addEventListener('click', () => {
      uploadedImages = [];
      if (imagePreviewContainer) imagePreviewContainer.innerHTML = '';
      document.getElementById('imagePreviewArea').style.display = 'none';
    });
  }

  // --- Style Photos Handling ---
  if (addPhotoBtn && photoUploadInput) {
    addPhotoBtn.addEventListener('click', () => photoUploadInput.click());

    photoUploadInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;

        try {
          const base64 = await resizeImage(file, 800, 800);
          stylePhotos.push(base64);
          displayImagePreview(base64, photoPreviewContainer, stylePhotos);
        } catch (err) {
          console.error("Error processing photo:", err);
        }
      }
      photoUploadInput.value = '';
    });
  }

  // --- Custom Fields Handling ---
  function addCustomField(name = '', value = '') {
      if (!customFieldsContainer) return;
      
      const div = document.createElement('div');
      div.className = 'input-group mb-2';
      div.innerHTML = `
        <input type="text" class="form-control" placeholder="Field Name" aria-label="Field Name" value="${name}">
        <input type="text" class="form-control" placeholder="Value" aria-label="Value" value="${value}">
        <button class="btn btn-outline-danger remove-field-btn" type="button">
          <i class="bi bi-trash"></i>
        </button>
      `;
      
      // Add event listener to the remove button
      div.querySelector('.remove-field-btn').addEventListener('click', () => {
        div.remove();
      });

      customFieldsContainer.appendChild(div);
  }

  if (addCustomFieldBtn && customFieldsContainer) {
    addCustomFieldBtn.addEventListener('click', () => addCustomField());
  }

  function displayImagePreview(base64, container, storageArray) {
      if (!container) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'col-auto position-relative';
      
      const img = document.createElement('img');
      img.src = base64;
      img.className = 'img-thumbnail';
      img.style.width = '100px';
      img.style.height = '100px';
      img.style.objectFit = 'cover';

      const removeBtn = document.createElement('button');
      removeBtn.innerHTML = '<i class="bi bi-x"></i>';
      removeBtn.className = 'btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle p-0 d-flex align-items-center justify-content-center';
      removeBtn.style.width = '20px';
      removeBtn.style.height = '20px';
      removeBtn.style.transform = 'translate(30%, -30%)';
      
      removeBtn.onclick = () => {
          // Remove from array
          if (storageArray) {
            const index = storageArray.indexOf(base64);
            if (index > -1) storageArray.splice(index, 1);
          }
          // Remove DOM element
          wrapper.remove();
          
          // Hide container if empty (specific to reference images)
          if (container.id === 'imagePreviewContainer' && container.children.length === 0) {
             document.getElementById('imagePreviewArea').style.display = 'none';
          }
      };

      wrapper.appendChild(img);
      wrapper.appendChild(removeBtn);
      container.appendChild(wrapper);
  }

  // Simple image resizer using Canvas
  function resizeImage(file, maxWidth, maxHeight) {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                  let width = img.width;
                  let height = img.height;

                  if (width > height) {
                      if (width > maxWidth) {
                          height *= maxWidth / width;
                          width = maxWidth;
                      }
                  } else {
                      if (height > maxHeight) {
                          width *= maxHeight / height;
                          height = maxHeight;
                      }
                  }

                  const canvas = document.createElement('canvas');
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0, width, height);
                  resolve(canvas.toDataURL(file.type, 0.7)); // 0.7 quality
              };
              img.onerror = reject;
              img.src = event.target.result;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
      });
  }


  // --- Event Listeners ---

  if (unitToggle) {
    unitToggle.addEventListener('click', () => {
      const newUnit = currentUnit === 'cm' ? 'in' : 'cm';
      
      document.querySelectorAll('.measure-input').forEach(input => {
        if (input.value) {
          input.value = convertValue(input.value, newUnit);
        }
      });

      currentUnit = newUnit;
      unitToggle.textContent = `Switch to ${currentUnit === 'cm' ? 'inches' : 'cm'}`;
      updatePlaceholders();
    });
  }

  const saveBtn = document.getElementById('saveBtn');
  const saveBtnMobile = document.getElementById('saveBtnMobile');
  const clientSelect = document.getElementById('clientSelect');

  function loadClientData(clientId) {
      if (!window.ST || !ST.measurements) return;
      
      const result = ST.measurements.getLatest(clientId);
      if (!result) {
           // No data found, clear form
           document.querySelectorAll('input[id^="field-"]').forEach(input => input.value = '');
           if (document.getElementById('field-notes')) document.getElementById('field-notes').value = '';
           uploadedImages = [];
           stylePhotos = [];
           if (imagePreviewContainer) imagePreviewContainer.innerHTML = '';
           if (photoPreviewContainer) photoPreviewContainer.innerHTML = '';
           if (document.getElementById('imagePreviewArea')) document.getElementById('imagePreviewArea').style.display = 'none';
           if (customFieldsContainer) customFieldsContainer.innerHTML = '';
          return;
      }

      const { data, gender } = result;

      // Set Unit
      currentUnit = data.unit || 'cm';
      if (unitToggle) {
          unitToggle.checked = (currentUnit === 'in');
          unitToggle.textContent = `Switch to ${currentUnit === 'cm' ? 'inches' : 'cm'}`;
      }
      updatePlaceholders();

      // Set Gender
      const genderRadio = document.querySelector(`input[name="gender"][value="${gender}"]`);
      if (genderRadio) genderRadio.checked = true;

      // Set Standard Fields
      if (data.values) {
          Object.entries(data.values).forEach(([key, val]) => {
             const input = document.getElementById(`field-${key}`);
             if (input) input.value = val;
          });
          
          if (data.values.notes && document.getElementById('field-notes')) {
              document.getElementById('field-notes').value = data.values.notes;
          }
      }

      // Set Custom Fields
      if (customFieldsContainer) {
          customFieldsContainer.innerHTML = '';
          if (data.values && data.values.customFields) {
               data.values.customFields.forEach(field => {
                   addCustomField(field.name, field.value);
               });
          }
      }

      // Set Images
      uploadedImages = [];
      stylePhotos = []; 
      
      if (data.images && Array.isArray(data.images)) {
          uploadedImages = data.images;
          if (imagePreviewContainer) {
             imagePreviewContainer.innerHTML = '';
             uploadedImages.forEach(base64 => displayImagePreview(base64, imagePreviewContainer, uploadedImages));
             document.getElementById('imagePreviewArea').style.display = 'block';
          }
      }
  }

  if (clientSelect) {
      clientSelect.addEventListener('change', () => {
          if (clientSelect.value) {
              loadClientData(clientSelect.value);
          }
      });
  }

  // --- Delete Field Handling (Standard Fields) ---
  document.querySelectorAll('.delete-field-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Find the closest column wrapper (col-6) and remove it
      const col = e.target.closest('.col-6');
      if (col) {
        if (confirm('Are you sure you want to remove this field?')) {
          col.remove();
        }
      }
    });
  });

  // --- Save Measurements Handling ---
  function handleSaveMeasurements(e) {
    if (e) e.preventDefault();

    const clientId = clientSelect ? clientSelect.value : null;
    if (!clientId) {
      alert('Please select a client to save measurements.');
      return;
    }

    // Collect Standard Fields
    const measurements = {};
    document.querySelectorAll('input[id^="field-"]').forEach(input => {
      const fieldName = input.id.replace('field-', '');
      if (input.value.trim() !== '') {
        measurements[fieldName] = input.value.trim();
      }
    });

    // Collect Notes
    const notesInput = document.getElementById('field-notes');
    if (notesInput) {
      measurements.notes = notesInput.value.trim();
    }

    // Collect Gender
    let gender = 'male';
    const genderInput = document.querySelector('input[name="gender"]:checked');
    if (genderInput) {
      gender = genderInput.value;
      measurements.gender = gender;
    }

    // Collect Custom Fields
    const customFields = [];
    if (customFieldsContainer) {
      customFieldsContainer.querySelectorAll('.input-group').forEach(group => {
        const inputs = group.querySelectorAll('input');
        if (inputs.length === 2) {
          const name = inputs[0].value.trim();
          const value = inputs[1].value.trim();
          if (name && value) {
            customFields.push({ name, value });
          }
        }
      });
    }
    measurements.customFields = customFields;

    // Collect Images (style reference + style photos)
    const allImages = [...uploadedImages, ...stylePhotos];

    const now = new Date().toISOString();

    // Data stored for this client/gender
    const measurementData = {
      id: Date.now().toString(),
      clientId,
      gender,
      unit: currentUnit,
      values: measurements,
      images: allImages,
      savedAt: now,
      timestamp: now
    };

    if (window.ST && ST.measurements && ST.clients) {
      const clients = ST.clients.all();
      const client = clients.find(c => c.id === clientId);
      const clientName = client ? client.name : '';

      const payload = { ...measurementData, clientName };

      // Persist measurements using shared measurements helper (one record per client + gender)
      ST.measurements.save(clientId, payload, gender);

      // Optionally track last measurement metadata on client
      ST.clients.update(clientId, {
        lastMeasuredAt: now,
        lastMeasurementGender: gender
      });

      // Update dashboard counters if available
      if (window.renderCounts && typeof window.renderCounts === 'function') {
        window.renderCounts();
      }

      alert('Measurements saved successfully!');
    } else {
      console.error('StyleTrack core library not loaded');
      alert('Error saving: system libraries not loaded.');
    }
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', handleSaveMeasurements);
  }
  if (saveBtnMobile) {
    saveBtnMobile.addEventListener('click', handleSaveMeasurements);
  }

  // --- Clear Button Handling ---
  const clearBtn = document.getElementById('clearBtn');
  const clearBtnMobile = document.getElementById('clearBtnMobile');

  function handleClear() {
    if (confirm('Are you sure you want to clear the form?')) {
      // Clear all text/number inputs
      document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(input => {
        if (input.id !== 'clientSearchInput') { // Don't clear search
            input.value = '';
        }
      });
      
      // Reset Selects
      if (clientSelect) clientSelect.value = '';
      
      // Clear Images
      uploadedImages = [];
      stylePhotos = [];
      if (imagePreviewContainer) imagePreviewContainer.innerHTML = '';
      if (photoPreviewContainer) photoPreviewContainer.innerHTML = '';
      const previewArea = document.getElementById('imagePreviewArea');
      if (previewArea) previewArea.style.display = 'none';

      // Remove custom fields
      if (customFieldsContainer) customFieldsContainer.innerHTML = '';

      // Reset placeholders
      updatePlaceholders();
    }
  }

  if (clearBtn) clearBtn.addEventListener('click', handleClear);
  if (clearBtnMobile) clearBtnMobile.addEventListener('click', handleClear);

  // --- Export Handling ---
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportPdfBtn = document.getElementById('exportPdfBtn');

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      // Gather data similar to save
      const measurements = {};
      document.querySelectorAll('input[id^="field-"]').forEach(input => {
        const fieldName = input.id.replace('field-', '');
        if (input.value.trim() !== '') {
          measurements[fieldName] = input.value.trim();
        }
      });

      if (Object.keys(measurements).length === 0) {
        alert('No measurement data to export.');
        return;
      }

      // Convert to CSV
      const rows = [['Field', `Value (${currentUnit})`]];
      Object.entries(measurements).forEach(([key, val]) => {
        rows.push([key, val]);
      });

      // Add Custom Fields
      if (customFieldsContainer) {
        customFieldsContainer.querySelectorAll('.input-group').forEach(group => {
          const inputs = group.querySelectorAll('input');
          if (inputs.length === 2 && inputs[0].value && inputs[1].value) {
            rows.push([inputs[0].value, inputs[1].value]);
          }
        });
      }

      let csvContent = "data:text/csv;charset=utf-8," 
          + rows.map(e => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "measurements.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Close modal
      const modalEl = document.getElementById('exportModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    });
  }

  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', () => {
       // Simple print as PDF for now
       window.print();
       // Close modal
       const modalEl = document.getElementById('exportModal');
       const modal = bootstrap.Modal.getInstance(modalEl);
       if (modal) modal.hide();
    });
  }

});
