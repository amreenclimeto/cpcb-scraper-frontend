import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../components/user/default-layout/MainLayout";
import PiboRegisteredList from "../pages/PiboRegisteredList";
import PwpRegisteredList from "../pages/PwpRegisteredList";
import BatteryManagement from "../pages/BatteryManagement";
import EprPwpCertificateAudit from "../pages/EprPwpCertificateAudit";
import Login from "../pages/Login";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PiboRegisteredList />} />
          <Route path="pibo-registered" element={<PiboRegisteredList />} />
          <Route path="pwp-registered" element={<PwpRegisteredList />} />
          <Route path="battery-management" element={<BatteryManagement />} />
          <Route path="epr-pwp-certificate-audit" element={<EprPwpCertificateAudit />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
