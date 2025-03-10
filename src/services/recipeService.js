// client/src/services/recipeService.js
import api, { safeApiCall } from '../utils/api';

const RECIPES_ENDPOINT = '/recipes';

// Get all recipes with optional filters
export const getRecipes = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  // Add pagination params
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  
  // Add sort param
  if (params.sort) queryParams.append('sort', params.sort);
  
  // Add any other filter params
  Object.entries(params).forEach(([key, value]) => {
    if (!['page', 'limit', 'sort'].includes(key)) {
      queryParams.append(key, value);
    }
  });
  
  try {
    const response = await api.get(`${RECIPES_ENDPOINT}?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return { data: [], count: 0 };
  }
};

// Get a single recipe by ID
export const getRecipe = async (id) => {
  try {
    const response = await api.get(`${RECIPES_ENDPOINT}/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching recipe ${id}:`, error);
    throw error.response?.data?.error || 'Failed to fetch recipe';
  }
};

// Enhanced search for recipes by ingredients with similarity scoring
export const searchRecipesByIngredients = async (ingredients) => {
  try {
    let ingredientsArray = Array.isArray(ingredients) 
      ? ingredients 
      : ingredients.split(',').map(i => i.trim()).filter(Boolean);
    
    // If empty input, handle gracefully
    if (ingredientsArray.length === 0) {
      // Return popular recipes instead
      return await getRecipes({
        sort: '-averageRating',
        limit: 15
      });
    }
    
    // Make sure we're sending at least one ingredient
    const searchIngredient = ingredientsArray[0] || '';
    
    // If it's a single letter or very short term, just get popular recipes
    if (searchIngredient.length <= 1) {
      return await getRecipes({
        sort: '-averageRating',
        limit: 15
      });
    }
    
    // Send search request with ingredients
    console.log('Searching with ingredients:', ingredientsArray);
    const response = await api.post(`${RECIPES_ENDPOINT}/search`, { 
      ingredients: ingredientsArray 
    });
    
    // Log the response to help with debugging
    console.log('Search response:', response.data);
    
    let results = response.data;
    let recipesFound = Array.isArray(results.data) ? results.data : [];
    
    // Log how many recipes were found
    console.log(`Found ${recipesFound.length} recipes out of ${results.totalMatches} total matches`);
    
    // Sort recipes by similarity score if available
    if (recipesFound.length > 0 && recipesFound[0].similarityScore !== undefined) {
      // First separate exact matches from suggested recipes
      const exactMatches = recipesFound.filter(r => !r.isSuggested);
      const suggestedRecipes = recipesFound.filter(r => r.isSuggested);
      
      // Sort each group
      exactMatches.sort((a, b) => b.similarityScore - a.similarityScore);
      suggestedRecipes.sort((a, b) => b.averageRating - a.averageRating);
      
      // Combine them back
      recipesFound = [...exactMatches, ...suggestedRecipes];
    }
    
    // If we don't have enough recipes, try a broader search
    if (recipesFound.length < 5 && ingredientsArray.length >= 1) {
      console.log('Not enough results, trying a broader search');
      
      try {
        // Try searching with just partial terms from the first ingredient
        const words = ingredientsArray[0].split(' ');
        const searchWord = words.find(w => w.length > 3) || ingredientsArray[0];
        
        console.log('Trying broader search with:', searchWord);
        
        const fallbackResponse = await api.post(`${RECIPES_ENDPOINT}/search`, { 
          ingredients: [searchWord] 
        });
        
        console.log('Fallback response:', fallbackResponse.data);
        
        let fallbackRecipes = [];
        if (fallbackResponse?.data?.data && Array.isArray(fallbackResponse.data.data)) {
          fallbackRecipes = fallbackResponse.data.data;
        }
        
        // Add additional recipes that weren't in the original search
        if (fallbackRecipes.length > 0) {
          const existingIds = new Set(recipesFound.map(r => r._id));
          const additionalRecipes = fallbackRecipes.filter(r => !existingIds.has(r._id));
          
          // Add enough additional recipes to get to at least 15 total
          const neededRecipes = Math.max(0, 15 - recipesFound.length);
          const recipesToAdd = additionalRecipes.slice(0, neededRecipes);
          
          console.log(`Adding ${recipesToAdd.length} more recipes from fallback search`);
          
          // Mark these as suggested
          const flaggedRecipes = recipesToAdd.map(recipe => ({
            ...recipe,
            isSuggested: true
          }));
          
          recipesFound = [...recipesFound, ...flaggedRecipes];
          
          // Update result count
          results.count = recipesFound.length;
          results.data = recipesFound;
        }
      } catch (error) {
        console.error('Error in fallback search:', error);
      }
    }
    
    // Final fallback to popular recipes if still not enough
    if (recipesFound.length < 15) {
      console.log('Still not enough recipes, fetching popular recipes');
      
      try {
        const popularResponse = await getRecipes({
          sort: '-averageRating',
          limit: 15
        });
        
        if (popularResponse?.data && Array.isArray(popularResponse.data)) {
          const existingIds = new Set(recipesFound.map(r => r._id));
          const additionalRecipes = popularResponse.data.filter(r => !existingIds.has(r._id));
          
          // Add enough additional recipes to get to at least 15 total
          const neededRecipes = Math.max(0, 15 - recipesFound.length);
          const recipesToAdd = additionalRecipes.slice(0, neededRecipes);
          
          console.log(`Adding ${recipesToAdd.length} popular recipes as fallback`);
          
          // Mark these as suggested
          const suggestedRecipes = recipesToAdd.map(recipe => ({
            ...recipe,
            isSuggested: true
          }));
          
          recipesFound = [...recipesFound, ...suggestedRecipes];
          
          // Update result count
          results.count = recipesFound.length;
          results.data = recipesFound;
        }
      } catch (error) {
        console.error('Error fetching popular recipes:', error);
      }
    }
    
    console.log(`Final result: ${recipesFound.length} recipes`);
    return {
      success: true,
      count: recipesFound.length,
      data: recipesFound
    };
  } catch (error) {
    console.error('Error searching recipes by ingredients:', error);
    // Return empty array as fallback
    return { data: [], count: 0 };
  }
};

// Create a new recipe
export const createRecipe = async (recipeData) => {
  try {
    const response = await api.post(RECIPES_ENDPOINT, recipeData);
    return response.data;
  } catch (error) {
    console.error('Error creating recipe:', error);
    throw error.response?.data?.error || 'Failed to create recipe';
  }
};

// Update a recipe
export const updateRecipe = async (id, recipeData) => {
  try {
    const response = await api.put(`${RECIPES_ENDPOINT}/${id}`, recipeData);
    return response.data;
  } catch (error) {
    console.error(`Error updating recipe ${id}:`, error);
    throw error.response?.data?.error || 'Failed to update recipe';
  }
};

// Delete a recipe
export const deleteRecipe = async (id) => {
  try {
    const response = await api.delete(`${RECIPES_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting recipe ${id}:`, error);
    throw error.response?.data?.error || 'Failed to delete recipe';
  }
};

// Add recipe to favorites
export const addToFavorites = async (id) => {
  try {
    const response = await api.put(`${RECIPES_ENDPOINT}/${id}/favorite`);
    return response.data;
  } catch (error) {
    // Check if the error is "Recipe already in favorites"
    if (error.response?.data?.error === 'Recipe already in favorites') {
      // Just return success in this case
      return { success: true, message: 'Recipe is already in favorites' };
    }
    console.error(`Error adding recipe ${id} to favorites:`, error);
    throw error.response?.data?.error || 'Failed to add to favorites';
  }
};

// Remove recipe from favorites
export const removeFromFavorites = async (id) => {
  try {
    const response = await api.put(`${RECIPES_ENDPOINT}/${id}/unfavorite`);
    return response.data;
  } catch (error) {
    // Check if the error is "Recipe not in favorites"
    if (error.response?.data?.error === 'Recipe not in favorites') {
      // Just return success in this case
      return { success: true, message: 'Recipe was not in favorites' };
    }
    console.error(`Error removing recipe ${id} from favorites:`, error);
    throw error.response?.data?.error || 'Failed to remove from favorites';
  }
};

// Get user's favorite recipes
export const getFavorites = async () => {
  try {
    const response = await api.get('/users/me/favorites');
    
    // Ensure we return the data array
    if (response && response.data) {
      if (Array.isArray(response.data)) {
        return { data: response.data };
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return { data: response.data.data, count: response.data.count || response.data.data.length };
      }
    }
    
    // Fallback to empty array
    console.warn('Unexpected response format from getFavorites:', response);
    return { data: [] };
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return { data: [] };
  }
};

// Safe versions with fallback
export const getSafeRecipes = async (params = {}, fallbackData = { data: [], count: 0 }) => {
  return safeApiCall(() => getRecipes(params), fallbackData);
};

export const getSafeRecipe = async (id, fallbackData = null) => {
  return safeApiCall(() => getRecipe(id), fallbackData);
};