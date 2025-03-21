import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaChartPie, 
  FaUsers, 
  FaUtensils, 
  FaStar, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes, 
  FaAngleRight, 
  FaChevronDown, 
  FaUser,
  FaHeart
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const AdminSidebar = () => {
  const { logout, user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const menuItems = [
    {
      path: '/admin',
      icon: <FaChartPie />,
      label: t('dashboard')
    },
    {
      path: '/admin/users',
      icon: <FaUsers />,
      label: t('manage_users')
    },
    {
      path: '/admin/recipes',
      icon: <FaUtensils />,
      label: t('manage_recipes')
    },
    {
      path: '/admin/reviews',
      icon: <FaStar />,
      label: t('manage_reviews')
    }
  ];

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  }, [location.pathname]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Navigation Link Component
  const NavLink = ({ item, onClick }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
          isActive 
            ? 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-md' 
            : 'text-gray-700 hover:bg-pink-50'
        }`}
        onClick={onClick}
      >
        <span className="text-lg">{item.icon}</span>
        <span className="font-medium">{item.label}</span>
        {isActive && <FaAngleRight className="ml-auto" />}
      </Link>
    );
  };

  return (
    <>
      {/* Top navigation for all screen sizes */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-30 px-4 py-3 flex items-center justify-between border-b border-pink-100">
        <Link to="/" className="flex items-center space-x-2 text-pink-500 font-bold text-2xl">
          <FaUtensils />
          <span>COokiFy</span>
        </Link>
        
        {/* Admin dropdown menu on desktop */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-pink-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center overflow-hidden border-2 border-pink-200">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUser className="text-pink-500" />
              )}
            </div>
            <div className="hidden md:block">
              <span className="font-medium text-gray-800">{user?.name || 'Admin'}</span>
            </div>
            <FaChevronDown className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg overflow-hidden z-50 border border-pink-100">
              <div className="p-4 border-b border-pink-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center overflow-hidden border-2 border-pink-200">
                    {user?.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-pink-500">{user?.name?.charAt(0) || 'A'}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{user?.name || 'Admin'}</p>
                    <p className="text-xs text-pink-500">{t('admin')}</p>
                  </div>
                </div>
              </div>
              
              <nav className="p-2">
                <ul className="space-y-1">
                  {menuItems.map((item) => (
                    <li key={item.path}>
                      <NavLink item={item} onClick={() => setIsDropdownOpen(false)} />
                    </li>
                  ))}
                  <li className="border-t border-pink-100 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <FaSignOutAlt />
                      <span className="font-medium">{t('logout')}</span>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
        
        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-pink-500 p-2 focus:outline-none"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>
      
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-pink-500 bg-opacity-20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Mobile menu - only visible on mobile */}
      <div className={`fixed top-14 left-0 right-0 bg-white shadow-lg z-40 transition-transform duration-300 md:hidden ${
        isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink item={item} onClick={() => setIsMobileMenuOpen(false)} />
              </li>
            ))}
            <li className="border-t border-pink-100 mt-2 pt-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
              >
                <FaSignOutAlt />
                <span className="font-medium">{t('logout')}</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Extra space at the top to account for fixed navbar */}
      <div className="pt-14"></div>

      {/* Floating decoration */}
      <div className="fixed bottom-5 right-5 text-pink-200 animate-pulse-slow hidden md:block">
        <FaHeart size={24} />
      </div>
    </>
  );
};

export default AdminSidebar;