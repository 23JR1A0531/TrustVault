const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://trustvault-api-3dg5.onrender.com/api"
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
      "Unable to connect to TrustVault API. Check whether the backend is running."
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
      // Keep the default HTTP error message.
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

const idPath = (id) => encodeURIComponent(id);

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
    request("/auth/logout-all", {
      method: "POST",
      token,
      body: {},
    }),

  health: () =>
    request("/health"),

  // Documents
  documents: (token, search = "") =>
    request(
      `/documents${
        search ? `?search=${encodeURIComponent(search)}` : ""
      }`,
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
    request(`/documents/${idPath(id)}/download`, {
      token,
      blob: true,
    }),

  edit: (token, id, data) =>
    request(`/documents/${idPath(id)}`, {
      method: "PATCH",
      token,
      body: data,
    }),

  remove: (token, id) =>
    request(`/documents/${idPath(id)}`, {
      method: "DELETE",
      token,
    }),

  // Direct user permissions
  grantUser: (token, id, data) =>
    request(`/documents/${idPath(id)}/permissions`, {
      method: "PUT",
      token,
      body: data,
    }),

  revokeUser: (token, documentId, userId) =>
    request(
      `/documents/${idPath(documentId)}/permissions/${idPath(userId)}`,
      {
        method: "DELETE",
        token,
      }
    ),

  // Group permissions
  grantGroup: (token, id, data) =>
    request(`/documents/${idPath(id)}/group-permissions`, {
      method: "PUT",
      token,
      body: data,
    }),

  revokeGroup: (token, documentId, groupId) =>
    request(
      `/documents/${idPath(documentId)}/group-permissions/${idPath(groupId)}`,
      {
        method: "DELETE",
        token,
      }
    ),

  // Department permissions
  grantDepartment: (token, id, data) =>
    request(`/documents/${idPath(id)}/department-permissions`, {
      method: "PUT",
      token,
      body: data,
    }),

  revokeDepartment: (token, documentId, departmentId) =>
    request(
      `/documents/${idPath(documentId)}/department-permissions/${idPath(departmentId)}`,
      {
        method: "DELETE",
        token,
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

  updateGroup: (token, id, data) =>
    request(`/groups/${idPath(id)}`, {
      method: "PATCH",
      token,
      body: data,
    }),

  deleteGroup: (token, id) =>
    request(`/groups/${idPath(id)}`, {
      method: "DELETE",
      token,
    }),

  addGroupMember: (token, id, data) =>
    request(`/groups/${idPath(id)}/members`, {
      method: "POST",
      token,
      body: data,
    }),

  removeGroupMember: (token, groupId, userId) =>
    request(
      `/groups/${idPath(groupId)}/members/${idPath(userId)}`,
      {
        method: "DELETE",
        token,
      }
    ),

  // Departments
  departments: (token) =>
    request("/departments", { token }),

  createDepartment: (token, data) =>
    request("/departments", {
      method: "POST",
      token,
      body: data,
    }),

  updateDepartment: (token, id, data) =>
    request(`/departments/${idPath(id)}`, {
      method: "PATCH",
      token,
      body: data,
    }),

  deleteDepartment: (token, id) =>
    request(`/departments/${idPath(id)}`, {
      method: "DELETE",
      token,
    }),

  departmentMembers: (token) =>
    request("/department-members", { token }),

  addDepartmentMember: (token, data) =>
    request("/department-members", {
      method: "POST",
      token,
      body: data,
    }),

  removeDepartmentMember: (token, userId, departmentId) =>
    request(
      `/department-members/${idPath(userId)}/${idPath(departmentId)}`,
      {
        method: "DELETE",
        token,
      }
    ),

  // Admin user management
  adminUsers: (token) =>
    request("/admin/users", { token }),

  searchActiveUsers: (token, search = "") =>
    request(
      `/admin/users/active?search=${encodeURIComponent(search)}`,
      { token }
    ),

  pendingUsers: (token) =>
    request("/admin/users/pending", { token }),

  updateUser: (token, id, data) =>
    request(`/admin/users/${idPath(id)}/role`, {
      method: "PATCH",
      token,
      body: data,
    }),

  approveUser: (token, id) =>
    request(`/admin/users/${idPath(id)}/approval`, {
      method: "PATCH",
      token,
      body: { approval_status: "approved" },
    }),

  rejectUser: (token, id) =>
    request(`/admin/users/${idPath(id)}/approval`, {
      method: "PATCH",
      token,
      body: { approval_status: "rejected" },
    }),

  // Audit trail
  audit: (token) =>
    request("/admin/audit", { token }),

  verifyAudit: (token) =>
    request("/admin/audit/verify", { token }),
};
