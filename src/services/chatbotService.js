// client/src/services/chatbotService.js
import api from '../utils/api';

/**
 * Send a message to the chatbot and get a response
 * @param {string} message - User's message text
 * @param {Array} history - Previous messages in the conversation
 * @returns {Promise<string>} - Chatbot's response text
 */
export const getChatbotResponse = async (message, history = []) => {
  try {
    // Format history for the API
    const formattedHistory = history
      .filter(msg => msg.id !== 'welcome' && !msg.isError) // Filter out welcome and error messages
      .map(msg => ({
        text: msg.text,
        isUser: msg.isUser
      }));
    
    // Keep up to 10 latest messages for better context preservation
    const historyToSend = formattedHistory.slice(-10);
    
    // If message is too long, trim it to reduce timeout risk
    const trimmedMessage = message.length > 500 ? 
      message.substring(0, 500) + '...' : 
      message;
    
    // Call API with timeout handling
    const response = await api.post('/chatbot/message', {
      message: trimmedMessage,
      history: historyToSend
    });
    
    return response.data.data.response;
  } catch (error) {
    console.error('Error getting chatbot response:', error);
    
    // Provide more detailed error messages
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Request timed out. Please try a shorter message or try again later.');
    }
    
    throw new Error(
      error.response?.data?.error || 
      'Failed to communicate with Cookie 🎀. Please try again later.'
    );
  }
};

/**
 * Get recipe suggestions based on ingredients
 * @param {Array} ingredients - List of ingredients
 * @returns {Promise<string>} - Recipe suggestions text
 */
export const suggestRecipes = async (ingredients) => {
  try {
    // Limit number of ingredients to reduce payload size
    const limitedIngredients = ingredients.slice(0, 10);
    
    // Call API with timeout handling
    const response = await api.post('/chatbot/suggest', { 
      ingredients: limitedIngredients 
    });
    
    return response.data.data.suggestions;
  } catch (error) {
    console.error('Error getting recipe suggestions:', error);
    
    // Provide more detailed error messages
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('The suggestion request took too long. Please try with fewer ingredients or try again later.');
    }
    
    throw new Error(
      error.response?.data?.error || 
      'Failed to get recipe suggestions. Please try again later.'
    );
  }
};

/**
 * Create a mock response for offline mode or when API fails
 * This can be used as a fallback when the API is unavailable
 * @param {string} message - User's message
 * @returns {string} - Mock response
 */
export const getMockResponse = (message) => {
  // Simple keyword matching for offline mode
  const msgLower = message.toLowerCase();
  
  if (msgLower.includes('hello') || msgLower.includes('hi')) {
    return "Hello! I'm Cookie 🎀, your recipe assistant. How can I help you today?";
  }
  
  if (msgLower.includes('recipe') || msgLower.includes('cook')) {
    return "I'd be happy to help with recipes! You can ask me for ideas based on ingredients you have, cooking techniques, or specific cuisines.";
  }
  
  if (msgLower.includes('ingredient')) {
    return "Ingredients are the foundation of any recipe. What ingredients do you have that you'd like to cook with?";
  }
  
  // Recipe keyword detection for common dishes
  if (msgLower.includes('biryani') || msgLower.includes('rice')) {
    return `Here's a simple Chicken Biryani recipe:

1. Marinate 500g chicken pieces with 1 cup yogurt, 1 tsp turmeric, 1 tsp chili powder, 1 tbsp ginger-garlic paste, and salt. Rest for 1 hour.

2. Cook 2 cups basmati rice with whole spices (bay leaves, cardamom, cloves) until 70% done. Drain and set aside.

3. In a heavy pot, fry 2 sliced onions until golden. Add marinated chicken and cook for 5-7 minutes.

4. Layer partially cooked rice over chicken. Sprinkle with fresh herbs, saffron-infused milk, and ghee.

5. Cover tightly and cook on low heat for 20-25 minutes until rice is fully cooked.

Serve hot with raita!`;
  }
  
  if (msgLower.includes('pasta') || msgLower.includes('spaghetti')) {
    return `Here's a quick Pasta recipe:

1. Boil 250g pasta in salted water until al dente (follow package instructions).

2. While pasta cooks, heat 3 tbsp olive oil in a pan and sauté 4 minced garlic cloves until fragrant.

3. Add 2 cups cherry tomatoes (halved) and cook until softened.

4. Drain pasta, reserving 1/4 cup of pasta water.

5. Add pasta to the pan with tomatoes, along with reserved water, fresh basil, salt, and pepper.

6. Toss everything together and finish with grated Parmesan cheese.

Simple, delicious, and ready in about 20 minutes!`;
  }
  
  // Default response
  return "I'm here to help with your cooking questions. You can ask me about recipes, ingredients, or cooking techniques!";
};