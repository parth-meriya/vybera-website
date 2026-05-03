import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:3001/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 500, receipt: 'test' })
    });
    const data = await res.json();
    console.log("Response:", res.status, data);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();
