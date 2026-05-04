/**
 * VYBERA — PDF Bill Generator
 * 
 * Two bill types:
 * 1. Shipping Label — Goes on the package (customer address + return address)
 * 2. Order Invoice — Full order details (order ID, products, pricing)
 */

const RETURN_ADDRESS = {
  name: 'VYBERA',
  line1: '818, Vishal Nagar',
  line2: 'Isanpur, Ahmedabad',
  state: 'Gujarat, India',
  phone: '+91 7574097366',
};

// ── Helper: Open printable HTML in new window ──────────────
function openPrintWindow(html, title) {
  const win = window.open('', '_blank', 'width=800,height=900');
  if (!win) {
    alert('Please allow popups to download the bill.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.document.title = title;
  // Auto-trigger print after fonts load
  win.onload = () => setTimeout(() => win.print(), 400);
}

// ── 1. SHIPPING LABEL (for packaging) ──────────────────────
export function printShippingLabel(order) {
  const addr = order.address || {};
  const date = order.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || new Date().toLocaleDateString('en-IN');
  
  const html = `<!DOCTYPE html>
<html>
<head>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; padding: 24px; color: #111; }
  .label { border: 2px solid #111; padding: 24px; max-width: 500px; margin: 0 auto; }
  .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 16px; }
  .header h1 { font-size: 24px; font-weight: 700; letter-spacing: 0.2em; }
  .header p { font-size: 10px; color: #666; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 4px; }
  .section { margin-bottom: 16px; }
  .section-title { font-size: 9px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin-bottom: 8px; }
  .info { font-size: 13px; line-height: 1.6; }
  .info strong { font-weight: 600; }
  .divider { border-top: 1px dashed #ccc; margin: 16px 0; }
  .return-box { background: #f5f5f5; padding: 12px; border: 1px solid #ddd; }
  .order-id { font-family: monospace; font-size: 11px; color: #666; text-align: center; margin-top: 12px; }
  @media print { body { padding: 0; } .label { border: 2px solid #000; } }
</style>
</head>
<body>
  <div class="label">
    <div class="header">
      <h1>VYBERA</h1>
      <p>Wear The Next</p>
    </div>
    
    <div class="section">
      <div class="section-title">Deliver To</div>
      <div class="info">
        <strong>${addr.name || '—'}</strong><br>
        ${addr.address || ''}<br>
        ${addr.city || ''}${addr.state ? ', ' + addr.state : ''} — ${addr.pincode || ''}<br>
        <strong>Phone:</strong> ${addr.phone || '—'}<br>
        <strong>Email:</strong> ${addr.email || order.userEmail || '—'}
      </div>
    </div>

    <div class="divider"></div>

    <div class="section">
      <div class="section-title">If Undeliverable, Return To</div>
      <div class="return-box info">
        <strong>${RETURN_ADDRESS.name}</strong><br>
        ${RETURN_ADDRESS.line1}<br>
        ${RETURN_ADDRESS.line2}<br>
        ${RETURN_ADDRESS.state}<br>
        <strong>Phone:</strong> ${RETURN_ADDRESS.phone}
      </div>
    </div>

    <div class="order-id">
      Order: ${order.id} &nbsp;|&nbsp; Date: ${date}
    </div>
  </div>
</body>
</html>`;

  openPrintWindow(html, `Shipping Label - ${order.id}`);
}

// ── 2. ORDER INVOICE (full order details) ──────────────────
export function printOrderInvoice(order) {
  const addr = order.address || {};
  const date = order.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || new Date().toLocaleDateString('en-IN');
  const products = order.products || [];

  const productRows = products.map(p => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;">${p.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;text-align:center;">${p.size || '—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;text-align:center;">${p.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;text-align:right;">₹${p.price?.toLocaleString()}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;text-align:right;font-weight:600;">₹${(p.price * p.quantity)?.toLocaleString()}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; padding: 32px; color: #111; max-width: 700px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 20px; margin-bottom: 24px; }
  .brand h1 { font-size: 28px; font-weight: 700; letter-spacing: 0.2em; }
  .brand p { font-size: 10px; color: #888; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 2px; }
  .invoice-meta { text-align: right; font-size: 11px; color: #555; line-height: 1.8; }
  .invoice-meta strong { color: #111; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .section-title { font-size: 9px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin-bottom: 8px; }
  .info { font-size: 12px; line-height: 1.7; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #f5f5f5; padding: 10px 12px; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; text-align: left; border-bottom: 2px solid #ddd; }
  .totals { width: 250px; margin-left: auto; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; }
  .totals .row.total { border-top: 2px solid #111; padding-top: 10px; margin-top: 6px; font-size: 14px; font-weight: 700; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; text-align: center; }
  .footer p { font-size: 10px; color: #999; line-height: 1.6; }
  .payment-badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 4px 12px; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; border-radius: 2px; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>VYBERA</h1>
      <p>Wear The Next</p>
    </div>
    <div class="invoice-meta">
      <strong>INVOICE</strong><br>
      Order: <strong>${order.id}</strong><br>
      Date: ${date}<br>
      ${order.paymentId && order.paymentId !== 'free_coupon_bypass' 
        ? `Payment: <span style="font-family:monospace;">${order.paymentId}</span>` 
        : '<span class="payment-badge">FREE (Coupon)</span>'}
    </div>
  </div>

  <div class="grid">
    <div>
      <div class="section-title">Bill To</div>
      <div class="info">
        <strong>${addr.name || '—'}</strong><br>
        ${addr.email || order.userEmail || ''}<br>
        ${addr.phone || ''}<br>
        ${addr.address || ''}<br>
        ${addr.city || ''}${addr.state ? ', ' + addr.state : ''} — ${addr.pincode || ''}
      </div>
    </div>
    <div>
      <div class="section-title">Ship From</div>
      <div class="info">
        <strong>${RETURN_ADDRESS.name}</strong><br>
        ${RETURN_ADDRESS.line1}<br>
        ${RETURN_ADDRESS.line2}<br>
        ${RETURN_ADDRESS.state}<br>
        ${RETURN_ADDRESS.phone}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th style="text-align:center;">Size</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Price</th>
        <th style="text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${productRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="row">
      <span>Subtotal</span>
      <span>₹${order.subtotal?.toLocaleString() || order.total?.toLocaleString()}</span>
    </div>
    <div class="row">
      <span>Shipping</span>
      <span style="color:#2e7d32;">Free</span>
    </div>
    ${order.discount > 0 ? `
    <div class="row">
      <span style="color:#2e7d32;">Discount${order.couponCode ? ' (' + order.couponCode + ')' : ''}</span>
      <span style="color:#2e7d32;">−₹${order.discount?.toLocaleString()}</span>
    </div>` : ''}
    <div class="row total">
      <span>Total</span>
      <span>₹${order.total?.toLocaleString()}</span>
    </div>
  </div>

  <div class="footer">
    <p>
      Thank you for shopping with VYBERA!<br>
      For support, email vybera@gmail.com or call ${RETURN_ADDRESS.phone}<br>
      www.vybera.shop
    </p>
  </div>
</body>
</html>`;

  openPrintWindow(html, `Invoice - ${order.id}`);
}
