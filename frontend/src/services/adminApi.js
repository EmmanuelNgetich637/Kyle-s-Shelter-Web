const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("shelter_admin_token");
}

async function request(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    localStorage.removeItem("shelter_admin_token");

    if (window.location.pathname.startsWith("/admin")) {
      window.location.assign("/admin/login");
    }
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || "Something went wrong.");
  }

  return data;
}

export async function loginAdmin(email, password) {
  const result = await request("/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!result.data?.token) {
    throw new Error("The server did not return an authentication token.");
  }

  localStorage.setItem("shelter_admin_token", result.data.token);
  return result.data.admin;
}

export async function getAdminEnquiries(filters = {}) {
  const params = new URLSearchParams();

  if (filters.status) params.set("status", filters.status);
  if (filters.search?.trim()) params.set("search", filters.search.trim());

  const query = params.toString();
  return request(`/admin/enquiries${query ? `?${query}` : ""}`);
}

export async function updateEnquiryStatus(id, status) {
  return request(`/admin/enquiries/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function hasAdminToken() {
  return Boolean(getToken());
}

export function logoutAdmin() {
  localStorage.removeItem("shelter_admin_token");
}

export async function getAdminShelters() {
  return request("/admin/shelters");
}

export async function createShelter(shelter) {
  return request("/admin/shelters", {
    method: "POST",
    body: JSON.stringify(shelter),
  });
}

export async function updateShelter(id, shelter) {
  return request(`/admin/shelters/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(shelter),
  });
}

// Quotation management

export async function getAdminQuotations(filters = {}) {
  const params = new URLSearchParams();

  if (filters.status) params.set("status", filters.status);
  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  const query = params.toString();

  return request(
    `/admin/quotations${query ? `?${query}` : ""}`,
  );
}

export async function getAdminQuotation(id) {
  return request(`/admin/quotations/${encodeURIComponent(id)}`);
}

export async function createAdminQuotation(quotation) {
  return request("/admin/quotations", {
    method: "POST",
    body: JSON.stringify(quotation),
  });
}

export async function updateAdminQuotationStatus(id, status) {
  return request(
    `/admin/quotations/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}
