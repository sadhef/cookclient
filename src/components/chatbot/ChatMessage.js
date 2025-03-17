import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FaUser, FaRobot, FaAngleDown, FaAngleUp } from 'react-icons/fa';
import { motion } from 'framer-motion';

const ChatMessage = ({ message }) => {
  const { text, isUser, isError } = message;
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Check if message is long to show collapse/expand option
  const isLongMessage = text.length > 500;
  
  // Determine background color based on message type
  const getBgColor = () => {
    if (isUser) {
      return 'bg-primary-light';
    } else if (isError) {
      return 'bg-red-100';
    } else {
      return 'bg-gray-100';
    }
  };
  
  // Message animation variants
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  // Handle toggle expand/collapse
  const toggleExpand = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  return (
    <motion.div
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ duration: 0.3 }}
    >
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 rounded-full ${isUser ? 'ml-2' : 'mr-2'} 
                        flex items-center justify-center ${isUser ? 'bg-primary' : 'bg-gray-700'}`}>
          {isUser ? (
            <FaUser className="text-white text-sm" />
          ) : (
            <FaRobot className="text-white text-sm" />
          )}
        </div>
        
        {/* Message bubble */}
        <div className={`${getBgColor()} p-3 rounded-lg relative`}>
          {/* Use ReactMarkdown for bot messages, plain text for user */}
          <div className={`${!isExpanded && isLongMessage ? 'max-h-32 overflow-hidden' : ''}`}>
            {isUser ? (
              <p className="text-gray-800 text-sm whitespace-pre-wrap break-words">{text}</p>
            ) : (
              <ReactMarkdown 
                className="text-gray-800 text-sm markdown-content"
                components={{
                  // Style markdown elements
                  p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                  // Fix for anchor accessibility warning:
                  a: ({ node, children, ...props }) => (
                    <a className="text-primary hover:underline" {...props}>
                      {children}
                    </a>
                  ),
                  strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                  em: ({ node, ...props }) => <em className="italic" {...props} />
                }}
              >
                {text}
              </ReactMarkdown>
            )}
          </div>
          
          {/* Expand/collapse button for long messages */}
          {isLongMessage && (
            <button 
              onClick={toggleExpand}
              className="mt-1 text-xs flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isExpanded ? (
                <>
                  <FaAngleUp className="mr-1" />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <FaAngleDown className="mr-1" />
                  <span>Read more</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;