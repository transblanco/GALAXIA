// frontend-config.js
// NO INCLUYAS NINGÚN TOKEN AQUÍ
const FRONTEND_CONFIG = {
  RAW_BASE: 'https://raw.githubusercontent.com/transblanco/GALAXIA/main/',
  SERVERLESS_URL: '/.netlify/functions/githubProxy', // Netlify function (relative)
  FILES: {
    tareas: 'tareas.json',
    areas: 'areas.json',
    responsables: 'responsables.json'
  }
};
