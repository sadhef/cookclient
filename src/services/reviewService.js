import api, { safeApiCall } from '../utils/api';

const REVIEWS_ENDPOINT = '/reviews';

// Get reviews for a recipe with enhanced error handling
export const getRecipeReviews = async (recipeId) => {
  try {
    console.log(`Fetching reviews for recipe ${recipeId}`);
    const response = await api.get(`/recipes/${recipeId}/reviews`);
    
    // Check response structure and return appropriate data
    if (response && response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    }
    
    // Default to empty array if response format is unexpected
    console.warn('Unexpected response format from getRecipeReviews:', response);
    return [];
  } catch (error) {
    console.error(`Error getting reviews for recipe ${recipeId}:`, error);
    // Return empty array instead of throwing error for better error handling
    return [];
  }
};

// Get a single review
export const getReview = async (id) => {
  try {
    const response = await api.get(`${REVIEWS_ENDPOINT}/${id}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error getting review:', error);
    throw error.response?.data?.error || 'Failed to fetch review';
  }
};

// Add a review to a recipe
export const addReview = async (recipeId, reviewData) => {
  try {
    const response = await api.post(`/recipes/${recipeId}/reviews`, reviewData);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error adding review:', error);
    throw error.response?.data?.error || 'Failed to add review';
  }
};

// Update a review
export const updateReview = async (id, reviewData) => {
  try {
    const response = await api.put(`${REVIEWS_ENDPOINT}/${id}`, reviewData);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error updating review:', error);
    throw error.response?.data?.error || 'Failed to update review';
  }
};

// Delete a review
export const deleteReview = async (id) => {
  try {
    const response = await api.delete(`${REVIEWS_ENDPOINT}/${id}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error.response?.data?.error || 'Failed to delete review';
  }
};

// Get user's reviews
export const getUserReviews = async () => {
  try {
    const response = await api.get('/users/me/reviews');
    
    // Handle different response formats
    if (response && response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    }
    
    // Log warning and return empty array if unexpected format
    console.warn('Unexpected response format from getUserReviews:', response);
    return [];
  } catch (error) {
    console.error('Error getting user reviews:', error);
    // Return empty array for better error handling
    return [];
  }
};

// Get all reviews (admin function)
export const getAllReviews = async () => {
  try {
    console.log('Calling getAllReviews in reviewService');
    // Use the admin endpoint to fetch all reviews
    const response = await api.get('/admin/reviews');
    
    // Handle different response formats
    if (response && response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    }
    
    console.warn('Unexpected response format from getAllReviews:', response);
    return [];
  } catch (error) {
    console.error('Error getting all reviews:', error);
    return [];
  }
};

// Safe versions
export const getSafeRecipeReviews = async (recipeId, fallbackData = []) => {
  return safeApiCall(() => getRecipeReviews(recipeId), fallbackData);
};