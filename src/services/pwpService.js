// src/services/piboService.js
import { API_ENDPOINTS } from "../config/apiEndpoints";
import DataService from "./DataService";

export const pwpService = {
  getPwpData: (params) => {
    return DataService.get(API_ENDPOINTS.GET_PWP_RECORDS, params);
  },
    exportPwpData: (params) => {
    return DataService.get(API_ENDPOINTS.EXPORT_PWP_RECORDS, params);
  },
};

