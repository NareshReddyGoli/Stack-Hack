async function runSolver(payload) {
  const baseUrl = process.env.PYTHON_SCHEDULER_URL || 'http://localhost:8000';
  const res = await fetch(`${baseUrl}/api/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = await safeReadText(res);
    try {
      const j = JSON.parse(detail);
      detail = j.detail || detail;
    } catch (_) {}
    const err = new Error(`PYTHON_${res.status}: ${detail}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function safeReadText(res) {
  try { return await res.text(); } catch (_) { return ''; }
}

module.exports = { runSolver };


