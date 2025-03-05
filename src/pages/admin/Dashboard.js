import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaUtensils, FaStar, FaUsers, FaChartPie, FaEye, FaChevronRight } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { getDashboardStats } from '../../services/adminService';
import { getRecipeReviews } from '../../services/reviewService';
import { getRecipes } from '../../services/recipeService';
import AdminSidebar from './AdminSidebar';
import { toast } from 'react-toastify';

const StatCard = ({ title, value, icon, color, trend }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-lg p-3 mr-4 ${color}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase">{title}</h3>
            <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-2 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{trend || "All time"}</span>
          <span className="text-primary font-medium">View all</span>
        </div>
      </div>
    </div>
  );
};

const RecipeCard = ({ recipe }) => {
  return (
    <div className="flex items-center p-4 hover:bg-gray-50 transition-all duration-200 rounded-lg">
      <div className="flex-shrink-0 w-12 h-12 mr-4 overflow-hidden rounded-lg">
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
      <div className="flex-grow min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{recipe.title || 'Untitled Recipe'}</h4>
        <div className="flex items-center text-gray-500 text-sm">
          <FaStar className="text-yellow-400 mr-1" />
          <span>{(recipe.averageRating || 0).toFixed(1)} ({recipe.ratingCount || 0})</span>
        </div>
      </div>
      <Link 
        to={`/recipes/${recipe._id}`} 
        className="ml-2 text-primary p-2 hover:bg-primary-50 rounded-full transition-colors"
        title="View Recipe"
      >
        <FaEye />
      </Link>
    </div>
  );
};

const ReviewCard = ({ review }) => {
  if (!review || !review.user) return null;
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            {review.user.avatar ? (
              <img 
                src={review.user.avatar} 
                alt={review.user.name}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-avatar.jpg';
                }}
              />
            ) : (
              <FaUser className="text-gray-500" />
            )}
          </div>
          <div className="ml-3">
            <p className="font-medium text-gray-900">{review.user.name || 'Unknown User'}</p>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className={`${i < (review.rating || 0) ? 'text-yellow-400' : 'text-gray-200'} text-xs`} />
              ))}
              <span className="ml-1 text-xs text-gray-500">
                {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
        <p className="text-gray-700 text-sm line-clamp-2 mb-2">{review.comment || 'No comment'}</p>
      </div>
      
      {review.recipe && review.recipe._id && review.recipe.title && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <Link 
            to={`/recipes/${review.recipe._id}`} 
            className="text-xs text-primary hover:underline inline-flex items-center"
          >
            <FaUtensils className="mr-1" />
            <span className="truncate">{review.recipe.title}</span>
            <FaChevronRight className="ml-auto text-gray-400" size={12} />
          </Link>
        </div>
      )}
    </div>
  );
};

const UserCard = ({ user }) => {
  return (
    <div className="flex items-center p-4 hover:bg-gray-50 transition-all duration-200 rounded-lg">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
        {user.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.name}
            className="w-full h-full rounded-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-avatar.jpg';
            }}
          />
        ) : (
          <FaUser className="text-gray-500" />
        )}
      </div>
      <div className="ml-3 flex-grow min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{user.name || 'Unknown User'}</h4>
        <p className="text-sm text-gray-500 truncate">{user.email || 'No email'}</p>
      </div>
      <div className="flex-shrink-0">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {user.role || 'user'}
        </span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast.error(error || t('error_occurred'));
        
        // Set default stats if there's an error
        setStats({
          counts: {
            users: 0,
            recipes: 0,
            reviews: 0
          },
          topRatedRecipes: [],
          recentUsers: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [t]);

  // Fetch recent reviews directly from recipes
  useEffect(() => {
    const fetchAllRecentReviews = async () => {
      try {
        setLoadingReviews(true);
        const allReviews = [];
        
        // First try to get recent reviews from stats
        if (stats && stats.recentReviews && stats.recentReviews.length > 0) {
          setRecentReviews(stats.recentReviews);
          setLoadingReviews(false);
          return;
        }
        
        // Fallback: fetch recipes and then get reviews for each
        const recipesResponse = await getRecipes({ limit: 10, sort: '-averageRating' });
        const recipes = recipesResponse.data || [];
        
        for (const recipe of recipes) {
          if (recipe && recipe._id) {
            try {
              const recipeReviews = await getRecipeReviews(recipe._id);
              if (Array.isArray(recipeReviews) && recipeReviews.length > 0) {
                // Add recipe info to reviews if missing
                const enhancedReviews = recipeReviews.map(review => ({
                  ...review,
                  recipe: review.recipe || { 
                    _id: recipe._id, 
                    title: recipe.title 
                  }
                }));
                allReviews.push(...enhancedReviews);
              }
            } catch (error) {
              console.error(`Error fetching reviews for recipe ${recipe._id}:`, error);
            }
          }
        }
        
        // Sort by date and take 5 most recent
        allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentReviews(allReviews.slice(0, 5));
      } catch (error) {
        console.error('Error fetching recent reviews:', error);
        setRecentReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchAllRecentReviews();
  }, [stats, t]);

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="p-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="pb-6">
        {/* Page header */}
        <div className="bg-white shadow-sm p-6 mb-6">
          <div className="flex items-center">
            <FaChartPie className="text-primary mr-3" size={20} />
            <h1 className="text-2xl font-bold text-gray-800">{t('admin_dashboard')}</h1>
          </div>
        </div>
        
        {/* Content container */}
        <div className="px-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatCard 
              title={t('total_users')}
              value={stats?.counts?.users || 0}
              icon={<FaUsers className="text-white" size={20} />}
              color="bg-blue-500"
              trend="All registered users"
            />
            <StatCard 
              title={t('total_recipes')}
              value={stats?.counts?.recipes || 0}
              icon={<FaUtensils className="text-white" size={20} />}
              color="bg-green-500"
              trend="Published recipes"
            />
            <StatCard 
              title={t('total_reviews')}
              value={stats?.counts?.reviews || 0}
              icon={<FaStar className="text-white" size={20} />}
              color="bg-yellow-500"
              trend="User feedback"
            />
          </div>
          
          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Rated Recipes */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-800">{t('top_rated_recipes')}</h2>
                <Link to="/admin/recipes" className="text-primary text-sm font-medium hover:underline flex items-center">
                  {t('view_all')}
                  <FaChevronRight className="ml-1" size={12} />
                </Link>
              </div>
              
              <div className="divide-y divide-gray-100">
                {stats && stats.topRatedRecipes && stats.topRatedRecipes.length > 0 ? (
                  stats.topRatedRecipes.map(recipe => (
                    <div className="px-6 py-3" key={recipe._id}>
                      <RecipeCard recipe={recipe} />
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    {t('no_recipes_yet')}
                  </div>
                )}
              </div>
            </div>
            
            {/* Recent Users */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-800">{t('recent_users')}</h2>
                <Link to="/admin/users" className="text-primary text-sm font-medium hover:underline flex items-center">
                  {t('view_all')}
                  <FaChevronRight className="ml-1" size={12} />
                </Link>
              </div>
              
              <div className="divide-y divide-gray-100">
                {stats && stats.recentUsers && stats.recentUsers.length > 0 ? (
                  stats.recentUsers.map(user => (
                    <div className="px-6 py-3" key={user._id}>
                      <UserCard user={user} />
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    {t('no_users_yet')}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Recent Reviews - Full width */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">{t('recent_reviews')}</h2>
              <Link to="/admin/reviews" className="text-primary text-sm font-medium hover:underline flex items-center">
                {t('view_all')}
                <FaChevronRight className="ml-1" size={12} />
              </Link>
            </div>
            
            {loadingReviews ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
              </div>
            ) : recentReviews && recentReviews.length > 0 ? (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentReviews.map((review, index) => (
                  <ReviewCard key={review._id || `review-${index}`} review={review} />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                {t('no_reviews_yet')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;