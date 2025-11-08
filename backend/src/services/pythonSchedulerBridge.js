const baseUrl = process.env.PY_SCHEDULER_URL || '';

async function start(params) {
  const res = await fetch(baseUrl + '/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(params) });
  if (!res.ok) throw new Error('Failed to start python scheduler');
  return await res.json(); // { jobId, dataset }
}

async function status(jobId) {
  const res = await fetch(baseUrl + '/status/' + encodeURIComponent(jobId));
  if (!res.ok) throw new Error('status failed');
  return await res.json(); // { state, percent, message }
}

async function result(jobId) {
  const res = await fetch(baseUrl + '/result/' + encodeURIComponent(jobId));
  if (!res.ok) throw new Error('result failed');
  return await res.json(); // { dataset }
}

module.exports = { start, status, result };


