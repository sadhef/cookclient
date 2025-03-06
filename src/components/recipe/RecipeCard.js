import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaClock, FaStar, FaHeart, FaRegHeart, FaCheckCircle, FaUtensils } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { addToFavorites, removeFromFavorites } from '../../services/recipeService';
import { toast } from 'react-toastify';

// Fallback default image path in public folder
const DEFAULT_RECIPE_IMAGE = '/default-recipe.jpg';

const RecipeCard = ({ recipe, refreshFavorites, showSimilarityScore = false }) => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  
  // Use local state to avoid UI flicker when toggling favorites
  const [isFavLoading, setIsFavLoading] = useState(false);
  const [isFavoriteLocal, setIsFavoriteLocal] = useState(
    user?.favorites?.includes(recipe?._id)
  );
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  
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
        // Show heart animation when adding to favorites
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 1000);
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
  
  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-pink-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 relative">
      {/* Heart animation when adding to favorites */}
      {showHeartAnimation && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="animate-float-up-and-fade">
            <FaHeart className="text-pink-500" size={50} />
          </div>
        </div>
      )}
      
      <Link to={`/recipes/${recipe._id}`} className="block">
        <div className="relative h-56 overflow-hidden">
          <img 
            src={recipe.image || DEFAULT_RECIPE_IMAGE} 
            alt={recipe.title || 'Recipe'}
            className="w-full h-full object-cover transform hover:scale-110 transition-all duration-700"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_RECIPE_IMAGE;
            }}
          />
          
          {/* Gradient overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          
          {/* Recipe Time */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm flex items-center shadow-md">
            <FaClock className="text-pink-400 mr-1.5" />
            <span className="text-gray-700 font-medium">{recipe.totalTime || '30 min'}</span>
          </div>
          
          {/* Rating Badge */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm flex items-center shadow-md">
            <FaStar className="text-yellow-500 mr-1.5" />
            <span className="text-gray-700 font-medium">{(recipe.averageRating || 0).toFixed(1)}</span>
            <span className="text-gray-500 ml-1">({recipe.ratingCount || 0})</span>
          </div>
          
          {/* Recipe Title (overlay on image) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="text-xl font-bold mb-1 line-clamp-1 drop-shadow-md font-cursive">
              {recipe.title || 'Untitled Recipe'}
            </h3>
          </div>
          
          {/* Similarity Score (if present) */}
          {showSimilarityScore && similarityScoreFormatted && (
            <div className="absolute bottom-14 left-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white px-3 py-1.5 rounded-full text-sm flex items-center shadow-md">
              <FaCheckCircle className="mr-1.5" />
              <span>Match: {similarityScoreFormatted}</span>
            </div>
          )}
          
          {/* Suggested Recipe Tag */}
          {recipe.isSuggested && (
            <div className="absolute bottom-14 left-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-3 py-1.5 rounded-full text-sm shadow-md flex items-center">
              <FaUtensils className="mr-1.5" />
              <span>{t('suggested')}</span>
            </div>
          )}
          
          {/* Favorite Button */}
          {isAuthenticated && (
            <button
              onClick={handleToggleFavorite}
              disabled={isFavLoading}
              className={`absolute bottom-3 right-3 p-3 rounded-full text-lg transition-all duration-300 shadow-md ${
                isFavorite 
                  ? 'bg-pink-500 text-white transform hover:scale-110' 
                  : 'bg-white/90 hover:bg-pink-100 text-pink-500 backdrop-blur-sm'
              } ${isFavLoading ? 'opacity-50' : ''}`}
            >
              {isFavorite ? (
                <FaHeart className="transform hover:scale-110 transition-transform" />
              ) : (
                <FaRegHeart className="transform hover:scale-110 transition-transform" />
              )}
            </button>
          )}
        </div>
        
        <div className="p-5">
          <p className="text-gray-600 text-sm line-clamp-2 mb-4 min-h-[40px]">
            {recipe.description || 'No description available.'}
          </p>
          
          <div className="flex justify-between items-end">
            {/* Nutrition Overview */}
            <div className="flex space-x-4 text-xs">
              <div className="flex flex-col items-center bg-pink-50 px-2 py-1.5 rounded-lg">
                <span className="font-bold text-pink-500">{Math.round(calories)}</span>
                <span className="text-gray-500">{t('calories')}</span>
              </div>
              <div className="flex flex-col items-center bg-pink-50 px-2 py-1.5 rounded-lg">
                <span className="font-bold text-pink-500">{Math.round(protein)}g</span>
                <span className="text-gray-500">{t('protein')}</span>
              </div>
              <div className="flex flex-col items-center bg-pink-50 px-2 py-1.5 rounded-lg">
                <span className="font-bold text-pink-500">{Math.round(carbs)}g</span>
                <span className="text-gray-500">{t('carbs')}</span>
              </div>
            </div>
            
            {/* View Button */}
            <span className="text-pink-500 font-medium text-sm bg-pink-50 px-3 py-1.5 rounded-full hover:bg-pink-100 transition-colors">
              {t('view_recipe')} →
            </span>
          </div>
        </div>
      </Link>
      
    </div>
  );
};

export default RecipeCard;