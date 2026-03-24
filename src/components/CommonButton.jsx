import React from "react";

const CommonButton = ({
  label,
  onClick,
  icon: Icon,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
}) => {

  // 🎨 Variants
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-black hover:bg-gray-300",
    success: "bg-green-600 text-white hover:bg-green-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  // 📏 Sizes
  const sizes = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 rounded-lg
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {Icon && <Icon size={18} />}
      {label}
    </button>
  );
};

export default CommonButton;