import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaCheck, 
  FaTimes, 
  FaFilter, 
  FaEye, 
  FaCheckCircle,
  FaClock,
  FaCookieBite,
  FaUtensils
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { getRecipes, updateRecipe, deleteRecipe } from '../../services/recipeService';
import { moderateRecipe } from '../../services/adminService';
import AdminSidebar from './AdminSidebar';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const RecipesPage = () => {
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all'
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [moderationModal, setModerationModal] = useState(false);
  const [moderationRecipe, setModerationRecipe] = useState(null);
  const [moderationStatus, setModerationStatus] = useState('approved');
  const [moderationNote, setModerationNote] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Fetch recipes
  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      setShowAnimation(true);
      
      // Prepare query params
      const params = {
        page: currentPage,
        limit: 10,
        sort: '-createdAt'
      };
      
      // Add filters
      if (filters.status !== 'all') {
        params.status = filters.status;
      }
      
      const response = await getRecipes(params);
      setRecipes(response.data);
      
      // Calculate total pages
      setTotalPages(Math.ceil(response.count / 10));
    } catch (error) {
      toast.error(error || t('error_occurred'));
    } finally {
      setLoading(false);
      setTimeout(() => setShowAnimation(false), 1000);
    }
  }, [currentPage, filters, t]);
  
  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);
  
  // Recipe edit form
  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      totalTime: '',
      ingredients: [],
      instructions: []
    },
    validationSchema: Yup.object({
      title: Yup.string()
        .required('Title is required')
        .max(100, 'Title cannot exceed 100 characters'),
      description: Yup.string()
        .required('Description is required')
        .max(500, 'Description cannot exceed 500 characters'),
      totalTime: Yup.string()
        .required('Total time is required'),
      ingredients: Yup.array()
        .of(Yup.string())
        .min(1, 'At least one ingredient is required'),
      instructions: Yup.array()
        .of(Yup.string())
        .min(1, 'At least one instruction is required')
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        
        const updatedRecipe = await updateRecipe(editingRecipe._id, values);
        
        // Update recipes list with the updated recipe
        setRecipes(recipes.map(recipe => 
          recipe._id === updatedRecipe._id ? updatedRecipe : recipe
        ));
        
        closeModal();
        toast.success(t('recipe_updated'));
      } catch (error) {
        toast.error(error || t('error_occurred'));
      } finally {
        setLoading(false);
      }
    }
  });
  
  // Reset form when modal closes
  const closeModal = () => {
    formik.resetForm();
    setEditingRecipe(null);
    setModalOpen(false);
  };
  
  // Open edit modal
  const handleEdit = (recipe) => {
    setEditingRecipe(recipe);
    
    // Convert arrays to string for the form
    const ingredientsString = recipe.ingredients.join('\n');
    const instructionsString = recipe.instructions.join('\n');
    
    formik.setValues({
      title: recipe.title,
      description: recipe.description,
      totalTime: recipe.totalTime,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      ingredientsString, // For textarea display
      instructionsString // For textarea display
    });
    
    setModalOpen(true);
  };
  
  // Open moderation modal
  const handleModerate = (recipe) => {
    setModerationRecipe(recipe);
    setModerationStatus(recipe.status || 'pending');
    setModerationNote(recipe.moderationNote || '');
    setModerationModal(true);
  };
  
  // Submit moderation
  const handleModerationSubmit = async () => {
    try {
      setLoading(true);
      
      const updatedRecipe = await moderateRecipe(
        moderationRecipe._id, 
        moderationStatus, 
        moderationNote
      );
      
      // Update recipes list
      setRecipes(recipes.map(recipe => 
        recipe._id === updatedRecipe._id ? updatedRecipe : recipe
      ));
      
      setModerationModal(false);
      toast.success(t('recipe_moderated'));
    } catch (error) {
      toast.error(error || t('error_occurred'));
    } finally {
      setLoading(false);
    }
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = (recipe) => {
    setConfirmDelete(recipe);
  };
  
  // Cancel delete
  const handleDeleteCancel = () => {
    setConfirmDelete(null);
  };
  
  // Delete recipe
  const handleDeleteConfirmed = async () => {
    try {
      setLoading(true);
      await deleteRecipe(confirmDelete._id);
      setRecipes(recipes.filter(recipe => recipe._id !== confirmDelete._id));
      setConfirmDelete(null);
      toast.success(t('recipe_deleted'));
    } catch (error) {
      toast.error(error || t('error_occurred'));
    } finally {
      setLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1); // Reset to first page when applying filters
    fetchRecipes();
    setFiltersOpen(false);
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: 'all'
    });
    setCurrentPage(1);
    setFiltersOpen(false);
  };
  
  // Filter recipes by search term
  const filteredRecipes = recipes.filter(recipe => 
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get status badge color and style
  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return {
          className: 'bg-green-100 text-green-800 border border-green-200',
          icon: <FaCheckCircle className="mr-1" size={10} />
        };
      case 'rejected':
        return {
          className: 'bg-red-100 text-red-800 border border-red-200',
          icon: <FaTimes className="mr-1" size={10} />
        };
      case 'pending':
      default:
        return {
          className: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
          icon: <FaClock className="mr-1" size={10} />
        };
    }
  };
  
  return (
    <div className="min-h-screen bg-rose-50">
      <AdminSidebar />
      
      {/* Loading animation overlay */}
      {showAnimation && (
        <div className="fixed inset-0 bg-pink-500/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-float">
              <FaCookieBite className="text-pink-500 text-5xl mx-auto" />
            </div>
            <p className="text-pink-600 font-medium text-xl mt-4">{t('Loading...')}...</p>
          </div>
        </div>
      )}
      
      <div className="pb-6">
        {/* Page header */}
        <div className="bg-white shadow-md p-6 mb-8 border-b border-pink-100">
          <div className="flex items-center">
            <div className="bg-pink-100 p-3 rounded-full mr-3">
              <FaUtensils className="text-pink-500" size={20} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{t('manage_recipes')}</h1>
          </div>
        </div>
      
        <div className="px-6">
          {/* Search and Filter */}
          <div className="mb-6">
            <div className="bg-white rounded-3xl shadow-lg p-4 border border-pink-100">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaSearch className="text-pink-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-12 pr-4 py-3 bg-pink-50 border border-pink-100 rounded-xl shadow-inner placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder={t('Search Recipes')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="bg-pink-50 text-pink-500 px-6 py-3 rounded-xl hover:bg-pink-100 flex items-center space-x-2 flex-shrink-0 border border-pink-100 font-medium transition-colors duration-300"
                >
                  <FaFilter />
                  <span>{t('filters')}</span>
                </button>
              </div>
              
              {/* Filters Panel */}
              {filtersOpen && (
                <div className="mt-6 p-4 bg-pink-50 rounded-xl border border-pink-100 animate-slide-up">
                  <h3 className="font-semibold text-gray-700 mb-4">{t('filter_recipes')}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('status')}
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                        className="block w-full pl-3 pr-10 py-2 text-base bg-white border-pink-100 focus:outline-none focus:ring-pink-300 focus:border-pink-300 rounded-xl shadow-sm"
                      >
                        <option value="all">{t('all')}</option>
                        <option value="pending">{t('pending')}</option>
                        <option value="approved">{t('approved')}</option>
                        <option value="rejected">{t('rejected')}</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="px-4 py-2 border border-pink-200 rounded-xl text-pink-500 hover:bg-pink-100 transition-colors duration-300"
                    >
                      {t('reset')}
                    </button>
                    <button
                      type="button"
                      onClick={applyFilters}
                      className="px-4 py-2 bg-gradient-to-r from-pink-400 to-rose-500 text-white rounded-xl hover:from-pink-500 hover:to-rose-600 shadow-md transition-all duration-300"
                    >
                      {t('apply_filters')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Recipes Table */}
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-pink-100">
            {loading && !recipes.length ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-pink-500"></div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-pink-100">
                <thead className="bg-pink-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-pink-500 uppercase tracking-wider">
                      {t('title')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-pink-500 uppercase tracking-wider">
                      {t('rating')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-pink-500 uppercase tracking-wider">
                      {t('status')}
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
                  {filteredRecipes.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        {searchTerm ? t('no_matching_recipes') : t('no_recipes')}
                      </td>
                    </tr>
                  ) : (
                    filteredRecipes.map(recipe => (
                      <tr key={recipe._id} className="hover:bg-pink-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-14 w-14 rounded-xl border-2 border-pink-100 overflow-hidden shadow-sm">
                              <img 
                                src={recipe.image || '/default-recipe.jpg'} 
                                alt={recipe.title}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/default-recipe.jpg';
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {recipe.title}
                              </div>
                              <div className="text-sm text-gray-500 truncate w-48">
                                {recipe.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-yellow-400 mr-1">★</span>
                            <span className="font-medium">{recipe.averageRating.toFixed(1)}</span>
                            <span className="text-gray-400 ml-1">({recipe.ratingCount})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const badge = getStatusBadge(recipe.status || 'pending');
                            return (
                              <span className={`px-3 py-1.5 inline-flex items-center text-xs leading-5 font-medium rounded-full ${badge.className}`}>
                                {badge.icon}
                                {recipe.status || t('pending')}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(recipe.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {confirmDelete && confirmDelete._id === recipe._id ? (
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
                              <Link
                                to={`/recipes/${recipe._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-full transition-colors"
                                title={t('view')}
                              >
                                <FaEye size={14} />
                              </Link>
                              
                              <button
                                onClick={() => handleModerate(recipe)}
                                className="text-purple-500 hover:text-purple-600 bg-purple-50 hover:bg-purple-100 p-2 rounded-full transition-colors"
                                title={t('moderate')}
                              >
                                <FaCheckCircle size={14} />
                              </button>
                              
                              <button
                                onClick={() => handleEdit(recipe)}
                                className="text-green-500 hover:text-green-600 bg-green-50 hover:bg-green-100 p-2 rounded-full transition-colors"
                                title={t('edit')}
                              >
                                <FaEdit size={14} />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteConfirm(recipe)}
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
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex justify-between items-center bg-pink-50 border-t border-pink-100">
                <div className="text-sm text-gray-600">
                  {t('showing')} {recipes.length} {t('of')} {totalPages * 10} {t('recipes')}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-pink-200 rounded-xl text-pink-500 hover:bg-pink-100 disabled:opacity-50 disabled:hover:bg-white disabled:text-pink-300 transition-colors shadow-sm"
                  >
                    {t('previous')}
                  </button>
                  <span className="px-4 py-2 border border-pink-200 rounded-xl bg-white font-medium text-pink-500 shadow-sm">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-pink-200 rounded-xl text-pink-500 hover:bg-pink-100 disabled:opacity-50 disabled:hover:bg-white disabled:text-pink-300 transition-colors shadow-sm"
                  >
                    {t('next')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Edit Recipe Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-pink-500/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-3xl w-full border border-pink-100">
            <div className="px-6 py-4 border-b border-pink-100">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaEdit className="text-pink-500 mr-2" />
                {t('edit_recipe')}
              </h3>
            </div>
            
            <form onSubmit={formik.handleSubmit}>
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('title')}
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formik.values.title}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 rounded-xl bg-pink-50 shadow-inner ${
                        formik.touched.title && formik.errors.title
                          ? 'border-red-300 focus:ring-red-300'
                          : 'border-pink-100 focus:ring-pink-300'
                      } focus:outline-none focus:ring-2 focus:border-transparent`}
                    />
                    {formik.touched.title && formik.errors.title && (
                      <p className="mt-1 text-sm text-red-500">{formik.errors.title}</p>
                    )}
                  </div>
                  
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('description')}
                    </label>
                    <textarea
                      name="description"
                      rows="3"
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 rounded-xl bg-pink-50 shadow-inner ${
                        formik.touched.description && formik.errors.description
                          ? 'border-red-300 focus:ring-red-300'
                          : 'border-pink-100 focus:ring-pink-300'
                      } focus:outline-none focus:ring-2 focus:border-transparent`}
                    ></textarea>
                    {formik.touched.description && formik.errors.description && (
                      <p className="mt-1 text-sm text-red-500">{formik.errors.description}</p>
                    )}
                  </div>
                  
                  {/* Total Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('total_time')}
                    </label>
                    <input
                      type="text"
                      name="totalTime"
                      value={formik.values.totalTime}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 rounded-xl bg-pink-50 shadow-inner ${
                        formik.touched.totalTime && formik.errors.totalTime
                          ? 'border-red-300 focus:ring-red-300'
                          : 'border-pink-100 focus:ring-pink-300'
                      } focus:outline-none focus:ring-2 focus:border-transparent`}
                    />
                    {formik.touched.totalTime && formik.errors.totalTime && (
                      <p className="mt-1 text-sm text-red-500">{formik.errors.totalTime}</p>
                    )}
                  </div>
                  
                  {/* Ingredients */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('ingredients')}
                    </label>
                    <textarea
                      name="ingredientsString"
                      rows="6"
                      value={formik.values.ingredients.join('\n')}
                      onChange={(e) => {
                        const ingredients = e.target.value.split('\n').filter(line => line.trim());
                        formik.setFieldValue('ingredients', ingredients);
                        formik.setFieldValue('ingredientsString', e.target.value);
                      }}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 rounded-xl bg-pink-50 shadow-inner ${
                        formik.touched.ingredients && formik.errors.ingredients
                          ? 'border-red-300 focus:ring-red-300'
                          : 'border-pink-100 focus:ring-pink-300'
                      } focus:outline-none focus:ring-2 focus:border-transparent`}
                      placeholder={t('ingredients_placeholder')}
                    ></textarea>
                    <p className="mt-1 text-xs text-gray-500">{t('ingredients_hint')}</p>
                    {formik.touched.ingredients && formik.errors.ingredients && (
                      <p className="mt-1 text-sm text-red-500">{formik.errors.ingredients}</p>
                    )}
                  </div>
                  
                  {/* Instructions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('instructions')}
                    </label>
                    <textarea
                      name="instructionsString"
                      rows="6"
                      value={formik.values.instructions.join('\n')}
                      onChange={(e) => {
                        const instructions = e.target.value.split('\n').filter(line => line.trim());
                        formik.setFieldValue('instructions', instructions);
                        formik.setFieldValue('instructionsString', e.target.value);
                      }}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 rounded-xl bg-pink-50 shadow-inner ${
                        formik.touched.instructions && formik.errors.instructions
                          ? 'border-red-300 focus:ring-red-300'
                          : 'border-pink-100 focus:ring-pink-300'
                      } focus:outline-none focus:ring-2 focus:border-transparent`}
                      placeholder={t('instructions_placeholder')}
                    ></textarea>
                    <p className="mt-1 text-xs text-gray-500">{t('instructions_hint')}</p>
                    {formik.touched.instructions && formik.errors.instructions && (
                      <p className="mt-1 text-sm text-red-500">{formik.errors.instructions}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-pink-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-pink-200 rounded-xl text-pink-500 hover:bg-pink-100 transition-colors shadow-sm"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-pink-400 to-rose-500 text-white rounded-xl hover:from-pink-500 hover:to-rose-600 shadow-md transition-all duration-300"
                >
                  {loading ? t('saving') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {moderationModal && (
  <div className="fixed inset-0 bg-pink-500/20 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-pink-100">
      <div className="px-6 py-4 border-b border-pink-100">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <FaCheckCircle className="text-pink-500 mr-2" />
          {t('moderate_recipe')}
        </h3>
      </div>
      
      <div className="p-6">
        <div className="mb-4 bg-pink-50 p-4 rounded-xl border border-pink-100">
          <h4 className="font-medium text-gray-800">{moderationRecipe?.title}</h4>
          <p className="text-sm text-gray-500 mt-1">{moderationRecipe?.description}</p>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('status')}
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center p-2 bg-green-50 rounded-xl border border-green-100 cursor-pointer transition-colors hover:bg-green-100">
              <input
                type="radio"
                name="status"
                value="approved"
                checked={moderationStatus === 'approved'}
                onChange={() => setModerationStatus('approved')}
                className="form-radio h-4 w-4 text-green-500 focus:ring-green-400"
              />
              <span className="ml-2 text-sm text-green-700 font-medium">{t('approved')}</span>
            </label>
            <label className="inline-flex items-center p-2 bg-red-50 rounded-xl border border-red-100 cursor-pointer transition-colors hover:bg-red-100">
              <input
                type="radio"
                name="status"
                value="rejected"
                checked={moderationStatus === 'rejected'}
                onChange={() => setModerationStatus('rejected')}
                className="form-radio h-4 w-4 text-red-500 focus:ring-red-400"
              />
              <span className="ml-2 text-sm text-red-700 font-medium">{t('rejected')}</span>
            </label>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('moderation_note')}
          </label>
          <textarea
            value={moderationNote}
            onChange={(e) => setModerationNote(e.target.value)}
            rows="3"
            className="w-full px-4 py-3 rounded-xl bg-pink-50 shadow-inner border-pink-100 focus:ring-pink-300 focus:outline-none focus:ring-2 focus:border-transparent"
            placeholder={moderationStatus === 'rejected' ? t('rejection_reason') : t('moderation_note_placeholder')}
          ></textarea>
          {moderationStatus === 'rejected' && (
            <p className="mt-1 text-xs text-red-500">{t('rejection_reason_required')}</p>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={() => setModerationModal(false)}
            className="px-4 py-2 border border-pink-200 rounded-xl text-pink-500 hover:bg-pink-100 transition-colors shadow-sm"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleModerationSubmit}
            disabled={loading || (moderationStatus === 'rejected' && !moderationNote.trim())}
            className="px-4 py-2 bg-gradient-to-r from-pink-400 to-rose-500 text-white rounded-xl hover:from-pink-500 hover:to-rose-600 shadow-md transition-all duration-300 disabled:opacity-50 disabled:hover:from-pink-400 disabled:hover:to-rose-500"
          >
            {loading ? t('saving') : t('submit')}
          </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipesPage;