import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaMicrophone, FaCalculator, FaLanguage, FaHeart, FaStar, FaUtensils, FaClock, FaSearch, FaCookieBite, FaLeaf } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import RecipeCard from '../components/recipe/RecipeCard';
import { getRecipes } from '../services/recipeService';
import { toast } from 'react-toastify';

const HomePage = () => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  
  const [topRatedRecipes, setTopRatedRecipes] = useState([]);
  const [latestRecipes, setLatestRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Setup video element and ensure it plays properly
    if (videoRef.current) {
      // Check if video is ready
      if (videoRef.current.readyState >= 2) {
        setVideoLoaded(true);
        playVideo();
      }
    }
    
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        
        // Fetch top rated recipes
        try {
          const topRatedPromise = getRecipes({
            sort: '-averageRating',
            limit: 3
          });
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 5000);
          });
          
          const topRatedResponse = await Promise.race([topRatedPromise, timeoutPromise]);
          
          if (topRatedResponse && topRatedResponse.data) {
            const topRatedData = topRatedResponse.data.data || topRatedResponse.data;
            setTopRatedRecipes(Array.isArray(topRatedData) ? topRatedData : []);
          } else {
            setTopRatedRecipes([]);
          }
        } catch (error) {
          console.error('Error fetching top rated recipes:', error);
          setTopRatedRecipes([]);
        }
        
        // Fetch latest recipes
        try {
          const latestPromise = getRecipes({
            sort: '-createdAt',
            limit: 3
          });
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 5000);
          });
          
          const latestResponse = await Promise.race([latestPromise, timeoutPromise]);
          
          if (latestResponse && latestResponse.data) {
            const latestData = latestResponse.data.data || latestResponse.data;
            setLatestRecipes(Array.isArray(latestData) ? latestData : []);
          } else {
            setLatestRecipes([]);
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

  // Ensure video plays and handles errors
  const playVideo = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.warn('Video autoplay was prevented:', err);
      });
    }
  };

  const handleVideoLoad = () => {
    setVideoLoaded(true);
    console.log('Video loaded successfully');
    playVideo();
  };

  const handleVideoError = (e) => {
    console.error('Video error:', e);
    setVideoLoaded(false);
  };

  const handleSearchClick = () => {
    if (!isAuthenticated) {
      toast.info(t('login_required'));
    }
  };

  return (
    <div className="min-h-screen bg-rose-50">
      {/* Floating decorative elements */}
      <div className="hidden md:block">
        <div className="fixed top-20 left-10 animate-bounce-slow opacity-20 text-pink-400">
          <FaUtensils size={30} />
        </div>
        <div className="fixed top-40 right-10 animate-pulse opacity-20 text-pink-400">
          <FaHeart size={30} />
        </div>
        <div className="fixed bottom-20 left-20 animate-pulse opacity-20 text-pink-400">
          <FaLeaf size={30} />
        </div>
        <div className="fixed bottom-60 right-20 animate-bounce-slow opacity-20 text-pink-400">
          <FaCookieBite size={30} />
        </div>
      </div>

      {/* Hero Section with Video Background */}
      <div className="relative text-white overflow-hidden rounded-b-[50px] shadow-2xl">
        {/* Video Background Container */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden" style={{ minHeight: '80vh' }}>
          {/* Main Video Element */}
          <video 
            ref={videoRef}
            autoPlay 
            loop 
            muted 
            playsInline
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            className={`w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          >
            <source src="/IMG_9234.MOV" type="video/quicktime" />
            <source src="/IMG_9234.mp4" type="video/mp4" /> 
            Your browser does not support the video tag.
          </video>
          
          {/* Gradient fallback while video loads */}
          <div 
            className={`absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-500 transition-opacity duration-1000 ${videoLoaded ? 'opacity-0' : 'opacity-100'}`}
          ></div>
          
          {/* Light gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/40"></div>
        </div>

        {/* Content - Positioned over the video */}
        <div className="container mx-auto px-4 relative z-10 pt-24 pb-36">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-6">
              <div className="bg-white/30 backdrop-blur-md p-5 rounded-full inline-block">
                <FaUtensils className="text-white text-5xl mx-auto drop-shadow-lg" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-8 font-cursive text-pink drop-shadow-lg">
              {t('app_name')}
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 text-pink/90 drop-shadow-md font-light max-w-2xl mx-auto leading-relaxed">
              {t('welcome_text')}
            </p>
            
            {/* Search Button */}
            <div className="mb-12 transform hover:scale-105 transition-transform duration-300">
              {isAuthenticated ? (
                <Link to="/search" className="py-5 px-10 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-medium rounded-full hover:from-pink-500 hover:to-rose-600 focus:outline-none focus:ring-4 focus:ring-pink-300 focus:ring-opacity-50 shadow-lg transition-all duration-300 inline-flex items-center space-x-3">
                  <FaSearch className="text-xl" />
                  <span className="text-lg">Search Recipes</span>
                </Link>
              ) : (
                <button 
                  onClick={handleSearchClick} 
                  className="py-5 px-10 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-medium rounded-full hover:from-pink-500 hover:to-rose-600 focus:outline-none focus:ring-4 focus:ring-pink-300 focus:ring-opacity-50 shadow-lg transition-all duration-300 inline-flex items-center space-x-3"
                >
                  <FaSearch className="text-xl" />
                  <span className="text-lg">Search Recipes</span>
                </button>
              )}
            </div>
            
            {/* Features Cards - With properly aligned text */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
              <div className="bg-white/30 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/50 transform hover:scale-105 transition-all duration-300 hover:bg-white/40 group h-full flex flex-col items-center">
                <div className="text-white text-3xl mb-5 bg-pink-500/60 p-5 rounded-full w-20 h-20 flex items-center justify-center shadow-md group-hover:bg-pink-500/80 transition-all duration-300">
                  <FaMicrophone className="mx-auto" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center group-hover:text-white/100 text-white/90 transition-colors duration-300">Voice Control</h3>
                <p className="text-white/80 text-center group-hover:text-white/100 transition-colors duration-300">
                  Hands-free cooking assistance with voice commands
                </p>
              </div>
              
              <div className="bg-white/30 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/50 transform hover:scale-105 transition-all duration-300 hover:bg-white/40 group h-full flex flex-col items-center">
                <div className="text-white text-3xl mb-5 bg-pink-500/60 p-5 rounded-full w-20 h-20 flex items-center justify-center shadow-md group-hover:bg-pink-500/80 transition-all duration-300">
                  <FaCalculator className="mx-auto" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center group-hover:text-white/100 text-white/90 transition-colors duration-300">Nutrition Calculator</h3>
                <p className="text-white/80 text-center group-hover:text-white/100 transition-colors duration-300">
                  Detailed nutrition information for every recipe
                </p>
              </div>
              
              <div className="bg-white/30 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/50 transform hover:scale-105 transition-all duration-300 hover:bg-white/40 group h-full flex flex-col items-center">
                <div className="text-white text-3xl mb-5 bg-pink-500/60 p-5 rounded-full w-20 h-20 flex items-center justify-center shadow-md group-hover:bg-pink-500/80 transition-all duration-300">
                  <FaLanguage className="mx-auto" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center group-hover:text-white/100 text-white/90 transition-colors duration-300">Multilingual Support</h3>
                <p className="text-white/80 text-center group-hover:text-white/100 transition-colors duration-300">
                  Cook in your preferred language with multilingual support
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="fill-rose-50">
            <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,58.7C672,64,768,96,864,96C960,96,1056,64,1152,58.7C1248,53,1344,75,1392,85.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </div>
      
      {/* Top Rated Recipes Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="flex items-center justify-center mb-14">
          <div className="bg-pink-100 p-4 rounded-full mr-4 shadow-md">
            <FaStar className="text-pink-500 text-2xl" />
          </div>
          <h2 className="text-4xl font-bold text-gray-800 font-cursive relative">
            {t('top_rated_recipes')}
            <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-pink-300 to-transparent rounded-full"></span>
          </h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-300 border-t-pink-500"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FaUtensils className="text-pink-400 animate-pulse" />
              </div>
            </div>
          </div>
        ) : topRatedRecipes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-pink-100">
            <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUtensils className="text-pink-300 text-xl" />
            </div>
            <p className="text-gray-500 font-medium">{t('no_recipes_found')}</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon for delicious recipes!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {topRatedRecipes.map(recipe => (
              <div key={recipe._id} className="transform hover:scale-105 transition-transform duration-300 hover:shadow-xl">
                <RecipeCard recipe={recipe} />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Latest Recipes Section */}
      <div className="bg-gradient-to-b from-rose-100 to-white py-20 rounded-t-[50px] mt-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-14">
            <div className="bg-pink-100 p-4 rounded-full mr-4 shadow-md">
              <FaClock className="text-pink-500 text-2xl" />
            </div>
            <h2 className="text-4xl font-bold text-gray-800 font-cursive relative">
              {t('latest_recipes')}
              <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-pink-300 to-transparent rounded-full"></span>
            </h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-300 border-t-pink-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FaUtensils className="text-pink-400 animate-pulse" />
                </div>
              </div>
            </div>
          ) : latestRecipes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-pink-100">
              <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUtensils className="text-pink-300 text-xl" />
              </div>
              <p className="text-gray-500 font-medium">{t('no_recipes_found')}</p>
              <p className="text-gray-400 text-sm mt-2">Check back soon for delicious recipes!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {latestRecipes.map(recipe => (
                <div key={recipe._id} className="transform hover:scale-105 transition-transform duration-300 hover:shadow-xl">
                  <RecipeCard recipe={recipe} />
                </div>
              ))}
            </div>
          )}
          
          {/* Call to action section at the bottom */}
          {!loading && (topRatedRecipes.length > 0 || latestRecipes.length > 0) && (
            <div className="mt-20 text-center">
              <Link to="/search" className="inline-flex items-center px-8 py-4 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200 transition-colors duration-300 shadow-md group">
                <span className="font-medium">{t('discover_more_recipes')}</span>
                <FaHeart className="ml-2 group-hover:scale-125 transition-transform duration-300" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;