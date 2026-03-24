import React, { useCallback, useState } from "react";
import UserHeader from "./UserHeader";
import UserSidebar from "./UserSidebar";
import { Outlet } from "react-router-dom";

const MainLayout = React.memo(() => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = useCallback((open) => {
    setSidebarOpen(open);
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

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
          <Outlet />
        </main>
      </div>
    </div>
  );
});

export default MainLayout;
