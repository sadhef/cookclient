import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaLock, FaGlobe, FaSave } from 'react-icons/fa';
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
      }
    }
  });
  
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('profile')}</h1>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  className={`px-6 py-4 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'profile'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('profile')}
                >
                  {t('personal_information')}
                </button>
                <button
                  className={`px-6 py-4 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'password'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('password')}
                >
                  {t('change_password')}
                </button>
              </nav>
            </div>
            
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mr-6">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <FaUser className="text-gray-500 text-2xl" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">{user.name}</h2>
                    <p className="text-gray-600">{user.email}</p>
                    <span className={`mt-1 inline-block px-2 py-1 text-xs rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
                
                <form onSubmit={profileFormik.handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('name')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="text-gray-400" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={profileFormik.values.name}
                        onChange={profileFormik.handleChange}
                        onBlur={profileFormik.handleBlur}
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          profileFormik.touched.name && profileFormik.errors.name
                            ? 'border-red-500'
                            : 'border-gray-300'
                        } rounded-md leading-5 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary`}
                      />
                    </div>
                    {profileFormik.touched.name && profileFormik.errors.name && (
                      <p className="mt-1 text-sm text-red-500">{profileFormik.errors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('email')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaEnvelope className="text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={profileFormik.values.email}
                        onChange={profileFormik.handleChange}
                        onBlur={profileFormik.handleBlur}
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          profileFormik.touched.email && profileFormik.errors.email
                            ? 'border-red-500'
                            : 'border-gray-300'
                        } rounded-md leading-5 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary`}
                      />
                    </div>
                    {profileFormik.touched.email && profileFormik.errors.email && (
                      <p className="mt-1 text-sm text-red-500">{profileFormik.errors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('preferred_language')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaGlobe className="text-gray-400" />
                      </div>
                      <select
                        id="preferredLanguage"
                        name="preferredLanguage"
                        value={profileFormik.values.preferredLanguage}
                        onChange={profileFormik.handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        {availableLanguages.map(lang => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('saving')}
                        </>
                      ) : (
                        <>
                          <FaSave className="mr-2" />
                          {t('save')}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="p-6">
                <form onSubmit={passwordFormik.handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('current_password')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="text-gray-400" />
                      </div>
                      <input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={passwordFormik.values.currentPassword}
                        onChange={passwordFormik.handleChange}
                        onBlur={passwordFormik.handleBlur}
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword
                            ? 'border-red-500'
                            : 'border-gray-300'
                        } rounded-md leading-5 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary`}
                      />
                    </div>
                    {passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword && (
                      <p className="mt-1 text-sm text-red-500">{passwordFormik.errors.currentPassword}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('new_password')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="text-gray-400" />
                      </div>
                      <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={passwordFormik.values.newPassword}
                        onChange={passwordFormik.handleChange}
                        onBlur={passwordFormik.handleBlur}
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          passwordFormik.touched.newPassword && passwordFormik.errors.newPassword
                            ? 'border-red-500'
                            : 'border-gray-300'
                        } rounded-md leading-5 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary`}
                      />
                    </div>
                    {passwordFormik.touched.newPassword && passwordFormik.errors.newPassword && (
                      <p className="mt-1 text-sm text-red-500">{passwordFormik.errors.newPassword}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('confirm_password')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={passwordFormik.values.confirmPassword}
                        onChange={passwordFormik.handleChange}
                        onBlur={passwordFormik.handleBlur}
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword
                            ? 'border-red-500'
                            : 'border-gray-300'
                        } rounded-md leading-5 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary`}
                      />
                    </div>
                    {passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-500">{passwordFormik.errors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('updating')}
                        </>
                      ) : (
                        <>
                          <FaSave className="mr-2" />
                          {t('update_password')}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;