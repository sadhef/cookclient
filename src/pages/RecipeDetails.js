import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaClock, FaStar, FaHeart, FaRegHeart, FaMicrophone, FaMicrophoneSlash, FaUtensils, FaCheckCircle, FaList, FaInfoCircle, FaCommentAlt } from 'react-icons/fa';
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
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  
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
        // Show heart animation when adding to favorites
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 1500);
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
      <div className="flex justify-center items-center min-h-screen bg-rose-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500"></div>
      </div>
    );
  }
  
  if (!recipe) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl p-12 text-center max-w-2xl mx-4">
          <div className="animate-bounce-slow mb-6">
            <FaUtensils className="text-pink-400 text-5xl mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4 font-cursive">{t('recipe_not_found')}</h2>
          <p className="text-gray-600 mb-6">{t('recipe_not_found_message')}</p>
          <button 
            onClick={() => window.history.back()}
            className="bg-gradient-to-r from-pink-400 to-rose-500 text-white px-6 py-3 rounded-full hover:from-pink-500 hover:to-rose-600 transition-colors shadow-md"
          >
            {t('go_back')}
          </button>
        </div>
      </div>
    );
  }
  
  // Ensure ingredients is an array
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  
  // Ensure instructions is an array
  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];
  
  // Ensure nutrition values are available with fallbacks
  const nutrition = recipe.nutrition || {
    calories: { value: 0, unit: 'kcal' },
    protein: { value: 0, unit: 'g' },
    carbs: { value: 0, unit: 'g' },
    fats: { value: 0, unit: 'g' }
  };
  
  return (
    <div className="bg-rose-50 min-h-screen">
      {/* Heart animation when adding to favorites */}
      {showHeartAnimation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-float-up-and-fade">
            <FaHeart className="text-pink-500" size={80} />
          </div>
        </div>
      )}

      {/* Recipe Header with Background Image */}
      <div className="relative text-white overflow-hidden">
        {/* Image Background with Overlay */}
        <div className="absolute inset-0 w-full h-full z-0">
          <div className="relative h-full">
            <img 
              src={recipe.image || '/default-recipe.jpg'} 
              alt={recipe.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-recipe.jpg';
              }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-pink-800/60"></div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 pt-20 pb-16 relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-md font-cursive">
            {recipe.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {/* Total Time */}
            <div className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <FaClock className="mr-2 text-pink-200" />
              <span>{recipe.totalTime}</span>
            </div>
            
            {/* Rating */}
            <div className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <FaStar className="text-yellow-300 mr-2" />
              <span>{recipe.averageRating.toFixed(1)}</span>
              <span className="text-white/90 ml-1">({recipe.ratingCount})</span>
            </div>
            
            {/* Favorite Button */}
            {isAuthenticated && (
              <button 
                onClick={handleToggleFavorite}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  isFavorite 
                    ? 'bg-pink-600 text-white' 
                    : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                }`}
              >
                {isFavorite ? (
                  <>
                    <FaHeart className="text-white" />
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
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ml-auto ${
                isListening 
                  ? 'bg-pink-600 text-white animate-pulse' 
                  : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
              }`}
            >
              {isListening ? (
                <>
                  <FaMicrophoneSlash className="animate-pulse" />
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
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-6 animate-pulse-slow shadow-lg border border-white/30">
              <p className="text-white font-medium">{voiceResponse || t('listening')}</p>
            </div>
          )}
          
          {/* Short Description */}
          <p className="text-white/90 max-w-3xl text-lg mb-6 drop-shadow-sm bg-black/20 backdrop-blur-sm p-4 rounded-2xl">
            {recipe.description}
          </p>
        </div>
        
        {/* Cute wavy divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="fill-rose-50">
            <path d="M0,64L60,80C120,96,240,128,360,122.7C480,117,600,75,720,64C840,53,960,75,1080,80C1200,85,1320,75,1380,69.3L1440,64L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
          </svg>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12 -mt-10">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-pink-100 transform hover:scale-102 transition-all duration-300">
          {/* Tabs Navigation */}
          <div className="flex flex-wrap border-b border-pink-100">
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`flex items-center py-4 px-6 transition-all duration-300 font-medium ${
                activeTab === 'ingredients'
                  ? 'text-pink-500 border-b-2 border-pink-500 bg-pink-50'
                  : 'text-gray-500 hover:text-pink-500 hover:bg-pink-50/50'
              }`}
            >
              <FaList className={`mr-2 ${activeTab === 'ingredients' ? 'text-pink-500' : 'text-pink-300'}`} />
              {t('ingredients')}
            </button>
            <button
              onClick={() => setActiveTab('instructions')}
              className={`flex items-center py-4 px-6 transition-all duration-300 font-medium ${
                activeTab === 'instructions'
                  ? 'text-pink-500 border-b-2 border-pink-500 bg-pink-50'
                  : 'text-gray-500 hover:text-pink-500 hover:bg-pink-50/50'
              }`}
            >
              <FaCheckCircle className={`mr-2 ${activeTab === 'instructions' ? 'text-pink-500' : 'text-pink-300'}`} />
              {t('instructions')}
            </button>
            <button
              onClick={() => setActiveTab('nutrition')}
              className={`flex items-center py-4 px-6 transition-all duration-300 font-medium ${
                activeTab === 'nutrition'
                  ? 'text-pink-500 border-b-2 border-pink-500 bg-pink-50'
                  : 'text-gray-500 hover:text-pink-500 hover:bg-pink-50/50'
              }`}
            >
              <FaInfoCircle className={`mr-2 ${activeTab === 'nutrition' ? 'text-pink-500' : 'text-pink-300'}`} />
              {t('nutritional_information')}
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex items-center py-4 px-6 transition-all duration-300 font-medium ${
                activeTab === 'reviews'
                  ? 'text-pink-500 border-b-2 border-pink-500 bg-pink-50'
                  : 'text-gray-500 hover:text-pink-500 hover:bg-pink-50/50'
              }`}
            >
              <FaCommentAlt className={`mr-2 ${activeTab === 'reviews' ? 'text-pink-500' : 'text-pink-300'}`} />
              {t('reviews')} 
              <span className="ml-1 bg-pink-100 text-pink-600 rounded-full text-xs px-2 py-0.5">
                {recipe.ratingCount}
              </span>
            </button>
          </div>
          
          <div className="p-8">
            {/* Ingredients Tab */}
            {activeTab === 'ingredients' && (
              <div className="animate-fade-in">
                <div className="flex items-center mb-6">
                  <div className="bg-pink-100 p-3 rounded-full mr-3">
                    <FaList className="text-pink-500" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800 font-cursive">{t('ingredients')}</h3>
                </div>
                
                <div className="bg-pink-50 p-6 rounded-2xl shadow-md border border-pink-100">
                  <div className="flex items-start mb-4">
                    <div className="bg-pink-100 p-2 rounded-full mr-3 mt-1">
                      <FaUtensils className="text-pink-500" />
                    </div>
                    <h4 className="font-medium text-gray-800 text-lg">{t('you_will_need')}:</h4>
                  </div>
                  
                  <ul className="space-y-3 pl-12">
                    {ingredients.length > 0 ? (
                      ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-center">
                          <div className="h-2 w-2 bg-pink-400 rounded-full mr-3"></div>
                          <span className="text-gray-700">{ingredient}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500 italic">{t('no_ingredients_available')}</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
            
            {/* Instructions Tab */}
            {activeTab === 'instructions' && (
              <div className="animate-fade-in">
                <div className="flex items-center mb-6">
                  <div className="bg-pink-100 p-3 rounded-full mr-3">
                    <FaCheckCircle className="text-pink-500" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800 font-cursive">{t('instructions')}</h3>
                </div>
                
                <ol className="space-y-4">
                  {instructions.length > 0 ? (
                    instructions.map((instruction, index) => (
                      <li 
                        key={index} 
                        className={`flex rounded-xl p-5 shadow-md transition-all duration-300 ${
                          index === currentStep 
                            ? 'bg-pink-100 border-l-4 border-pink-500 transform scale-102' 
                            : 'bg-pink-50 border border-pink-100 hover:bg-pink-100/50'
                        }`}
                      >
                        <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full mr-4 ${
                          index === currentStep ? 'bg-pink-500 text-white' : 'bg-pink-200 text-pink-600'
                        }`}>
                          {index + 1}
                        </div>
                        <p className="text-gray-700">{instruction}</p>
                      </li>
                    ))
                  ) : (
                    <li className="py-3 text-gray-500 italic bg-pink-50 p-6 rounded-xl text-center">
                      {t('no_instructions_available')}
                    </li>
                  )}
                </ol>
                
                {isListening && (
                  <div className="mt-8 bg-pink-50 p-4 rounded-xl border border-pink-100">
                    <p className="text-gray-700 text-sm">
                      <span className="font-medium text-pink-500">{t('tip')}:</span> {t('voice_control_instructions')}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Nutrition Tab */}
            {activeTab === 'nutrition' && (
              <div className="animate-fade-in">
                <div className="flex items-center mb-6">
                  <div className="bg-pink-100 p-3 rounded-full mr-3">
                    <FaInfoCircle className="text-pink-500" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800 font-cursive">{t('nutritional_information')}</h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-pink-50 p-6 rounded-2xl text-center shadow-md border border-pink-100 transform hover:scale-105 transition-all duration-300">
                    <div className="w-16 h-16 bg-pink-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-pink-500 font-bold text-xl">kcal</span>
                    </div>
                    <p className="text-gray-500 text-sm mb-1">{t('calories')}</p>
                    <p className="text-3xl font-bold text-pink-500">
                      {Math.round(nutrition.calories.value)}
                    </p>
                  </div>
                  
                  <div className="bg-pink-50 p-6 rounded-2xl text-center shadow-md border border-pink-100 transform hover:scale-105 transition-all duration-300">
                    <div className="w-16 h-16 bg-pink-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-pink-500 font-bold text-xl">P</span>
                    </div>
                    <p className="text-gray-500 text-sm mb-1">{t('protein')}</p>
                    <p className="text-3xl font-bold text-pink-500">
                      {Math.round(nutrition.protein.value)}
                      <span className="text-sm font-normal ml-1">g</span>
                    </p>
                  </div>
                  
                  <div className="bg-pink-50 p-6 rounded-2xl text-center shadow-md border border-pink-100 transform hover:scale-105 transition-all duration-300">
                    <div className="w-16 h-16 bg-pink-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-pink-500 font-bold text-xl">C</span>
                    </div>
                    <p className="text-gray-500 text-sm mb-1">{t('carbs')}</p>
                    <p className="text-3xl font-bold text-pink-500">
                      {Math.round(nutrition.carbs.value)}
                      <span className="text-sm font-normal ml-1">g</span>
                    </p>
                  </div>
                  
                  <div className="bg-pink-50 p-6 rounded-2xl text-center shadow-md border border-pink-100 transform hover:scale-105 transition-all duration-300">
                    <div className="w-16 h-16 bg-pink-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-pink-500 font-bold text-xl">F</span>
                    </div>
                    <p className="text-gray-500 text-sm mb-1">{t('fats')}</p>
                    <p className="text-3xl font-bold text-pink-500">
                      {Math.round(nutrition.fats.value)}
                      <span className="text-sm font-normal ml-1">g</span>
                    </p>
                  </div>
                </div>
                
                <div className="mt-8 bg-pink-50 p-6 rounded-2xl border border-pink-100">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-pink-500">{t('nutrition_note')}:</span> {t('nutrition_calculated')}
                  </p>
                </div>
              </div>
            )}
            
            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="animate-fade-in">
                <div className="flex items-center mb-6">
                  <div className="bg-pink-100 p-3 rounded-full mr-3">
                    <FaCommentAlt className="text-pink-500" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800 font-cursive">{t('reviews')}</h3>
                </div>
                
                {isAuthenticated ? (
                  <div className="bg-pink-50 rounded-2xl p-6 mb-8 shadow-md border border-pink-100">
                    <ReviewForm 
                      recipeId={recipe._id} 
                      onReviewAdded={handleAddReview} 
                    />
                  </div>
                ) : (
                  <div className="bg-pink-50 text-pink-700 p-6 rounded-2xl mb-8 border border-pink-100 shadow-md">
                    <h4 className="font-medium mb-2 flex items-center">
                      <FaHeart className="mr-2 text-pink-400" />
                      {t('share_your_experience')}
                    </h4>
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
      
      {/* Call to action footer */}
      <div className="bg-gradient-to-r from-pink-400 to-rose-500 py-12 mt-12 text-white text-center">
        <div className="container mx-auto px-4">
          <div className="mb-6 animate-pulse">
            <FaHeart className="text-4xl mx-auto" />
          </div>
          <h3 className="text-2xl font-bold mb-4 font-cursive">
            {t('enjoyed_this_recipe')}
          </h3>
          <p className="mb-8 max-w-2xl mx-auto">
            {t('discover_more_recipes')}
          </p>
          <button 
            onClick={() => window.location.href = '/search'} 
            className="bg-white text-pink-500 px-8 py-3 rounded-full font-medium hover:bg-pink-100 transition-colors shadow-md transform hover:scale-105 transition-all duration-300"
          >
            {t('explore_more_recipes')}
          </button>
        </div>
      </div>
      
      {/* Add custom animation keyframes */}
      <style jsx="true">{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes float-up-and-fade {
          0% { transform: scale(0.7); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: translateY(-100px) scale(0.5); opacity: 0; }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite;
        }
        
        .animate-float-up-and-fade {
          animation: float-up-and-fade 1.5s forwards;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        .font-cursive {
          font-family: 'Comic Sans MS', cursive, sans-serif;
        }
      `}</style>
    </div>
  );
};

export default RecipeDetailsPage;