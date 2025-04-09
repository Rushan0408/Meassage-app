import React, { useState, useRef, useEffect } from 'react';

const PopoverContext = React.createContext({
  open: false,
  setOpen: () => {},
  triggerRef: null
});

const Popover = ({ children }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  );
};

const PopoverTrigger = ({ children, asChild }) => {
  const { setOpen, triggerRef } = React.useContext(PopoverContext);
  
  const handleClick = () => {
    setOpen(prev => !prev);
  };
  
  const child = asChild ? React.cloneElement(children, {
    ref: triggerRef,
    onClick: (e) => {
      handleClick();
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

const PopoverContent = ({ children, className = '', ...props }) => {
  const { open, setOpen, triggerRef } = React.useContext(PopoverContext);
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
  
  return (
    <div
      ref={contentRef}
      className={`absolute right-0 z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export { Popover, PopoverTrigger, PopoverContent }; 