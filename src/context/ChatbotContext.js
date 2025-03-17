import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { getChatbotResponse, suggestRecipes, getMockResponse } from '../services/chatbotService';

const ChatbotContext = createContext();

export const useChat = () => useContext(ChatbotContext);

export const ChatbotProvider = ({ children }) => {
  const { t, currentLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  
  // Initialize with welcome message
  useEffect(() => {
    // Add welcome message in the current language
    const welcomeMessage = {
      id: 'welcome',
      text: t('chatbot_welcome'),
      isUser: false,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
  }, [currentLanguage, t]);
  
  // Toggle chatbot visibility
  const toggleChat = () => {
    setIsOpen(prevState => !prevState);
  };
  
  // Send a message to the chatbot
  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    // Add user message to conversation
    const userMessage = {
      id: `user-${Date.now()}`,
      text,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    
    // Add a delay to simulate thinking (min 1s, max 1.5s + 100ms per character up to 3s)
    const thinkingDelay = Math.min(
      3000, 
      1000 + Math.min(text.length * 100, 2000)
    );
    
    try {
      // Wait for the simulated thinking delay (natural UX)
      await new Promise(resolve => setTimeout(resolve, thinkingDelay));
      
      let response;
      
      if (isOfflineMode) {
        // Use offline mode response
        response = getMockResponse(text);
        setConsecutiveErrors(0); // Reset error counter in offline mode
      } else {
        try {
          // Get chatbot response with an increased timeout of 60 seconds
          response = await getChatbotResponse(text, messages);
          setConsecutiveErrors(0); // Reset error counter on success
        } catch (error) {
          console.error('API request failed, falling back to offline mode:', error);
          setConsecutiveErrors(prev => prev + 1);
          
          // If we have 3 consecutive errors, switch to offline mode permanently
          if (consecutiveErrors >= 2) {
            setIsOfflineMode(true);
          }
          
          response = getMockResponse(text);
          
          // Send a fallback error first
          const errorMessage = {
            id: `error-${Date.now()}`,
            text: `I'm having trouble connecting to my knowledge base. I'll do my best to help with limited information.`,
            isUser: false,
            isError: true,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, errorMessage]);
          
          // Short delay before sending offline response
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Add chatbot response to conversation
      const botMessage = {
        id: `bot-${Date.now()}`,
        text: response,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      setConsecutiveErrors(prev => prev + 1);
      
      // Add error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        text: error.message || t('chatbot_error'),
        isUser: false,
        isError: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  // Get recipe suggestions based on ingredients
  const getRecipeSuggestions = async (ingredients) => {
    setIsTyping(true);
    
    try {
      // Add user message showing the ingredients
      const userMessage = {
        id: `user-${Date.now()}`,
        text: `${t('chatbot_ingredients_prompt')}: ${ingredients.join(', ')}`,
        isUser: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Simulated thinking delay (1-3 seconds based on number of ingredients)
      const thinkingDelay = Math.min(3000, 1000 + ingredients.length * 200);
      await new Promise(resolve => setTimeout(resolve, thinkingDelay));
      
      let suggestions;
      
      if (isOfflineMode) {
        // Use offline mode suggestions
        suggestions = `Based on the ingredients (${ingredients.join(', ')}), here are some simple ideas:
        
1. Quick Stir Fry: Use any vegetables and protein you have, add soy sauce, and serve over rice.

2. Simple Pasta: Boil pasta, then mix with olive oil, garlic, and any vegetables or protein you have.

3. Versatile Salad: Combine your fresh ingredients with a simple dressing of oil, vinegar, salt, and pepper.

Try searching for these basic recipes in the COokiFy search bar for more detailed instructions!`;
        
        setConsecutiveErrors(0); // Reset error counter in offline mode
      } else {
        try {
          // Get suggestions with an increased timeout of 60 seconds
          suggestions = await suggestRecipes(ingredients);
          setConsecutiveErrors(0); // Reset error counter on success
        } catch (error) {
          console.error('API request failed, falling back to offline mode:', error);
          setConsecutiveErrors(prev => prev + 1);
          
          // If we have 3 consecutive errors, switch to offline mode permanently
          if (consecutiveErrors >= 2) {
            setIsOfflineMode(true);
          }
          
          suggestions = `Based on the ingredients (${ingredients.join(', ')}), here are some simple ideas:
          
1. Quick Stir Fry: Use any vegetables and protein you have, add soy sauce, and serve over rice.

2. Simple Pasta: Boil pasta, then mix with olive oil, garlic, and any vegetables or protein you have.

3. Versatile Salad: Combine your fresh ingredients with a simple dressing of oil, vinegar, salt, and pepper.

Try searching for these basic recipes in the COokiFy search bar for more detailed instructions!`;
          
          // Send a fallback error first
          const errorMessage = {
            id: `error-${Date.now()}`,
            text: `I'm having trouble generating detailed suggestions right now. Here are some basic ideas instead:`,
            isUser: false,
            isError: true,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, errorMessage]);
          
          // Short delay before sending offline response
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Add suggestion message
      const suggestionMessage = {
        id: `bot-${Date.now()}`,
        text: suggestions,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, suggestionMessage]);
    } catch (error) {
      console.error('Error getting recipe suggestions:', error);
      setConsecutiveErrors(prev => prev + 1);
      
      // Add error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        text: error.message || t('chatbot_suggestion_error'),
        isUser: false,
        isError: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  // Reset offline mode and error counter
  const resetOfflineMode = () => {
    setIsOfflineMode(false);
    setConsecutiveErrors(0);
  };
  
  // Clear chat history
  const clearChat = () => {
    const welcomeMessage = {
      id: 'welcome',
      text: t('chatbot_welcome'),
      isUser: false,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    resetOfflineMode(); // Try online mode again when chat is cleared
  };
  
  // Values provided to consumers
  const value = {
    isOpen,
    messages,
    isTyping,
    inputValue,
    isOfflineMode,
    setInputValue,
    toggleChat,
    sendMessage,
    getRecipeSuggestions,
    clearChat,
    resetOfflineMode
  };
  
  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
};