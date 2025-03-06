import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FaEnvelope, FaLock, FaUtensils, FaHeart, FaCookieBite, FaStar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const { t } = useLanguage();
  const [loginError, setLoginError] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .required('Password is required')
    }),
    onSubmit: async (values) => {
      setLoginError('');
      setShowAnimation(true);
      const success = await login(values.email, values.password);
      if (!success) {
        setLoginError('Invalid email or password');
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
      
      {/* Login animation overlay */}
      {showAnimation && (
        <div className="fixed inset-0 bg-pink-500/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-float">
              <FaHeart className="text-pink-500 text-5xl mx-auto" />
            </div>
            <p className="text-pink-600 font-medium text-xl mt-4">{t('logging_in')}...</p>
          </div>
        </div>
      )}
      
      <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-md w-full transform hover:scale-102 transition-all duration-300">
          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-pink-100">
            {/* Card header */}
            <div className="bg-gradient-to-r from-pink-400 to-rose-500 py-8 px-8">
              <div className="flex justify-center mb-4">
                <div className="bg-white/30 rounded-full p-3">
                  <FaUtensils className="text-white text-2xl" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white text-center font-cursive drop-shadow-sm">
                {t('login')}
              </h2>
            </div>
            
            {/* Card body */}
            <div className="p-8">
              {loginError && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-r animate-pulse" role="alert">
                  <p className="font-medium">Login Failed</p>
                  <p>{loginError}</p>
                </div>
              )}

              <form className="space-y-6" onSubmit={formik.handleSubmit}>
                <div className="space-y-5">
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
                        autoComplete="current-password"
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
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-pink-500 focus:ring-pink-400 border-pink-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      {t('remember_me')}
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link to="/forgot-password" className="font-medium text-pink-500 hover:text-pink-600">
                      {t('forgot_password')}
                    </Link>
                  </div>
                </div>

                <div>
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
                    {t('login')}
                  </button>
                </div>
              </form>
            </div>
            
            {/* Card footer */}
            <div className="bg-pink-50 px-8 py-6 border-t border-pink-100 text-center">
              <p className="text-sm text-gray-600">
                {t('dont_have_account')}{' '}
                <Link to="/register" className="font-medium text-pink-500 hover:text-pink-600 hover:underline">
                  {t('register')}
                </Link>
              </p>
            </div>
          </div>
          
          {/* Little heart decoration under the card */}
          <div className="flex justify-center mt-6">
            <FaHeart className="text-pink-400 opacity-50 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;