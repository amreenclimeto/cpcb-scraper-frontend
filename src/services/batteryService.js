// src/services/piboService.js
import { API_ENDPOINTS } from "../config/apiEndpoints";
import DataService from "./DataService";

export const batteryService = {
  getMetalProdDashboard: (params) => {
    return DataService.get(API_ENDPOINTS.GET_METAL_BATTERY_PROD_DATA, params);
  },
   
};

