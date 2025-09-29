// netlify/functions/githubProxy.js
import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { method } = event;
    const { repo, path, branch, content } = JSON.parse(event.body || "{}");

    const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`;
    
    const headers = {
      Authorization: `token ${process.env.GITHUB_TOKEN}`, // se usa la variable de Netlify
      "Content-Type": "application/json",
    };

    // Leer archivo
    if (method === "GET") {
      const res = await fetch(url, { headers });
      const data = await res.json();
      return { statusCode: 200, body: JSON.stringify(data) };
    }

    // Actualizar archivo
    if (method === "PUT") {
      const res = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(content),
      });
      const data = await res.json();
      return { statusCode: 200, body: JSON.stringify(data) };
    }

    return { statusCode: 400, body: "Método no soportado" };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
