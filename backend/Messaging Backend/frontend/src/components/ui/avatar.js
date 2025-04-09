import React from "react";

const Avatar = ({
  src,
  alt,
  fallback,
  size = "md",
  className = "",
  ...props
}) => {
  const [imageError, setImageError] = React.useState(false);
  
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-24 w-24"
  };
  
  const sizeClass = sizes[size] || sizes.md;
  const baseClasses = "relative flex shrink-0 overflow-hidden rounded-full";
  const allClasses = `${baseClasses} ${sizeClass} ${className}`;
  
  return (
    <div className={allClasses} {...props}>
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || "Avatar"}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground font-medium">
          {fallback || alt?.charAt(0) || "?"}
        </div>
      )}
    </div>
  );
};

export { Avatar }; 