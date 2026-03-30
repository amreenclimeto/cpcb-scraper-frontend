// src/services/piboService.js
import { API_ENDPOINTS } from "../config/apiEndpoints";
import DataService from "./DataService";

export const pwpCertificateService = {
  getPwpCertificateData: (params) => {
    return DataService.get(API_ENDPOINTS.EPR_PWP_CERTIFICATE_LATEST, params);
  },
};

