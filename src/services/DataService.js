// src/services/DataService.js
import axiosInstance from "../config/axiosInstance";

const DataService = {
  get: async (url, params = {}) => {
    const res = await axiosInstance.get(url, { params });
    return res.data;
  },

  post: async (url, data = {}) => {
    const res = await axiosInstance.post(url, data);
    return res.data;
  },

  put: async (url, data = {}) => {
    const res = await axiosInstance.put(url, data);
    return res.data;
  },

  delete: async (url) => {
    const res = await axiosInstance.delete(url);
    return res.data;
  },
};

export default DataService;