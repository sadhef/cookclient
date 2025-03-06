import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaLock, FaGlobe, FaSave, FaHeart, FaStar, FaUtensils, FaUserEdit, FaKey, FaMagic } from 'react-icons/fa';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'react-toastify';

const UserProfile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { t, currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Profile form
  const profileFormik = useFormik({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
      preferredLanguage: user?.preferredLanguage || currentLanguage
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .required('Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name cannot exceed 50 characters'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required')
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setShowAnimation(true);
        
        // Update profile
        const success = await updateProfile(values);
        
        if (success) {
          // Change language if needed
          if (values.preferredLanguage !== currentLanguage) {
            changeLanguage(values.preferredLanguage);
          }
          
          toast.success(t('profile_updated'));
        }
      } catch (error) {
        toast.error(error || t('update_failed'));
      } finally {
        setLoading(false);
        setTimeout(() => setShowAnimation(false), 1000);
      }
    }
  });
  
  // Password form
  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string()
        .required('Current password is required')
        .min(6, 'Password must be at least 6 characters'),
      newPassword: Yup.string()
        .required('New password is required')
        .min(6, 'Password must be at least 6 characters'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
        .required('Please confirm your password')
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setShowAnimation(true);
        
        // Change password
        const success = await changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword
        });
        
        if (success) {
          toast.success(t('password_updated'));
          passwordFormik.resetForm();
        }
      } catch (error) {
        toast.error(error || t('password_update_failed'));
      } finally {
        setLoading(false);
        setTimeout(() => setShowAnimation(false), 1000);
      }
    }
  });
  
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-rose-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-rose-50 py-12">
      {/* Animation overlay when saving */}
      {showAnimation && (
        <div className="fixed inset-0 bg-pink-500/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-float">
              <FaMagic className="text-pink-500 text-5xl mx-auto" />
            </div>
            <p className="text-pink-600 font-medium text-xl mt-4">
              {activeTab === 'profile' ? t('updating_profile') : t('updating_password')}...
            </p>
          </div>
        </div>
      )}

      {/* Cute floating elements */}
      <div className="hidden md:block">
        <div className="fixed top-20 left-10 animate-bounce-slow opacity-20 text-pink-400">
          <FaHeart size={30} />
        </div>
        <div className="fixed top-40 right-10 animate-pulse opacity-20 text-pink-400">
          <FaUtensils size={30} />
        </div>
        <div className="fixed bottom-20 left-20 animate-pulse opacity-20 text-pink-400">
          <FaStar size={30} />
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-10">
            <div className="bg-pink-100 p-3 rounded-full mr-3">
              <FaUser className="text-pink-500 text-xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 font-cursive">{t('profile')}</h1>
          </div>
          
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-pink-100 transform hover:scale-102 transition-all duration-300">
            {/* Tabs */}
            <div className="flex border-b border-pink-100">
              <button
                className={`flex-1 flex justify-center items-center py-5 px-6 transition-all duration-300 ${
                  activeTab === 'profile'
                    ? 'bg-pink-50 border-b-2 border-pink-500 text-pink-500 font-medium'
                    : 'text-gray-500 hover:text-pink-500 hover:bg-pink-50/50'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                <FaUserEdit className={`mr-2 ${activeTab === 'profile' ? 'text-pink-500' : 'text-pink-300'}`} />
                {t('personal_information')}
              </button>
              <button
                className={`flex-1 flex justify-center items-center py-5 px-6 transition-all duration-300 ${
                  activeTab === 'password'
                    ? 'bg-pink-50 border-b-2 border-pink-500 text-pink-500 font-medium'
                    : 'text-gray-500 hover:text-pink-500 hover:bg-pink-50/50'
                }`}
                onClick={() => setActiveTab('password')}
              >
                <FaKey className={`mr-2 ${activeTab === 'password' ? 'text-pink-500' : 'text-pink-300'}`} />
                {t('change_password')}
              </button>
            </div>
            
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-8">
                <div className="flex flex-col md:flex-row items-center mb-8">
                  <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center mr-6 border-4 border-pink-200 shadow-md">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <FaUser className="text-pink-400 text-3xl" />
                    )}
                  </div>
                  <div className="mt-4 md:mt-0 text-center md:text-left">
                    <h2 className="text-2xl font-semibold text-gray-800 font-cursive">{user.name}</h2>
                    <p className="text-gray-600">{user.email}</p>
                    <span className={`mt-2 inline-block px-3 py-1 text-sm rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-pink-100 text-pink-800'
                    }`}>
                      {user.role === 'admin' ? t('admin') : t('user')}
                    </span>
                  </div>
                </div>
                
                <form onSubmit={profileFormik.handleSubmit} className="space-y-6">
                  <div className="bg-pink-50 p-6 rounded-2xl shadow-sm">
                    <div className="mb-5">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('name')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaUser className="text-pink-400" />
                        </div>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={profileFormik.values.name}
                          onChange={profileFormik.handleChange}
                          onBlur={profileFormik.handleBlur}
                          className={`block w-full pl-12 pr-4 py-3 border rounded-full shadow-sm ${
                            profileFormik.touched.name && profileFormik.errors.name
                              ? 'border-red-400 focus:ring-red-400'
                              : 'border-pink-200 focus:ring-pink-400'
                          } bg-white focus:outline-none focus:ring-2 focus:border-transparent`}
                        />
                      </div>
                      {profileFormik.touched.name && profileFormik.errors.name && (
                        <p className="mt-2 text-sm text-red-500">{profileFormik.errors.name}</p>
                      )}
                    </div>
                    
                    <div className="mb-5">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('email')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaEnvelope className="text-pink-400" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={profileFormik.values.email}
                          onChange={profileFormik.handleChange}
                          onBlur={profileFormik.handleBlur}
                          className={`block w-full pl-12 pr-4 py-3 border rounded-full shadow-sm ${
                            profileFormik.touched.email && profileFormik.errors.email
                              ? 'border-red-400 focus:ring-red-400'
                              : 'border-pink-200 focus:ring-pink-400'
                          } bg-white focus:outline-none focus:ring-2 focus:border-transparent`}
                        />
                      </div>
                      {profileFormik.touched.email && profileFormik.errors.email && (
                        <p className="mt-2 text-sm text-red-500">{profileFormik.errors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('preferred_language')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaGlobe className="text-pink-400" />
                        </div>
                        <select
                          id="preferredLanguage"
                          name="preferredLanguage"
                          value={profileFormik.values.preferredLanguage}
                          onChange={profileFormik.handleChange}
                          className="block w-full pl-12 pr-4 py-3 border border-pink-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent shadow-sm appearance-none"
                        >
                          {availableLanguages.map(lang => (
                            <option key={lang.code} value={lang.code}>
                              {lang.name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-pink-500">
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-md text-white bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 transition-all duration-300 transform hover:scale-105"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('saving')}
                        </>
                      ) : (
                        <>
                          <FaSave className="mr-2" />
                          {t('save_changes')}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="inline-block bg-pink-100 p-4 rounded-full mb-4">
                    <FaKey className="text-pink-500 text-3xl" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-800">{t('update_your_password')}</h3>
                  <p className="text-gray-600 text-sm mt-1">{t('password_security_tip')}</p>
                </div>
                
                <form onSubmit={passwordFormik.handleSubmit} className="space-y-6">
                  <div className="bg-pink-50 p-6 rounded-2xl shadow-sm">
                    <div className="mb-5">
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('current_password')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaLock className="text-pink-400" />
                        </div>
                        <input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          value={passwordFormik.values.currentPassword}
                          onChange={passwordFormik.handleChange}
                          onBlur={passwordFormik.handleBlur}
                          className={`block w-full pl-12 pr-4 py-3 border rounded-full shadow-sm ${
                            passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword
                              ? 'border-red-400 focus:ring-red-400'
                              : 'border-pink-200 focus:ring-pink-400'
                          } bg-white focus:outline-none focus:ring-2 focus:border-transparent`}
                        />
                      </div>
                      {passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword && (
                        <p className="mt-2 text-sm text-red-500">{passwordFormik.errors.currentPassword}</p>
                      )}
                    </div>
                    
                    <div className="mb-5">
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('new_password')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaLock className="text-pink-400" />
                        </div>
                        <input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          value={passwordFormik.values.newPassword}
                          onChange={passwordFormik.handleChange}
                          onBlur={passwordFormik.handleBlur}
                          className={`block w-full pl-12 pr-4 py-3 border rounded-full shadow-sm ${
                            passwordFormik.touched.newPassword && passwordFormik.errors.newPassword
                              ? 'border-red-400 focus:ring-red-400'
                              : 'border-pink-200 focus:ring-pink-400'
                          } bg-white focus:outline-none focus:ring-2 focus:border-transparent`}
                        />
                      </div>
                      {passwordFormik.touched.newPassword && passwordFormik.errors.newPassword && (
                        <p className="mt-2 text-sm text-red-500">{passwordFormik.errors.newPassword}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('confirm_password')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaLock className="text-pink-400" />
                        </div>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={passwordFormik.values.confirmPassword}
                          onChange={passwordFormik.handleChange}
                          onBlur={passwordFormik.handleBlur}
                          className={`block w-full pl-12 pr-4 py-3 border rounded-full shadow-sm ${
                            passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword
                              ? 'border-red-400 focus:ring-red-400'
                              : 'border-pink-200 focus:ring-pink-400'
                          } bg-white focus:outline-none focus:ring-2 focus:border-transparent`}
                        />
                      </div>
                      {passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword && (
                        <p className="mt-2 text-sm text-red-500">{passwordFormik.errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-md text-white bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 transition-all duration-300 transform hover:scale-105"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('updating')}
                        </>
                      ) : (
                        <>
                          <FaKey className="mr-2" />
                          {t('update_password')}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
          
          {/* Little hearts decoration */}
          <div className="flex justify-center mt-6 space-x-3">
            <FaHeart className="text-pink-400 opacity-50 animate-pulse" />
            <FaStar className="text-pink-400 opacity-50 animate-bounce-slow" />
            <FaHeart className="text-pink-400 opacity-50 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;