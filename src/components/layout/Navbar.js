import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { FaUtensils, FaUser, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaHeart, FaStar, FaShieldAlt, FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const { t, currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };
  
  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-primary font-bold text-2xl">
            <FaUtensils />
            <span>COokiFy</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:text-primary transition-colors">
              {t('home')}
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/favorites" className="hover:text-primary transition-colors">
                  {t('favorites')}
                </Link>
                <Link to="/my-reviews" className="hover:text-primary transition-colors">
                  {t('my_reviews')}
                </Link>
                
                {isAdmin && (
                  <Link to="/admin" className="hover:text-primary transition-colors flex items-center space-x-1">
                    <FaShieldAlt />
                    <span>{t('admin_dashboard')}</span>
                  </Link>
                )}
                
                <div className="relative group">
                  <button className="flex items-center space-x-1 hover:text-primary transition-colors">
                    <FaUser />
                    <span>{user?.name}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      {t('profile')}
                    </Link>
                    <button 
                      onClick={handleLogout} 
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                    >
                      <FaSignOutAlt />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-primary transition-colors flex items-center space-x-1">
                  <FaSignInAlt />
                  <span>{t('login')}</span>
                </Link>
                <Link to="/register" className="hover:text-primary transition-colors flex items-center space-x-1">
                  <FaUserPlus />
                  <span>{t('register')}</span>
                </Link>
              </>
            )}
            
            {/* Language Selector */}
            <select 
              className="bg-gray-700 border border-gray-600 text-white rounded py-1 px-2"
              value={currentLanguage}
              onChange={handleLanguageChange}
            >
              {availableLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white focus:outline-none"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('home')}
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/favorites" 
                    className="hover:text-primary transition-colors flex items-center space-x-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaHeart />
                    <span>{t('favorites')}</span>
                  </Link>
                  <Link 
                    to="/my-reviews" 
                    className="hover:text-primary transition-colors flex items-center space-x-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaStar />
                    <span>{t('my_reviews')}</span>
                  </Link>
                  
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      className="hover:text-primary transition-colors flex items-center space-x-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FaShieldAlt />
                      <span>{t('admin_dashboard')}</span>
                    </Link>
                  )}
                  
                  <Link 
                    to="/profile" 
                    className="hover:text-primary transition-colors flex items-center space-x-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaUser />
                    <span>{t('profile')}</span>
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="text-left hover:text-primary transition-colors flex items-center space-x-2"
                  >
                    <FaSignOutAlt />
                    <span>{t('logout')}</span>
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="hover:text-primary transition-colors flex items-center space-x-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaSignInAlt />
                    <span>{t('login')}</span>
                  </Link>
                  <Link 
                    to="/register" 
                    className="hover:text-primary transition-colors flex items-center space-x-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaUserPlus />
                    <span>{t('register')}</span>
                  </Link>
                </>
              )}
              
              {/* Mobile Language Selector */}
              <div className="flex items-center space-x-2">
                <span>{t('preferred_language')}:</span>
                <select 
                  className="bg-gray-700 border border-gray-600 text-white rounded py-1 px-2"
                  value={currentLanguage}
                  onChange={handleLanguageChange}
                >
                  {availableLanguages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;