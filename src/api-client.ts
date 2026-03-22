import axios from "axios";
import { useAuthStore } from "./store";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Attach the Bearer token from the Zustand store to every outbound request.
// Skip if the caller already set an Authorization header explicitly.
apiClient.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default apiClient;
