import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { FaUtensils, FaUser, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaHeart, FaStar, FaShieldAlt, FaBars, FaTimes, FaHome, FaCookieBite, FaGlobe } from 'react-icons/fa';

const Navbar = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const { t, currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Add scroll effect for shadow
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
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
    <nav className={`bg-white text-gray-800 ${scrolled ? 'shadow-lg' : 'shadow-md'} sticky top-0 z-50 transition-all duration-300`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-pink-500 font-bold text-2xl font-cursive transform hover:scale-105 transition-transform duration-300">
            <FaUtensils className="text-pink-500" />
            <span>COokiFy</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/" className="px-3 py-2 rounded-full hover:bg-pink-100 hover:text-pink-500 transition-colors flex items-center space-x-1">
              <FaHome className="text-pink-400" />
              <span>{t('home')}</span>
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/favorites" className="px-3 py-2 rounded-full hover:bg-pink-100 hover:text-pink-500 transition-colors flex items-center space-x-1">
                  <FaHeart className="text-pink-400" />
                  <span>{t('favorites')}</span>
                </Link>
                <Link to="/my-reviews" className="px-3 py-2 rounded-full hover:bg-pink-100 hover:text-pink-500 transition-colors flex items-center space-x-1">
                  <FaStar className="text-pink-400" />
                  <span>{t('my_reviews')}</span>
                </Link>
                
                {isAdmin && (
                  <Link to="/admin" className="px-3 py-2 rounded-full hover:bg-pink-100 hover:text-pink-500 transition-colors flex items-center space-x-1">
                    <FaShieldAlt className="text-pink-400" />
                    <span>{t('admin_dashboard')}</span>
                  </Link>
                )}
                
                <div className="relative group ml-2">
                  <button className="flex items-center space-x-1 px-3 py-2 rounded-full bg-pink-50 hover:bg-pink-100 transition-colors border border-pink-200">
                    <div className="w-6 h-6 rounded-full bg-pink-200 flex items-center justify-center text-pink-500 mr-1">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <FaUser className="text-pink-500 text-sm" />
                      )}
                    </div>
                    <span className="font-medium">{user?.name}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-xl shadow-lg py-2 z-10 hidden group-hover:block border border-pink-100 overflow-hidden">
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 hover:bg-pink-50 transition-colors flex items-center space-x-2"
                    >
                      <FaUser className="text-pink-400" />
                      <span>{t('profile')}</span>
                    </Link>
                    <button 
                      onClick={handleLogout} 
                      className="block w-full text-left px-4 py-2 hover:bg-pink-50 transition-colors flex items-center space-x-2"
                    >
                      <FaSignOutAlt className="text-pink-400" />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 rounded-full hover:bg-pink-100 hover:text-pink-500 transition-colors flex items-center space-x-1">
                  <FaSignInAlt className="text-pink-400" />
                  <span>{t('login')}</span>
                </Link>
                <Link to="/register" className="px-3 py-2 ml-1 rounded-full bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:from-pink-500 hover:to-rose-600 transition-colors flex items-center space-x-1 shadow-sm">
                  <FaUserPlus />
                  <span>{t('register')}</span>
                </Link>
              </>
            )}
            
            {/* Language Selector */}
            <div className="ml-2 relative group">
              <button className="flex items-center space-x-1 px-3 py-2 rounded-full hover:bg-pink-100 transition-colors">
                <FaGlobe className="text-pink-400" />
                <span className="text-sm">{currentLanguage.toUpperCase()}</span>
              </button>
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg py-2 z-10 hidden group-hover:block border border-pink-100">
                {availableLanguages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full text-left px-4 py-2 hover:bg-pink-50 transition-colors ${
                      currentLanguage === lang.code ? 'bg-pink-50 text-pink-500 font-medium' : ''
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-pink-500 focus:outline-none p-2 rounded-full hover:bg-pink-50"
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
        
        {/* Mobile Navigation - Slide down with animation */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-screen opacity-100 py-4' : 'max-h-0 opacity-0'
          } border-t border-pink-100`}
        >
          <div className="flex flex-col space-y-2 px-2">
            <Link 
              to="/" 
              className="p-3 rounded-xl hover:bg-pink-50 transition-colors flex items-center space-x-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                <FaHome className="text-pink-500" />
              </div>
              <span>{t('home')}</span>
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to="/favorites" 
                  className="p-3 rounded-xl hover:bg-pink-50 transition-colors flex items-center space-x-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                    <FaHeart className="text-pink-500" />
                  </div>
                  <span>{t('favorites')}</span>
                </Link>
                <Link 
                  to="/my-reviews" 
                  className="p-3 rounded-xl hover:bg-pink-50 transition-colors flex items-center space-x-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                    <FaStar className="text-pink-500" />
                  </div>
                  <span>{t('my_reviews')}</span>
                </Link>
                
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="p-3 rounded-xl hover:bg-pink-50 transition-colors flex items-center space-x-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                      <FaShieldAlt className="text-pink-500" />
                    </div>
                    <span>{t('admin_dashboard')}</span>
                  </Link>
                )}
                
                <Link 
                  to="/profile" 
                  className="p-3 rounded-xl hover:bg-pink-50 transition-colors flex items-center space-x-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                    <FaUser className="text-pink-500" />
                  </div>
                  <span>{t('profile')}</span>
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="p-3 rounded-xl hover:bg-pink-50 text-left transition-colors flex items-center space-x-3 w-full"
                >
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                    <FaSignOutAlt className="text-pink-500" />
                  </div>
                  <span>{t('logout')}</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="p-3 rounded-xl hover:bg-pink-50 transition-colors flex items-center space-x-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                    <FaSignInAlt className="text-pink-500" />
                  </div>
                  <span>{t('login')}</span>
                </Link>
                <Link 
                  to="/register" 
                  className="p-3 rounded-xl hover:bg-pink-50 transition-colors flex items-center space-x-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                    <FaUserPlus className="text-pink-500" />
                  </div>
                  <span>{t('register')}</span>
                </Link>
              </>
            )}
            
            {/* Mobile Language Selector */}
            <div className="p-3 rounded-xl bg-pink-50">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                  <FaGlobe className="text-pink-500" />
                </div>
                <span>{t('preferred_language')}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pl-11">
                {availableLanguages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      changeLanguage(lang.code);
                      setMobileMenuOpen(false);
                    }}
                    className={`py-1 px-2 rounded-lg text-sm ${
                      currentLanguage === lang.code 
                        ? 'bg-pink-200 text-pink-700 font-medium' 
                        : 'bg-white border border-pink-100'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cute little decoration at the bottom of the navbar */}
      <div className="hidden md:block h-1 bg-gradient-to-r from-pink-400 via-rose-300 to-pink-400"></div>
      
      {/* Add custom font style */}
      <style jsx="true">{`
        .font-cursive {
          font-family: 'Comic Sans MS', cursive, sans-serif;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;