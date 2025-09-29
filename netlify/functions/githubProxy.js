// netlify/functions/githubProxy.js
// Node 18+ (Netlify). No pongas tokens en el repo: usa Netlify env vars.
exports.handler = async function(event, context) {
  const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: 'OK' };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    // payload structure: { action: 'saveAreas'|'saveRespons'|'saveTasks', payload: {...} }
    const { action, payload } = body;

    const TOKEN = process.env.GITHUB_TOKEN;
    if (!TOKEN) {
      return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'GITHUB_TOKEN not set in environment' }) };
    }

    const OWNER = process.env.REPO_OWNER || payload?.owner || 'transblanco';
    const REPO = process.env.REPO_NAME || payload?.repo || 'GALAXIA';
    const BRANCH = process.env.BRANCH || payload?.branch || 'main';

    // helper: get file contents (returns null if 404)
    async function ghGet(path) {
      // path must NOT start with '/'
      const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`;
      const res = await fetch(url, { headers: { Authorization: `token ${TOKEN}`, Accept: 'application/vnd.github+json' } });
      if (res.status === 404) return null;
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`ghGet ${res.status} ${txt}`);
      }
      return await res.json();
    }

    // helper: put file (create or update)
    async function ghPut(path, contentStr, message = `Update ${path}`, sha = null) {
      const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}`;
      const bodyReq = {
        message,
        content: Buffer.from(contentStr, 'utf8').toString('base64'),
        branch: BRANCH
      };
      if (sha) bodyReq.sha = sha;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { Authorization: `token ${TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyReq)
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(`ghPut ${res.status}: ${json && json.message ? json.message : JSON.stringify(json)}`);
      }
      return json;
    }

    // Validate action and perform
    if (action === 'saveAreas') {
      const areas = payload?.areas;
      const file = (payload?.file || 'areas.json').replace(/^\/+/, ''); // strip leading slash
      if (!Array.isArray(areas)) return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'payload.areas debe ser un arreglo' }) };

      // read existing to obtain sha (if any)
      const existing = await ghGet(file);
      const sha = existing ? existing.sha : null;
      const content = JSON.stringify(areas, null, 2);
      const result = await ghPut(file, content, `Update ${file} via Netlify function`, sha);
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true, result }) };
    }

    if (action === 'saveRespons') {
      const respons = payload?.respons;
      const file = (payload?.file || 'responsables.json').replace(/^\/+/, '');
      if (!Array.isArray(respons)) return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'payload.respons debe ser un arreglo' }) };

      const existing = await ghGet(file);
      const sha = existing ? existing.sha : null;
      const content = JSON.stringify(respons, null, 2);
      const result = await ghPut(file, content, `Update ${file} via Netlify function`, sha);
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true, result }) };
    }

    if (action === 'saveTasks' || action === 'saveTareas') {
      const tasks = payload?.tasks || payload?.tareas;
      const file = (payload?.file || 'tareas.json').replace(/^\/+/, '');
      if (!Array.isArray(tasks)) return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'payload.tasks debe ser un arreglo' }) };

      const existing = await ghGet(file);
      const sha = existing ? existing.sha : null;
      const content = JSON.stringify(tasks, null, 2);
      const result = await ghPut(file, content, `Update ${file} via Netlify function`, sha);
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true, result }) };
    }

    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Acción desconocida' }) };

  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
