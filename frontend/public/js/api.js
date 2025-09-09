const API_BASE = "http://localhost:5000/api"; // your backend URL

async function apiRequest(endpoint, method = "GET", data = null, auth = true) {
  const headers = { "Content-Type": "application/json" };
  if (auth && localStorage.getItem("token")) {
    headers["Authorization"] = "Bearer " + localStorage.getItem("token");
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : null
  });

  if (!res.ok) throw new Error("API Error: " + res.status);
  return await res.json();
}
