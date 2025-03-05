import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FaUser, FaEnvelope, FaLock, FaUtensils } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
  const { register, isAuthenticated, loading } = useAuth();
  const { t } = useLanguage();
  const [registerError, setRegisterError] = useState('');

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
      const { name, email, password } = values;
      const success = await register({ name, email, password });
      if (!success) {
        setRegisterError('Registration failed. Email may already be in use.');
      }
    }
  });

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with logo */}
      <div className="w-full py-6 flex justify-center">
        <Link to="/" className="flex items-center space-x-2 text-primary font-bold text-2xl">
          <FaUtensils className="text-primary" size={24} />
          <span>COokiFy</span>
        </Link>
      </div>
      
      <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-md w-full">
          {/* Card */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            {/* Card header */}
            <div className="bg-primary py-6 px-8">
              <h2 className="text-2xl font-bold text-white text-center">
                {t('register')}
              </h2>
            </div>
            
            {/* Card body */}
            <div className="p-8">
              {registerError && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r" role="alert">
                  <p className="font-medium">Registration Failed</p>
                  <p>{registerError}</p>
                </div>
              )}

              <form className="space-y-5" onSubmit={formik.handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('name')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        className={`appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border ${
                          formik.touched.name && formik.errors.name ? 'border-red-500' : 'border-gray-300'
                        } placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:z-10 sm:text-sm`}
                        placeholder={t('name')}
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    </div>
                    {formik.touched.name && formik.errors.name && (
                      <p className="mt-1 text-sm text-red-500">{formik.errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('email')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaEnvelope className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        className={`appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border ${
                          formik.touched.email && formik.errors.email ? 'border-red-500' : 'border-gray-300'
                        } placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:z-10 sm:text-sm`}
                        placeholder={t('email')}
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    </div>
                    {formik.touched.email && formik.errors.email && (
                      <p className="mt-1 text-sm text-red-500">{formik.errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('password')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        className={`appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border ${
                          formik.touched.password && formik.errors.password ? 'border-red-500' : 'border-gray-300'
                        } placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:z-10 sm:text-sm`}
                        placeholder={t('password')}
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    </div>
                    {formik.touched.password && formik.errors.password && (
                      <p className="mt-1 text-sm text-red-500">{formik.errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('confirm_password')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        className={`appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border ${
                          formik.touched.confirmPassword && formik.errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        } placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:z-10 sm:text-sm`}
                        placeholder={t('confirm_password')}
                        value={formik.values.confirmPassword}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    </div>
                    {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-500">{formik.errors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                  >
                    {loading ? (
                      <span className="absolute left-0 inset-y-0 flex items-center pl-3">
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
            <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                {t('already_have_account')}{' '}
                <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
                  {t('login')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;