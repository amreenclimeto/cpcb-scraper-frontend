import React, { useCallback, useState } from "react";
import UserHeader from "./UserHeader";
import UserSidebar from "./UserSidebar";
import { Outlet, useLocation } from "react-router-dom";

const MainLayout = React.memo(() => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = useCallback((open) => {
    setSidebarOpen(open);
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const location = useLocation();

  // Page titles based on routes
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/user":
      case "/user/dashboard":
        return "Dashboard";
      case "/user/company-profile":
        return "Company Profile";
      case "/user/registration-details":
        return "Registration Details";
      case "/user/packaging-declaration":
        return "Packaging Declaration";
      case "/user/packaging-declaration-add/purchase":
        return null;
      case "/user/packaging-declaration-add/sale":
        return null;
      case "/user/packaging-declaration-add":
        return "Packaging Declaration";
      case "/user/compliance-purchase":
        return null;
         case "/user/compliance-sale":
        return null;
         case "/user/compliance-export":
        return "Compliance Export";
         case "/user/summery-purchase":
        return "Summery Purchase";
         case "/user/summery-sale":
        return "Summery Sale";
         case "/user/summery-export":
        return "Summery Export";
         case "/user/pendency-tracker":
        return "Pendency Tracker";
         case "/user/EC-wallet":
        return "EC & Wallet";
         case "/user/alerts-notification":
        return "Alerts & Notification";
         case "/user/instructions":
        return "Instructions";
      default:
        return "Welcome";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => toggleSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <UserSidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebarCollapsed={toggleSidebarCollapsed}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <UserHeader toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* ✅ Dynamic page title */}
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
            {getPageTitle()}
          </h1>
          <Outlet />
        </main>
      </div>
    </div>
  );
});

export default MainLayout;
