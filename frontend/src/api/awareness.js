// frontend/src/api/awareness.js
import axiosInstance from "./axiosConfig";

// 🧠 Fetch all awareness resources (with optional flair filtering)
export async function fetchAwarenessResources(selectedFlair) {
  try {
    const url = selectedFlair
      ? `/awareness/resources/?flair=${encodeURIComponent(selectedFlair)}`
      : `/awareness/resources/`;
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching awareness resources:", error);
    throw error;
  }
}

// 📄 Fetch a single awareness resource by ID
export async function fetchAwarenessDetail(id) {
  try {
    const response = await axiosInstance.get(`/awareness/resources/${id}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching awareness detail:", error);
    throw error;
  }
}
// frontend/src/api/awareness.js


// ✅ Handles both JSON and FormData automatically
export async function createAwarenessResource(formData) {
  try {
    const response = await axiosInstance.post(`/awareness/resources/`, formData, {
      headers: {
        "Content-Type":
          formData instanceof FormData ? "multipart/form-data" : "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating awareness resource:", error.response?.data || error);
    throw error;
  }
}

// ✅ Flair fetching
export async function fetchFlairs() {
  try {
    const response = await axiosInstance.get(`/awareness/flairs/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching flairs:", error);
    throw error;
  }
}
