import React from "react";
import {
  Menu,
  Bell,
} from "lucide-react";

const UserHeader = React.memo(({ toggleSidebar }) => {
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            className="p-2 transition rounded-lg lg:hidden hover:bg-gray-100"
            onClick={() => toggleSidebar(true)}
          >
            <Menu size={20} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center justify-center w-10 h-10 transition rounded-full bg-gray-100 hover:bg-gray-200">
            <Bell size={18} className="text-gray-600" />
          </button>
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center">
              <img src="" alt="User" className="w-full h-full object-cover" />
            </div>
            <div className="leading-tight">
              <p className="text-xs text-gray-500">Hello</p>
              <p className="text-sm font-medium text-gray-800">Adriana</p>
            </div>
          </div>
        </div>
      </header>
    </>
  );
});

export default UserHeader;
