import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaMicrophone, FaCalculator, FaLanguage, FaRobot, FaHeart, FaStar, FaUtensils, FaClock } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import RecipeCard from '../components/recipe/RecipeCard';
import { getRecipes, searchRecipesByIngredients } from '../services/recipeService';
import { toast } from 'react-toastify';

// Component for the search box with ingredient suggestions
const IngredientSearchBox = ({ ingredients, setIngredients, onSearch, loading }) => {
  const { t } = useLanguage();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);

  // Common ingredients for suggestions
  const commonIngredients = [
    'chicken', 'beef', 'pork', 'fish', 'tomato', 'onion', 'garlic', 
    'potato', 'carrot', 'broccoli', 'rice', 'pasta', 'cheese', 'egg',
    'mushroom', 'bell pepper', 'spinach', 'olive oil', 'butter', 'milk'
  ];

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(e);
  };

  // Add a suggested ingredient to the search
  const addSuggestion = (ingredient) => {
    // Check if already selected
    if (selectedSuggestions.includes(ingredient)) {
      return;
    }

    // Add to selected suggestions
    setSelectedSuggestions([...selectedSuggestions, ingredient]);

    // Add to the search input
    let currentIngredients = ingredients ? 
      ingredients.split(',').map(i => i.trim()).filter(Boolean) : 
      [];
    
    currentIngredients.push(ingredient);
    setIngredients(currentIngredients.join(', '));
  };

  // Remove a selected suggestion
  const removeSuggestion = (ingredient) => {
    setSelectedSuggestions(selectedSuggestions.filter(i => i !== ingredient));
    
    // Remove from the search input
    let currentIngredients = ingredients ? 
      ingredients.split(',').map(i => i.trim()).filter(Boolean) : 
      [];
    
    currentIngredients = currentIngredients.filter(i => i !== ingredient);
    setIngredients(currentIngredients.join(', '));
  };

  // Initialize selected suggestions from current ingredients
  useEffect(() => {
    if (ingredients) {
      const ingredientsArray = ingredients.split(',').map(i => i.trim()).filter(Boolean);
      setSelectedSuggestions(ingredientsArray);
    }
  }, []);

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-2">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaSearch className="text-pink-300" />
            </div>
            <input
              type="text"
              value={ingredients}
              onChange={(e) => {
                setIngredients(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="block w-full py-4 pl-12 pr-4 text-gray-700 bg-white border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-inner"
              placeholder={t('ingredients_placeholder')}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="py-4 px-8 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-medium rounded-full hover:from-pink-500 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? t('searching') : t('find_recipes')}
            </button>
          </div>
        </div>
      </form>

      {/* Selected ingredients pills */}
      {selectedSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedSuggestions.map((ingredient) => (
            <span 
              key={ingredient}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700"
            >
              {ingredient}
              <button 
                type="button" 
                onClick={() => removeSuggestion(ingredient)}
                className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-pink-700 hover:bg-pink-400 hover:text-white"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Common ingredients suggestions */}
      {showSuggestions && (
        <div className="mt-2 mb-6">
          <p className="text-sm text-white opacity-90 mb-2">{t('common_ingredients')}:</p>
          <div className="flex flex-wrap gap-2">
            {commonIngredients.map((ingredient) => (
              <button
                key={ingredient}
                type="button"
                onClick={() => addSuggestion(ingredient)}
                className={`px-2 py-1 text-xs rounded-full ${
                  selectedSuggestions.includes(ingredient)
                    ? 'bg-pink-400 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {ingredient}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const HomePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [ingredients, setIngredients] = useState('');
  const [topRatedRecipes, setTopRatedRecipes] = useState([]);
  const [latestRecipes, setLatestRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        
        // Create fallback recipes in case API fails
        const fallbackRecipes = [
          {
            _id: 'fallback1',
            title: 'Italian Pasta',
            description: 'A delicious homemade pasta with rich tomato sauce',
            image: '/default-recipe.jpg', // Using relative path
            totalTime: '30 minutes',
            averageRating: 4.5,
            ratingCount: 10,
            nutrition: {
              calories: { value: 450 },
              protein: { value: 15 },
              carbs: { value: 65 }
            }
          },
          {
            _id: 'fallback2',
            title: 'Garden Salad',
            description: 'Fresh vegetables with a zesty dressing',
            image: '/default-recipe.jpg',
            totalTime: '15 minutes',
            averageRating: 4.2,
            ratingCount: 8,
            nutrition: {
              calories: { value: 220 },
              protein: { value: 5 },
              carbs: { value: 20 }
            }
          },
          {
            _id: 'fallback3',
            title: 'Chocolate Cake',
            description: 'Rich and moist chocolate cake for dessert',
            image: '/default-recipe.jpg',
            totalTime: '45 minutes',
            averageRating: 4.8,
            ratingCount: 15,
            nutrition: {
              calories: { value: 380 },
              protein: { value: 6 },
              carbs: { value: 48 }
            }
          }
        ];
        
        // Fetch top rated recipes
        try {
          // Set a timeout for this specific fetch
          const topRatedPromise = getRecipes({
            sort: '-averageRating',
            limit: 3
          });
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 5000);
          });
          
          const topRatedResponse = await Promise.race([topRatedPromise, timeoutPromise]);
          
          // Handle different response formats
          if (topRatedResponse && topRatedResponse.data) {
            const topRatedData = topRatedResponse.data.data || topRatedResponse.data;
            setTopRatedRecipes(Array.isArray(topRatedData) && topRatedData.length > 0 ? topRatedData : fallbackRecipes);
          } else {
            setTopRatedRecipes(fallbackRecipes);
          }
        } catch (error) {
          console.error('Error fetching top rated recipes:', error);
          setTopRatedRecipes(fallbackRecipes);
        }
        
        // Fetch latest recipes
        try {
          // Set a timeout for this specific fetch
          const latestPromise = getRecipes({
            sort: '-createdAt',
            limit: 3
          });
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 5000);
          });
          
          const latestResponse = await Promise.race([latestPromise, timeoutPromise]);
          
          // Handle different response formats
          if (latestResponse && latestResponse.data) {
            const latestData = latestResponse.data.data || latestResponse.data;
            setLatestRecipes(Array.isArray(latestData) && latestData.length > 0 ? latestData : fallbackRecipes);
          } else {
            setLatestRecipes(fallbackRecipes);
          }
        } catch (error) {
          console.error('Error fetching latest recipes:', error);
          setLatestRecipes(fallbackRecipes);
        }
      } catch (error) {
        console.error('Failed to fetch recipes:', error);
        // Define fallback recipes again here to avoid the ESLint error
        const fallbackRecipes = [
          {
            _id: 'fallback1',
            title: 'Italian Pasta',
            description: 'A delicious homemade pasta with rich tomato sauce',
            image: '/default-recipe.jpg',
            totalTime: '30 minutes',
            averageRating: 4.5,
            ratingCount: 10,
            nutrition: {
              calories: { value: 450 },
              protein: { value: 15 },
              carbs: { value: 65 }
            }
          },
          {
            _id: 'fallback2',
            title: 'Garden Salad',
            description: 'Fresh vegetables with a zesty dressing',
            image: '/default-recipe.jpg',
            totalTime: '15 minutes',
            averageRating: 4.2,
            ratingCount: 8,
            nutrition: {
              calories: { value: 220 },
              protein: { value: 5 },
              carbs: { value: 20 }
            }
          },
          {
            _id: 'fallback3',
            title: 'Chocolate Cake',
            description: 'Rich and moist chocolate cake for dessert',
            image: '/default-recipe.jpg',
            totalTime: '45 minutes',
            averageRating: 4.8,
            ratingCount: 15,
            nutrition: {
              calories: { value: 380 },
              protein: { value: 6 },
              carbs: { value: 48 }
            }
          }
        ];
        setTopRatedRecipes(fallbackRecipes);
        setLatestRecipes(fallbackRecipes);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecipes();
  }, [t]);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!ingredients || !ingredients.trim()) {
      toast.info(t('enter_ingredients'));
      return;
    }
    
    try {
      setSearchLoading(true);
      
      // Show heart animation
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1500);
      
      // Search directly if fewer than 5 ingredients
      const ingredientsArray = ingredients.split(',').map(i => i.trim()).filter(Boolean);
      
      if (ingredientsArray.length > 0) {
        try {
          const searchResults = await searchRecipesByIngredients(ingredientsArray);
          
          // Store search results in sessionStorage
          sessionStorage.setItem('searchResults', JSON.stringify(searchResults.data || searchResults));
          sessionStorage.setItem('searchIngredients', ingredients);
          sessionStorage.setItem('parsedIngredients', JSON.stringify(ingredientsArray));
          
          navigate('/search');
        } catch (error) {
          console.error('Search error:', error);
          navigate(`/search?ingredients=${encodeURIComponent(ingredients)}`);
        }
      } else {
        // Just pass to search page with query params
        navigate(`/search?ingredients=${encodeURIComponent(ingredients)}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(t('search_error'));
      navigate(`/search?ingredients=${encodeURIComponent(ingredients)}`);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50">
      {/* Cute floating elements */}
      <div className="hidden md:block">
        <div className="fixed top-20 left-10 animate-bounce-slow opacity-20 text-pink-400">
          <FaUtensils size={30} />
        </div>
        <div className="fixed top-40 right-10 animate-pulse opacity-20 text-pink-400">
          <FaHeart size={30} />
        </div>
        <div className="fixed bottom-20 left-20 animate-pulse opacity-20 text-pink-400">
          <FaClock size={30} />
        </div>
        <div className="fixed bottom-60 right-20 animate-bounce-slow opacity-20 text-pink-400">
          <FaStar size={30} />
        </div>
      </div>

      {/* Heart animation when searching */}
      {showHeartAnimation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-float-up-and-fade">
            <FaHeart className="text-pink-500" size={80} />
          </div>
        </div>
      )}

      {/* Hero Section with Professional Video Background */}
      <div className="relative text-white overflow-hidden rounded-b-[50px] shadow-xl">
        {/* Video Background with enhanced presentation */}
        <div className="absolute inset-0 w-full h-full z-0">
          {/* Fallback background if video fails to load */}
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-pink-600"></div>
          
          {/* Professional gradient overlay for better text visibility and premium feel */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/60"></div>
          
          {/* Subtle vignette effect for more professional look */}
          <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.6)]"></div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10 pt-20 pb-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="animate-bounce-slow inline-block mb-4">
              <FaUtensils className="text-white text-4xl mx-auto" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-cursive text-white drop-shadow-md">
              {t('app_name')}
            </h1>
            <p className="text-xl mb-8 text-white drop-shadow-sm font-light">
              {t('welcome_text')}
            </p>
            
            {/* Enhanced Search Form with suggestions */}
            <div className="mb-8 transform hover:scale-102 transition-transform duration-300">
              <IngredientSearchBox 
                ingredients={ingredients}
                setIngredients={setIngredients}
                onSearch={handleSearch}
                loading={searchLoading}
              />
            </div>
            
            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/30 transform hover:scale-105 transition-transform duration-300">
                <div className="text-white text-3xl mb-4 bg-pink-400/40 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <FaMicrophone className="mx-auto" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('voice_control')}</h3>
                <p className="text-white/90 text-sm">
                  Hands-free cooking assistance with voice commands
                </p>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/30 transform hover:scale-105 transition-transform duration-300">
                <div className="text-white text-3xl mb-4 bg-pink-400/40 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <FaCalculator className="mx-auto" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('nutrition_calc')}</h3>
                <p className="text-white/90 text-sm">
                  Detailed nutrition information for every recipe
                </p>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/30 transform hover:scale-105 transition-transform duration-300">
                <div className="text-white text-3xl mb-4 bg-pink-400/40 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <FaLanguage className="mx-auto" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('multilingual')}</h3>
                <p className="text-white/90 text-sm">
                  Cook in your preferred language with multilingual support
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Cute wavy divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="fill-rose-50">
            <path d="M0,64L60,80C120,96,240,128,360,122.7C480,117,600,75,720,64C840,53,960,75,1080,80C1200,85,1320,75,1380,69.3L1440,64L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
          </svg>
        </div>
      </div>
      
      {/* Top Rated Recipes */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center mb-10">
          <div className="bg-pink-100 rounded-full p-3 mr-3">
            <FaStar className="text-pink-500 text-xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 font-cursive">
            {t('top_rated_recipes')}
          </h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-pink-500"></div>
          </div>
        ) : topRatedRecipes.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl shadow-md border border-pink-100">
            <p className="text-gray-500">{t('no_recipes_found')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {topRatedRecipes.map(recipe => (
              <div key={recipe._id} className="transform hover:scale-105 transition-transform duration-300">
                <RecipeCard recipe={recipe} />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Latest Recipes with cute background */}
      <div className="bg-gradient-to-b from-rose-100 to-white py-16 rounded-t-[50px] mt-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-10">
            <div className="bg-pink-100 rounded-full p-3 mr-3">
              <FaClock className="text-pink-500 text-xl" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 font-cursive">
              {t('latest_recipes')}
            </h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-pink-500"></div>
            </div>
          ) : latestRecipes.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl shadow-md border border-pink-100">
              <p className="text-gray-500">{t('no_recipes_found')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestRecipes.map(recipe => (
                <div key={recipe._id} className="transform hover:scale-105 transition-transform duration-300">
                  <RecipeCard recipe={recipe} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;