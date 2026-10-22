
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:5000/api"
).replace(/\/+$/, "");

/**
 * Common API request handler.
 * Supports JSON, FormData uploads, and blob downloads.
 */
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
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined && !formData) {
    headers["Content-Type"] = "application/json";
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : formData
            ? body
            : JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Unable to connect to the server. Check that the backend is running."
    );
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const data = await response.json();

      message =
        data.message ||
        data.error ||
        data.detail ||
        message;
    } catch {
      // Preserve the original HTTP error message.
    }

    if (response.status === 401) {
      throw new Error(
        "Session expired or authentication failed. Please log in again."
      );
    }

    if (response.status === 403) {
      throw new Error(
        message || "You do not have permission to perform this action."
      );
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  if (blob) {
    return response.blob();
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export const api = {
  // Authentication
  login: (data) =>
    request("/auth/login", {
      method: "POST",
      body: data,
    }),

  register: (data) =>
    request("/auth/register", {
      method: "POST",
      body: data,
    }),

  me: (token) =>
    request("/auth/me", { token }),

  logout: (token) =>
    request("/logout-all", {
      method: "POST",
      token,
    }),

  health: () =>
    request("/health"),

  // Documents
  documents: (token, search = "") => {
    const query = search.trim()
      ? `?search=${encodeURIComponent(search.trim())}`
      : "";

    return request(`/documents${query}`, { token });
  },

  upload: (token, formData) =>
    request("/documents", {
      method: "POST",
      token,
      body: formData,
      formData: true,
    }),

  download: (token, id) =>
    request(`/documents/${encodeURIComponent(id)}/download`, {
      token,
      blob: true,
    }),

  edit: (token, id, data) =>
    request(`/documents/${encodeURIComponent(id)}`, {
      method: "PATCH",
      token,
      body: data,
    }),

  remove: (token, id) =>
    request(`/documents/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
    }),

  // Document permissions
  grantUser: (token, id, data) =>
    request(`/documents/${encodeURIComponent(id)}/permissions`, {
      method: "PUT",
      token,
      body: data,
    }),

  grantGroup: (token, id, data) =>
    request(`/documents/${encodeURIComponent(id)}/group-permissions`, {
      method: "PUT",
      token,
      body: data,
    }),

  grantDepartment: (token, id, data) =>
    request(
      `/documents/${encodeURIComponent(id)}/department-permissions`,
      {
        method: "PUT",
        token,
        body: data,
      }
    ),

  // Groups
  groups: (token) =>
    request("/groups", { token }),

  createGroup: (token, data) =>
    request("/groups", {
      method: "POST",
      token,
      body: data,
    }),

  addGroupMember: (token, id, data) =>
    request(`/groups/${encodeURIComponent(id)}/members`, {
      method: "POST",
      token,
      body: data,
    }),

  // Departments
  departments: (token) =>
    request("/departments", { token }),

  createDepartment: (token, data) =>
    request("/departments", {
      method: "POST",
      token,
      body: data,
    }),

  departmentMembers: (token) =>
    request("/department-members", { token }),

  addDepartmentMember: (token, data) =>
    request("/department-members", {
      method: "POST",
      token,
      body: data,
    }),

  // Audit trail
  audit: (token) =>
    request("/admin/audit", { token }),

  verifyAudit: (token) =>
    request("/admin/audit/verify", { token }),

  // Admin user management
  adminUsers: (token) =>
    request("/admin/users", { token }),

  updateUser: (token, id, data) =>
    request(`/admin/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      token,
      body: data,
    }),

  approveUser: (token, id) =>
    request(`/admin/users/${encodeURIComponent(id)}/approve`, {
      method: "POST",
      token,
      body: {},
    }),

  rejectUser: (token, id) =>
    request(`/admin/users/${encodeURIComponent(id)}/reject`, {
      method: "POST",
      token,
      body: {},
    }),
};
