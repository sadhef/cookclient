import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaFilter, FaAllergies, FaLightbulb, FaSortDown, FaHeart, 
  FaStar, FaUtensils, FaClock, FaMagic, FaCheckCircle, FaThumbsUp,
  FaBan
} from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getRecipes, searchRecipesByExcludedIngredients } from '../services/recipeService';
import RecipeCard from '../components/recipe/RecipeCard';
import { toast } from 'react-toastify';

const AllergenSearch = () => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [allergenTerm, setAllergenTerm] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOption, setSortOption] = useState('highest_rated');
  const [searchAnimation, setSearchAnimation] = useState(false);
  const [excludedIngredients, setExcludedIngredients] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    sortBy: 'highest_rated',
    duration: 'all',
    minRating: 0
  });

  // Check if user is authenticated on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error(t('login_required'));
      navigate('/login');
    }
  }, [isAuthenticated, navigate, t]);
  
  // Helper function to deduplicate recipes
  const deduplicateRecipes = useCallback((recipeArray) => {
    if (!recipeArray || recipeArray.length === 0) return [];
    
    const uniqueRecipesMap = new Map();
    
    recipeArray.forEach(recipe => {
      if (!recipe || !recipe.title) return;
      
      const key = recipe.title.toLowerCase().trim();
      
      if (uniqueRecipesMap.has(key)) {
        const existingRecipe = uniqueRecipesMap.get(key);
        if (recipe.averageRating > existingRecipe.averageRating) {
          uniqueRecipesMap.set(key, recipe);
        }
      } else {
        uniqueRecipesMap.set(key, recipe);
      }
    });
    
    return Array.from(uniqueRecipesMap.values());
  }, []);
  
  // Fetch top rated recipes as default
  const fetchTopRatedRecipes = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getRecipes({
        sort: '-averageRating',
        limit: 15
      });
      
      // Handle different response structures and deduplicate
      if (result && result.data) {
        const recipeData = Array.isArray(result.data) ? result.data : [];
        const uniqueRecipes = deduplicateRecipes(recipeData);
        
        setRecipes(uniqueRecipes);
        setTotalResults(uniqueRecipes.length);
      } else {
        console.error('Unexpected response format from getRecipes:', result);
        setRecipes([]);
        setTotalResults(0);
      }
      setExcludedIngredients([]);
    } catch (error) {
      console.error('Error fetching top rated recipes:', error);
      toast.error(error || t('error_occurred'));
      setRecipes([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [t, deduplicateRecipes]);
  
  // Search excluding allergens
  const performAllergenSearch = useCallback(async (allergens) => {
    try {
      setLoading(true);
      setSearchAnimation(true);
      
      const allergensArray = allergens.split(',').map(i => i.trim()).filter(Boolean);
      
      if (allergensArray.length === 0) {
        fetchTopRatedRecipes();
        return;
      }
      
      // Save the excluded ingredients for highlighting in recipe cards
      setExcludedIngredients(allergensArray);
      
      // Add the new function to recipeService.js first
      const results = await searchRecipesByExcludedIngredients(allergensArray);
      
      // Safely handle different response structures
      if (results && results.data) {
        const recipeData = Array.isArray(results.data) ? results.data : [];
        const uniqueRecipes = deduplicateRecipes(recipeData);
        
        setRecipes(uniqueRecipes);
        setTotalResults(uniqueRecipes.length);
      } else {
        console.error('Unexpected response format from searchRecipesByExcludedIngredients:', results);
        setRecipes([]);
        setTotalResults(0);
      }
      
      // Store search results in sessionStorage
      try {
        // Store unique recipes instead of possibly duplicate ones
        const uniqueResults = { ...results, data: deduplicateRecipes(results.data) };
        sessionStorage.setItem('allergenSearchResults', JSON.stringify(uniqueResults));
        sessionStorage.setItem('excludedIngredients', allergens);
        sessionStorage.setItem('parsedAllergens', JSON.stringify(allergensArray));
      } catch (storageError) {
        console.error('Error storing allergen search results in sessionStorage:', storageError);
      }
      
      // Hide search animation after 1 second
      setTimeout(() => {
        setSearchAnimation(false);
      }, 1000);
      
    } catch (error) {
      console.error('Allergen search error:', error);
      toast.error(t('search_error'));
      setRecipes([]);
      setTotalResults(0);
      setSearchAnimation(false);
      setExcludedIngredients([]);
      
      navigate(`/allergen-search?allergens=${encodeURIComponent(allergens)}`);
    } finally {
      setLoading(false);
    }
  }, [t, fetchTopRatedRecipes, navigate, deduplicateRecipes]);
  
  // Parse query params
  useEffect(() => {
    if (!isAuthenticated) {
      return; // Don't proceed if not authenticated
    }
    
    const queryParams = new URLSearchParams(location.search);
    const allergensParam = queryParams.get('allergens');
    
    if (allergensParam) {
      setAllergenTerm(allergensParam);
      performAllergenSearch(allergensParam);
    } else {
      // Check if we have search results in sessionStorage
      try {
        const storedResults = sessionStorage.getItem('allergenSearchResults');
        const storedAllergens = sessionStorage.getItem('excludedIngredients');
        const storedParsedAllergens = sessionStorage.getItem('parsedAllergens');
        
        if (storedResults && storedAllergens) {
          setAllergenTerm(storedAllergens);
          
          const parsedResults = JSON.parse(storedResults);
          if (parsedResults && parsedResults.data) {
            const recipeData = Array.isArray(parsedResults.data) ? parsedResults.data : [];
            const uniqueRecipes = deduplicateRecipes(recipeData);
            
            setRecipes(uniqueRecipes);
            setTotalResults(uniqueRecipes.length);
            
            if (storedParsedAllergens) {
              try {
                setExcludedIngredients(JSON.parse(storedParsedAllergens));
              } catch (e) {
                console.error('Error parsing stored allergens array:', e);
                setExcludedIngredients([]);
              }
            }
            
            setLoading(false);
            return;
          }
        }
      } catch (storageError) {
        console.error('Error reading from sessionStorage:', storageError);
      }
      
      // No allergens provided, fetch top-rated recipes
      fetchTopRatedRecipes();
    }
  }, [location.search, performAllergenSearch, fetchTopRatedRecipes, isAuthenticated, deduplicateRecipes]);
  
  // Handle allergen search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!allergenTerm.trim()) {
      fetchTopRatedRecipes();
      navigate('/allergen-search');
      return;
    }
    
    performAllergenSearch(allergenTerm);
    navigate(`/allergen-search?allergens=${encodeURIComponent(allergenTerm)}`);
  };
  
  // Handle sort option change
  const handleSortOptionChange = (option) => {
    setSortOption(option);
    
    // Create a copy of recipes array to sort
    let sortedRecipes = [...recipes];
    
    if (option === 'highest_rated') {
      // Sort by average rating
      sortedRecipes.sort((a, b) => b.averageRating - a.averageRating);
    } 
    else if (option === 'newest') {
      // Sort by creation date
      sortedRecipes.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    }
    
    setRecipes(sortedRecipes);
  };
  
  // Apply filters
  const applyFilters = () => {
    // Make sure recipes is an array before filtering
    if (!Array.isArray(recipes)) {
      console.error('recipes is not an array:', recipes);
      return;
    }
    
    // Sort the recipes based on filters
    let filteredRecipes = [...recipes];
    
    // Filter by duration
    if (filters.duration !== 'all') {
      filteredRecipes = filteredRecipes.filter(recipe => {
        if (!recipe || !recipe.totalTime) return false;
        
        const timeString = recipe.totalTime.toLowerCase();
        if (filters.duration === 'quick' && (timeString.includes('<') || timeString.includes('15') || timeString.includes('10'))) {
          return true;
        }
        if (filters.duration === 'medium' && (timeString.includes('30') || timeString.includes('20'))) {
          return true;
        }
        if (filters.duration === 'long' && (timeString.includes('>') || timeString.includes('60') || timeString.includes('hour'))) {
          return true;
        }
        return false;
      });
    }
    
    // Filter by minimum rating
    if (filters.minRating > 0) {
      filteredRecipes = filteredRecipes.filter(recipe => {
        return recipe && typeof recipe.averageRating === 'number' && recipe.averageRating >= filters.minRating;
      });
    }
    
    setRecipes(filteredRecipes);
    setTotalResults(filteredRecipes.length);
    setFiltersOpen(false);
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      sortBy: 'highest_rated',
      duration: 'all',
      minRating: 0
    });
    
    // Re-perform the search to get original results
    performAllergenSearch(allergenTerm);
  };
  
  // Toggle filters panel
  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };
  
  // Create the search results text
  const getSearchResultsText = () => {
    if (allergenTerm) {
      return `${t('Allergen-Free Recipes')} (${t('Excluding')}: "${allergenTerm}")`;
    }
    return t('Top Rated Recipes');
  };
  
  // If not authenticated, don't render the component
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-rose-50 py-8">
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
      
      {/* Search animation overlay */}
      {searchAnimation && (
        <div className="fixed inset-0 bg-pink-500/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <FaMagic className="text-pink-500 text-5xl mx-auto animate-spin-slow mb-4" />
            <p className="text-pink-600 font-medium text-xl">{t('Finding Allergen-Free Recipes')}</p>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 font-cursive mb-2">
            {t('Allergen-Free Recipe Search')}
          </h1>
          <p className="text-gray-600">{t('Find recipes excluding specific ingredients')}</p>
        </div>
        
        {/* Search Bar */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-8 border border-pink-100">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaAllergies className="text-pink-300" />
              </div>
              <input
                type="text"
                value={allergenTerm}
                onChange={(e) => setAllergenTerm(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 border border-pink-200 rounded-full leading-5 bg-white placeholder-pink-300 focus:outline-none focus:placeholder-pink-300 focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all duration-300"
                placeholder={t('Enter allergens to exclude (comma separated)')}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-gradient-to-r from-pink-400 to-rose-500 text-white px-6 py-3 rounded-full hover:from-pink-500 hover:to-rose-600 transition-all duration-300 shadow-md transform hover:scale-105 flex-shrink-0"
              >
                {t('Find Safe Recipes')}
              </button>
              <button
                type="button"
                onClick={toggleFilters}
                className="bg-white text-pink-500 px-4 py-3 rounded-full hover:bg-pink-50 border border-pink-200 flex items-center space-x-2 flex-shrink-0 shadow-md transition-all duration-300 transform hover:scale-105"
              >
                <FaFilter />
                <span>{t('filters')}</span>
              </button>
            </div>
          </form>
          
          {/* Excluded Ingredients Pills */}
          {excludedIngredients.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {excludedIngredients.map((ingredient, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"
                >
                  <FaBan className="mr-1" size={10} />
                  {ingredient}
                </span>
              ))}
            </div>
          )}
          
          {/* Filters Panel */}
          {filtersOpen && (
            <div className="mt-6 p-6 border-t border-pink-100 animate-slide-up bg-pink-50/50 rounded-2xl">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className="bg-pink-100 p-2 rounded-full mr-3">
                    <FaFilter className="text-pink-500" />
                  </div>
                  <h3 className="font-semibold text-gray-700 font-cursive text-xl">{t('filter_recipes')}</h3>
                </div>
                <button 
                  onClick={toggleFilters}
                  className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full"
                >
                  <span className="sr-only">{t('close')}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sort By */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('sort_by')}
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                    className="block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-pink-400 focus:border-pink-400 sm:text-sm rounded-lg"
                  >
                    <option value="highest_rated">{t('highest_rated')}</option>
                    <option value="newest">{t('newest')}</option>
                  </select>
                </div>
                
                {/* Duration */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('preparation_time')}
                  </label>
                  <select
                    value={filters.duration}
                    onChange={(e) => setFilters({...filters, duration: e.target.value})}
                    className="block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-pink-400 focus:border-pink-400 sm:text-sm rounded-lg"
                  >
                    <option value="all">{t('all')}</option>
                    <option value="quick">{t('quick')} (&lt; 15 min)</option>
                    <option value="medium">{t('medium')} (15-30 min)</option>
                    <option value="long">{t('long')} (&gt; 30 min)</option>
                  </select>
                </div>
                
                {/* Minimum Rating */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('minimum_rating')}
                  </label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => setFilters({...filters, minRating: parseFloat(e.target.value)})}
                    className="block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-pink-400 focus:border-pink-400 sm:text-sm rounded-lg"
                  >
                    <option value="0">{t('any_rating')}</option>
                    <option value="3">3+ {t('stars')}</option>
                    <option value="4">4+ {t('stars')}</option>
                    <option value="4.5">4.5+ {t('stars')}</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 border border-pink-300 rounded-full text-pink-500 bg-white hover:bg-pink-50 transition-all duration-300"
                >
                  {t('reset')}
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="px-4 py-2 bg-gradient-to-r from-pink-400 to-rose-500 text-white rounded-full hover:from-pink-500 hover:to-rose-600 transition-all duration-300 shadow-md"
                >
                  {t('apply_filters')}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Results Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-4 rounded-2xl shadow-md border border-pink-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 md:mb-0 font-cursive flex items-center">
            <FaAllergies className="text-pink-400 mr-2" />
            {getSearchResultsText()}
          </h2>
          
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 mr-2 bg-pink-100 px-3 py-1 rounded-full text-sm">
              {totalResults} {totalResults === 1 ? t('result_found') : t('results_found')}
            </span>
            
            {/* Sort options */}
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => handleSortOptionChange(e.target.value)}
                className="appearance-none bg-white border border-pink-200 py-2 pl-3 pr-10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-300 shadow-sm"
              >
                <option value="highest_rated">{t('highest_rated')}</option>
                <option value="newest">{t('newest')}</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-pink-500">
                <FaSortDown />
              </div>
            </div>
          </div>
        </div>
        
        {/* Results Grid */}
        {loading && !searchAnimation ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500"></div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-md border border-pink-100">
            <div className="animate-bounce-slow mb-4">
              <FaUtensils className="text-pink-400 text-4xl mx-auto" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 font-cursive">{t('no_results')}</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">{t('No recipes found that exclude these ingredients.')}</p>
            <button
              onClick={() => {
                setAllergenTerm('');
                fetchTopRatedRecipes();
                navigate('/allergen-search');
              }}
              className="bg-gradient-to-r from-pink-400 to-rose-500 text-white px-8 py-3 rounded-full hover:from-pink-500 hover:to-rose-600 transition-all duration-300 shadow-md transform hover:scale-105"
            >
              {t('See All Safe Recipes')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recipes.map(recipe => (
              <div key={recipe._id} className="transform hover:scale-105 transition-transform duration-300">
                <RecipeCard 
                  recipe={recipe} 
                  excludedIngredients={excludedIngredients}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllergenSearch;