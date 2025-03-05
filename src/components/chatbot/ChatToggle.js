import React from 'react';
import { FaRobot, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useChat } from '../../context/ChatbotContext';
import { useLanguage } from '../../context/LanguageContext';

const ChatToggle = () => {
  const { isOpen, toggleChat } = useChat();
  const { t } = useLanguage();
  
  return (
    <motion.div
      className="fixed right-6 bottom-6 z-30"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <button
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary-dark'
        }`}
        onClick={toggleChat}
        aria-label={isOpen ? t('close_chatbot') : t('open_chatbot')}
        title={isOpen ? t('close_chatbot') : t('open_chatbot')}
      >
        {isOpen ? (
          <FaTimes className="text-white text-xl" />
        ) : (
          <FaRobot className="text-white text-xl" />
        )}
      </button>
    </motion.div>
  );
};

export default ChatToggle;