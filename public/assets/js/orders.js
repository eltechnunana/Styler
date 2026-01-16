document.addEventListener('DOMContentLoaded', () => {
  const clientSel = document.getElementById('orderClient');
  const itemInput = document.getElementById('orderItem');
  const dueInput = document.getElementById('orderDue');
  const statusSel = document.getElementById('orderStatus');
  const addBtn = document.getElementById('addOrderBtn');
  const tbody = document.querySelector('#ordersTable tbody');
  const settings = (window.ST && ST.settings && ST.settings.get()) || {};

  // Pricing inputs & totals display elements
  const currencyLabel = document.getElementById('orderCurrencyLabel');
  const unitInput = document.getElementById('orderUnitPrice');
  const qtyInput = document.getElementById('orderQuantity');
  const taxInput = document.getElementById('orderTax');
  const discInput = document.getElementById('orderDiscount');
  const subtotalEl = document.getElementById('orderSubtotal');
  const discountPctEl = document.getElementById('orderDiscountPct');
  const discountAmountEl = document.getElementById('orderDiscountAmount');
  const taxPctEl = document.getElementById('orderTaxPct');
  const taxAmountEl = document.getElementById('orderTaxAmount');
  const totalEl = document.getElementById('orderTotal');

  function formatMoney(amount, currency) {
    const curr = currency || settings.bizCurrency || 'USD';
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: curr }).format(amount || 0);
    } catch {
      const symbol = curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : curr === 'NGN' ? '₦' : curr === 'GHS' ? 'GH₵' : '$';
      return `${symbol}${(amount || 0).toFixed(2)}`;
    }
  }

  function computeTotals(o) {
    const unit = parseFloat(o.unitPrice || '0') || 0;
    const qty = Math.max(1, parseInt(o.quantity || '1')) || 1;
    const taxPct = Math.max(0, parseFloat(o.taxPct || '0') || 0);
    const discountPct = Math.max(0, parseFloat(o.discountPct || '0') || 0);
    const subtotal = unit * qty;
    const discountAmount = subtotal * (discountPct / 100);
    const taxableBase = subtotal - discountAmount;
    const taxAmount = taxableBase * (taxPct / 100);
    const total = taxableBase + taxAmount;
    return { currency: o.currency || settings.bizCurrency || 'USD', unitPrice: unit, quantity: qty, taxPct, discountPct, subtotal, discountAmount, taxAmount, total };
  }

  function currencySymbol(code) {
    return code === 'EUR' ? '€' : code === 'GBP' ? '£' : code === 'NGN' ? '₦' : code === 'GHS' ? 'GH₵' : '$';
  }

  function updateCardTotals() {
    const currency = settings.bizCurrency || 'USD';
    if (currencyLabel) currencyLabel.textContent = currencySymbol(currency);
    const totals = computeTotals({
      unitPrice: unitInput ? unitInput.value : 0,
      quantity: qtyInput ? qtyInput.value : 1,
      taxPct: taxInput ? taxInput.value : 0,
      discountPct: discInput ? discInput.value : 0,
      currency
    });
    if (discountPctEl) discountPctEl.textContent = String(totals.discountPct || 0);
    if (taxPctEl) taxPctEl.textContent = String(totals.taxPct || 0);
    if (subtotalEl) subtotalEl.textContent = formatMoney(totals.subtotal, currency);
    if (discountAmountEl) discountAmountEl.textContent = formatMoney(totals.discountAmount, currency);
    if (taxAmountEl) taxAmountEl.textContent = formatMoney(totals.taxAmount, currency);
    if (totalEl) totalEl.textContent = formatMoney(totals.total, currency);
  }

  function generateInvoice(order) {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) { alert('PDF library not loaded'); return; }
    const doc = new jsPDF();
    const biz = settings;
    const totals = computeTotals(order);
    const clientsById = Object.fromEntries(ST.clients.all().map(c => [c.id, c.name]));
    const clientName = clientsById[order.clientId] || order.clientId || 'Client';
    const invoiceId = order.invoiceId || `INV-${order.id.slice(-6)}`;
    const currency = totals.currency;

    // Header with logo
    let yStart = 20;
    
    // Header Section: Logo + Business Details
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(String(biz.bizName || 'ELTECH DESIGN'), 14, yStart);
    yStart += 6;
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.text(String(biz.bizTagline || 'Creative Fashion & Bespoke Tailoring'), 14, yStart);
    yStart += 8;

    doc.setFont(undefined, 'normal');
    doc.text(`Business ID: ${biz.bizId || 'GW-028-40073'}`, 14, yStart);
    yStart += 5;
    if (biz.bizEmail) {
      doc.text(`📧 ${biz.bizEmail}`, 14, yStart);
      yStart += 5;
    }
    if (biz.bizPhone) {
      doc.text(`📞 ${biz.bizPhone}`, 14, yStart);
      yStart += 5;
    }

    yStart += 5;
    doc.line(14, yStart, 196, yStart);
    yStart += 10;

    // INVOICE Title Section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE', 14, yStart);
    yStart += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`Invoice ID: ${invoiceId}`, 14, yStart);
    yStart += 5;
    doc.text(`Invoice Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 14, yStart);
    
    yStart += 5;
    doc.line(14, yStart, 196, yStart);
    yStart += 8;

    // Billed To Section
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Billed To', 14, yStart);
    yStart += 6;
    doc.setFontSize(10);
    doc.text(`Customer Name: ${clientName}`, 14, yStart);

    yStart += 5;
    doc.line(14, yStart, 196, yStart);
    yStart += 8;

    // Invoice Details Table Header
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Invoice Details', 14, yStart);
    yStart += 8;

    const startX = 14;
    const colDescX = startX;
    const colQtyX = startX + 95;
    const colUnitX = startX + 120;
    const colLineX = startX + 160;

    doc.setFontSize(10);
    doc.text('Description', colDescX, yStart);
    doc.text('Quantity', colQtyX, yStart, { align: 'right' });
    doc.text('Unit Price', colUnitX + 20, yStart, { align: 'right' });
    doc.text('Line Total', colLineX + 25, yStart, { align: 'right' });
    
    yStart += 2;
    doc.line(14, yStart, 196, yStart); // Underline header
    yStart += 6;

    // Table Row
    doc.setFont(undefined, 'normal');
    doc.text(String(order.item || 'Custom Order'), colDescX, yStart);
    doc.text(String(totals.quantity), colQtyX, yStart, { align: 'right' });
    doc.text(String(formatMoney(totals.unitPrice, currency)), colUnitX + 20, yStart, { align: 'right' });
    doc.text(String(formatMoney(totals.subtotal, currency)), colLineX + 25, yStart, { align: 'right' });

    yStart += 5;
    doc.line(14, yStart, 196, yStart);
    yStart += 8;

    // Payment Summary Section
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Payment Summary', 14, yStart);
    yStart += 8;

    doc.setFontSize(10);
    // Subtotal
    doc.setFont(undefined, 'bold');
    doc.text('Subtotal', 14, yStart);
    doc.text(String(formatMoney(totals.subtotal, currency)), 180, yStart, { align: 'right' });
    yStart += 6;

    // Discount
    doc.text(`Discount (${totals.discountPct}%)`, 14, yStart);
    doc.text(`- ${formatMoney(totals.discountAmount, currency)}`, 180, yStart, { align: 'right' });
    yStart += 6;

    // Tax
    doc.text(`Tax (${totals.taxPct}%)`, 14, yStart);
    doc.text(String(formatMoney(totals.taxAmount, currency)), 180, yStart, { align: 'right' });
    yStart += 6;

    // Total Amount Due
    doc.setFontSize(11);
    doc.text('Total Amount Due', 14, yStart);
    doc.text(String(formatMoney(totals.total, currency)), 180, yStart, { align: 'right' });
    
    yStart += 5;
    doc.line(14, yStart, 196, yStart);
    yStart += 8;

    // Payment Status Section
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Payment Status', 14, yStart);
    yStart += 6;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Status: Invoice issued`, 14, yStart);
    yStart += 5;
    doc.setFont(undefined, 'bold');
    doc.text(`Amount Payable: ${formatMoney(totals.total, currency)}`, 14, yStart);

    yStart += 5;
    doc.line(14, yStart, 196, yStart);
    yStart += 8;

    // Notes & Terms
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Notes & Terms', 14, yStart);
    yStart += 6;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const terms = [
      '• All garments are custom-made with precision and care.',
      '• Items are non-refundable after production begins.',
      '• Please retain this invoice for your records.'
    ];
    terms.forEach(term => {
      doc.text(term, 14, yStart);
      yStart += 5;
    });

    yStart += 2;
    doc.line(14, yStart, 196, yStart);
    yStart += 8;

    // Appreciation Message
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Appreciation Message', 14, yStart);
    yStart += 6;
    doc.setFontSize(9);
    doc.setFont(undefined, 'italic');
    doc.text('Thank you for your business. We appreciate the opportunity to serve you and look forward to styling you again.', 14, yStart);

    const safeName = String(clientName).replace(/[^a-z0-9]/gi, '-');
    doc.save(`invoice-${safeName}-${invoiceId}.pdf`);
  }

  function generateReceipt(order) {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) { alert('PDF library not loaded'); return; }
    const doc = new jsPDF();
    const biz = settings;
    const totals = computeTotals(order);
    const clientsById = Object.fromEntries(ST.clients.all().map(c => [c.id, c.name]));
    const clientName = clientsById[order.clientId] || order.clientId || 'Client';
    const receiptId = `RCT-${order.id.slice(-6)}`;
    const currency = totals.currency;
    const bizName = biz.bizName || 'ELORA COUTURE';
    const tagline = biz.bizTagline || 'Luxury • Faith • African Elegance';
    const location = biz.bizAddress || 'Accra, Ghana';
    const phone = biz.bizPhone || '+233 24 000 0000';
    const email = biz.bizEmail || 'eloracouture@gmail.com';
    const website = biz.bizWebsite || 'http://www.eloracouture.com';
    const itemDescription = order.item || 'Custom Fashion Item';
    const category = order.category || 'Bespoke Fashion Design';
    const quantity = totals.quantity;
    const subtotal = totals.subtotal;
    const discountAmount = totals.discountAmount;
    const taxAmount = totals.taxAmount;
    const totalPaid = totals.total;
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginLeft = 18;
    const marginRight = pageWidth - 18;
    let y = 20;

    // Render Logo if exists
    if (biz.bizLogo) {
      try {
        let format = 'JPEG';
        if (biz.bizLogo.startsWith('data:image/png')) format = 'PNG';
        else if (biz.bizLogo.startsWith('data:image/svg')) format = 'SVG';
        // Add logo at top-left, adjust text Y position
        doc.addImage(biz.bizLogo, format, marginLeft, y, 25, 25);
        y += 30; // Push text down
      } catch (e) {
        console.warn('Could not add logo to PDF:', e);
      }
    }

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(String(bizName), marginLeft, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    if (tagline) {
      doc.text(String(tagline), marginLeft, y);
      y += 6;
    }
    if (location) {
      doc.text(String(location), marginLeft, y);
      y += 5;
    }
    if (phone) {
      doc.text(String(phone), marginLeft, y);
      y += 5;
    }
    if (email) {
      doc.text(String(email), marginLeft, y);
      y += 5;
    }
    // Website removed as per user request
    doc.line(marginLeft, y, marginRight, y);
    y += 8;
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('RECEIPT', marginLeft, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Receipt ID: ${receiptId}`, marginLeft, y);
    y += 5;
    doc.text(`Transaction Date: ${new Date().toLocaleDateString()}`, marginLeft, y);
    y += 5;
    doc.line(marginLeft, y, marginRight, y);
    y += 8;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Customer Details', marginLeft, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Received From: ${clientName}`, marginLeft, y);
    y += 5;
    doc.line(marginLeft, y, marginRight, y);
    y += 8;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Purchase Details', marginLeft, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Item Description: ${itemDescription}`, marginLeft, y);
    y += 5;
    doc.text(`Category: ${category}`, marginLeft, y);
    y += 5;
    doc.text(`Quantity: ${quantity}`, marginLeft, y);
    y += 5;
    doc.line(marginLeft, y, marginRight, y);
    y += 8;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Payment Summary', marginLeft, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Subtotal: ${formatMoney(subtotal, currency)}`, marginLeft, y);
    y += 5;
    doc.text(`Discount: ${formatMoney(discountAmount, currency)}`, marginLeft, y);
    y += 5;
    doc.text(`Tax: ${formatMoney(taxAmount, currency)}`, marginLeft, y);
    y += 7;
    doc.setFont(undefined, 'bold');
    doc.text(`Total Amount Paid: ${formatMoney(totalPaid, currency)}`, marginLeft, y);
    y += 7;
    doc.line(marginLeft, y, marginRight, y);
    y += 8;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Payment Status', marginLeft, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Status: Payment successfully recorded', marginLeft, y);
    y += 5;
    doc.text(`Outstanding Balance: ${formatMoney(0, currency)}`, marginLeft, y);
    y += 5;
    doc.line(marginLeft, y, marginRight, y);
    y += 8;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Important Notice', marginLeft, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const noticeLines = [
      'All garments are carefully designed and tailored to meet our quality standards.',
      'Items are non-refundable after delivery unless otherwise agreed.'
    ];
    noticeLines.forEach(line => {
      doc.text(line, marginLeft, y);
      y += 4;
    });
    y += 3;
    doc.line(marginLeft, y, marginRight, y);
    y += 8;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Thank You Message', marginLeft, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont(undefined, 'italic');
    doc.text(`Thank you for choosing ${bizName || 'us'}. Every piece is crafted with care—`, marginLeft, y);
    y += 4;
    doc.text('wear it with confidence and grace.', marginLeft, y);
    y += 6;
    doc.setFont(undefined, 'normal');
    // Authorized Signature section removed as per user request
    const safeName = String(clientName).replace(/[^a-z0-9]/gi, '-');
    doc.save(`receipt-${safeName}-${receiptId}.pdf`);
  }

  function loadClients() {
    const list = ST.clients.all();
    clientSel.innerHTML = '';
    if (!list.length) {
      const opt = document.createElement('option'); opt.value = ''; opt.textContent = 'No clients'; clientSel.appendChild(opt);
      return;
    }
    list.forEach(c => {
      const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.name; clientSel.appendChild(opt);
    });
  }

  function renderOrders() {
    const list = ST.orders.all();
    const clientsById = Object.fromEntries(ST.clients.all().map(c => [c.id, c.name]));
    tbody.innerHTML = '';
    if (!list.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td'); td.colSpan = 6; td.textContent = 'No orders yet.'; td.className = 'text-muted';
      tr.appendChild(td); tbody.appendChild(tr); return;
    }
    list.forEach(o => {
      const tr = document.createElement('tr');
      const ctd = document.createElement('td'); ctd.textContent = clientsById[o.clientId] || o.clientId; tr.appendChild(ctd);
      const itd = document.createElement('td'); itd.textContent = o.item || ''; tr.appendChild(itd);
      const dtd = document.createElement('td'); dtd.textContent = o.dueDate || ''; tr.appendChild(dtd);
      const std = document.createElement('td');
      const statusSelect = document.createElement('select'); statusSelect.className = 'form-select form-select-sm';
      ['pending','in_progress','ready','delivered'].forEach(s => {
        const opt = document.createElement('option'); opt.value = s; opt.textContent = s.replace('_',' ');
        if (o.status === s) opt.selected = true; statusSelect.appendChild(opt);
      });
      statusSelect.addEventListener('change', () => { ST.orders.update(o.id, { status: statusSelect.value }); });
      std.appendChild(statusSelect); tr.appendChild(std);

      const amt = computeTotals(o);
      const amtTd = document.createElement('td'); amtTd.textContent = formatMoney(amt.total, amt.currency); tr.appendChild(amtTd);

      const atd = document.createElement('td'); atd.className = 'text-end';
      const invBtn = document.createElement('button'); invBtn.className = 'btn btn-sm btn-outline-primary me-2'; invBtn.innerHTML = '<i class="bi bi-file-earmark-text me-1"></i>Invoice';
      invBtn.addEventListener('click', () => generateInvoice(o));
      const rctBtn = document.createElement('button'); rctBtn.className = 'btn btn-sm btn-outline-success me-2'; rctBtn.innerHTML = '<i class="bi bi-receipt me-1"></i>Receipt';
      rctBtn.addEventListener('click', () => generateReceipt(o));
      const delBtn = document.createElement('button'); delBtn.className = 'btn btn-sm btn-outline-danger'; delBtn.innerHTML = '<i class="bi bi-trash"></i>';
      delBtn.addEventListener('click', () => { if (confirm('Delete order?')) { ST.orders.remove(o.id); renderOrders(); } });
      atd.append(invBtn, rctBtn, delBtn); tr.appendChild(atd);

      tbody.appendChild(tr);
    });
  }

  addBtn.addEventListener('click', () => {
    const clientId = clientSel.value;
    if (!clientId) { alert('Select a client'); return; }
    const item = itemInput.value.trim();
    const dueDate = dueInput.value;
    const status = statusSel.value;
    const currency = settings.bizCurrency || 'USD';
    const unitPrice = unitInput ? parseFloat(unitInput.value || '0') || 0 : 0;
    const quantity = qtyInput ? Math.max(1, parseInt(qtyInput.value || '1')) || 1 : 1;
    const taxPct = taxInput ? Math.max(0, parseFloat(taxInput.value || '0') || 0) : 0;
    const discountPct = discInput ? Math.max(0, parseFloat(discInput.value || '0') || 0) : 0;
    ST.orders.add({ clientId, item, dueDate, status, unitPrice, quantity, taxPct, discountPct, currency });
    itemInput.value = ''; dueInput.value = ''; statusSel.value = 'pending';
    if (unitInput) unitInput.value = '0';
    if (qtyInput) qtyInput.value = '1';
    if (taxInput) taxInput.value = String(settings.bizDefaultTax || 0);
    if (discInput) discInput.value = '0';
    updateCardTotals();
    renderOrders();
  });

  loadClients();
  renderOrders();

  // Initialize pricing defaults and totals
  if (typeof settings.bizDefaultTax !== 'undefined' && taxInput) {
    taxInput.value = String(settings.bizDefaultTax);
  }
  updateCardTotals();
  [unitInput, qtyInput, taxInput, discInput].forEach(el => {
    if (el) el.addEventListener('input', updateCardTotals);
  });
});
