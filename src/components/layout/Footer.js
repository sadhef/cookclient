import React from 'react';
import { Link } from 'react-router-dom';
import { FaUtensils, FaGithub, FaTwitter, FaInstagram, FaEnvelope, FaHeart, FaStar } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';

const Footer = () => {
  const { t, currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  
  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
  };
  
  return (
    <footer className="bg-gradient-to-r from-pink-400 to-rose-500 text-white pt-12 pb-6 relative overflow-hidden">
      {/* Cute floating elements */}
      <div className="absolute top-10 left-10 animate-bounce-slow opacity-20 text-white">
        <FaHeart size={24} />
      </div>
      <div className="absolute top-20 right-12 animate-pulse opacity-20 text-white">
        <FaStar size={24} />
      </div>
      <div className="absolute bottom-10 left-20 animate-pulse-slow opacity-20 text-white">
        <FaUtensils size={24} />
      </div>
      
      <div className="container mx-auto px-4">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-white font-bold text-2xl mb-6 md:mb-0 transform hover:scale-105 transition-all duration-300 font-cursive">
            <div className="bg-white/20 p-2 rounded-full">
              <FaUtensils className="text-white" />
            </div>
            <span>COokiFy</span>
          </Link>
          
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Navigation links */}
            <div className="flex space-x-4">
              <Link to="/" className="text-white/90 hover:text-white transition-all duration-300 hover:scale-110 transform">
                {t('home')}
              </Link>
              <Link to="/search" className="text-white/90 hover:text-white transition-all duration-300 hover:scale-110 transform">
                {t('search')}
              </Link>
              <Link to="/favorites" className="text-white/90 hover:text-white transition-all duration-300 hover:scale-110 transform">
                {t('favorites')}
              </Link>
            </div>
            
            {/* Language selector */}
            <select 
              className="bg-white/20 backdrop-blur-sm border-none text-white rounded-full py-2 px-4 focus:ring-2 focus:ring-white/50 focus:outline-none appearance-none cursor-pointer"
              value={currentLanguage}
              onChange={handleLanguageChange}
            >
              {availableLanguages.map(lang => (
                <option key={lang.code} value={lang.code} className="text-gray-800">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Social icons */}
        <div className="flex justify-center space-x-6 mb-8">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all duration-300 transform hover:scale-110">
            <FaGithub />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all duration-300 transform hover:scale-110">
            <FaTwitter />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all duration-300 transform hover:scale-110">
            <FaInstagram />
          </a>
          <a href="mailto:contact@cookify.com" className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all duration-300 transform hover:scale-110">
            <FaEnvelope />
          </a>
        </div>
        
        {/* Divider */}
        <div className="border-t border-white/20 my-6"></div>
        
        {/* Copyright and links */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-white/80">
          <p className="flex items-center">
            &copy; {new Date().getFullYear()} COokiFy <FaHeart className="inline-block mx-1 text-white/60" size={12} /> {t('all_rights_reserved')}
          </p>
          
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">
              {t('privacy_policy')}
            </Link>
            <Link to="/terms-of-service" className="hover:text-white transition-colors">
              {t('terms_of_service')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;