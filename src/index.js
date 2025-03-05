import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './styles/index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Check for SpeechRecognition support and create polyfill if needed
if (!window.SpeechRecognition && window.webkitSpeechRecognition) {
  window.SpeechRecognition = window.webkitSpeechRecognition;
}

// Request microphone permission as early as possible
const requestMicrophonePermission = async () => {
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Just request access - we'll actually use it later
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');
    }
  } catch (error) {
    console.warn('Microphone permission denied or not available:', error);
  }
};

// Try to request permission, but don't block app loading
requestMicrophonePermission();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <App />
          <ToastContainer position="bottom-right" />
        </LanguageProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);