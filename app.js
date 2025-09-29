// /GALAXIA/app.js
// Debe cargarse después de frontend-config.js
(function(){
  if (typeof FRONTEND_CONFIG === 'undefined') {
    console.error('FRONTEND_CONFIG missing');
    window.APP = {
      loadAll: async ()=> ({ tareas: [], areas: [], respons: [] }),
      saveTareas: async ()=> { throw new Error('FRONTEND_CONFIG missing'); }
    };
    return;
  }

  const RAW_BASE = FRONTEND_CONFIG.RAW_BASE || `https://raw.githubusercontent.com/${FRONTEND_CONFIG.OWNER || 'transblanco'}/${FRONTEND_CONFIG.REPO || 'GALAXIA'}/main/`;
  const SERVERLESS_URL = FRONTEND_CONFIG.SERVERLESS_URL || '/.netlify/functions/githubProxy';
  const FILES = FRONTEND_CONFIG.FILES || { tareas: 'tareas.json', areas: 'areas.json', responsables: 'responsables.json' };

  async function fetchJsonRaw(filename){
    const url = RAW_BASE + filename.replace(/^\//,'');
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) {
        if (r.status === 404) return null;
        throw new Error(`${r.status} ${r.statusText}`);
      }
      return await r.json();
    } catch (e) {
      console.warn('fetchJsonRaw error', url, e);
      return null;
    }
  }

  async function serverSave(action, payload){
    try {
      const r = await fetch(SERVERLESS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j && j.error ? j.error : JSON.stringify(j));
      return j;
    } catch (err) {
      console.error('serverSave error', err);
      throw err;
    }
  }

  // Public API methods
  async function loadAll(){
    // Prefer server-provided single endpoint if available, else fetch raw files
    const tareas = (await fetchJsonRaw(FILES.tareas)) || [];
    const areas = (await fetchJsonRaw(FILES.areas)) || [];
    const respons = (await fetchJsonRaw(FILES.responsables)) || [];
    return { tareas, areas, respons };
  }

  async function saveAreas(areasArr){
    if(!Array.isArray(areasArr)) throw new Error('areas must be array');
    // payload: { areas: [...], file: 'areas.json' }
    return await serverSave('saveAreas', { areas: areasArr, file: FILES.areas });
  }

  async function saveRespons(responsArr){
    if(!Array.isArray(responsArr)) throw new Error('respons must be array');
    return await serverSave('saveRespons', { respons: responsArr, file: FILES.responsables });
  }

  async function saveTareas(tasksArr){
    if(!Array.isArray(tasksArr)) throw new Error('tasks must be array');
    return await serverSave('saveTasks', { tasks: tasksArr, file: FILES.tareas });
  }

  // Expose for the UI
  window.APP = { loadAll, saveAreas, saveRespons, saveTareas, fetchJsonRaw };

  console.log('APP ready: RAW_BASE=', RAW_BASE, 'SERVERLESS=', SERVERLESS_URL);
})();

