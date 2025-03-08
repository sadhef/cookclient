// client/src/context/ChatbotContext.js
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

  // Function to send the sequential messages
  const sendSequentialMessages = () => {
    setIsTyping(true);
    
    // First response after 2 seconds
    setTimeout(() => {
      const response1 = {
        id: `bot-seq-1-${Date.now()}`,
        text: t('chatbot_response_1'),
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, response1]);
      
      // Second response after 2 more seconds (4 seconds total)
      setTimeout(() => {
        const response2 = {
          id: `bot-seq-2-${Date.now()}`,
          text: t('chatbot_response_2'),
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, response2]);
        
        // Third response after 2 more seconds (6 seconds total)
        setTimeout(() => {
          const response3 = {
            id: `bot-seq-3-${Date.now()}`,
            text: t('chatbot_response_3'),
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, response3]);
          
          // Fourth response after 2 more seconds (8 seconds total)
          setTimeout(() => {
            const response4 = {
              id: `bot-seq-4-${Date.now()}`,
              text: t('chatbot_response_4'),
              isUser: false,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, response4]);
            setIsTyping(false);
          }, 2000);
        }, 2000);
      }, 2000);
    }, 2000);
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
    
    // Check if the user message is "hi" (case insensitive)
    if (text.trim().toLowerCase() === 'hi') {
      // Send the special sequence of responses
      sendSequentialMessages();
      return;
    }
    
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
      } else {
        try {
          // Get chatbot response with a timeout of 25 seconds
          const responsePromise = getChatbotResponse(text, messages);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Response timeout')), 25000)
          );
          
          response = await Promise.race([responsePromise, timeoutPromise]);
        } catch (error) {
          console.error('API request failed, falling back to offline mode:', error);
          setIsOfflineMode(true);
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
      } else {
        try {
          // Get suggestions with a timeout of 25 seconds
          const suggestionsPromise = suggestRecipes(ingredients);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Suggestions timeout')), 25000)
          );
          
          suggestions = await Promise.race([suggestionsPromise, timeoutPromise]);
        } catch (error) {
          console.error('API request failed, falling back to offline mode:', error);
          setIsOfflineMode(true);
          
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
  
  // Reset offline mode
  const resetOfflineMode = () => {
    setIsOfflineMode(false);
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
    resetOfflineMode,
    sendSequentialMessages
  };
  
  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
};