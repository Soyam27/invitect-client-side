'use client';
import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Loader from "../components/LoaderComponent";

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRouteChanging, setIsRouteChanging] = useState(false);
  const pathname = usePathname();

  // Handle initial page load
  useEffect(() => {
    const handleLoad = () => {
      setTimeout(() => {
        setIsLoading(false);
      }, 1200); // Show loader for 1.2 seconds on initial load
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  // Handle route changes
  useEffect(() => {
    setIsRouteChanging(true);
    const timer = setTimeout(() => {
      setIsRouteChanging(false);
    }, 1000); // Show loader for 1 second on route change

    return () => clearTimeout(timer);
  }, [pathname]);

  const showLoader = isLoading || isRouteChanging;

  // Global loading control functions
  const startLoading = () => setIsRouteChanging(true);
  const stopLoading = () => {
    setTimeout(() => {
      setIsRouteChanging(false);
    }, 800);
  };

  return (
    <LoadingContext.Provider value={{ 
      isLoading, 
      isRouteChanging, 
      setIsLoading, 
      setIsRouteChanging,
      startLoading,
      stopLoading,
      showLoader 
    }}>
      {showLoader && <Loader />}
      <div style={{ 
        display: showLoader ? 'none' : 'block',
        minHeight: '100vh'
      }}>
        {children}
      </div>
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};