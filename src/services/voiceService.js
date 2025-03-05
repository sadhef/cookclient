import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

// Language codes for speech recognition
const languageCodes = {
  en: 'en-US',
  ml: 'ml-IN',
  ta: 'ta-IN'
};

// Command patterns for different languages
const commandPatterns = {
  en: {
    ingredients: ['ingredient', 'ingredients'],
    instructions: ['instruction', 'instructions', 'steps', 'how to'],
    nutrition: ['nutrition', 'nutritional', 'calories', 'protein'],
    next: ['next', 'next step', 'continue'],
    previous: ['previous', 'back', 'go back'],
    repeat: ['repeat', 'again', 'say again']
  },
  ml: {
    ingredients: ['ചേരുവകൾ', 'സാധനങ്ങൾ'],
    instructions: ['നിർദ്ദേശങ്ങൾ', 'ഘട്ടങ്ങൾ', 'എങ്ങനെ'],
    nutrition: ['പോഷകം', 'കലോറികൾ', 'പ്രോട്ടീൻ'],
    next: ['അടുത്തത്', 'തുടരുക'],
    previous: ['മുൻപത്തെ', 'തിരികെ', 'പിന്നോട്ട്'],
    repeat: ['ആവർത്തിക്കുക', 'വീണ്ടും']
  },
  ta: {
    ingredients: ['பொருட்கள்', 'பொருட்களை'],
    instructions: ['செய்முறை', 'படிகள்', 'எப்படி'],
    nutrition: ['ஊட்டச்சத்து', 'கலோரிகள்', 'புரதம்'],
    next: ['அடுத்து', 'தொடர்'],
    previous: ['முந்தைய', 'பின்னால்', 'திரும்பி'],
    repeat: ['மீண்டும்', 'திரும்ப']
  }
};

// Initialize a SpeechRecognition instance
const initializeSpeechRecognition = () => {
  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
    console.warn('Speech Recognition API is not supported in this browser');
    return null;
  }
  
  // Use standard or webkit prefix
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  return new SpeechRecognition();
};

// Text-to-speech function
const speak = (text, language = 'en') => {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageCodes[language] || 'en-US';
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn('Speech Synthesis API is not supported in this browser');
  }
};

// Custom hook for voice control
export const useVoiceControl = (recipeData) => {
  const { currentLanguage, t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [voiceResponse, setVoiceResponse] = useState('');
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  
  // Initialize speech recognition on component mount
  useEffect(() => {
    const recognitionInstance = initializeSpeechRecognition();
    if (recognitionInstance) {
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      
      recognitionInstance.onresult = (event) => {
        const current = event.resultIndex;
        const newTranscript = event.results[current][0].transcript;
        setTranscript(newTranscript);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech Recognition Error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceResponse(t('microphone_permission_denied'));
        } else {
          setVoiceResponse(t('error_occurred'));
        }
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        // Don't set isListening to false here to prevent issues with manual stopping
      };
      
      setRecognition(recognitionInstance);
    }
    
    // Cleanup on unmount
    return () => {
      if (recognitionInstance) {
        recognitionInstance.abort();
      }
    };
  }, [t]);
  
  // Update language whenever currentLanguage changes
  useEffect(() => {
    if (recognition) {
      recognition.lang = languageCodes[currentLanguage] || 'en-US';
    }
  }, [currentLanguage, recognition]);
  
  // Define command patterns based on current language
  const patterns = commandPatterns[currentLanguage] || commandPatterns.en;
  
  // Function to process voice commands
  const processCommand = useCallback((command) => {
    const lowerCommand = command.toLowerCase();
    let response = '';
    
    // Check if command matches ingredients pattern
    if (patterns.ingredients.some(pattern => lowerCommand.includes(pattern))) {
      if (recipeData?.ingredients?.length > 0) {
        response = `${t('ingredients')}: ${recipeData.ingredients.join(', ')}`;
      } else {
        response = t('no_ingredients');
      }
    } 
    
    // Check if command matches instructions pattern
    else if (patterns.instructions.some(pattern => lowerCommand.includes(pattern))) {
      if (recipeData?.instructions?.length > 0) {
        response = `${t('instructions')}: ${recipeData.instructions[currentStep]}`;
      } else {
        response = t('no_instructions');
      }
    } 
    
    // Check if command matches nutrition pattern
    else if (patterns.nutrition.some(pattern => lowerCommand.includes(pattern))) {
      if (recipeData?.nutrition) {
        const nutritionInfo = recipeData.nutrition;
        response = `${t('nutritional_information')}: ${t('calories')} ${nutritionInfo.calories?.value || 0} ${t('protein')} ${nutritionInfo.protein?.value || 0}g, ${t('carbs')} ${nutritionInfo.carbs?.value || 0}g, ${t('fats')} ${nutritionInfo.fats?.value || 0}g`;
      } else {
        response = t('no_nutrition_info');
      }
    } 
    
    // Check if command matches next step pattern
    else if (patterns.next.some(pattern => lowerCommand.includes(pattern))) {
      if (recipeData?.instructions?.length > 0) {
        if (currentStep < recipeData.instructions.length - 1) {
          setCurrentStep(prev => prev + 1);
          response = recipeData.instructions[currentStep + 1];
        } else {
          response = t('recipe_complete');
        }
      } else {
        response = t('no_instructions');
      }
    } 
    
    // Check if command matches previous step pattern
    else if (patterns.previous.some(pattern => lowerCommand.includes(pattern))) {
      if (recipeData?.instructions?.length > 0) {
        if (currentStep > 0) {
          setCurrentStep(prev => prev - 1);
          response = recipeData.instructions[currentStep - 1];
        } else {
          response = t('first_step');
        }
      } else {
        response = t('no_instructions');
      }
    } 
    
    // Check if command matches repeat pattern
    else if (patterns.repeat.some(pattern => lowerCommand.includes(pattern))) {
      if (recipeData?.instructions?.length > 0) {
        response = recipeData.instructions[currentStep];
      } else {
        response = t('no_instructions');
      }
    } 
    
    // Command not recognized
    else {
      response = t('command_not_recognized');
    }
    
    setVoiceResponse(response);
    speak(response, currentLanguage);
    
    return response;
  }, [recipeData, currentStep, currentLanguage, t, patterns.ingredients, patterns.instructions, patterns.nutrition, patterns.next, patterns.previous, patterns.repeat]);
  
  // Process transcript when it changes
  useEffect(() => {
    if (transcript && isListening) {
      processCommand(transcript);
      setTranscript('');
    }
  }, [transcript, isListening, processCommand]);
  
  // Start voice control
  const startVoiceControl = useCallback(() => {
    if (!recognition) {
      setVoiceResponse(t('browser_not_supported'));
      return;
    }
    
    if (!isListening) {
      try {
        recognition.start();
        setIsListening(true);
        setVoiceResponse(t('listening'));
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setVoiceResponse(t('error_starting_recognition'));
      }
    }
  }, [isListening, recognition, t]);
  
  // Stop voice control
  const stopVoiceControl = useCallback(() => {
    if (recognition && isListening) {
      try {
        recognition.stop();
        setIsListening(false);
        setVoiceResponse('');
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
  }, [isListening, recognition]);
  
  // Toggle voice control
  const toggleVoiceControl = useCallback(() => {
    if (isListening) {
      stopVoiceControl();
    } else {
      startVoiceControl();
    }
  }, [isListening, startVoiceControl, stopVoiceControl]);

  return {
    isListening,
    voiceResponse,
    currentStep,
    startVoiceControl,
    stopVoiceControl,
    toggleVoiceControl,
    speak: (text) => speak(text, currentLanguage),
    browserSupported: !!recognition
  };
};