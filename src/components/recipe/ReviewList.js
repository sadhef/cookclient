import React, { useState } from 'react';
import { FaStar, FaUser, FaEdit, FaTrash, FaSave, FaTimes, FaQuoteRight, FaRegComment } from 'react-icons/fa';
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
    <div className="border-b border-pink-100 py-6 last:border-b-0 transition-all duration-300 hover:bg-pink-50/30">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mr-4 shadow-sm overflow-hidden">
            {review.user.avatar ? (
              <img 
                src={review.user.avatar} 
                alt={review.user.name} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <FaUser className="text-pink-500" size={24} />
            )}
          </div>
          <div>
            <h4 className="font-medium text-gray-800 text-lg">{review.user.name}</h4>
            <div className="flex items-center">
              <div className="flex mr-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`${
                      star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    size={16}
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
              className="text-pink-500 hover:bg-pink-100 p-2 rounded-full transition-colors"
              aria-label={t('edit_review')}
            >
              <FaEdit size={16} />
            </button>
            <button 
              onClick={handleDelete}
              disabled={loading}
              className="text-pink-500 hover:bg-pink-100 p-2 rounded-full transition-colors"
              aria-label={t('delete_review')}
            >
              <FaTrash size={16} />
            </button>
          </div>
        )}
      </div>
      
      {/* Edit mode */}
      {editing ? (
        <div className="ml-16 pl-2 border-l-2 border-pink-200 animate-fade-in">
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 text-sm font-medium">{t('your_rating')}</label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setEditedReview({ ...editedReview, rating: star })}
                  className="focus:outline-none transform hover:scale-110 transition-transform"
                >
                  <FaStar
                    className={`${
                      star <= editedReview.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    size={20}
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <textarea
              rows="3"
              className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 shadow-sm"
              value={editedReview.comment}
              onChange={(e) => setEditedReview({ ...editedReview, comment: e.target.value })}
            ></textarea>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleSaveEdit}
              disabled={loading}
              className="bg-gradient-to-r from-pink-400 to-rose-500 text-white py-2 px-4 rounded-full hover:from-pink-500 hover:to-rose-600 text-sm flex items-center space-x-1 shadow-sm transition-all duration-300"
            >
              <FaSave className="mr-1" />
              <span>{loading ? t('saving') : t('save')}</span>
            </button>
            <button
              onClick={handleCancelEdit}
              className="bg-gray-200 text-gray-700 py-2 px-4 rounded-full hover:bg-gray-300 text-sm flex items-center space-x-1 shadow-sm transition-all duration-300"
            >
              <FaTimes className="mr-1" />
              <span>{t('cancel')}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative pl-16 pr-8">
          <div className="text-gray-500 absolute left-4 top-0 opacity-20">
            <FaQuoteRight size={24} />
          </div>
          <p className="text-gray-700 whitespace-pre-line">{review.comment}</p>
        </div>
      )}
    </div>
  );
};

const ReviewList = ({ reviews, onUpdateReview, onDeleteReview }) => {
  const { t } = useLanguage();
  
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-pink-50 rounded-2xl text-pink-700 border border-pink-100 shadow-md">
        <div className="flex justify-center mb-4">
          <div className="bg-white p-3 rounded-full shadow-md">
            <FaRegComment className="text-pink-400" size={24} />
          </div>
        </div>
        <p className="font-cursive text-xl mb-2">{t('no_reviews')}</p>
        <p className="text-sm text-pink-600 max-w-md mx-auto">{t('be_first_reviewer')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-pink-100 overflow-hidden">
      <div className="divide-pink-100 divide-y">
        {reviews.map(review => (
          <Review 
            key={review._id} 
            review={review} 
            onUpdateReview={onUpdateReview}
            onDeleteReview={onDeleteReview}
          />
        ))}
      </div>
    </div>
  );
};

export default ReviewList;