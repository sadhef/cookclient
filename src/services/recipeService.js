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
    
    // Deduplicate recipes to prevent showing the same recipe twice
    if (response.data && response.data.data) {
      const uniqueRecipes = deduplicateRecipes(Array.isArray(response.data.data) ? response.data.data : []);
      return { 
        ...response.data, 
        data: uniqueRecipes,
        count: uniqueRecipes.length
      };
    }
    
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
    console.log('Categories:', results.categories);
    
    // Deduplicate recipes to prevent showing the same recipe twice
    recipesFound = deduplicateRecipes(recipesFound);
    
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
    
    // Return the complete results
    return {
      success: true,
      count: recipesFound.length,
      totalMatches: results.totalMatches || recipesFound.length,
      categories: results.categories,
      data: recipesFound
    };
  } catch (error) {
    console.error('Error searching recipes by ingredients:', error);
    
    // Return empty array as fallback
    return { 
      success: false,
      count: 0,
      data: [],
      error: error.response?.data?.error || 'Error searching recipes'
    };
  }
};

// Helper function to deduplicate recipes
const deduplicateRecipes = (recipes) => {
  // Return early if there are no recipes
  if (!recipes || recipes.length === 0) {
    return [];
  }

  // Use Map to keep track of unique recipes by title
  const uniqueRecipesMap = new Map();
  
  // Process each recipe
  recipes.forEach(recipe => {
    if (!recipe || !recipe.title) return;
    
    // Create a unique key from the recipe title (normalized to lowercase, trimmed)
    const key = recipe.title.toLowerCase().trim();
    
    // If we already have this recipe, only keep the one with the higher rating
    if (uniqueRecipesMap.has(key)) {
      const existingRecipe = uniqueRecipesMap.get(key);
      
      // Compare ratings and keep the higher-rated version
      if (recipe.averageRating > existingRecipe.averageRating) {
        uniqueRecipesMap.set(key, recipe);
      }
    } else {
      // First time seeing this recipe, add it to our map
      uniqueRecipesMap.set(key, recipe);
    }
  });
  
  // Convert the Map values back to an array
  return Array.from(uniqueRecipesMap.values());
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
    
    // Ensure we return the data array and deduplicate
    if (response && response.data) {
      if (Array.isArray(response.data)) {
        const uniqueRecipes = deduplicateRecipes(response.data);
        return { data: uniqueRecipes };
      } else if (response.data.data && Array.isArray(response.data.data)) {
        const uniqueRecipes = deduplicateRecipes(response.data.data);
        return { 
          data: uniqueRecipes, 
          count: uniqueRecipes.length 
        };
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