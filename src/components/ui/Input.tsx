import { forwardRef, useState } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: "default" | "filled";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, variant = "default", className = "", ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const baseClasses = `
      w-full px-4 py-2.5 rounded-xl text-slate-800 placeholder-slate-400
      transition-all duration-200 ease-out
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
      disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-500
    `;

    const variantClasses = {
      default: `
        bg-white border-2 border-slate-200
        hover:border-slate-300
        focus:border-blue-500 focus:bg-white
        ${error ? "border-red-300 hover:border-red-400 focus:ring-red-500 focus:border-red-500" : ""}
      `,
      filled: `
        bg-slate-50 border-2 border-transparent
        hover:bg-slate-100
        focus:bg-white focus:border-blue-500
        ${error ? "bg-red-50 hover:bg-red-100 focus:ring-red-500 focus:border-red-500" : ""}
      `,
    };

    const paddingClasses = leftIcon ? "pl-11" : "";
    const paddingRightClasses = rightIcon ? "pr-11" : "";

    return (
      <div className={`${className}`}>
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isFocused ? "text-blue-500" : error ? "text-red-400" : "text-slate-400"} transition-colors`}>
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses} ${paddingRightClasses}`}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";