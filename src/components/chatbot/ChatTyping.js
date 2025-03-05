import React from 'react';
import { FaRobot } from 'react-icons/fa';
import { motion } from 'framer-motion';

const ChatTyping = () => {
  return (
    <div className="flex w-full justify-start mb-3">
      <div className="flex max-w-[85%] flex-row">
        {/* Robot avatar */}
        <div className="flex-shrink-0 h-8 w-8 rounded-full mr-2 flex items-center justify-center bg-gray-700">
          <FaRobot className="text-white text-sm" />
        </div>
        
        {/* Typing indicator */}
        <div className="bg-gray-100 p-3 rounded-lg flex items-center">
          <div className="flex space-x-1">
            {[0, 1, 2].map((dot) => (
              <motion.div
                key={dot}
                className="h-2 w-2 bg-gray-400 rounded-full"
                animate={{
                  y: ["0%", "-50%", "0%"]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  repeatType: "loop",
                  delay: dot * 0.2
                }}
              />
            ))}
          </div>
          <span className="ml-2 text-gray-500 text-sm">Rifi is typing...</span>
        </div>
      </div>
    </div>
  );
};

export default ChatTyping;