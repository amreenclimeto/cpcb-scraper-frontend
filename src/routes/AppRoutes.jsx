import { BrowserRouter, Route, Routes } from "react-router-dom";
import PiboTable from "../pages/PiboTable";
import MainLayout from "../components/user/default-layout/MainLayout";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
           <Route path="/" element={<MainLayout />}>
               <Route path="/pibo-dashboard" element={<PiboTable />} />
               </Route>
    
      </Routes>
    </BrowserRouter>
  );
}
