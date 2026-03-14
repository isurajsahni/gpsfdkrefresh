import { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <UIContext.Provider value={{ isCartOpen, setIsCartOpen, isSearchOpen, setIsSearchOpen }}>
      {children}
    </UIContext.Provider>
  );
};
