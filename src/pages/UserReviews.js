import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaEdit, FaTrash } from 'react-icons/fa';
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

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await getUserReviews();
        
        // Check if response is an array
        if (Array.isArray(response)) {
          setReviews(response);
        } else if (response && response.data && Array.isArray(response.data)) {
          // If response has a data property that's an array
          setReviews(response.data);
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('my_reviews')}</h1>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">{t('no_reviews_yet')}</h2>
            <p className="text-gray-600 mb-6">{t('no_reviews_message')}</p>
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
                <div key={review._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      {hasValidRecipe ? (
                        <Link to={`/recipes/${review.recipe._id}`} className="text-xl font-semibold text-primary hover:text-primary-dark">
                          {review.recipe.title}
                        </Link>
                      ) : (
                        <span className="text-xl font-semibold text-gray-500 italic">
                          {t('deleted_recipe')}
                        </span>
                      )}
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                              key={star}
                              className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {review.createdAt ? formatDate(review.createdAt) : t('unknown_date')}
                        </span>
                      </div>
                    </div>
                    
                    {editingReview && editingReview._id === review._id ? (
                      <div className="mt-4">
                        <div className="mb-3">
                          <label className="block text-gray-700 mb-1 text-sm">{t('your_rating')}</label>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEditFormData({ ...editFormData, rating: star })}
                                className="focus:outline-none"
                              >
                                <FaStar
                                  className={`text-lg ${
                                    star <= editFormData.rating ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <textarea
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            value={editFormData.comment}
                            onChange={(e) => setEditFormData({ ...editFormData, comment: e.target.value })}
                            placeholder={t('your_comment')}
                          ></textarea>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            className="bg-primary text-white py-1 px-3 rounded-md hover:bg-primary-dark text-sm"
                          >
                            {t('save')}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-200 text-gray-700 py-1 px-3 rounded-md hover:bg-gray-300 text-sm"
                          >
                            {t('cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-700 mb-4">{review.comment || t('no_comment')}</p>
                        
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditClick(review)}
                            className="text-blue-500 hover:text-blue-700 p-1"
                            aria-label={t('edit_review')}
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            aria-label={t('delete_review')}
                          >
                            <FaTrash />
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