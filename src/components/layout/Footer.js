import React from 'react';
import { Link } from 'react-router-dom';
import { FaUtensils, FaGithub, FaTwitter, FaInstagram } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';

const Footer = () => {
  const { t, currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  
  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
  };
  
  return (
    <footer className="bg-gray-900 text-gray-400 py-8">
      <div className="container mx-auto px-4">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-primary font-bold text-xl mb-4 md:mb-0">
            <FaUtensils />
            <span>COokiFy</span>
          </Link>
          
          {/* Language selector */}
          <div className="flex items-center space-x-4">
            <select 
              className="bg-gray-800 border-none text-gray-300 rounded py-1 px-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
              value={currentLanguage}
              onChange={handleLanguageChange}
            >
              {availableLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            
            {/* Social icons */}
            <div className="flex space-x-3">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors">
                <FaGithub />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors">
                <FaTwitter />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors">
                <FaInstagram />
              </a>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="border-t border-gray-800 my-4"></div>
        
        {/* Copyright and links */}
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} COokiFy</p>
          
          <div className="flex space-x-6 mt-3 md:mt-0">
            <Link to="/" className="hover:text-gray-300 transition-colors">
              {t('home')}
            </Link>
            <Link to="/search" className="hover:text-gray-300 transition-colors">
              {t('search')}
            </Link>
            <Link to="/privacy-policy" className="hover:text-gray-300 transition-colors">
              {t('privacy_policy')}
            </Link>
            <Link to="/terms-of-service" className="hover:text-gray-300 transition-colors">
              {t('terms_of_service')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;