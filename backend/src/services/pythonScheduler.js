const BASE_URL = process.env.PY_SCHEDULER_URL || 'http://127.0.0.1:8000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    let detail;
    try {
      detail = await res.json();
    } catch (e) {
      detail = await res.text();
    }
    const err = new Error('Python scheduler request failed');
    err.status = res.status;
    err.detail = detail;
    throw err;
  }
  return res.json();
}

async function listDatasets() {
  const data = await request('/datasets', { method: 'GET', headers: { 'Content-Type': undefined } });
  return data.datasets || [];
}

async function generate(payload) {
  return request('/generate', { method: 'POST', body: JSON.stringify(payload) });
}

module.exports = { listDatasets, generate };


