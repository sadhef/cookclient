import React, { useRef, useEffect } from 'react';
import { FaPaperPlane, FaTrash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../context/ChatbotContext';
import { useLanguage } from '../../context/LanguageContext';
import ChatMessage from './ChatMessage';
import ChatTyping from './ChatTyping';

const ChatBot = () => {
  const { 
    isOpen, 
    messages, 
    isTyping, 
    inputValue, 
    setInputValue, 
    sendMessage,
    clearChat
  } = useChat();
  const { t } = useLanguage();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);
  
  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300);
    }
  }, [isOpen]);
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue);
    }
  };
  
  // Animation variants for the chat container
  const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: 'spring',
        damping: 20,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95,
      transition: { 
        duration: 0.2 
      }
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] bg-white rounded-lg shadow-xl z-20 flex flex-col"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Chat header */}
          <div className="bg-primary text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2">
                <FaPaperPlane className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold"> Cookie 🎀</h3>
                <p className="text-xs opacity-80">{t('chatbot_subtitle')}</p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="text-white opacity-70 hover:opacity-100 transition-opacity"
              title={t('clear_chat')}
              aria-label={t('clear_chat')}
            >
              <FaTrash />
            </button>
          </div>
          
          {/* Chat messages */}
          <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isTyping && <ChatTyping />}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Chat input */}
          <form 
            onSubmit={handleSubmit}
            className="p-3 border-t border-gray-200 flex items-center"
          >
            <input
              type="text"
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('chatbot_input_placeholder')}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              disabled={isTyping}
            />
            <button
              type="submit"
              className={`px-4 py-2 rounded-r-lg text-white ${
                isTyping ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'
              }`}
              disabled={isTyping || !inputValue.trim()}
            >
              <FaPaperPlane />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatBot;