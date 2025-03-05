import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaClock, FaStar, FaHeart, FaRegHeart, FaMicrophone, FaMicrophoneSlash, FaUtensils } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getRecipe, addToFavorites, removeFromFavorites } from '../services/recipeService';
import { getRecipeReviews } from '../services/reviewService';
import { useVoiceControl } from '../services/voiceService';
import { calculateNutritionFallback } from '../services/nutritionService';
import ReviewForm from '../components/recipe/ReviewForm';
import ReviewList from '../components/recipe/ReviewList';
import { toast } from 'react-toastify';

const RecipeDetailsPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  
  const [recipe, setRecipe] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('ingredients');
  
  // Initialize voice control
  const {
    isListening,
    voiceResponse,
    currentStep,
    toggleVoiceControl
  } = useVoiceControl(recipe);

  // Fetch recipe and reviews
  useEffect(() => {
    const fetchRecipeData = async () => {
      try {
        setLoading(true);
        const recipeData = await getRecipe(id);
        
        if (!recipeData) {
          console.error('No recipe data returned for ID:', id);
          toast.error(t('recipe_not_found'));
          setLoading(false);
          return;
        }
        
        // Check and fix nutrition data if missing or all zeros
        if (!recipeData.nutrition || 
            (recipeData.nutrition.calories.value === 0 && 
             recipeData.nutrition.protein.value === 0 && 
             recipeData.nutrition.carbs.value === 0 && 
             recipeData.nutrition.fats.value === 0)) {
          
          console.log('Nutrition data missing or zeros, calculating...', recipeData.ingredients);
          
          // Calculate nutrition from ingredients
          const calculatedNutrition = calculateNutritionFallback(recipeData.ingredients);
          
          // Update recipe with calculated nutrition
          recipeData.nutrition = calculatedNutrition;
          console.log('Calculated nutrition:', calculatedNutrition);
        }
        
        setRecipe(recipeData);
        
        // Check if recipe is in user's favorites
        if (isAuthenticated && user?.favorites) {
          setIsFavorite(user.favorites.includes(id));
        }
        
        // Fetch reviews
        try {
          const reviewsData = await getRecipeReviews(id);
          if (Array.isArray(reviewsData)) {
            setReviews(reviewsData);
          } else if (reviewsData && Array.isArray(reviewsData.data)) {
            setReviews(reviewsData.data);
          } else {
            console.warn('Unexpected reviews data format:', reviewsData);
            setReviews([]);
          }
        } catch (reviewError) {
          console.error('Error fetching reviews:', reviewError);
          setReviews([]);
        }
      } catch (error) {
        console.error('Error fetching recipe:', error);
        toast.error(error || t('error_occurred'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecipeData();
  }, [id, isAuthenticated, user, t]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.info(t('login_required'));
      return;
    }
    
    try {
      if (isFavorite) {
        await removeFromFavorites(id);
        toast.success(t('removed_from_favorites'));
      } else {
        await addToFavorites(id);
        toast.success(t('added_to_favorites'));
      }
      
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      // Handle common errors
      if (error?.includes?.('already in favorites')) {
        toast.info(t('already_in_favorites'));
        setIsFavorite(true);
      } else if (error?.includes?.('not in favorites')) {
        toast.info(t('not_in_favorites'));
        setIsFavorite(false);
      } else {
        toast.error(error || t('error_occurred'));
      }
    }
  };

  const handleAddReview = (newReview) => {
    if (newReview) {
      setReviews([newReview, ...reviews]);
      
      // Update recipe's average rating and count if available in the response
      if (newReview.recipe && newReview.recipe.averageRating !== undefined) {
        setRecipe(prevRecipe => ({
          ...prevRecipe,
          averageRating: newReview.recipe.averageRating,
          ratingCount: newReview.recipe.ratingCount
        }));
      }
    }
  };

  const handleUpdateReview = (updatedReview) => {
    if (updatedReview) {
      setReviews(reviews.map(review => 
        review._id === updatedReview._id ? updatedReview : review
      ));
      
      // Update recipe's average rating and count if available in the response
      if (updatedReview.recipe && updatedReview.recipe.averageRating !== undefined) {
        setRecipe(prevRecipe => ({
          ...prevRecipe,
          averageRating: updatedReview.recipe.averageRating,
          ratingCount: updatedReview.recipe.ratingCount
        }));
      }
    }
  };
  
  const handleDeleteReview = (deletedReviewId) => {
    if (deletedReviewId) {
      setReviews(reviews.filter(review => review._id !== deletedReviewId));
      
      // Refresh recipe to get updated rating
      getRecipe(id)
        .then(recipeData => {
          if (recipeData) {
            setRecipe(recipeData);
          }
        })
        .catch(error => {
          console.error('Error refreshing recipe data:', error);
        });
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
      </div>
    );
  }
  
  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('recipe_not_found')}</h2>
        <p className="text-gray-600">{t('recipe_not_found_message')}</p>
      </div>
    );
  }
  
  // Ensure ingredients is an array
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  
  // Ensure instructions is an array
  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];
  
  // Format ingredients as a paragraph
  const ingredientsParagraph = ingredients.length > 0 
    ? ingredients.join(', ') 
    : t('no_ingredients_available');
  
  // Ensure nutrition values are available with fallbacks
  const nutrition = recipe.nutrition || {
    calories: { value: 0, unit: 'kcal' },
    protein: { value: 0, unit: 'g' },
    carbs: { value: 0, unit: 'g' },
    fats: { value: 0, unit: 'g' }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Recipe Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {recipe.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {/* Total Time */}
            <div className="flex items-center">
              <FaClock className="mr-2" />
              <span>{recipe.totalTime}</span>
            </div>
            
            {/* Rating */}
            <div className="flex items-center">
              <FaStar className="text-yellow-300 mr-2" />
              <span>{recipe.averageRating.toFixed(1)}</span>
              <span className="text-white/80 ml-1">({recipe.ratingCount})</span>
            </div>
            
            {/* Favorite Button */}
            {isAuthenticated && (
              <button 
                onClick={handleToggleFavorite}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
              >
                {isFavorite ? (
                  <>
                    <FaHeart className="text-red-400" />
                    <span>{t('remove_from_favorites')}</span>
                  </>
                ) : (
                  <>
                    <FaRegHeart />
                    <span>{t('add_to_favorites')}</span>
                  </>
                )}
              </button>
            )}
            
            {/* Voice Control Button */}
            <button 
              onClick={toggleVoiceControl}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors ml-auto"
            >
              {isListening ? (
                <>
                  <FaMicrophoneSlash />
                  <span>{t('voice_control_stop')}</span>
                </>
              ) : (
                <>
                  <FaMicrophone />
                  <span>{t('voice_control_start')}</span>
                </>
              )}
            </button>
          </div>
          
          {/* Voice Response */}
          {isListening && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
              <p className="text-white">{voiceResponse || t('listening')}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Recipe Image */}
          <div className="h-64 md:h-96 overflow-hidden">
            <img 
              src={recipe.image || '/default-recipe.jpg'} 
              alt={recipe.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-recipe.jpg';
              }}
            />
          </div>
          
          <div className="p-6">
            {/* Description */}
            <p className="text-gray-700 mb-6">{recipe.description}</p>
            
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('ingredients')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'ingredients'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t('ingredients')}
                </button>
                <button
                  onClick={() => setActiveTab('instructions')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'instructions'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t('instructions')}
                </button>
                <button
                  onClick={() => setActiveTab('nutrition')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'nutrition'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t('nutritional_information')}
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'reviews'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t('reviews')} ({recipe.ratingCount})
                </button>
              </nav>
            </div>
            
            {/* Ingredients Tab */}
            {activeTab === 'ingredients' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">{t('ingredients')}</h3>
                <div className="bg-gray-50 p-5 rounded-lg">
                  <div className="flex items-start mb-3">
                    <FaUtensils className="mt-1 mr-3 text-primary flex-shrink-0" />
                    <h4 className="font-medium text-gray-800">{t('you_will_need')}:</h4>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {ingredientsParagraph}
                  </p>
                </div>
              </div>
            )}
            
            {/* Instructions Tab */}
            {activeTab === 'instructions' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">{t('instructions')}</h3>
                <ol className="space-y-4">
                  {instructions.length > 0 ? (
                    instructions.map((instruction, index) => (
                      <li 
                        key={index} 
                        className={`flex rounded-lg p-4 ${
                          index === currentStep 
                            ? 'bg-primary-light border-l-4 border-primary' 
                            : 'bg-gray-50'
                        }`}
                      >
                        <span className="font-bold text-primary mr-4">{index + 1}.</span>
                        <p>{instruction}</p>
                      </li>
                    ))
                  ) : (
                    <li className="py-3 text-gray-500 italic">{t('no_instructions_available')}</li>
                  )}
                </ol>
              </div>
            )}
            
            {/* Nutrition Tab */}
            {activeTab === 'nutrition' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">{t('nutritional_information')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-500 text-sm">{t('calories')}</p>
                    <p className="text-2xl font-bold text-primary">
                      {Math.round(nutrition.calories.value)}
                      <span className="text-sm font-normal ml-1">kcal</span>
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-500 text-sm">{t('protein')}</p>
                    <p className="text-2xl font-bold text-primary">
                      {Math.round(nutrition.protein.value)}
                      <span className="text-sm font-normal ml-1">g</span>
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-500 text-sm">{t('carbs')}</p>
                    <p className="text-2xl font-bold text-primary">
                      {Math.round(nutrition.carbs.value)}
                      <span className="text-sm font-normal ml-1">g</span>
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-500 text-sm">{t('fats')}</p>
                    <p className="text-2xl font-bold text-primary">
                      {Math.round(nutrition.fats.value)}
                      <span className="text-sm font-normal ml-1">g</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">{t('reviews')}</h3>
                
                {isAuthenticated ? (
                  <ReviewForm 
                    recipeId={recipe._id} 
                    onReviewAdded={handleAddReview} 
                  />
                ) : (
                  <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-6">
                    <p>{t('login_to_review')}</p>
                  </div>
                )}
                
                <ReviewList 
                  reviews={reviews} 
                  onUpdateReview={handleUpdateReview}
                  onDeleteReview={handleDeleteReview}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailsPage;