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
    
    // If message is too long, trim it to reduce timeout risk
    const trimmedMessage = message.length > 500 ? 
      message.substring(0, 500) + '...' : 
      message;
    
    // Call API with increased timeout (60 seconds instead of 25)
    const responsePromise = api.post('/chatbot/message', {
      message: trimmedMessage,
      history: formattedHistory.slice(-5) // Only send last 5 messages to reduce payload size
    });
    
    // Set longer timeout for the request
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Response timeout')), 60000) // 60 seconds timeout
    );
    
    // Race both promises
    const response = await Promise.race([responsePromise, timeoutPromise]);
    
    return response.data.data.response;
  } catch (error) {
    console.error('Error getting chatbot response:', error);
    
    // Provide more detailed error messages
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Request timed out. The server is taking too long to respond. Please try a shorter message or try again later.');
    }
    
    // If the error has a response with specific error message, use that
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    
    // Otherwise use a generic error message
    throw new Error(
      'Failed to communicate with Cookie 🎀. Please try again in a moment.'
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
    
    // Call API with increased timeout
    const suggestionsPromise = api.post('/chatbot/suggest', { 
      ingredients: limitedIngredients 
    });
    
    // Set longer timeout for the request
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Suggestions timeout')), 60000) // 60 seconds timeout
    );
    
    // Race both promises
    const response = await Promise.race([suggestionsPromise, timeoutPromise]);
    
    return response.data.data.suggestions;
  } catch (error) {
    console.error('Error getting recipe suggestions:', error);
    
    // Provide more detailed error messages
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('The suggestion request took too long. Please try with fewer ingredients or try again later.');
    }
    
    // If the error has a response with specific error message, use that
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    
    // Otherwise use a generic error message
    throw new Error(
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

  if (msgLower.includes('timeout') || msgLower.includes('error') || msgLower.includes('not working')) {
    return "I'm currently having trouble connecting to my knowledge base. This could be due to high traffic or network issues. You can try again with a shorter message, or try again later.";
  }
  
  // Default response
  return "I'm here to help with your cooking questions. You can ask me about recipes, ingredients, or cooking techniques!";
};