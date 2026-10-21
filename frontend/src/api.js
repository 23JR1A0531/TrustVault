const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api"
).replace(/\/$/, "");

async function request(path, options = {}) {
  const {
    token,
    method = "GET",
    body,
    formData = false,
    blob = false,
  } = options;

  const headers = {};

  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  if (body !== undefined && !formData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : formData
          ? body
          : JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const data = await response.json();
      message = data.message || data.error || data.detail || message;
    } catch {
      // Keep the HTTP error message if response isn't JSON.
    }

    throw new Error(message);
  }

  if (blob) return response.blob();
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export const api = {
  login: (data) =>
    request("/auth/login", { method: "POST", body: data }),

  register: (data) =>
    request("/auth/register", { method: "POST", body: data }),

  me: (token) => request("/auth/me", { token }),

  logout: (token) =>
    request("/logout-all", { method: "POST", token }),

  health: () =>
    request("/health"),

  documents: (token, search = "") =>
    request(
      `/documents${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      { token }
    ),

  upload: (token, formData) =>
    request("/documents", {
      method: "POST",
      token,
      body: formData,
      formData: true,
    }),

  download: (token, id) =>
    request(`/documents/${id}/download`, { token, blob: true }),

  edit: (token, id, data) =>
    request(`/documents/${id}`, { method: "PATCH", token, body: data }),

  remove: (token, id) =>
    request(`/documents/${id}`, { method: "DELETE", token }),

  grantUser: (token, id, data) =>
    request(`/documents/${id}/permissions`, { method: "PUT", token, body: data }),

  grantGroup: (token, id, data) =>
    request(`/documents/${id}/group-permissions`, { method: "PUT", token, body: data }),

  grantDepartment: (token, id, data) =>
    request(`/documents/${id}/department-permissions`, { method: "PUT", token, body: data }),

  groups: (token) =>
    request("/groups", { token }),

  createGroup: (token, data) =>
    request("/groups", { method: "POST", token, body: data }),

  addGroupMember: (token, id, data) =>
    request(`/groups/${id}/members`, { method: "POST", token, body: data }),

  departments: (token) =>
    request("/departments", { token }),

  createDepartment: (token, data) =>
    request("/departments", { method: "POST", token, body: data }),

  departmentMembers: (token) =>
    request("/department-members", { token }),

  addDepartmentMember: (token, data) =>
    request("/department-members", { method: "POST", token, body: data }),

  audit: (token) =>
    request("/admin/audit", { token }),

  verifyAudit: (token) =>
    request("/admin/audit/verify", { token }),
};
