import React from "react";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "../../../auth/AuthContext";
import PortalSwitcher from "../../PortalSwitcher";

const UserHeader = React.memo(({ toggleSidebar }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    const portal =
      import.meta.env.VITE_PORTAL_URL || "http://localhost:3100";
    window.location.href = `${portal.replace(/\/$/, "")}/?signedOut=1`;
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="p-2 transition rounded-lg lg:hidden hover:bg-gray-100"
          onClick={() => toggleSidebar(true)}
        >
          <Menu size={20} />
        </button>
        <p className="hidden text-sm font-medium text-gray-700 sm:block">
          CPCB Audit Portal
        </p>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-gray-800">
              {user.company_name || user.email}
            </p>
            <p className="text-[11px] font-mono text-gray-500">{user.user_type}</p>
          </div>
        ) : null}
        <PortalSwitcher />
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
});

export default UserHeader;
