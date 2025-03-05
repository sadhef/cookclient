// client/src/context/LanguageContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { mockLanguageService } from '../utils/mockServices';

// Import language files
import englishTranslations from '../translations/en';
import malayalamTranslations from '../translations/ml';
import tamilTranslations from '../translations/ta';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const { user, updateProfile, isAuthenticated } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState(mockLanguageService.currentLanguage);
  const [translations, setTranslations] = useState(englishTranslations);

  // Load translations based on language
  const loadTranslations = useCallback((language) => {
    switch (language) {
      case 'ml':
        setTranslations(malayalamTranslations);
        break;
      case 'ta':
        setTranslations(tamilTranslations);
        break;
      default:
        setTranslations(englishTranslations);
    }
  }, []);

  // Change language function
  const changeLanguage = useCallback(async (language) => {
    if (!['en', 'ml', 'ta'].includes(language)) {
      language = 'en';
    }
    
    // Update local state immediately
    setCurrentLanguage(language);
    loadTranslations(language);
    
    // Use mock service to update language (works offline)
    mockLanguageService.setLanguage(language);
    
    // Update document language attribute
    document.documentElement.lang = language;
    
    // If user is logged in, update their preference
    if (isAuthenticated && user?.preferredLanguage !== language) {
      try {
        // Use non-awaited call to avoid blocking UI
        updateProfile({ preferredLanguage: language })
          .catch(() => {
            // Silently fail
            console.debug('Failed to update user language preference (non-critical)');
          });
      } catch (error) {
        // Ignore errors
      }
    }
  }, [isAuthenticated, user, updateProfile, loadTranslations]);

  // Set language from user preferences or localStorage
  useEffect(() => {
    const storedLanguage = localStorage.getItem('language');
    const browserLanguage = navigator.language.split('-')[0];
    
    // Priority: User settings > localStorage > browser language > default (en)
    if (isAuthenticated && user?.preferredLanguage) {
      changeLanguage(user.preferredLanguage);
    } else if (storedLanguage) {
      changeLanguage(storedLanguage);
    } else if (['en', 'ml', 'ta'].includes(browserLanguage)) {
      changeLanguage(browserLanguage);
    } else {
      // Default to English
      changeLanguage('en');
    }
  }, [isAuthenticated, user, changeLanguage]);

  // Get translation function
  const t = useCallback((key, defaultValue = '') => {
    return translations[key] || englishTranslations[key] || defaultValue || key;
  }, [translations]);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        t,
        availableLanguages: [
          { code: 'en', name: 'English' },
          { code: 'ml', name: 'Malayalam' },
          { code: 'ta', name: 'Tamil' }
        ]
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};