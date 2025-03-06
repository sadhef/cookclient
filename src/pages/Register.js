import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FaUser, FaEnvelope, FaLock, FaUtensils, FaHeart, FaCookieBite, FaStar, FaMagic } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
  const { register, isAuthenticated, loading } = useAuth();
  const { t } = useLanguage();
  const [registerError, setRegisterError] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .required('Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name cannot exceed 50 characters'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Please confirm your password')
    }),
    onSubmit: async (values) => {
      setRegisterError('');
      setShowAnimation(true);
      const { name, email, password } = values;
      const success = await register({ name, email, password });
      if (!success) {
        setRegisterError('Registration failed. Email may already be in use.');
        setShowAnimation(false);
      }
    }
  });

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-rose-50 to-pink-100 relative overflow-hidden">
      {/* Cute floating elements */}
      <div className="fixed top-20 left-10 animate-bounce-slow opacity-30 text-pink-400">
        <FaUtensils size={30} />
      </div>
      <div className="fixed top-40 right-10 animate-pulse opacity-30 text-pink-400">
        <FaHeart size={30} />
      </div>
      <div className="fixed bottom-20 left-20 animate-pulse opacity-30 text-pink-400">
        <FaCookieBite size={30} />
      </div>
      <div className="fixed bottom-60 right-20 animate-bounce-slow opacity-30 text-pink-400">
        <FaStar size={30} />
      </div>
      
      {/* Header with logo */}
      <div className="w-full py-8 flex justify-center">
        <Link to="/" className="flex items-center space-x-2 text-pink-500 font-bold text-3xl font-cursive transform hover:scale-110 transition-transform duration-300">
          <FaUtensils className="text-pink-500" size={30} />
          <span>COokiFy</span>
        </Link>
      </div>
      
      {/* Registration animation overlay */}
      {showAnimation && (
        <div className="fixed inset-0 bg-pink-500/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-float">
            <FaMagic className="text-pink-500 text-5xl mx-auto" />
            </div>
            <p className="text-pink-600 font-medium text-xl mt-4">{t('creating_account')}...</p>
          </div>
        </div>
      )}
      
      <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-md w-full transform hover:scale-102 transition-all duration-300">
          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-pink-100">
            {/* Card header */}
            <div className="bg-gradient-to-r from-pink-400 to-rose-500 py-8 px-8">
              <div className="flex justify-center mb-4">
                <div className="bg-white/30 rounded-full p-3">
                  <FaUser className="text-white text-2xl" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white text-center font-cursive drop-shadow-sm">
                {t('register')}
              </h2>
            </div>
            
            {/* Card body */}
            <div className="p-8">
              {registerError && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-r animate-pulse" role="alert">
                  <p className="font-medium">Registration Failed</p>
                  <p>{registerError}</p>
                </div>
              )}

              <form className="space-y-5" onSubmit={formik.handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('name')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaUser className="h-5 w-5 text-pink-400" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        className={`appearance-none rounded-full relative block w-full px-4 py-3 pl-12 border ${
                          formik.touched.name && formik.errors.name ? 'border-red-400' : 'border-pink-200'
                        } placeholder-pink-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent focus:z-10 sm:text-sm shadow-sm`}
                        placeholder={t('name')}
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    </div>
                    {formik.touched.name && formik.errors.name && (
                      <p className="mt-2 text-sm text-red-500">{formik.errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('email')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaEnvelope className="h-5 w-5 text-pink-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        className={`appearance-none rounded-full relative block w-full px-4 py-3 pl-12 border ${
                          formik.touched.email && formik.errors.email ? 'border-red-400' : 'border-pink-200'
                        } placeholder-pink-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent focus:z-10 sm:text-sm shadow-sm`}
                        placeholder={t('email')}
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    </div>
                    {formik.touched.email && formik.errors.email && (
                      <p className="mt-2 text-sm text-red-500">{formik.errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('password')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaLock className="h-5 w-5 text-pink-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        className={`appearance-none rounded-full relative block w-full px-4 py-3 pl-12 border ${
                          formik.touched.password && formik.errors.password ? 'border-red-400' : 'border-pink-200'
                        } placeholder-pink-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent focus:z-10 sm:text-sm shadow-sm`}
                        placeholder={t('password')}
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    </div>
                    {formik.touched.password && formik.errors.password && (
                      <p className="mt-2 text-sm text-red-500">{formik.errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('confirm_password')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaLock className="h-5 w-5 text-pink-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        className={`appearance-none rounded-full relative block w-full px-4 py-3 pl-12 border ${
                          formik.touched.confirmPassword && formik.errors.confirmPassword ? 'border-red-400' : 'border-pink-200'
                        } placeholder-pink-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent focus:z-10 sm:text-sm shadow-sm`}
                        placeholder={t('confirm_password')}
                        value={formik.values.confirmPassword}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    </div>
                    {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-500">{formik.errors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 transition-all duration-300 shadow-md transform hover:scale-105"
                  >
                    {loading ? (
                      <span className="absolute left-4 inset-y-0 flex items-center">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                    ) : null}
                    {t('register')}
                  </button>
                </div>
              </form>
            </div>
            
            {/* Card footer */}
            <div className="bg-pink-50 px-8 py-6 border-t border-pink-100 text-center">
              <p className="text-sm text-gray-600">
                {t('already_have_account')}{' '}
                <Link to="/login" className="font-medium text-pink-500 hover:text-pink-600 hover:underline">
                  {t('login')}
                </Link>
              </p>
            </div>
          </div>
          
          {/* Little decorations under the card */}
          <div className="flex justify-center mt-6 space-x-3">
            <FaHeart className="text-pink-400 opacity-50 animate-pulse" />
            <FaStar className="text-pink-400 opacity-50 animate-bounce-slow" />
            <FaHeart className="text-pink-400 opacity-50 animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Add custom animation keyframes */}
      <style jsx="true">{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.1); }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite;
        }
        
        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
        
        .font-cursive {
          font-family: 'Comic Sans MS', cursive, sans-serif;
        }
      `}</style>
    </div>
  );
};

export default Register;