document.addEventListener('DOMContentLoaded', () => {
  const cardsWrap = document.getElementById('summaryCards');
  const statusWrap = document.getElementById('statusBreakdown');

  function render() {
    const clients = ST.clients.all();
    const orders = ST.orders.all();

    cardsWrap.innerHTML = '';
    const cardSpecs = [
      { title: 'Clients', value: clients.length, icon: 'bi-people' },
      { title: 'Orders', value: orders.length, icon: 'bi-card-checklist' },
    ];
    cardSpecs.forEach(s => {
      const col = document.createElement('div'); col.className = 'col-sm-6 col-lg-3';
      col.innerHTML = `
        <div class="card card-brand h-100">
          <div class="card-body d-flex align-items-center justify-content-between">
            <div>
              <div class="text-muted">${s.title}</div>
              <div class="fs-4">${s.value}</div>
            </div>
            <i class="bi ${s.icon} fs-2 text-primary"></i>
          </div>
        </div>`;
      cardsWrap.appendChild(col);
    });

    const statuses = ['pending','in_progress','ready','delivered'];
    const counts = Object.fromEntries(statuses.map(s => [s, 0]));
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    statusWrap.innerHTML = '';
    statuses.forEach(s => {
      const col = document.createElement('div'); col.className = 'col-12 col-md-6 col-lg-3';
      const label = s.replace('_',' ');
      col.innerHTML = `
        <div class="border rounded p-3 h-100">
          <div class="d-flex justify-content-between">
            <span class="text-muted">${label}</span>
            <span>${counts[s]}</span>
          </div>
          <div class="progress mt-2" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="${orders.length}">
            <div class="progress-bar" style="width:${orders.length? Math.round((counts[s]/orders.length)*100) : 0}%"></div>
          </div>
        </div>`;
      statusWrap.appendChild(col);
    });
  }

  render();
});
