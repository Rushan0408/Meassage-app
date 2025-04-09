import * as React from 'react';

const Button = React.forwardRef(({
  className = '',
  variant = 'default',
  size = 'default',
  type = 'button',
  children,
  ...props
}, ref) => {
  // Define variant styles
  const variantStyles = {
    default: 'bg-gray-800 text-white hover:bg-gray-700',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300',
    outline: 'bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-700',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
    link: 'bg-transparent underline text-blue-600 hover:text-blue-800',
    destructive: 'bg-red-600 text-white hover:bg-red-700'
  };

  // Define size styles
  const sizeStyles = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 py-1 text-sm',
    lg: 'h-12 px-6 py-3 text-lg',
    icon: 'h-9 w-9 p-0' // For icon buttons
  };

  return (
    <button
      ref={ref}
      type={type}
      className={`
        inline-flex items-center justify-center rounded-md font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
        disabled:opacity-50 disabled:pointer-events-none
        ${variantStyles[variant] || variantStyles.default}
        ${sizeStyles[size] || sizeStyles.default}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export { Button }; 