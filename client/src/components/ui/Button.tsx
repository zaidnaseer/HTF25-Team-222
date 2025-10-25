import { FC, ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "primary";
  size?: "sm" | "md" | "lg";
}

const Button: FC<ButtonProps> = ({
  variant = "default",
  size = "md",
  className,
  ...props
}) => {
  const baseStyles = "rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    default: "bg-gray-700 text-white hover:bg-gray-600",
    primary: "bg-indigo-500 text-white hover:bg-indigo-600",
    ghost: "bg-transparent text-white hover:bg-gray-800",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-md",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    />
  );
};

export { Button };
