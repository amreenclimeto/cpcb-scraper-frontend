import React, { useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  Package,
  UserCircle,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import MenuButton from "../../MenuButton";
import climetoLogo from "../../../assets/images/ClimetoTransparentLogo.png"
const SubItem = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? "bg-emerald-50 text-emerald-700 font-medium"
        : "text-gray-600 hover:bg-gray-50"
    }`}
  >
    {label}
  </button>
);

const UserSidebarLinks = [
  { label: "PIBO Dashboard", icon: Home, path: "/" },
  // {
  //   label: "Registration",
  //   icon: UserCircle,
  //   expandable: true,
  //   key: "registration",
  //   children: [
  //     { label: "Company Profile", path: "/user/company-profile" },
  //     { label: "Registration Details", path: "/user/registration-details" },
  //   ],
  // },
  { label: "PIBO Registered", icon: Package, path: "/pibo-registered" },
  { label: "PWP Registered", icon: Package, path: "/pwp-registered" },
  { label: "Battery Management", icon: Package, path: "/battery-management" },
];

const UserSidebar = React.memo(
  ({
    sidebarOpen,
    toggleSidebar,
    sidebarCollapsed = false,
    toggleSidebarCollapsed,
  }) => {
    const navigate = useNavigate();
    const location = useLocation(); // 👈 detects current path
    const [expanded, setExpanded] = useState({});

    const handleNavigate = (path) => {
      navigate(path);
      toggleSidebar?.(false); // close sidebar on mobile
    };

    const renderMenu = (item) => {
      const isActive =
        location.pathname === item.path ||
        (item.children &&
          item.children.some((child) => location.pathname === child.path));

      if (item.expandable) {
        const open = expanded[item.key] || isActive;
        return (
          <div key={item.label} className="mb-1">
            <button
              onClick={() =>
                setExpanded((prev) => ({
                  ...prev,
                  [item.key]: !prev[item.key],
                }))
              }
              className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-gray-700 transition-colors ${
                isActive ? "bg-gray-100 text-gray-700" : "hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>
            {open && (
              <div className="ml-6 mt-1 space-y-1">
                {item.children.map((sub) => (
                  <SubItem
                    key={sub.label}
                    label={sub.label}
                    isActive={location.pathname === sub.path}
                    onClick={() => handleNavigate(sub.path)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      }

      return (
        <MenuButton
          key={item.label}
          Icon={item.icon}
          label={item.label}
          isActive={isActive}
          onClick={() => handleNavigate(item.path)}
        />
      );
    };

    return (
      <>
        {/* Expand button when sidebar is collapsed (desktop) */}
        {sidebarCollapsed && toggleSidebarCollapsed && (
          <button
            onClick={toggleSidebarCollapsed}
            className="hidden lg:flex fixed left-0 top-4 z-50 w-9 h-10 items-center justify-center rounded-r-lg bg-white border border-l-0 border-gray-200 shadow-md hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-all"
            title="Open sidebar"
            aria-label="Open sidebar"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:flex bg-white border-r border-gray-200 flex-col flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
            sidebarCollapsed ? "lg:w-0" : "lg:w-64 xl:w-72"
          }`}
        >
          <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-200 min-w-[16rem] xl:min-w-[18rem]">
            <img
              src={climetoLogo}
              alt="CLIMETO Logo"
              className="h-10 w-auto object-contain flex-shrink-0"
            />
            {toggleSidebarCollapsed && (
              <button
                onClick={toggleSidebarCollapsed}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                title="Close sidebar"
                aria-label="Close sidebar"
              >
                <ChevronLeft size={20} />
              </button>
            )}
          </div>
          <nav className="flex-1 p-4 overflow-y-auto min-w-[16rem] xl:min-w-[18rem]">
            {UserSidebarLinks.map(renderMenu)}
          </nav>
        </aside>

        {/* Mobile Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <img
              src={climetoLogo}
              alt="CLIMETO Logo"
              className="h-10 w-auto object-contain"
            />
            <button
              onClick={() => toggleSidebar(false)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 p-4 overflow-y-auto">
            {UserSidebarLinks.map(renderMenu)}
          </nav>
        </aside>
      </>
    );
  },
);

export default UserSidebar;
