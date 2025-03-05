
export const mockLanguageService = {
  currentLanguage: localStorage.getItem('language') || 'en',
  
  // Set language and store in localStorage
  setLanguage(language) {
    if (!['en', 'ml', 'ta'].includes(language)) {
      language = 'en';
    }
    
    this.currentLanguage = language;
    localStorage.setItem('language', language);
    
    return {
      success: true,
      data: { language }
    };
  },
  
  // Get current language from localStorage
  getLanguage() {
    return {
      success: true,
      data: { language: this.currentLanguage }
    };
  }
};