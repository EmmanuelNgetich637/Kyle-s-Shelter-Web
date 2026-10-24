const API_BASE_URL = "/api";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  let result;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    const error = new Error(
      result?.message ||
        (response.status === 404
          ? "The requested resource could not be found."
          : `Request failed with status ${response.status}`)
    );

    error.status = response.status;
    throw error;
  }

  return result;
}

export async function getShelters() {
  const result = await request("/shelters");
  return result.data;
}

export async function getShelterBySlug(slug) {
  const result = await request(
    `/shelters/${encodeURIComponent(slug)}`
  );

  return result.data;
}

export async function submitEnquiry(enquiry) {
  return request("/enquiries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(enquiry),
  });
}
