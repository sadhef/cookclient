import React, { useState } from 'react';
import { FaStar, FaUser, FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { updateReview, deleteReview } from '../../services/reviewService';
import { toast } from 'react-toastify';

const Review = ({ review, onUpdateReview, onDeleteReview }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editedReview, setEditedReview] = useState({
    rating: review.rating,
    comment: review.comment
  });

  // Check if review belongs to current user
  const isUserReview = user && review.user._id === user._id;

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditedReview({
      rating: review.rating,
      comment: review.comment
    });
  };

  const handleSaveEdit = async () => {
    try {
      if (editedReview.comment.trim().length < 5) {
        toast.error(t('review_min_length'));
        return;
      }

      setLoading(true);
      const updated = await updateReview(review._id, editedReview);
      onUpdateReview(updated);
      
      setEditing(false);
      toast.success(t('review_updated'));
    } catch (error) {
      toast.error(error || t('error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(t('delete_review_confirm'))) {
      try {
        setLoading(true);
        await deleteReview(review._id);
        onDeleteReview(review._id);
        
        toast.success(t('review_deleted'));
      } catch (error) {
        toast.error(error || t('error_occurred'));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="border-b border-gray-200 py-4 last:border-b-0">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
            {review.user.avatar ? (
              <img 
                src={review.user.avatar} 
                alt={review.user.name} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <FaUser className="text-gray-500" />
            )}
          </div>
          <div>
            <h4 className="font-medium text-gray-800">{review.user.name}</h4>
            <div className="flex items-center">
              <div className="flex mr-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`text-sm ${
                      star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-500 text-sm">
                {formatDate(review.createdAt)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Action buttons for user's own reviews */}
        {isUserReview && !editing && (
          <div className="flex space-x-2">
            <button 
              onClick={handleEdit}
              className="text-blue-500 hover:text-blue-700 p-1"
              aria-label={t('edit_review')}
            >
              <FaEdit />
            </button>
            <button 
              onClick={handleDelete}
              disabled={loading}
              className="text-red-500 hover:text-red-700 p-1"
              aria-label={t('delete_review')}
            >
              <FaTrash />
            </button>
          </div>
        )}
      </div>
      
      {/* Edit mode */}
      {editing ? (
        <div>
          <div className="mb-3">
            <label className="block text-gray-700 mb-1 text-sm">{t('your_rating')}</label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setEditedReview({ ...editedReview, rating: star })}
                  className="focus:outline-none"
                >
                  <FaStar
                    className={`text-lg ${
                      star <= editedReview.rating ? 'text-yellow-400' : 'text-gray-300'
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
              value={editedReview.comment}
              onChange={(e) => setEditedReview({ ...editedReview, comment: e.target.value })}
            ></textarea>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleSaveEdit}
              disabled={loading}
              className="bg-primary text-white py-1 px-3 rounded-md hover:bg-primary-dark text-sm"
            >
              {loading ? t('saving') : t('save')}
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
        <p className="text-gray-700 whitespace-pre-line">{review.comment}</p>
      )}
    </div>
  );
};

const ReviewList = ({ reviews, onUpdateReview, onDeleteReview }) => {
  const { t } = useLanguage();
  
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{t('no_reviews')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <Review 
          key={review._id} 
          review={review} 
          onUpdateReview={onUpdateReview}
          onDeleteReview={onDeleteReview}
        />
      ))}
    </div>
  );
};

export default ReviewList;