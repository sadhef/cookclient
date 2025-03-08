import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaRobot, FaPaperPlane, FaTrash } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { getChatbotResponse } from '../services/chatbotService';

const Chatbot = ({ isOpen, onClose, initialIngredients = [] }) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Initialize chat with welcome message
  useEffect(() => {
    if (isOpen) {
      // Clear previous chat when opening
      setMessages([
        {
          role: 'assistant',
          content: t('chatbot_welcome'),
          timestamp: new Date().toISOString()
        }
      ]);
      
      // Send sequential messages after the initial welcome
      setTimeout(() => {
        setMessages(prevMessages => [
          ...prevMessages,
          {
            role: 'assistant',
            content: t('chatbot_welcome_msg1'),
            timestamp: new Date().toISOString()
          }
        ]);
        
        // Send second message
        setTimeout(() => {
          setMessages(prevMessages => [
            ...prevMessages,
            {
              role: 'assistant',
              content: t('chatbot_welcome_msg2'),
              timestamp: new Date().toISOString()
            }
          ]);
          
          // Send third message
          setTimeout(() => {
            setMessages(prevMessages => [
              ...prevMessages,
              {
                role: 'assistant',
                content: t('chatbot_welcome_msg3'),
                timestamp: new Date().toISOString()
              }
            ]);
            
            // Send fourth message
            setTimeout(() => {
              setMessages(prevMessages => [
                ...prevMessages,
                {
                  role: 'assistant',
                  content: t('chatbot_welcome_msg4'),
                  timestamp: new Date().toISOString()
                }
              ]);
            }, 2000);
          }, 2000);
        }, 2000);
      }, 2000);
      
      // If there are initial ingredients, suggest a prompt
      if (initialIngredients && initialIngredients.length > 0) {
        const ingredientsString = initialIngredients.join(', ');
        setInputValue(`${t('chatbot_ingredients_prompt')}: ${ingredientsString}`);
      }
    }
  }, [isOpen, t, initialIngredients]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    const userMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    
    try {
      const response = await getChatbotResponse(userMessage.content);
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.data.message || response.data,
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error getting chatbot response:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: t('chatbot_error'),
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: t('chatbot_welcome'),
        timestamp: new Date().toISOString()
      }
    ]);
    
    // Send sequential messages again after clearing
    setTimeout(() => {
      setMessages(prevMessages => [
        ...prevMessages,
        {
          role: 'assistant',
          content: t('chatbot_welcome_msg1'),
          timestamp: new Date().toISOString()
        }
      ]);
      
      setTimeout(() => {
        setMessages(prevMessages => [
          ...prevMessages,
          {
            role: 'assistant',
            content: t('chatbot_welcome_msg2'),
            timestamp: new Date().toISOString()
          }
        ]);
        
        setTimeout(() => {
          setMessages(prevMessages => [
            ...prevMessages,
            {
              role: 'assistant',
              content: t('chatbot_welcome_msg3'),
              timestamp: new Date().toISOString()
            }
          ]);
          
          setTimeout(() => {
            setMessages(prevMessages => [
              ...prevMessages,
              {
                role: 'assistant',
                content: t('chatbot_welcome_msg4'),
                timestamp: new Date().toISOString()
              }
            ]);
          }, 2000);
        }, 2000);
      }, 2000);
    }, 2000);
  };
  
  // If not open, don't render
  if (!isOpen) return null;
  
  return (
    <div className="fixed bottom-0 right-0 w-full sm:w-96 h-[70vh] bg-white rounded-t-xl shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-rose-400 text-white p-4 rounded-t-xl flex justify-between items-center">
        <div className="flex items-center">
          <div className="bg-white p-2 rounded-full mr-3">
            <FaRobot className="text-pink-500" />
          </div>
          <div>
            <h3 className="font-bold">Cookie 🎀</h3>
            <p className="text-xs opacity-80">{t('chatbot_subtitle')}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={clearChat}
            className="p-2 hover:bg-pink-500/30 rounded-full transition-colors"
            aria-label={t('clear_chat')}
            title={t('clear_chat')}
          >
            <FaTrash size={16} />
          </button>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-pink-500/30 rounded-full transition-colors"
            aria-label={t('close_chatbot')}
            title={t('close_chatbot')}
          >
            <FaTimes size={18} />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-rose-50">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] p-3 rounded-xl shadow-sm ${
                  message.role === 'user' 
                    ? 'bg-pink-500 text-white rounded-tr-none' 
                    : 'bg-white rounded-tl-none'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <span className="text-xs opacity-60 mt-1 block">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm max-w-[80%]">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce delay-75"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('chatbot_input_placeholder')}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-l-full focus:outline-none focus:border-pink-400"
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-pink-400 to-rose-400 text-white py-2 px-4 rounded-r-full disabled:opacity-50"
            disabled={loading || !inputValue.trim()}
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chatbot;