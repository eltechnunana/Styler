document.addEventListener('DOMContentLoaded', () => {
  const measurementForm = document.getElementById('measurementForm');
  const unitToggle = document.getElementById('unitToggle');
  const styleImagesInput = document.getElementById('styleImages');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const clientNameInput = document.getElementById('clientName'); // Assuming you have a client name input

  let currentUnit = 'cm';
  let uploadedImages = []; // Array to store base64 strings of images

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
      styleImagesInput.addEventListener('change', async (e) => {
          const files = Array.from(e.target.files);
          
          for (const file of files) {
              if (!file.type.startsWith('image/')) continue;

               // Compress/Resize image before storing (optional but recommended for localStorage)
              try {
                  const base64 = await resizeImage(file, 800, 800); // Max 800x800
                  uploadedImages.push(base64);
                  displayImagePreview(base64);
              } catch (err) {
                  console.error("Error processing image:", err);
              }
          }
           // Clear input so same files can be selected again if needed
           styleImagesInput.value = '';
      });
  }

  function displayImagePreview(base64) {
      const wrapper = document.createElement('div');
      wrapper.className = 'preview-item';
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline-block';
      wrapper.style.margin = '5px';

      const img = document.createElement('img');
      img.src = base64;
      img.style.width = '100px';
      img.style.height = '100px';
      img.style.objectFit = 'cover';
      img.className = 'img-thumbnail';

      const removeBtn = document.createElement('button');
      removeBtn.innerHTML = '&times;';
      removeBtn.className = 'btn btn-danger btn-sm';
      removeBtn.style.position = 'absolute';
      removeBtn.style.top = '0';
      removeBtn.style.right = '0';
      removeBtn.onclick = () => {
          // Remove from array
          const index = uploadedImages.indexOf(base64);
          if (index > -1) uploadedImages.splice(index, 1);
          // Remove DOM element
          wrapper.remove();
      };

      wrapper.appendChild(img);
      wrapper.appendChild(removeBtn);
      imagePreviewContainer.appendChild(wrapper);
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

  if (measurementForm) {
    measurementForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Collect form data
      const formData = new FormData(measurementForm);
      const data = Object.fromEntries(formData.entries());
      
      // Add current unit and images
      data.unit = currentUnit;
      data.images = uploadedImages; 
      data.timestamp = new Date().toISOString();
      data.id = Date.now().toString(); // Simple ID

      // Save to localStorage (StyleTrack standard)
      const clients = JSON.parse(localStorage.getItem('styletrack_clients') || '[]');
      
      // Check if updating existing client (by name for simplicity, or ID if you have it)
       // In a real app, you'd likely use a hidden ID field
      const existingIndex = clients.findIndex(c => c.name === data.name);
      
      if (existingIndex >= 0) {
          // Merge new measurements into existing client record
          clients[existingIndex] = { ...clients[existingIndex], ...data };
      } else {
           clients.push(data);
      }

      localStorage.setItem('styletrack_clients', JSON.stringify(clients));

      alert('Measurements saved successfully!');
      measurementForm.reset();
      uploadedImages = [];
      imagePreviewContainer.innerHTML = '';
      // Optional: Redirect to clients list
       window.location.href = 'clients.html';
    });
  }
});
