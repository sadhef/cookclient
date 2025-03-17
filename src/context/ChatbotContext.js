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
      } else {
        try {
          // Get chatbot response with a timeout handling
          const responsePromise = getChatbotResponse(text, messages);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Response timeout')), 40000) // Increased timeout to 40 seconds
          );
          
          response = await Promise.race([responsePromise, timeoutPromise]);
          
          // FIX: Handle response chunking if it's too long
          if (response && response.length > 2000) {
            // Break the response into smaller chunks of max 1500 characters
            // Try to break at paragraph or sentence boundaries
            const chunks = [];
            let currentChunk = '';
            
            // Split by paragraphs first
            const paragraphs = response.split('\n\n');
            
            for (const paragraph of paragraphs) {
              if (currentChunk.length + paragraph.length + 2 <= 1500) {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
              } else {
                // Check if current chunk needs to be broken down further
                if (currentChunk) {
                  chunks.push(currentChunk);
                  currentChunk = paragraph;
                } else {
                  // If a single paragraph is too long, break it by sentences
                  const sentences = paragraph.split(/(?<=[.!?])\s+/);
                  for (const sentence of sentences) {
                    if (currentChunk.length + sentence.length + 1 <= 1500) {
                      currentChunk += (currentChunk ? ' ' : '') + sentence;
                    } else {
                      chunks.push(currentChunk);
                      currentChunk = sentence;
                    }
                  }
                }
              }
            }
            
            // Add the last chunk if it exists
            if (currentChunk) {
              chunks.push(currentChunk);
            }
            
            // Send the chunks as separate messages
            for (let i = 0; i < chunks.length; i++) {
              const botMessage = {
                id: `bot-${Date.now()}-${i}`,
                text: chunks[i],
                isUser: false,
                timestamp: new Date()
              };
              
              setMessages(prev => [...prev, botMessage]);
              
              // If there are more chunks, add a small delay between messages
              if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
            
            setIsTyping(false);
            return;
          }
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
          // Get suggestions with an increased timeout of 40 seconds
          const suggestionsPromise = suggestRecipes(ingredients);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Suggestions timeout')), 40000)
          );
          
          suggestions = await Promise.race([suggestionsPromise, timeoutPromise]);
          
          // Similar chunking logic for long recipe suggestions
          if (suggestions && suggestions.length > 2000) {
            const chunks = suggestions.split(/(?<=\d\.\s.*?\n\n)/g).filter(chunk => chunk.trim());
            
            for (let i = 0; i < chunks.length; i++) {
              const suggestionMessage = {
                id: `bot-${Date.now()}-${i}`,
                text: chunks[i],
                isUser: false,
                timestamp: new Date()
              };
              
              setMessages(prev => [...prev, suggestionMessage]);
              
              // If there are more chunks, add a small delay between messages
              if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
            
            setIsTyping(false);
            return;
          }
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
    resetOfflineMode
  };
  
  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
};