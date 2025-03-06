import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FaStar, FaHeart, FaQuoteLeft, FaPaperPlane } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { addReview, getRecipeReviews } from '../../services/reviewService';
import { toast } from 'react-toastify';

const ReviewForm = ({ recipeId, onReviewAdded }) => {
  const { t } = useLanguage();
  const [userReview, setUserReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  // Check if user already reviewed this recipe
  useEffect(() => {
    const checkUserReview = async () => {
      try {
        const reviews = await getRecipeReviews(recipeId);
        const found = reviews.find(review => review.user._id === localStorage.getItem('userId'));
        
        if (found) {
          setUserReview(found);
        }
      } catch (error) {
        console.error('Error checking user review:', error);
      }
    };
    
    checkUserReview();
  }, [recipeId]);

  const formik = useFormik({
    initialValues: {
      rating: 5,
      comment: ''
    },
    validationSchema: Yup.object({
      rating: Yup.number()
        .required('Rating is required')
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating cannot be more than 5'),
      comment: Yup.string()
        .required('Comment is required')
        .min(5, 'Comment must be at least 5 characters')
        .max(500, 'Comment cannot exceed 500 characters')
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setShowAnimation(true);
        const newReview = await addReview(recipeId, values);
        onReviewAdded(newReview);
        
        toast.success(t('review_added'));
        formik.resetForm();
        setUserReview(newReview);
      } catch (error) {
        toast.error(error || t('error_occurred'));
      } finally {
        setLoading(false);
        setTimeout(() => setShowAnimation(false), 1000);
      }
    }
  });

  // If user already reviewed, show message
  if (userReview) {
    return (
      <div className="bg-pink-50 border border-pink-200 text-pink-700 px-6 py-4 rounded-2xl mb-6 shadow-md">
        <div className="flex items-center mb-2">
          <div className="bg-pink-100 p-2 rounded-full mr-3">
            <FaHeart className="text-pink-500" />
          </div>
          <p className="font-medium font-cursive text-lg">{t('already_reviewed')}</p>
        </div>
        <p className="text-sm ml-12">{t('already_reviewed_message')}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Success animation overlay */}
      {showAnimation && (
        <div className="absolute inset-0 bg-pink-500/20 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
          <div className="text-center">
            <div className="animate-float">
              <FaStar className="text-yellow-400 text-5xl mx-auto" />
            </div>
            <p className="text-pink-600 font-medium text-xl mt-4 font-cursive">
              {t('thanks_for_review')}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 border border-pink-100">
        <div className="flex items-center mb-6">
          <div className="bg-pink-100 p-3 rounded-full mr-3">
            <FaQuoteLeft className="text-pink-500" />
          </div>
          <h4 className="text-xl font-semibold text-gray-800 font-cursive">
            {t('leave_review')}
          </h4>
        </div>
        
        <form onSubmit={formik.handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 mb-3 font-medium">
              {t('your_rating')}
            </label>
            <div className="flex items-center space-x-2 bg-pink-50 p-4 rounded-2xl">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => formik.setFieldValue('rating', star)}
                  className="focus:outline-none transform hover:scale-125 transition-transform duration-300"
                >
                  <FaStar
                    size={28}
                    className={`${
                      star <= formik.values.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {formik.touched.rating && formik.errors.rating && (
              <p className="mt-2 text-sm text-pink-500 bg-pink-50 p-2 rounded-lg">
                {formik.errors.rating}
              </p>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="comment" className="block text-gray-700 mb-3 font-medium">
              {t('your_comment')}
            </label>
            <textarea
              id="comment"
              name="comment"
              rows="4"
              className={`w-full px-4 py-3 border ${
                formik.touched.comment && formik.errors.comment
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-pink-200'
              } rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-300 shadow-sm`}
              placeholder={t('review_placeholder')}
              value={formik.values.comment}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            ></textarea>
            {formik.touched.comment && formik.errors.comment && (
              <p className="mt-2 text-sm text-pink-500 bg-pink-50 p-2 rounded-lg">
                {formik.errors.comment}
              </p>
            )}
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-pink-400 to-rose-500 text-white py-3 px-6 rounded-full hover:from-pink-500 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 flex items-center space-x-2 shadow-md transform hover:scale-105 transition-all duration-300"
            >
              <span>{loading ? t('submitting') : t('submit_review')}</span>
              <FaPaperPlane />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;