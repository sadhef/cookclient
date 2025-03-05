import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import PrivateRoute from './components/common/PrivateRoute';
import AdminRoute from './components/common/AdminRoute';

// Chatbot Components
import { ChatBot, ChatToggle } from './components/chatbot';
import { ChatbotProvider } from './context/ChatbotContext';

// Public Pages
import HomePage from './pages/HomePage';
import SearchResults from './pages/SearchResults';
import RecipeDetailsPage from './pages/RecipeDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// User Pages
import UserProfile from './pages/UserProfile';
import UserFavorites from './pages/UserFavorites';
import UserReviews from './pages/UserReviews';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminRecipes from './pages/admin/Recipes';
import AdminReviews from './pages/admin/Reviews';

function App() {
  const { loadUser, loading } = useAuth();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
      </div>
    );
  }

  return (
    <ChatbotProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/recipes/:id" element={<RecipeDetailsPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected User Routes */}
            <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
            <Route path="/favorites" element={<PrivateRoute><UserFavorites /></PrivateRoute>} />
            <Route path="/my-reviews" element={<PrivateRoute><UserReviews /></PrivateRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/recipes" element={<AdminRoute><AdminRecipes /></AdminRoute>} />
            <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        
        {/* Chatbot components */}
        <ChatBot />
        <ChatToggle />
      </div>
    </ChatbotProvider>
  );
}

export default App;