import React, { useState, useRef, useEffect } from 'react';

const DropdownMenuContext = React.createContext({
  open: false,
  setOpen: () => {},
  triggerRef: null
});

const DropdownMenu = ({ children }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuTrigger = ({ children, asChild }) => {
  const { setOpen, triggerRef } = React.useContext(DropdownMenuContext);
  
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(prev => !prev);
  };
  
  const child = asChild ? React.cloneElement(children, {
    ref: triggerRef,
    onClick: (e) => {
      handleClick(e);
      children.props.onClick?.(e);
    }
  }) : (
    <button
      ref={triggerRef}
      type="button"
      onClick={handleClick}
    >
      {children}
    </button>
  );
  
  return child;
};

const DropdownMenuContent = ({ children, align = 'left', className = '', ...props }) => {
  const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext);
  const contentRef = useRef(null);
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        contentRef.current && 
        !contentRef.current.contains(event.target) && 
        triggerRef.current && 
        !triggerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, setOpen, triggerRef]);
  
  if (!open) return null;
  
  const alignmentClasses = {
    left: 'left-0',
    right: 'right-0',
    end: 'right-0',
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2'
  };
  
  return (
    <div
      ref={contentRef}
      className={`absolute z-50 mt-1 w-40 rounded-md bg-white shadow-lg border border-gray-200 py-1 ${alignmentClasses[align] || alignmentClasses.left} ${className}`}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
};

const DropdownMenuItem = ({ children, onClick, className = '', disabled = false, ...props }) => {
  const { setOpen } = React.useContext(DropdownMenuContext);
  
  const handleClick = (e) => {
    if (disabled) return;
    
    onClick?.(e);
    setOpen(false);
  };
  
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        w-full px-3 py-2 text-sm text-left hover:bg-gray-100 focus:outline-none
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }; 