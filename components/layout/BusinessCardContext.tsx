"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface BusinessCardContextType {
  isOpen: boolean;
  openBusinessCard: () => void;
  closeBusinessCard: () => void;
  toggleBusinessCard: () => void;
}

const BusinessCardContext = createContext<BusinessCardContextType | undefined>(
  undefined
);

export function BusinessCardProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openBusinessCard = () => setIsOpen(true);
  const closeBusinessCard = () => setIsOpen(false);
  const toggleBusinessCard = () => setIsOpen((prev) => !prev);

  return (
    <BusinessCardContext.Provider
      value={{
        isOpen,
        openBusinessCard,
        closeBusinessCard,
        toggleBusinessCard,
      }}
    >
      {children}
    </BusinessCardContext.Provider>
  );
}

export function useBusinessCard() {
  const context = useContext(BusinessCardContext);

  if (context === undefined) {
    throw new Error(
      "useBusinessCard must be used within a BusinessCardProvider"
    );
  }

  return context;
}
