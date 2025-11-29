import React, { createContext, useState, ReactNode } from 'react';

type Page = 'landing' | 'login' | 'register' | 'home' | 'profile' | 'createEvent' | 'ticket';

interface NavigationContextType {
  currentPage: Page;
  currentPageParams: Record<string, any>;
  navigateTo: (page: Page, params?: Record<string, any>) => void;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [currentPageParams, setCurrentPageParams] = useState<Record<string, any>>({});


  const navigateTo = (page: Page, params: Record<string, any> = {}) => {
    setCurrentPage(page);
    setCurrentPageParams(params);
  };

  return (
    <NavigationContext.Provider value={{ currentPage, navigateTo, currentPageParams }}>
      {children}
    </NavigationContext.Provider>
  );
};
