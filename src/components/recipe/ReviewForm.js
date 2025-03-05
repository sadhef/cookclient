import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FaStar } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { addReview, getRecipeReviews } from '../../services/reviewService';
import { toast } from 'react-toastify';

const ReviewForm = ({ recipeId, onReviewAdded }) => {
  const { t } = useLanguage();
  const [userReview, setUserReview] = useState(null);
  const [loading, setLoading] = useState(false);

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
        const newReview = await addReview(recipeId, values);
        onReviewAdded(newReview);
        
        toast.success(t('review_added'));
        formik.resetForm();
        setUserReview(newReview);
      } catch (error) {
        toast.error(error || t('error_occurred'));
      } finally {
        setLoading(false);
      }
    }
  });

  // If user already reviewed, show message
  if (userReview) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
        <p className="font-medium">{t('already_reviewed')}</p>
        <p className="text-sm">{t('already_reviewed_message')}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-8">
      <h4 className="text-lg font-semibold mb-4">{t('leave_review')}</h4>
      
      <form onSubmit={formik.handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">{t('your_rating')}</label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => formik.setFieldValue('rating', star)}
                className="focus:outline-none"
              >
                <FaStar
                  className={`text-xl ${
                    star <= formik.values.rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {formik.touched.rating && formik.errors.rating && (
            <p className="mt-1 text-sm text-red-500">{formik.errors.rating}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="comment" className="block text-gray-700 mb-2">
            {t('your_comment')}
          </label>
          <textarea
            id="comment"
            name="comment"
            rows="4"
            className={`w-full px-3 py-2 border ${
              formik.touched.comment && formik.errors.comment
                ? 'border-red-500'
                : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary`}
            placeholder={t('review_placeholder')}
            value={formik.values.comment}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          ></textarea>
          {formik.touched.comment && formik.errors.comment && (
            <p className="mt-1 text-sm text-red-500">{formik.errors.comment}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          {loading ? t('submitting') : t('submit_review')}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;