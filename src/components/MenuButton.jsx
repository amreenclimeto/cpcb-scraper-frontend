import React from "react";

const MenuButton = ({ Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-gray-100 text-gray-700"
        : "text-gray-700 hover:bg-gray-100"
    }`}
  >
    <Icon size={20} />
    <span>{label}</span>
  </button>
);

export default React.memo(MenuButton);
