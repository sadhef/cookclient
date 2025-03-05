import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaMicrophone, FaCalculator, FaLanguage, FaRobot } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { useChat } from '../context/ChatbotContext';
import RecipeCard from '../components/recipe/RecipeCard';
import { getRecipes, searchRecipesByIngredients } from '../services/recipeService';
import { toast } from 'react-toastify';

const HomePage = () => {
  const { t } = useLanguage();
  const { toggleChat, getRecipeSuggestions } = useChat();
  const navigate = useNavigate();
  
  const [ingredients, setIngredients] = useState('');
  const [topRatedRecipes, setTopRatedRecipes] = useState([]);
  const [latestRecipes, setLatestRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

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
        
        // Fetch top rated recipes with timeout protection
        let topRated = [];
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
            topRated = Array.isArray(topRatedData) ? topRatedData : [];
          }
        } catch (error) {
          console.error('Error fetching top rated recipes:', error);
          topRated = fallbackRecipes;
        }
        setTopRatedRecipes(topRated.length > 0 ? topRated : fallbackRecipes);
        
        // Fetch latest recipes with timeout protection
        let latest = [];
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
            latest = Array.isArray(latestData) ? latestData : [];
          }
        } catch (error) {
          console.error('Error fetching latest recipes:', error);
          latest = fallbackRecipes;
        }
        setLatestRecipes(latest.length > 0 ? latest : fallbackRecipes);
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
    
    if (!ingredients.trim()) {
      toast.info(t('enter_ingredients'));
      return;
    }
    
    try {
      // Search directly if fewer than 5 ingredients
      const ingredientsArray = ingredients.split(',').map(i => i.trim()).filter(Boolean);
      
      if (ingredientsArray.length <= 5) {
        try {
          const searchResults = await searchRecipesByIngredients(ingredientsArray);
          
          // Store search results in sessionStorage
          sessionStorage.setItem('searchResults', JSON.stringify(searchResults.data || searchResults));
          sessionStorage.setItem('searchIngredients', ingredients);
          
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
    }
  };
  
  // Handle asking Cookie 🎀 for suggestions
  const handleAskCookie = () => {
    if (!ingredients.trim()) {
      toast.info(t('enter_ingredients'));
      return;
    }
    
    const ingredientsArray = ingredients.split(',').map(i => i.trim()).filter(Boolean);
    
    // Open chatbot and ask for suggestions
    getRecipeSuggestions(ingredientsArray);
    toggleChat();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Video Background */}
      <div className="relative text-white overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.7)' }}
          >
            <source src="/IMG_9234.MOV" type="video/mp4" />
            {/* Fallback background if video fails to load */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark"></div>
          </video>
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('app_name')}
            </h1>
            <p className="text-xl mb-8 text-white/90">
              {t('welcome_text')}
            </p>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    className="block w-full py-3 pl-10 pr-3 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder={t('ingredients_placeholder')}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="py-3 px-6 bg-white text-primary font-medium rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    {t('find_recipes')}
                  </button>
                  <button
                    type="button"
                    onClick={handleAskCookie}
                    className="py-3 px-4 bg-white/80 backdrop-blur-sm text-primary-dark font-medium rounded-lg hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center"
                  >
                    <FaRobot className="mr-2" />
                    {t('ask_Cookie')}
                  </button>
                </div>
              </div>
            </form>
            
            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                <div className="text-white text-3xl mb-4">
                  <FaMicrophone className="mx-auto" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('voice_control')}</h3>
                <p className="text-white/80 text-sm">
                  Hands-free cooking assistance with voice commands
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                <div className="text-white text-3xl mb-4">
                  <FaCalculator className="mx-auto" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('nutrition_calc')}</h3>
                <p className="text-white/80 text-sm">
                  Detailed nutrition information for every recipe
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                <div className="text-white text-3xl mb-4">
                  <FaLanguage className="mx-auto" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('multilingual')}</h3>
                <p className="text-white/80 text-sm">
                  Cook in your preferred language with multilingual support
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Top Rated Recipes */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">
          {t('top_rated_recipes')}
        </h2>
        
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
          </div>
        ) : topRatedRecipes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t('no_recipes_found')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {topRatedRecipes.map(recipe => (
              <RecipeCard key={recipe._id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
      
      {/* Latest Recipes */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">
          {t('latest_recipes')}
        </h2>
        
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
          </div>
        ) : latestRecipes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t('no_recipes_found')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestRecipes.map(recipe => (
              <RecipeCard key={recipe._id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;