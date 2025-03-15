// Enhanced RecipeCard.js component to better display ingredients matching

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaClock, FaStar, FaHeart, FaRegHeart, FaCheckCircle, FaSearch, FaBan } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { addToFavorites, removeFromFavorites } from '../../services/recipeService';
import { toast } from 'react-toastify';

// Fallback default image path in public folder
const DEFAULT_RECIPE_IMAGE = '/default-recipe.jpg';

const RecipeCard = ({ 
  recipe, 
  refreshFavorites, 
  showSimilarityScore = false,
  searchIngredients = [],
  excludedIngredients = []
}) => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  
  // Use local state to avoid UI flicker when toggling favorites
  const [isFavLoading, setIsFavLoading] = useState(false);
  const [isFavoriteLocal, setIsFavoriteLocal] = useState(
    user?.favorites?.includes(recipe?._id)
  );
  
  // Determine if recipe is in user's favorites
  const isFavorite = isFavoriteLocal || user?.favorites?.includes(recipe?._id);
  
  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.info(t('login_required'));
      return;
    }
    
    if (!recipe || !recipe._id) {
      console.error('Invalid recipe object:', recipe);
      toast.error(t('error_occurred'));
      return;
    }
    
    try {
      setIsFavLoading(true);
      
      if (isFavorite) {
        await removeFromFavorites(recipe._id);
        toast.success(t('removed_from_favorites'));
        setIsFavoriteLocal(false);
      } else {
        await addToFavorites(recipe._id);
        toast.success(t('added_to_favorites'));
        setIsFavoriteLocal(true);
      }
      
      // Only call refreshFavorites if it exists and after a small delay
      // to avoid UI flicker
      if (typeof refreshFavorites === 'function') {
        setTimeout(() => {
          refreshFavorites();
        }, 300);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      // Customize error message
      if (error?.includes?.('already in favorites')) {
        toast.info(t('already_in_favorites'));
      } else if (error?.includes?.('not in favorites')) {
        toast.info(t('not_in_favorites'));
      } else {
        toast.error(error || t('error_occurred'));
      }
    } finally {
      setIsFavLoading(false);
    }
  };
  
  // If recipe is invalid, don't render anything
  if (!recipe || !recipe._id) {
    return null;
  }
  
  // Format similarity score as percentage if it exists
  const similarityScoreFormatted = recipe.similarityScore !== undefined 
    ? `${Math.round(recipe.similarityScore * 100)}%` 
    : null;
  
  // Ensure nutrition properties are valid
  const calories = recipe.nutrition?.calories?.value || 0;
  const protein = recipe.nutrition?.protein?.value || 0;
  const carbs = recipe.nutrition?.carbs?.value || 0;
  
  // Highlight matching ingredients if search ingredients provided
  const getHighlightedIngredients = () => {
    if (!searchIngredients || searchIngredients.length === 0 || !recipe.ingredients) {
      return null;
    }
    
    // Find matches between search ingredients and recipe ingredients
    const normalizedSearchIngredients = searchIngredients.map(ing => 
      ing.toLowerCase().trim()
    );
    
    const matchingIngredients = recipe.ingredients.filter(ing => {
      const normalizedIng = ing.toLowerCase().trim();
      return normalizedSearchIngredients.some(searchIng => 
        normalizedIng.includes(searchIng) || 
        searchIng.includes(normalizedIng)
      );
    });
    
    if (matchingIngredients.length === 0) {
      return null;
    }
    
    // Return max 3 matching ingredients
    return (
      <div className="mt-2 px-2 py-1 bg-green-50 rounded-md border border-green-100">
        <p className="text-xs text-green-700 font-medium flex items-center">
          <FaSearch className="mr-1 text-green-500" size={10} />
          {t('matching_ingredients')}:
        </p>
        <p className="text-xs text-green-800 truncate">
          {matchingIngredients.slice(0, 3).join(', ')}
          {matchingIngredients.length > 3 ? `, +${matchingIngredients.length - 3} more` : ''}
        </p>
      </div>
    );
  };
  
  // Highlight excluded ingredients/allergens if provided
  const getHighlightedAllergens = () => {
    if (!excludedIngredients || excludedIngredients.length === 0 || !recipe.ingredients) {
      return null;
    }
    
    // Find any ingredients that might contain allergens despite filtering
    // This helps users double-check for potential cross-contamination
    const possibleAllergens = recipe.ingredients.filter(ing => {
      const normalizedIng = ing.toLowerCase().trim();
      return excludedIngredients.some(allergen => 
        normalizedIng.includes(allergen.toLowerCase())
      );
    });
    
    if (possibleAllergens.length === 0) {
      // No allergens found in this recipe
      return (
        <div className="mt-2 px-2 py-1 bg-green-50 rounded-md border border-green-100">
          <p className="text-xs text-green-700 font-medium flex items-center">
            <FaCheckCircle className="mr-1 text-green-500" size={10} />
            {t('allergen_free')}
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <Link to={`/recipes/${recipe._id}`} className="block">
        <div className="relative h-48">
          <img 
            src={recipe.image || DEFAULT_RECIPE_IMAGE} 
            alt={recipe.title || 'Recipe'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_RECIPE_IMAGE;
            }}
          />
          
          {/* Recipe Time */}
          <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full text-sm flex items-center">
            <FaClock className="text-primary mr-1" />
            <span>{recipe.totalTime || '30 min'}</span>
          </div>
          
          {/* Rating Badge */}
          <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full text-sm flex items-center">
            <FaStar className="text-yellow-500 mr-1" />
            <span>{(recipe.averageRating || 0).toFixed(1)}</span>
            <span className="text-gray-500 ml-1">({recipe.ratingCount || 0})</span>
          </div>
          
          {/* Similarity Score (if present) */}
          {showSimilarityScore && similarityScoreFormatted && (
            <div className="absolute bottom-2 left-2 bg-primary/90 text-white px-2 py-1 rounded-full text-sm flex items-center">
              <FaCheckCircle className="mr-1" />
              <span>Match: {similarityScoreFormatted}</span>
            </div>
          )}
          
          {/* Suggested Recipe Tag */}
          {recipe.isSuggested && (
            <div className="absolute bottom-2 left-2 bg-yellow-500/80 text-white px-2 py-1 rounded-full text-sm">
              {t('suggested')}
            </div>
          )}
          
          {/* Favorite Button */}
          {isAuthenticated && (
            <button
              onClick={handleToggleFavorite}
              disabled={isFavLoading}
              className={`absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm p-2 rounded-full text-lg transition-colors ${
                isFavLoading ? 'opacity-50' : ''
              }`}
            >
              {isFavorite ? (
                <FaHeart className="text-red-500" />
              ) : (
                <FaRegHeart className="text-gray-700 hover:text-red-500" />
              )}
            </button>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
            {recipe.title || 'Untitled Recipe'}
          </h3>
          
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {recipe.description || 'No description available.'}
          </p>
          
          {/* Display matching ingredients if searching */}
          {getHighlightedIngredients()}
          
          {/* Display allergen information if applicable */}
          {getHighlightedAllergens()}
          
          <div className="flex justify-between items-center mt-3">
            {/* Nutrition Overview */}
            <div className="flex space-x-3 text-xs">
              <div className="flex flex-col items-center">
                <span className="font-semibold">{Math.round(calories)}</span>
                <span className="text-gray-500">{t('calories')}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-semibold">{Math.round(protein)}g</span>
                <span className="text-gray-500">{t('protein')}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-semibold">{Math.round(carbs)}g</span>
                <span className="text-gray-500">{t('carbs')}</span>
              </div>
            </div>
            
            {/* View Button */}
            <span className="text-primary text-sm font-medium">
              {t('View Recipe')} →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default RecipeCard;