// app.js
// Debe cargarse después de frontend-config.js
(async function(){

  // 1) Cargar galaxia.json (config pública)
  async function loadPublicConfig(){
    try {
      const r = await fetch('/galaxia.json', { cache: 'no-store' });
      if(!r.ok) throw new Error('No se pudo cargar galáxia.json');
      return await r.json();
    } catch(e) {
      console.warn('No se pudo cargar galaxia.json, usando defaults', e);
      return null;
    }
  }

  const publicCfg = await loadPublicConfig();
  // FRONTEND_CONFIG ya existe por frontend-config.js
  const RAW_BASE = FRONTEND_CONFIG.RAW_BASE;
  const SERVERLESS_URL = FRONTEND_CONFIG.SERVERLESS_URL;
  const FILES = FRONTEND_CONFIG.FILES;

  // 2) Lectura pública (raw.githubusercontent)
  async function fetchJsonRaw(filename){
    const url = RAW_BASE + filename; // asegúrate filename NO empiece con '/'
    const res = await fetch(url, { cache: 'no-store' });
    if(!res.ok){
      if(res.status === 404) return null;
      throw new Error(`Error leyendo ${filename}: ${res.status}`);
    }
    return await res.json();
  }

  // 3) Escritura segura: POST a Netlify Function
  // Nota: la función en Netlify hace el PUT a GitHub con el token en env var
  async function serverSave(action, payload){
    const res = await fetch(SERVERLESS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });
    const json = await res.json();
    if(!res.ok) throw new Error(json.error || 'Error serverless');
    return json;
  }

  // Ejemplos de uso:
  async function loadAll(){
    const tareas = await fetchJsonRaw(FILES.tareas) || [];
    const areas  = await fetchJsonRaw(FILES.areas) || [];
    const respons = await fetchJsonRaw(FILES.responsables) || [];
    return { tareas, areas, respons };
  }

  async function saveTareas(newTareas){
    // payload convention: { tasks: [...], file: 'tareas.json' }
    return await serverSave('saveTasks', { tasks: newTareas, file: FILES.tareas });
  }

  async function saveAreas(newAreas){
    return await serverSave('saveAreas', { areas: newAreas, file: FILES.areas });
  }

  async function saveRespons(newRespons){
    return await serverSave('saveRespons', { respons: newRespons, file: FILES.responsables });
  }

  // Inicial: carga y render (con tus funciones de UI)
  const data = await loadAll();
  console.log('Datos cargados (lectura pública):', data);
  // Aquí llama a las funciones que renderizan la UI con `data.tareas` etc.

  // Exporta funciones al global si los modales HTML llaman a ellas
  window.APP = {
    loadAll, saveTareas, saveAreas, saveRespons, fetchJsonRaw
  };

})();
