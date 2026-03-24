// src/services/piboService.js
import { API_ENDPOINTS } from "../config/apiEndpoints";
import DataService from "./DataService";

export const piboService = {
  getPiboData: (params) => {
    return DataService.get(API_ENDPOINTS.PIBO.GET_CURRENT_PIBO, params);
  },
    getNewCompaniesData: (params) => {
    return DataService.get(API_ENDPOINTS.PIBO.GET_NEW_COMPANIES, params);
  },
      getPiboRegistered: (params) => {
    return DataService.get(API_ENDPOINTS.PIBO.GET_PIBO_RECORDS, params);
  },
};

