import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaMicrophone, FaCalculator, FaLanguage, FaRobot, FaHeart, FaStar, FaUtensils, FaClock } from 'react-icons/fa';
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
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        
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
            setTopRatedRecipes(Array.isArray(topRatedData) ? topRatedData : []);
          }
        } catch (error) {
          console.error('Error fetching top rated recipes:', error);
          setTopRatedRecipes([]);
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
            setLatestRecipes(Array.isArray(latestData) ? latestData : []);
          }
        } catch (error) {
          console.error('Error fetching latest recipes:', error);
          setLatestRecipes([]);
        }
      } catch (error) {
        console.error('Failed to fetch recipes:', error);
        setTopRatedRecipes([]);
        setLatestRecipes([]);
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
  
  // Handle asking Cookie for suggestions
  const handleAskCookie = () => {
    if (!ingredients.trim()) {
      toast.info(t('enter_ingredients'));
      return;
    }
    
    const ingredientsArray = ingredients.split(',').map(i => i.trim()).filter(Boolean);
    
    // Open chatbot and ask for suggestions
    getRecipeSuggestions(ingredientsArray);
    toggleChat();
    
    // Show heart animation
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 1500);
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

      {/* Heart animation when asking Cookie */}
      {showHeartAnimation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-float-up-and-fade">
            <FaHeart className="text-pink-500" size={80} />
          </div>
        </div>
      )}

      {/* Hero Section with Video Background */}
      <div className="relative text-white overflow-hidden rounded-b-[50px] shadow-lg">
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
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-400"></div>
          </video>
          {/* Overlay to ensure text readability with a cute gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-pink-500/30 to-rose-600/50"></div>
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
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-8 transform hover:scale-102 transition-transform duration-300">
              <div className="flex flex-col md:flex-row gap-2 drop-shadow-lg">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaSearch className="text-pink-300" />
                  </div>
                  <input
                    type="text"
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    className="block w-full py-4 pl-12 pr-4 text-gray-700 bg-white border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-inner"
                    placeholder={t('ingredients_placeholder')}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="py-4 px-8 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-medium rounded-full hover:from-pink-500 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 shadow-md transition-all duration-300 transform hover:scale-105"
                  >
                    {t('find_recipes')}
                  </button>
                  <button
                    type="button"
                    onClick={handleAskCookie}
                    className="py-4 px-6 bg-white/90 backdrop-blur-sm text-pink-500 font-medium rounded-full hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 flex items-center shadow-md transition-all duration-300 transform hover:scale-105"
                  >
                    <FaRobot className="mr-2" />
                    {t('ask_Cookie')}
                  </button>
                </div>
              </div>
            </form>
            
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
}

export default HomePage;