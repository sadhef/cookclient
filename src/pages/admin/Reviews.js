import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaTrash, FaSearch, FaCheck, FaTimes, FaUser, FaFilter, FaUtensils } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { getRecipes } from '../../services/recipeService';
import { getRecipeReviews } from '../../services/reviewService';
import AdminSidebar from './AdminSidebar';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const Reviews = () => {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Fallback method: fetch reviews from all recipes
  const fetchReviewsByRecipes = useCallback(async () => {
    try {
      setLoading(true);
      const allReviews = [];
      
      // If there are no recipes yet, return early
      if (recipes.length === 0) {
        setLoading(false);
        setReviews([]);
        return;
      }
      
      // Fetch reviews for each recipe
      for (const recipe of recipes) {
        if (recipe && recipe._id) {
          try {
            const recipeReviews = await getRecipeReviews(recipe._id);
            
            // Add recipe info to each review if not already there
            const reviewsWithRecipe = recipeReviews.map(review => {
              // If review already has recipe info, use it
              if (review.recipe && review.recipe._id && review.recipe.title) {
                return review;
              }
              
              // Otherwise add recipe info
              return {
                ...review,
                recipe: {
                  _id: recipe._id,
                  title: recipe.title
                }
              };
            });
            
            allReviews.push(...reviewsWithRecipe);
          } catch (error) {
            console.error(`Error fetching reviews for recipe ${recipe._id}:`, error);
          }
        }
      }
      
      // Sort reviews by date (newest first)
      allReviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      
      setReviews(allReviews);
    } catch (error) {
      console.error('Error fetching reviews by recipes:', error);
      toast.error(error || t('error_occurred'));
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [recipes, t]);
  
  // Fetch all reviews using the admin endpoint
  const fetchAllReviews = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to use the admin-specific endpoint to get all reviews
      const response = await api.get('/admin/reviews');
      
      if (response && response.data) {
        let reviewsData = [];
        if (Array.isArray(response.data)) {
          reviewsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          reviewsData = response.data.data;
        }
        
        setReviews(reviewsData);
      } else {
        console.error('Unexpected response format:', response);
        // Fallback to fetching reviews recipe by recipe
        await fetchReviewsByRecipes();
      }
    } catch (error) {
      console.error('Error fetching all reviews:', error);
      // Fallback to recipe-by-recipe approach if admin endpoint fails
      await fetchReviewsByRecipes();
    } finally {
      setLoading(false);
    }
  }, [fetchReviewsByRecipes]);
  
  // Fetch reviews for a specific recipe
  const fetchReviewsForRecipe = useCallback(async (recipeId) => {
    try {
      setLoading(true);
      
      // Use the service function instead of direct API call
      const recipeReviews = await getRecipeReviews(recipeId);
      
      // Get recipe info
      const recipe = recipes.find(r => r._id === recipeId);
      
      // Add recipe info to each review if needed
      const reviewsWithRecipe = recipeReviews.map(review => {
        // If review already has recipe info, use it
        if (review.recipe && review.recipe._id && review.recipe.title) {
          return review;
        }
        
        // Otherwise add recipe info
        return {
          ...review,
          recipe: {
            _id: recipeId,
            title: recipe?.title || 'Unknown Recipe'
          }
        };
      });
      
      setReviews(reviewsWithRecipe);
    } catch (error) {
      console.error('Error fetching reviews for recipe:', error);
      toast.error(error || t('error_occurred'));
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [recipes, t]);
  
  // Fetch recipes list
  const fetchRecipesList = useCallback(async () => {
    try {
      const response = await getRecipes({
        limit: 100,
        sort: 'title'
      });
      
      if (response && response.data) {
        setRecipes(Array.isArray(response.data) ? response.data : []);
      } else {
        console.error('Unexpected response format from getRecipes:', response);
        setRecipes([]);
      }
    } catch (error) {
      console.error('Error fetching recipes list:', error);
      toast.error(error || t('error_occurred'));
      setRecipes([]);
    }
  }, [t]);
  
  // Fetch recipes list on component mount
  useEffect(() => {
    fetchRecipesList();
  }, [fetchRecipesList]);
  
  // Fetch reviews when recipes are loaded or selection changes
  useEffect(() => {
    if (recipes.length > 0) {
      if (selectedRecipe) {
        fetchReviewsForRecipe(selectedRecipe);
      } else {
        fetchAllReviews();
      }
    }
  }, [selectedRecipe, fetchReviewsForRecipe, fetchAllReviews, recipes.length]);
  
  const handleDeleteConfirm = (review) => {
    setConfirmDelete(review);
  };
  
  const handleDeleteCancel = () => {
    setConfirmDelete(null);
  };
  
  const handleDeleteConfirmed = async () => {
    try {
      setLoading(true);
      
      // Call API to delete the review
      await api.delete(`/reviews/${confirmDelete._id}`);
      
      // Remove from state
      setReviews(reviews.filter(review => review._id !== confirmDelete._id));
      setConfirmDelete(null);
      
      toast.success(t('review_deleted'));
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error(error || t('error_occurred'));
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  const filteredReviews = reviews.filter(review => {
    if (!review) return false;
    
    const comment = review.comment || '';
    const recipeName = review.recipe?.title || '';
    const userName = review.user?.name || '';
    
    const searchLower = searchTerm.toLowerCase();
    return (
      comment.toLowerCase().includes(searchLower) ||
      recipeName.toLowerCase().includes(searchLower) ||
      userName.toLowerCase().includes(searchLower)
    );
  });

  // Star rating component
  const StarRating = ({ rating }) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <FaStar 
            key={i} 
            className={i < rating ? "text-yellow-400" : "text-gray-300"} 
            size={16}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating}/5</span>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="pb-6">
        {/* Page header */}
        <div className="bg-white shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaStar className="text-primary mr-3" />
            {t('manage_reviews')}
          </h1>
        </div>
        
        {/* Search and filters */}
        <div className="px-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder={t('search_reviews')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="md:w-auto w-full flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaFilter className="text-gray-500" />
                <span>{t('filters')}</span>
              </button>
            </div>
            
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('filter_by_recipe')}
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      value={selectedRecipe}
                      onChange={(e) => setSelectedRecipe(e.target.value)}
                    >
                      <option value="">{t('all_recipes')}</option>
                      {recipes.map(recipe => (
                        <option key={recipe._id} value={recipe._id}>
                          {recipe.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Reviews list */}
        <div className="px-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchTerm || selectedRecipe ? t('no_matching_reviews') : t('no_reviews')}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredReviews.map((review, index) => {
                  if (!review || !review._id) return null;
                  
                  const recipeName = review.recipe?.title || 'Unknown Recipe';
                  const recipeId = review.recipe?._id || '';
                  const userName = review.user?.name || 'Unknown User';
                  const comment = review.comment || t('no_comment');
                  
                  return (
                    <div key={review._id || `review-${index}`} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            {review.user?.avatar ? (
                              <img 
                                src={review.user.avatar} 
                                alt={userName}
                                className="w-full h-full rounded-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/default-avatar.jpg';
                                }}
                              />
                            ) : (
                              <FaUser className="text-gray-500" />
                            )}
                          </div>
                          
                          <div>
                            <h3 className="font-medium text-gray-900">{userName}</h3>
                            <p className="text-sm text-gray-500 mb-1">
                              {review.createdAt ? formatDate(review.createdAt) : t('unknown_date')}
                            </p>
                            
                            <div className="mb-2">
                              <StarRating rating={review.rating || 0} />
                            </div>
                            
                            <div className="mb-3">
                              {recipeId ? (
                                <Link
                                  to={`/recipes/${recipeId}`}
                                  className="inline-flex items-center text-primary hover:underline"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <FaUtensils className="mr-1" size={14} />
                                  <span>{recipeName}</span>
                                </Link>
                              ) : (
                                <span className="text-gray-700">{recipeName}</span>
                              )}
                            </div>
                            
                            <p className="text-gray-700">{comment}</p>
                          </div>
                        </div>
                        
                        <div>
                          {confirmDelete && confirmDelete._id === review._id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={handleDeleteConfirmed}
                                className="text-white bg-red-500 hover:bg-red-600 rounded-full p-2 transition-colors"
                                title={t('confirm_delete')}
                              >
                                <FaCheck size={14} />
                              </button>
                              <button
                                onClick={handleDeleteCancel}
                                className="text-white bg-gray-400 hover:bg-gray-500 rounded-full p-2 transition-colors"
                                title={t('cancel')}
                              >
                                <FaTimes size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDeleteConfirm(review)}
                              className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                              title={t('delete_review')}
                            >
                              <FaTrash size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;