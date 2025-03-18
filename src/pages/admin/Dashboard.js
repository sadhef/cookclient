import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUser, 
  FaUtensils, 
  FaStar, 
  FaUsers, 
  FaChartPie, 
  FaEye, 
  FaChevronRight, 
  FaHeart, 
  FaCrown, 
  FaCommentAlt, 
  FaMagic 
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { getDashboardStats } from '../../services/adminService';
import { getRecipeReviews } from '../../services/reviewService';
import { getRecipes } from '../../services/recipeService';
import AdminSidebar from './AdminSidebar';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setShowAnimation(true);
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
        setTimeout(() => setShowAnimation(false), 1500);
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
      <div className="min-h-screen bg-rose-50">
        <AdminSidebar />
        <div className="p-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50">
      <AdminSidebar />
      
      {/* Loading animation overlay */}
      {showAnimation && (
        <div className="fixed inset-0 bg-pink-500/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-float">
              <FaMagic className="text-pink-500 text-5xl mx-auto" />
            </div>
            <p className="text-pink-600 font-medium text-xl mt-4">{t('loading_dashboard')}...</p>
          </div>
        </div>
      )}
      
      {/* Cute floating elements */}
      <div className="hidden md:block">
        <div className="fixed top-20 left-10 animate-bounce-slow opacity-20 text-pink-400">
          <FaHeart size={30} />
        </div>
        <div className="fixed top-40 right-10 animate-pulse opacity-20 text-pink-400">
          <FaStar size={30} />
        </div>
        <div className="fixed bottom-20 left-20 animate-pulse opacity-20 text-pink-400">
          <FaUtensils size={30} />
        </div>
      </div>
      
      <div className="pb-6">
        {/* Page header */}
        <div className="bg-white shadow-md p-6 mb-8 border-b border-pink-100">
          <div className="flex items-center">
            <div className="bg-pink-100 p-3 rounded-full mr-3">
              <FaChartPie className="text-pink-500" size={20} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{t('admin_dashboard')}</h1>
          </div>
        </div>
        
        {/* Content container */}
        <div className="px-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-pink-100 transform hover:scale-102 transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-2xl p-4 mr-4 bg-gradient-to-r from-blue-400 to-blue-600">
                    <FaUsers className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase">{t('total_users')}</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{stats?.counts?.users || 0}</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 bg-pink-50 border-t border-pink-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">All registered users</span>
                  <Link to="/admin/users" className="text-pink-500 font-medium">
                    {t('view_all')}
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-pink-100 transform hover:scale-102 transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-2xl p-4 mr-4 bg-gradient-to-r from-pink-400 to-rose-500">
                    <FaUtensils className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase">{t('total_recipes')}</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{stats?.counts?.recipes || 0}</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 bg-pink-50 border-t border-pink-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Published recipes</span>
                  <Link to="/admin/recipes" className="text-pink-500 font-medium">
                    {t('view_all')}
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-pink-100 transform hover:scale-102 transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-2xl p-4 mr-4 bg-gradient-to-r from-yellow-400 to-amber-500">
                    <FaStar className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase">{t('total_reviews')}</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{stats?.counts?.reviews || 0}</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 bg-pink-50 border-t border-pink-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">User feedback</span>
                  <Link to="/admin/reviews" className="text-pink-500 font-medium">
                    {t('view_all')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top Rated Recipes */}
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-pink-100">
              <div className="px-6 py-4 border-b border-pink-100 flex items-center">
                <div className="bg-pink-100 p-2 rounded-full mr-2">
                  <FaCrown className="text-pink-500" size={16} />
                </div>
                <h2 className="font-bold text-gray-800">{t('top_rated_recipes')}</h2>
              </div>
              
              <div className="divide-y divide-pink-100">
                {stats && stats.topRatedRecipes && stats.topRatedRecipes.length > 0 ? (
                  stats.topRatedRecipes.map(recipe => (
                    <div className="px-6 py-3" key={recipe._id}>
                      <div className="flex items-center p-4 hover:bg-pink-50 transition-all duration-300 rounded-xl">
                        <div className="flex-shrink-0 w-14 h-14 mr-4 overflow-hidden rounded-xl shadow-sm border border-pink-100">
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
                          className="ml-2 text-pink-500 p-2 hover:bg-pink-100 rounded-full transition-colors transform hover:scale-110"
                          title="View Recipe"
                        >
                          <FaEye />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <div className="flex justify-center mb-4">
                      <div className="bg-pink-50 p-3 rounded-full">
                        <FaUtensils className="text-pink-300" size={20} />
                      </div>
                    </div>
                    <p>{t('no_recipes_yet')}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Recent Users */}
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-pink-100">
              <div className="px-6 py-4 border-b border-pink-100 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-pink-100 p-2 rounded-full mr-2">
                    <FaUsers className="text-pink-500" size={16} />
                  </div>
                  <h2 className="font-bold text-gray-800">{t('recent_users')}</h2>
                </div>
                <Link to="/admin/users" className="text-pink-500 text-sm font-medium hover:underline flex items-center">
                  {t('view_all')}
                  <FaChevronRight className="ml-1" size={12} />
                </Link>
              </div>
              
              <div className="divide-y divide-pink-100">
                {stats && stats.recentUsers && stats.recentUsers.length > 0 ? (
                  stats.recentUsers.map(user => (
                    <div className="px-6 py-3" key={user._id}>
                      <div className="flex items-center p-4 hover:bg-pink-50 transition-all duration-300 rounded-xl">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center overflow-hidden border-2 border-pink-200">
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
                            <FaUser className="text-pink-400" />
                          )}
                        </div>
                        <div className="ml-3 flex-grow min-w-0">
                          <h4 className="font-medium text-gray-800 truncate">{user.name || 'Unknown User'}</h4>
                          <p className="text-sm text-gray-500 truncate">{user.email || 'No email'}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-pink-100 text-pink-800'
                          }`}>
                            {user.role || 'user'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <div className="flex justify-center mb-4">
                      <div className="bg-pink-50 p-3 rounded-full">
                        <FaUser className="text-pink-300" size={20} />
                      </div>
                    </div>
                    <p>{t('no_users_yet')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Recent Reviews - Full width */}
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-pink-100">
            <div className="px-6 py-4 border-b border-pink-100 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-pink-100 p-2 rounded-full mr-2">
                  <FaCommentAlt className="text-pink-500" size={16} />
                </div>
                <h2 className="font-bold text-gray-800">{t('recent_reviews')}</h2>
              </div>
              <Link to="/admin/reviews" className="text-pink-500 text-sm font-medium hover:underline flex items-center">
                {t('view_all')}
                <FaChevronRight className="ml-1" size={12} />
              </Link>
            </div>
            
            {loadingReviews ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-pink-500"></div>
              </div>
            ) : recentReviews && recentReviews.length > 0 ? (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentReviews.map((review, index) => (
                  <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-pink-100 transform hover:scale-102 transition-all duration-300" key={review._id || `review-${index}`}>
                    {review && review.user && (
                      <>
                        <div className="p-4">
                          <div className="flex items-center mb-3">
                            <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 border-2 border-pink-200">
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
                                <FaUser className="text-pink-400" />
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-800">{review.user.name || 'Unknown User'}</p>
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
                          <div className="bg-pink-50 p-3 rounded-xl relative">
                            <div className="absolute -top-2 -left-2 transform rotate-12 text-pink-300">
                              <FaCommentAlt size={14} />
                            </div>
                            <p className="text-gray-700 text-sm line-clamp-2">{review.comment || 'No comment'}</p>
                          </div>
                        </div>
                        
                        {review.recipe && review.recipe._id && review.recipe.title && (
                          <div className="px-4 py-2 bg-pink-50 border-t border-pink-100">
                            <Link 
                              to={`/recipes/${review.recipe._id}`} 
                              className="text-xs text-pink-500 hover:text-pink-600 inline-flex items-center"
                            >
                              <FaUtensils className="mr-1" />
                              <span className="truncate">{review.recipe.title}</span>
                              <FaChevronRight className="ml-auto text-pink-300" size={12} />
                            </Link>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <div className="flex justify-center mb-4">
                  <div className="bg-pink-50 p-3 rounded-full">
                    <FaCommentAlt className="text-pink-300" size={20} />
                  </div>
                </div>
                <p>{t('no_reviews_yet')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;