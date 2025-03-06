import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaLightbulb, FaSortDown, FaHeart, FaStar, FaUtensils, FaClock, FaMagic } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { getRecipes, searchRecipesByIngredients } from '../services/recipeService';
import RecipeCard from '../components/recipe/RecipeCard';
import { toast } from 'react-toastify';

const SearchResults = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hasSuggestedRecipes, setHasSuggestedRecipes] = useState(false);
  const [sortOption, setSortOption] = useState('best_match'); // Default sort option
  const [searchAnimation, setSearchAnimation] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    sortBy: 'relevance',
    duration: 'all',
    minRating: 0
  });
  
  // Fetch latest recipes if no search term provided
  const fetchLatestRecipes = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getRecipes({
        sort: '-createdAt',
        limit: 12
      });
      
      // Handle different response structures
      if (result && result.data) {
        setRecipes(Array.isArray(result.data) ? result.data : []);
        setTotalResults(result.count || (Array.isArray(result.data) ? result.data.length : 0));
      } else {
        console.error('Unexpected response format from getRecipes:', result);
        setRecipes([]);
        setTotalResults(0);
      }
      setHasSuggestedRecipes(false);
    } catch (error) {
      console.error('Error fetching latest recipes:', error);
      toast.error(error || t('error_occurred'));
      // Set empty array as fallback
      setRecipes([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [t]);
  
  // Search by ingredients
  const performSearch = useCallback(async (ingredients) => {
    try {
      setLoading(true);
      setSearchAnimation(true);
      
      const ingredientsArray = ingredients.split(',').map(i => i.trim()).filter(Boolean);
      
      if (ingredientsArray.length === 0) {
        fetchLatestRecipes();
        return;
      }
      
      const results = await searchRecipesByIngredients(ingredientsArray);
      
      // Check if there are any suggested recipes
      let hasSuggested = false;
      if (results && results.data && Array.isArray(results.data)) {
        hasSuggested = results.data.some(recipe => recipe.isSuggested);
      }
      setHasSuggestedRecipes(hasSuggested);
      
      // Safely handle different response structures
      if (results && results.data) {
        setRecipes(Array.isArray(results.data) ? results.data : []);
        setTotalResults(results.count || (Array.isArray(results.data) ? results.data.length : 0));
      } else {
        console.error('Unexpected response format from searchRecipesByIngredients:', results);
        setRecipes([]);
        setTotalResults(0);
      }
      
      // Store search results in sessionStorage
      try {
        sessionStorage.setItem('searchResults', JSON.stringify(results));
        sessionStorage.setItem('searchIngredients', ingredients);
        sessionStorage.setItem('hasSuggestedRecipes', JSON.stringify(hasSuggested));
      } catch (storageError) {
        console.error('Error storing search results in sessionStorage:', storageError);
      }
      
      // Hide search animation after 1 second
      setTimeout(() => {
        setSearchAnimation(false);
      }, 1000);
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error(t('search_error'));
      setRecipes([]);
      setTotalResults(0);
      setSearchAnimation(false);
      
      navigate(`/search?ingredients=${encodeURIComponent(ingredients)}`);
    } finally {
      setLoading(false);
    }
  }, [t, fetchLatestRecipes, navigate]);
  
  // Parse query params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const ingredientsParam = queryParams.get('ingredients');
    
    if (ingredientsParam) {
      setSearchTerm(ingredientsParam);
      performSearch(ingredientsParam);
    } else {
      // Check if we have search results in sessionStorage
      try {
        const storedResults = sessionStorage.getItem('searchResults');
        const storedIngredients = sessionStorage.getItem('searchIngredients');
        const storedHasSuggested = sessionStorage.getItem('hasSuggestedRecipes');
        
        if (storedResults && storedIngredients) {
          setSearchTerm(storedIngredients);
          
          const parsedResults = JSON.parse(storedResults);
          if (parsedResults && parsedResults.data) {
            setRecipes(Array.isArray(parsedResults.data) ? parsedResults.data : []);
            setTotalResults(parsedResults.count || (Array.isArray(parsedResults.data) ? parsedResults.data.length : 0));
            
            if (storedHasSuggested) {
              setHasSuggestedRecipes(JSON.parse(storedHasSuggested));
            }
            
            setLoading(false);
            return;
          }
        }
      } catch (storageError) {
        console.error('Error reading from sessionStorage:', storageError);
      }
      
      // No ingredients provided, fetch latest recipes
      fetchLatestRecipes();
    }
  }, [location.search, performSearch, fetchLatestRecipes]);
  
  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      fetchLatestRecipes();
      navigate('/search');
      return;
    }
    
    performSearch(searchTerm);
    navigate(`/search?ingredients=${encodeURIComponent(searchTerm)}`);
  };
  
  // Handle sort option change
  const handleSortOptionChange = (option) => {
    setSortOption(option);
    
    // Create a copy of recipes array to sort
    let sortedRecipes = [...recipes];
    
    if (option === 'best_match') {
      // Sort by similarity score (matching recipes first, then by score)
      const exactMatches = sortedRecipes.filter(r => !r.isSuggested);
      const suggestedRecipes = sortedRecipes.filter(r => r.isSuggested);
      
      exactMatches.sort((a, b) => {
        if (a.similarityScore !== undefined && b.similarityScore !== undefined) {
          return b.similarityScore - a.similarityScore;
        }
        return 0;
      });
      
      sortedRecipes = [...exactMatches, ...suggestedRecipes];
    } 
    else if (option === 'highest_rated') {
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
      sortBy: 'relevance',
      duration: 'all',
      minRating: 0
    });
    
    // Re-perform the search to get original results
    performSearch(searchTerm);
  };
  
  // Toggle filters panel
  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };
  
  // Create the search results text
  const getSearchResultsText = () => {
    if (searchTerm) {
      return `${t('search_results_for')} "${searchTerm}"`;
    }
    return t('all_recipes');
  };
  
  // Group recipes into matched and suggested
  const exactMatchRecipes = recipes.filter(recipe => !recipe.isSuggested);
  const suggestedRecipes = recipes.filter(recipe => recipe.isSuggested);
  
  // Check if we have any recipes with similarity scores
  const hasScores = recipes.some(recipe => recipe.similarityScore !== undefined);
  
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
            <p className="text-pink-600 font-medium text-xl">{t('finding_perfect_recipes')}</p>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 font-cursive mb-2">
            {t('recipe_search')}
          </h1>
          <p className="text-gray-600">{t('find_perfect_recipe')}</p>
        </div>
        
        {/* Search Bar */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-8 border border-pink-100">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaSearch className="text-pink-300" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 border border-pink-200 rounded-full leading-5 bg-white placeholder-pink-300 focus:outline-none focus:placeholder-pink-300 focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all duration-300"
                placeholder={t('ingredients_placeholder')}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-gradient-to-r from-pink-400 to-rose-500 text-white px-6 py-3 rounded-full hover:from-pink-500 hover:to-rose-600 transition-all duration-300 shadow-md transform hover:scale-105 flex-shrink-0"
              >
                {t('search')}
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
                    <option value="relevance">{t('relevance')}</option>
                    <option value="rating">{t('highest_rated')}</option>
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
              
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-6 py-3 border border-pink-300 rounded-full text-pink-500 bg-white hover:bg-pink-50 transition-all duration-300"
                >
                  {t('reset')}
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="px-6 py-3 bg-gradient-to-r from-pink-400 to-rose-500 text-white rounded-full hover:from-pink-500 hover:to-rose-600 transition-all duration-300 shadow-md"
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
            <FaHeart className="text-pink-400 mr-2" />
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
                <option value="best_match">{t('best_match')}</option>
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
            <p className="text-gray-600 mb-8 max-w-md mx-auto">{t('no_results_message')}</p>
            <button
              onClick={() => {
                setSearchTerm('');
                fetchLatestRecipes();
                navigate('/search');
              }}
              className="bg-gradient-to-r from-pink-400 to-rose-500 text-white px-8 py-3 rounded-full hover:from-pink-500 hover:to-rose-600 transition-all duration-300 shadow-md transform hover:scale-105"
            >
              {t('browse_all_recipes')}
            </button>
          </div>
        ) : (
          <>
            {/* Exact match recipes */}
            {exactMatchRecipes.length > 0 && (
              <div className="mb-12">
                {hasSuggestedRecipes && (
                  <div className="flex items-center mb-6">
                    <div className="bg-pink-100 p-3 rounded-full mr-3">
                      <FaCheckCircle className="text-pink-500" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-800 font-cursive">
                      {t('exact_matches')}
                    </h2>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {exactMatchRecipes.map(recipe => (
                    <div key={recipe._id} className="transform hover:scale-105 transition-transform duration-300">
                      <RecipeCard 
                        recipe={recipe} 
                        showSimilarityScore={hasScores}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Suggested recipes */}
            {suggestedRecipes.length > 0 && (
              <div className="mt-16 bg-gradient-to-b from-white to-rose-100 py-12 px-8 rounded-3xl shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="text-yellow-500 bg-yellow-100 p-3 rounded-full mr-3">
                    <FaLightbulb />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800 font-cursive">
                    {t('suggested_recipes')}
                  </h2>
                </div>
                <p className="text-gray-600 mb-8 max-w-3xl">
                  {t('suggested_recipes_description')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {suggestedRecipes.map(recipe => (
                    <div key={recipe._id} className="transform hover:scale-105 transition-transform duration-300">
                      <RecipeCard recipe={recipe} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Pagination - cute version */}
            {totalResults > 12 && (
              <div className="mt-16 flex justify-center">
                <nav className="inline-flex rounded-full shadow-md overflow-hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-6 py-3 border-r border-pink-200 bg-white text-sm font-medium text-pink-500 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                  >
                    {t('previous')}
                  </button>
                  <div className="bg-pink-100 px-4 flex items-center text-pink-600 font-medium">
                    {currentPage} / {Math.ceil(totalResults / 12)}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage * 12 >= totalResults}
                    className="relative inline-flex items-center px-6 py-3 border-l border-pink-200 bg-white text-sm font-medium text-pink-500 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                  >
                    {t('next')}
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Add FaCheckCircle to imports at the top
const FaCheckCircle = (props) => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"></path>
  </svg>
);

export default SearchResults;