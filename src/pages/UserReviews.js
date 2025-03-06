import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaEdit, FaTrash, FaHeart, FaUtensils, FaCommentAlt, FaSadTear, FaMagic } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { getUserReviews, updateReview, deleteReview } from '../services/reviewService';
import { toast } from 'react-toastify';

const UserReviews = () => {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [editFormData, setEditFormData] = useState({
    rating: 5,
    comment: ''
  });
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await getUserReviews();
        
        // Check if response is an array
        if (Array.isArray(response)) {
          setReviews(response);
          if (response.length > 0) {
            // Show animation if there are reviews
            setShowAnimation(true);
            setTimeout(() => setShowAnimation(false), 1500);
          }
        } else if (response && response.data && Array.isArray(response.data)) {
          // If response has a data property that's an array
          setReviews(response.data);
          if (response.data.length > 0) {
            // Show animation if there are reviews
            setShowAnimation(true);
            setTimeout(() => setShowAnimation(false), 1500);
          }
        } else {
          // Fallback to empty array if response structure is unexpected
          console.error('Unexpected response format from getUserReviews:', response);
          setReviews([]);
        }
      } catch (error) {
        console.error('Error fetching user reviews:', error);
        toast.error(error || t('error_occurred'));
        setReviews([]); // Ensure reviews is always an array
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [t]);

  const handleEditClick = (review) => {
    setEditingReview(review);
    setEditFormData({
      rating: review.rating,
      comment: review.comment
    });
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setEditFormData({
      rating: 5,
      comment: ''
    });
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm(t('delete_review_confirm'))) {
      try {
        await deleteReview(reviewId);
        setReviews(reviews.filter(review => review._id !== reviewId));
        toast.success(t('review_deleted'));
      } catch (error) {
        console.error('Error deleting review:', error);
        toast.error(error || t('error_occurred'));
      }
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (editFormData.comment.trim().length < 5) {
        toast.error(t('review_min_length'));
        return;
      }

      const updatedReview = await updateReview(editingReview._id, editFormData);
      
      // Check if updatedReview is valid
      if (updatedReview && updatedReview._id) {
        setReviews(reviews.map(review => 
          review._id === updatedReview._id ? updatedReview : review
        ));
        
        setEditingReview(null);
        toast.success(t('review_updated'));
      } else {
        throw new Error('Invalid review data returned from server');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error(error || t('error_occurred'));
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

  return (
    <div className="min-h-screen bg-rose-50 py-12">
      {/* Animation when reviews are loaded */}
      {showAnimation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-float-up-and-fade">
            <FaCommentAlt className="text-pink-500" size={80} />
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
        <div className="flex items-center justify-center mb-10">
          <div className="bg-pink-100 p-3 rounded-full mr-3">
            <FaCommentAlt className="text-pink-500 text-xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 font-cursive">{t('my_reviews')}</h1>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500 mb-4"></div>
            <p className="text-pink-500 font-medium">{t('loading_reviews')}</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-xl border border-pink-100">
            <div className="mb-6 flex justify-center">
              <div className="bg-pink-50 p-4 rounded-full">
                <FaSadTear className="text-pink-400 text-4xl" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 font-cursive">{t('no_reviews_yet')}</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{t('no_reviews_message')}</p>
            <Link 
              to="/search"
              className="bg-gradient-to-r from-pink-400 to-rose-500 text-white px-8 py-3 rounded-full hover:from-pink-500 hover:to-rose-600 transition-all duration-300 shadow-md inline-flex items-center"
            >
              <FaUtensils className="mr-2" />
              <span>{t('find_recipes_to_review')}</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map(review => {
              // Skip invalid reviews that don't have required properties
              if (!review || !review._id) {
                return null;
              }
              
              // Check if recipe exists and has required properties
              const hasValidRecipe = review.recipe && review.recipe._id && review.recipe.title;
              
              return (
                <div key={review._id} className="bg-white rounded-3xl shadow-lg overflow-hidden border border-pink-100 transform hover:scale-102 transition-all duration-300">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-6">
                      <div className="mb-4 md:mb-0">
                        {hasValidRecipe ? (
                          <Link to={`/recipes/${review.recipe._id}`} className="text-xl font-semibold text-pink-500 hover:text-pink-600 flex items-center">
                            <FaUtensils className="mr-2 text-pink-400" />
                            {review.recipe.title}
                          </Link>
                        ) : (
                          <span className="text-xl font-semibold text-gray-500 italic flex items-center">
                            <FaUtensils className="mr-2 text-gray-400" />
                            {t('deleted_recipe')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 bg-pink-50 px-4 py-2 rounded-full">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                              key={star}
                              className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}
                              size={18}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {review.createdAt ? formatDate(review.createdAt) : t('unknown_date')}
                        </span>
                      </div>
                    </div>
                    
                    {editingReview && editingReview._id === review._id ? (
                      <div className="mt-4 bg-pink-50 p-6 rounded-2xl">
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2 font-medium">{t('your_rating')}</label>
                          <div className="flex items-center space-x-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEditFormData({ ...editFormData, rating: star })}
                                className="focus:outline-none transform hover:scale-110 transition-transform duration-300"
                              >
                                <FaStar
                                  size={24}
                                  className={`${
                                    star <= editFormData.rating ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2 font-medium">{t('your_comment')}</label>
                          <textarea
                            rows="4"
                            className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent shadow-sm"
                            value={editFormData.comment}
                            onChange={(e) => setEditFormData({ ...editFormData, comment: e.target.value })}
                            placeholder={t('your_comment')}
                          ></textarea>
                        </div>
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={handleSaveEdit}
                            className="bg-gradient-to-r from-pink-400 to-rose-500 text-white py-2 px-6 rounded-full hover:from-pink-500 hover:to-rose-600 shadow-md transition-all duration-300 flex items-center"
                          >
                            <FaMagic className="mr-2" />
                            {t('save')}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-white text-gray-700 py-2 px-6 rounded-full hover:bg-gray-100 border border-gray-200 shadow-sm transition-all duration-300"
                          >
                            {t('cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-pink-50 p-6 rounded-2xl mb-4 relative">
                          <div className="absolute -top-3 -left-3 transform rotate-12 text-pink-300">
                            <FaCommentAlt size={20} />
                          </div>
                          <p className="text-gray-700">{review.comment || t('no_comment')}</p>
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => handleEditClick(review)}
                            className="flex items-center space-x-1 text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-2 rounded-full transition-colors"
                            aria-label={t('edit_review')}
                          >
                            <FaEdit />
                            <span className="text-sm ml-1">{t('edit')}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="flex items-center space-x-1 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors"
                            aria-label={t('delete_review')}
                          >
                            <FaTrash />
                            <span className="text-sm ml-1">{t('delete')}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserReviews;