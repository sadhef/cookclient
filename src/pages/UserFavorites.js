import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getFavorites } from '../services/recipeService';
import RecipeCard from '../components/recipe/RecipeCard';
import { toast } from 'react-toastify';

const UserFavorites = () => {
  const { t } = useLanguage();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const response = await getFavorites();
        
        // Check if response.data exists and is an array
        if (response.data && Array.isArray(response.data)) {
          setFavorites(response.data);
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('favorites')}</h1>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">{t('no_favorites')}</h2>
            <p className="text-gray-600 mb-6">{t('no_favorites_message')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {favorites.map(recipe => (
              <RecipeCard 
                key={recipe._id} 
                recipe={recipe} 
                refreshFavorites={refreshFavorites} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserFavorites;