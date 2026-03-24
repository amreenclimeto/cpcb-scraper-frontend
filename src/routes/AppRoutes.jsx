import { BrowserRouter, Route, Routes } from "react-router-dom";
import PiboTable from "../pages/PiboTable";
import MainLayout from "../components/user/default-layout/MainLayout";
import PiboRegisteredList from "../pages/PiboRegisteredList";
import PwpRegisteredList from "../pages/PwpRegisteredList";
import BatteryManagement from "../pages/BatteryManagement";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<PiboTable />} />
          <Route path="pibo-registered" element={<PiboRegisteredList />} />
          <Route path="pwp-registered" element={<PwpRegisteredList />} />
          <Route path="battery-management" element={<BatteryManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
