fetch('https://vybera.shop/api/create-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 100, receipt: 'test' })
})
.then(async res => {
  console.log('Status:', res.status, res.statusText);
  const text = await res.text();
  console.log('Response:', text);
})
.catch(err => console.error('Fetch Error:', err));
