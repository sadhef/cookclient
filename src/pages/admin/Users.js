import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaCheck, FaTimes } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { getUsers, createUser, updateUser, deleteUser } from '../../services/adminService';
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
        } else {
          const newUser = await createUser(values);
          setUsers([newUser, ...users]);
          toast.success(t('user_created'));
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
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (error) {
        toast.error(error || t('error_occurred'));
      } finally {
        setLoading(false);
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
  
  // Open modal for creating
  const handleCreate = () => {
    setEditingUser(null);
    formik.setValues({
      name: '',
      email: '',
      password: '',
      role: 'user',
      _action: 'create'
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
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('manage_users')}</h1>
          
          <button
            onClick={handleCreate}
            className="bg-primary text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-primary-dark"
          >
            <FaPlus />
            <span>{t('create_user')}</span>
          </button>
        </div>
        
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
              placeholder={t('search_users')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Users Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {loading && !users.length ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('role')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('created_at')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      {searchTerm ? t('no_matching_users') : t('no_users')}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name}
                                className="h-10 w-10 rounded-full"
                              />
                            ) : (
                              <span className="text-gray-500 font-semibold">
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
                            : 'bg-blue-100 text-blue-800'
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
                              className="text-red-600 hover:text-red-800"
                              disabled={loading}
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={handleDeleteCancel}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteConfirm(user)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingUser ? t('edit_user') : t('create_user')}
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
                    className={`w-full px-3 py-2 border ${
                      formik.touched.name && formik.errors.name
                        ? 'border-red-500'
                        : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary`}
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
                    className={`w-full px-3 py-2 border ${
                      formik.touched.email && formik.errors.email
                        ? 'border-red-500'
                        : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary`}
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="mt-1 text-sm text-red-500">{formik.errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('password')}
                    {editingUser && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({t('leave_empty_to_keep_current')})
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-3 py-2 border ${
                      formik.touched.password && formik.errors.password
                        ? 'border-red-500'
                        : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary`}
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
                    className={`w-full px-3 py-2 border ${
                      formik.touched.role && formik.errors.role
                        ? 'border-red-500'
                        : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary`}
                  >
                    <option value="user">{t('user')}</option>
                    <option value="admin">{t('admin')}</option>
                  </select>
                  {formik.touched.role && formik.errors.role && (
                    <p className="mt-1 text-sm text-red-500">{formik.errors.role}</p>
                  )}
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {loading ? t('saving') : editingUser ? t('update') : t('create')}
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