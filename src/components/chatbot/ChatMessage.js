import React from 'react';
import ReactMarkdown from 'react-markdown';
import { FaUser, FaRobot } from 'react-icons/fa';
import { motion } from 'framer-motion';

const ChatMessage = ({ message }) => {
  const { text, isUser, isError } = message;
  
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
        <div className={`${getBgColor()} p-3 rounded-lg`}>
          {/* Use ReactMarkdown for bot messages, plain text for user */}
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
      </div>
    </motion.div>
  );
};

export default ChatMessage;