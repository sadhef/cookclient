import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaSearch, FaCheck, FaTimes, FaUser } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { getUsers, updateUser, deleteUser } from '../../services/adminService';
import AdminSidebar from './AdminSidebar';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const UsersPage = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);
  
  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      role: 'user'
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
        .min(6, 'Password must be at least 6 characters')
        .when('_action', {
          is: 'create',
          then: Yup.string().required('Password is required')
        }),
      role: Yup.string()
        .required('Role is required')
        .oneOf(['user', 'admin'], 'Invalid role')
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        
        if (editingUser) {
          // Remove password if it's empty (user didn't want to change it)
          const updateData = { ...values };
          if (!updateData.password) {
            delete updateData.password;
          }
          
          const updatedUser = await updateUser(editingUser._id, updateData);
          setUsers(users.map(user => user._id === updatedUser._id ? updatedUser : user));
          toast.success(t('user_updated'));
        }
        
        closeModal();
      } catch (error) {
        toast.error(error || t('error_occurred'));
      } finally {
        setLoading(false);
      }
    }
  });
  
  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setShowAnimation(true);
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (error) {
        toast.error(error || t('error_occurred'));
      } finally {
        setLoading(false);
        setTimeout(() => setShowAnimation(false), 1000);
      }
    };
    
    fetchUsers();
  }, [t]);
  
  // Reset form when modal closes
  const closeModal = () => {
    formik.resetForm();
    setEditingUser(null);
    setModalOpen(false);
  };
  
  // Open modal for editing
  const handleEdit = (user) => {
    setEditingUser(user);
    formik.setValues({
      name: user.name,
      email: user.email,
      password: '', // Don't show password
      role: user.role,
      _action: 'edit'
    });
    setModalOpen(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = (user) => {
    setConfirmDelete(user);
  };
  
  // Cancel delete
  const handleDeleteCancel = () => {
    setConfirmDelete(null);
  };
  
  // Delete user
  const handleDeleteConfirmed = async () => {
    try {
      setLoading(true);
      await deleteUser(confirmDelete._id);
      setUsers(users.filter(user => user._id !== confirmDelete._id));
      setConfirmDelete(null);
      toast.success(t('user_deleted'));
    } catch (error) {
      toast.error(error || t('error_occurred'));
    } finally {
      setLoading(false);
    }
  };
  
  // Filter users by search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="min-h-screen bg-rose-50">
      <AdminSidebar />
      
      {/* Loading animation overlay */}
      {showAnimation && (
        <div className="fixed inset-0 bg-pink-500/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-float">
              <FaUser className="text-pink-500 text-5xl mx-auto" />
            </div>
            <p className="text-pink-600 font-medium text-xl mt-4">{t('loading_users')}...</p>
          </div>
        </div>
      )}
      
      <div className="pb-6">
        {/* Page header */}
        <div className="bg-white shadow-md p-6 mb-8 border-b border-pink-100">
          <div className="flex items-center">
            <div className="bg-pink-100 p-3 rounded-full mr-3">
              <FaUser className="text-pink-500" size={20} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{t('manage_users')}</h1>
          </div>
        </div>
        
        <div className="px-6">
          {/* Search */}
          <div className="mb-6">
            <div className="bg-white rounded-3xl shadow-lg p-4 border border-pink-100">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaSearch className="text-pink-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-4 py-3 border border-pink-200 rounded-full leading-5 bg-white placeholder-pink-300 focus:outline-none focus:placeholder-pink-300 focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all duration-300"
                  placeholder={t('search_users')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Users Table */}
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-pink-100">
            {loading && !users.length ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-pink-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-pink-100">
                  <thead className="bg-pink-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-pink-500 uppercase tracking-wider">
                        {t('name')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-pink-500 uppercase tracking-wider">
                        {t('email')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-pink-500 uppercase tracking-wider">
                        {t('role')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-pink-500 uppercase tracking-wider">
                        {t('created_at')}
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-pink-500 uppercase tracking-wider">
                        {t('actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-pink-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          {searchTerm ? t('no_matching_users') : t('no_users')}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user._id} className="hover:bg-pink-50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center border-2 border-pink-200">
                                {user.avatar ? (
                                  <img 
                                    src={user.avatar} 
                                    alt={user.name}
                                    className="h-10 w-10 rounded-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = '/default-avatar.jpg';
                                    }}
                                  />
                                ) : (
                                  <span className="text-pink-500 font-semibold">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-pink-100 text-pink-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {confirmDelete && confirmDelete._id === user._id ? (
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={handleDeleteConfirmed}
                                  className="text-white bg-red-500 hover:bg-red-600 p-2 rounded-full shadow-sm transition-colors"
                                  disabled={loading}
                                >
                                  <FaCheck size={14} />
                                </button>
                                <button
                                  onClick={handleDeleteCancel}
                                  className="text-white bg-gray-400 hover:bg-gray-500 p-2 rounded-full shadow-sm transition-colors"
                                >
                                  <FaTimes size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handleEdit(user)}
                                  className="text-green-500 hover:text-green-600 bg-green-50 hover:bg-green-100 p-2 rounded-full transition-colors"
                                  title={t('edit')}
                                >
                                  <FaEdit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteConfirm(user)}
                                  className="text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors"
                                  title={t('delete')}
                                >
                                  <FaTrash size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Edit User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-pink-500/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-pink-100">
            <div className="px-6 py-4 border-b border-pink-100">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaEdit className="text-pink-500 mr-2" />
                {t('edit_user')}
              </h3>
            </div>
            
            <form onSubmit={formik.handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('name')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border ${
                      formik.touched.name && formik.errors.name
                        ? 'border-red-300 focus:ring-red-300'
                        : 'border-pink-200 focus:ring-pink-300'
                    } rounded-xl focus:outline-none focus:ring-2 focus:border-transparent`}
                  />
                  {formik.touched.name && formik.errors.name && (
                    <p className="mt-1 text-sm text-red-500">{formik.errors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border ${
                      formik.touched.email && formik.errors.email
                        ? 'border-red-300 focus:ring-red-300'
                        : 'border-pink-200 focus:ring-pink-300'
                    } rounded-xl focus:outline-none focus:ring-2 focus:border-transparent`}
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="mt-1 text-sm text-red-500">{formik.errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('password')}
                    <span className="text-xs text-gray-500 ml-1">
                      ({t('leave_empty_to_keep_current')})
                    </span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border ${
                      formik.touched.password && formik.errors.password
                        ? 'border-red-300 focus:ring-red-300'
                        : 'border-pink-200 focus:ring-pink-300'
                    } rounded-xl focus:outline-none focus:ring-2 focus:border-transparent`}
                  />
                  {formik.touched.password && formik.errors.password && (
                    <p className="mt-1 text-sm text-red-500">{formik.errors.password}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('role')}
                  </label>
                  <select
                    name="role"
                    value={formik.values.role}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border ${
                      formik.touched.role && formik.errors.role
                        ? 'border-red-300 focus:ring-red-300'
                        : 'border-pink-200 focus:ring-pink-300'
                    } rounded-xl focus:outline-none focus:ring-2 focus:border-transparent`}
                  >
                    <option value="user">{t('user')}</option>
                    <option value="admin">{t('admin')}</option>
                  </select>
                  {formik.touched.role && formik.errors.role && (
                    <p className="mt-1 text-sm text-red-500">{formik.errors.role}</p>
                  )}
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-pink-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-pink-200 rounded-xl text-pink-500 hover:bg-pink-50 transition-colors shadow-sm"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-pink-400 to-rose-500 text-white rounded-xl hover:from-pink-500 hover:to-rose-600 shadow-md transition-all duration-300"
                >
                  {loading ? t('saving') : t('update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;