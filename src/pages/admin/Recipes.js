import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrash, FaSearch, FaCheck, FaTimes, FaFilter } from 'react-icons/fa';
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
  
  // Fetch recipes
  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      
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
  
  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('manage_recipes')}</h1>
        </div>
        
        {/* Search and Filter */}
        <div className="mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
              placeholder={t('search_recipes')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 flex items-center space-x-2 flex-shrink-0"
          >
            <FaFilter />
            <span>{t('filters')}</span>
          </button>
        </div>
        
        {/* Filters Panel */}
        {filtersOpen && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
            <h3 className="font-semibold text-gray-700 mb-4">{t('filter_recipes')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('status')}
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                >
                  <option value="all">{t('all')}</option>
                  <option value="pending">{t('pending')}</option>
                  <option value="approved">{t('approved')}</option>
                  <option value="rejected">{t('rejected')}</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t('reset')}
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                {t('apply_filters')}
              </button>
            </div>
          </div>
        )}
        
        {/* Recipes Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {loading && !recipes.length ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('title')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('rating')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status')}
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
                {filteredRecipes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      {searchTerm ? t('no_matching_recipes') : t('no_recipes')}
                    </td>
                  </tr>
                ) : (
                  filteredRecipes.map(recipe => (
                    <tr key={recipe._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              src={recipe.image || '/default-recipe.jpg'} 
                              alt={recipe.title}
                              className="h-10 w-10 rounded-full object-cover"
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
                          <span className="text-yellow-500 mr-1">★</span>
                          <span>{recipe.averageRating.toFixed(1)}</span>
                          <span className="text-gray-400 ml-1">({recipe.ratingCount})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          getStatusBadgeColor(recipe.status || 'pending')
                        }`}>
                          {recipe.status || t('pending')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(recipe.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {confirmDelete && confirmDelete._id === recipe._id ? (
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
                            <Link
                              to={`/recipes/${recipe._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <span className="sr-only">{t('view')}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            </Link>
                            
                            <button
                              onClick={() => handleModerate(recipe)}
                              className="text-purple-600 hover:text-purple-800"
                            >
                              <span className="sr-only">{t('moderate')}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            
                            <button
                              onClick={() => handleEdit(recipe)}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              <FaEdit />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteConfirm(recipe)}
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 flex justify-between items-center bg-gray-50">
              <div className="text-sm text-gray-500">
                {t('showing')} {recipes.length} {t('of')} {totalPages * 10} {t('recipes')}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                >
                  {t('previous')}
                </button>
                <span className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-gray-100">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                >
                  {t('next')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Recipe Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
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
                      className={`w-full px-3 py-2 border ${
                        formik.touched.title && formik.errors.title
                          ? 'border-red-500'
                          : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary`}
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
                      className={`w-full px-3 py-2 border ${
                        formik.touched.description && formik.errors.description
                          ? 'border-red-500'
                          : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary`}
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
                      className={`w-full px-3 py-2 border ${
                        formik.touched.totalTime && formik.errors.totalTime
                          ? 'border-red-500'
                          : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary`}
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
                      className={`w-full px-3 py-2 border ${
                        formik.touched.ingredients && formik.errors.ingredients
                          ? 'border-red-500'
                          : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary`}
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
                      className={`w-full px-3 py-2 border ${
                        formik.touched.instructions && formik.errors.instructions
                          ? 'border-red-500'
                          : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary`}
                      placeholder={t('instructions_placeholder')}
                    ></textarea>
                    <p className="mt-1 text-xs text-gray-500">{t('instructions_hint')}</p>
                    {formik.touched.instructions && formik.errors.instructions && (
                      <p className="mt-1 text-sm text-red-500">{formik.errors.instructions}</p>
                    )}
                  </div>
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
                  {loading ? t('saving') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Moderation Modal */}
      {moderationModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                {t('moderate_recipe')}
              </h3>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-medium text-gray-800">{moderationRecipe?.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{moderationRecipe?.description}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('status')}
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="approved"
                      checked={moderationStatus === 'approved'}
                      onChange={() => setModerationStatus('approved')}
                      className="form-radio h-4 w-4 text-primary"
                    />
                    <span className="ml-2 text-sm text-gray-700">{t('approved')}</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="rejected"
                      checked={moderationStatus === 'rejected'}
                      onChange={() => setModerationStatus('rejected')}
                      className="form-radio h-4 w-4 text-red-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">{t('rejected')}</span>
                  </label>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('moderation_note')}
                </label>
                <textarea
                  value={moderationNote}
                  onChange={(e) => setModerationNote(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder={moderationStatus === 'rejected' ? t('rejection_reason') : t('moderation_note_placeholder')}
                ></textarea>
                {moderationStatus === 'rejected' && (
                  <p className="mt-1 text-xs text-gray-500">{t('rejection_reason_required')}</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModerationModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleModerationSubmit}
                  disabled={loading || (moderationStatus === 'rejected' && !moderationNote.trim())}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
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