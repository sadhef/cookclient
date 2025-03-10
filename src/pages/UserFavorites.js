import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getFavorites } from '../services/recipeService';
import RecipeCard from '../components/recipe/RecipeCard';
import { toast } from 'react-toastify';
import { FaHeart, FaSearch, FaUtensils, FaSadTear } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const UserFavorites = () => {
  const { t } = useLanguage();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const response = await getFavorites();
        
        // Check if response.data exists and is an array
        if (response.data && Array.isArray(response.data)) {
          setFavorites(response.data);
          
          // Show heart animation if there are favorites
          if (response.data.length > 0) {
            setShowHeartAnimation(true);
            setTimeout(() => setShowHeartAnimation(false), 2000);
          }
        } else {
          // If response.data is not an array, initialize as empty array
          console.error('Response data is not an array:', response);
          setFavorites([]);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
        toast.error(error || t('error_occurred'));
        setFavorites([]); // Ensure favorites is always an array
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [t]);

  const refreshFavorites = async () => {
    try {
      const response = await getFavorites();
      // Ensure we're setting an array
      if (response.data && Array.isArray(response.data)) {
        setFavorites(response.data);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error refreshing favorites:', error);
      toast.error(error || t('error_occurred'));
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 py-12">
      {/* Heart animation when loading favorites */}
      {showHeartAnimation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-float-up-and-fade">
            <FaHeart className="text-pink-500" size={80} />
          </div>
        </div>
      )}

      {/* Cute floating elements */}
      <div className="hidden md:block">
        <div className="fixed top-20 left-10 animate-bounce-slow opacity-20 text-pink-400">
          <FaHeart size={30} />
        </div>
        <div className="fixed top-40 right-10 animate-pulse opacity-20 text-pink-400">
          <FaUtensils size={30} />
        </div>
        <div className="fixed bottom-20 left-20 animate-pulse opacity-20 text-pink-400">
          <FaHeart size={30} />
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center mb-10">
          <div className="bg-pink-100 p-3 rounded-full mr-3">
            <FaHeart className="text-pink-500 text-xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 font-cursive">{t('Your Favorites')}</h1>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500 mb-4"></div>
            <p className="text-pink-500 font-medium">{t('loading_favorites')}</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-xl border border-pink-100">
            <div className="mb-6 flex justify-center">
              <div className="bg-pink-50 p-4 rounded-full">
                <FaSadTear className="text-pink-400 text-4xl" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 font-cursive">{t('No Favorites')}</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">{t('No Favorites Message')}</p>
            <Link 
              to="/search"
              className="bg-gradient-to-r from-pink-400 to-rose-500 text-white px-8 py-3 rounded-full hover:from-pink-500 hover:to-rose-600 transition-all duration-300 shadow-md inline-flex items-center"
            >
              <FaSearch className="mr-2" />
              <span>{t('browse_recipes')}</span>
            </Link>
          </div>
        ) : (
          <>
            <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">{t('favorites_description')}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {favorites.map(recipe => (
                <div key={recipe._id} className="transform hover:scale-105 transition-transform duration-300">
                  <RecipeCard 
                    recipe={recipe} 
                    refreshFavorites={refreshFavorites} 
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserFavorites;