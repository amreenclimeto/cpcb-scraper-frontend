import axios from "axios";
 
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const baseURL = apiBaseUrl ? apiBaseUrl : "/api";
 
const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
});


export default axiosInstance;