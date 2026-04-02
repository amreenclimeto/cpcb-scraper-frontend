// src/config/apiEndpoints.js
export const API_ENDPOINTS = {
  PIBO: {
    GET_CURRENT_PIBO: "/pibo/current",
    GET_NEW_COMPANIES: "pibo/new-after-baseline",
    GET_CHANGE_STATUS: "/pibo/status-changes",
    GET_PIBO_RECORDS: "/pibo/records",
    EXPORT_PIBO_RECORDS: "/pibo/export",
  },
  GET_PWP_RECORDS: "/pwp/records",
  EXPORT_PWP_RECORDS: "/pwp/export",
  EPR_PWP_CERTIFICATE_LATEST: "/epr-cer/history",
  GET_METAL_BATTERY_PROD_DATA: "/battery/metal-dashboard",
};
