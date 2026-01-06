import axios from "axios";
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BE_BASE_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});
// Add a request interceptor
axiosInstance.interceptors.request.use(
  function (config) {
    // Skip adding Authorization header for auth endpoints
    const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
    const isAuthEndpoint = authEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (isAuthEndpoint) {
      return config;
    }
    
    // Attach Authorization header if token exists
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      console.log(`[Axios] Requesting ${config.url}. Token exists? ${!!token}`);
      console.log(`[Axios] Full URL: ${config.baseURL}${config.url}`);
      console.log(`[Axios] Params:`, config.params);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  },

);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  function onFulfilled(response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Return full response to allow accessing response.data.data
    return response;
  },
  function onRejected(error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Preserve error object for error.response.data.error.code handling
    return Promise.reject(error);
  },
);

export default axiosInstance;
