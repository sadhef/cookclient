import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

// Language codes for speech recognition
const languageCodes = {
  en: 'en-US',
  ml: 'ml-IN',
  ta: 'ta-IN'
};

// Command patterns for different languages with more variations
const commandPatterns = {
  en: {
    ingredients: ['ingredient', 'ingredients', 'what ingredients', 'show ingredients', 'list ingredients', 'what do i need'],
    instructions: ['instruction', 'instructions', 'steps', 'how to', 'how do i', 'what to do', 'recipe steps', 'method'],
    nutrition: ['nutrition', 'nutritional', 'calories', 'protein', 'nutritional info', 'nutrition facts', 'how many calories'],
    next: ['next', 'next step', 'continue', 'what next', 'move on', 'forward', 'proceed', 'go on'],
    previous: ['previous', 'back', 'go back', 'step back', 'before', 'earlier step', 'last step'],
    repeat: ['repeat', 'again', 'say again', 'what was that', 'repeat step', 'one more time']
  },
  ml: {
    ingredients: ['ചേരുവകൾ', 'സാധനങ്ങൾ', 'എന്തൊക്കെ വേണം', 'എന്തൊക്കെയാണ് ചേരുവകൾ'],
    instructions: ['നിർദ്ദേശങ്ങൾ', 'ഘട്ടങ്ങൾ', 'എങ്ങനെ', 'എങ്ങനെ ചെയ്യണം', 'സൂചനകൾ'],
    nutrition: ['പോഷകം', 'കലോറികൾ', 'പ്രോട്ടീൻ', 'പോഷകവിവരം', 'പോഷകമൂല്യം'],
    next: ['അടുത്തത്', 'തുടരുക', 'അടുത്ത ഘട്ടം', 'മുന്നോട്ട്'],
    previous: ['മുൻപത്തെ', 'തിരികെ', 'പിന്നോട്ട്', 'മുൻപത്തെ ഘട്ടം'],
    repeat: ['ആവർത്തിക്കുക', 'വീണ്ടും', 'ഒന്നുകൂടി പറയുക', 'വീണ്ടും പറയുക']
  },
  ta: {
    ingredients: ['பொருட்கள்', 'பொருட்களை', 'தேவையான பொருட்கள்', 'என்ன பொருட்கள்'],
    instructions: ['செய்முறை', 'படிகள்', 'எப்படி', 'எப்படி செய்வது', 'வழிமுறைகள்'],
    nutrition: ['ஊட்டச்சத்து', 'கலோரிகள்', 'புரதம்', 'ஊட்டச்சத்து தகவல்'],
    next: ['அடுத்து', 'தொடர்', 'அடுத்த படி', 'முன்னோக்கி'],
    previous: ['முந்தைய', 'பின்னால்', 'திரும்பி', 'முந்தைய படி'],
    repeat: ['மீண்டும்', 'திரும்ப', 'மீண்டும் சொல்', 'ஒரு முறை கூட']
  }
};

// Check for browser support of speech recognition
const checkBrowserSupportForSpeech = () => {
  if (!window) return false;
  
  // Check for speech recognition
  const speechRecognitionSupported = !!(
    window.SpeechRecognition || 
    window.webkitSpeechRecognition || 
    window.mozSpeechRecognition || 
    window.msSpeechRecognition
  );
  
  // Check for speech synthesis
  const speechSynthesisSupported = !!(
    window.speechSynthesis && 
    typeof window.speechSynthesis.speak === 'function'
  );
  
  return {
    recognition: speechRecognitionSupported,
    synthesis: speechSynthesisSupported
  };
};

// Direct browser Speech Recognition (not using react-speech-recognition)
const createSpeechRecognition = (language = 'en-US', onResult, onEnd) => {
  const SpeechRecognition = window.SpeechRecognition || 
    window.webkitSpeechRecognition || 
    window.mozSpeechRecognition ||
    window.msSpeechRecognition;
  
  if (!SpeechRecognition) return null;
  
  const recognition = new SpeechRecognition();
  recognition.lang = language;
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  
  recognition.onresult = (event) => {
    const last = event.results.length - 1;
    const result = event.results[last][0].transcript;
    console.log(`Speech recognized: ${result} (confidence: ${event.results[last][0].confidence})`);
    if (onResult && typeof onResult === 'function') {
      onResult(result);
    }
  };
  
  recognition.onend = () => {
    console.log('Speech recognition ended');
    if (onEnd && typeof onEnd === 'function') {
      onEnd();
    }
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
  };
  
  return recognition;
};

// Voice preferences - can be customized based on user preferences
const voicePreferences = {
  en: {
    // For Jarvis-like experience, prefer British male voice
    preferredGender: 'male',
    // Prioritize British voices like those in Iron Man's J.A.R.V.I.S.
    preferredVoiceNames: ['Google UK English Male', 'Microsoft George', 'Daniel', 'British Male']
  },
  ml: {
    preferredGender: 'male',
    preferredVoiceNames: []
  },
  ta: {
    preferredGender: 'male',
    preferredVoiceNames: []
  }
};

// Text-to-speech function with enhanced voice selection for Jarvis-like effect
const speak = (text, language = 'en', voiceType = 'default') => {
  if (!window.speechSynthesis) {
    console.warn('Speech synthesis not supported');
    return false;
  }
  
  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = languageCodes[language] || 'en-US';
    utterance.lang = language === 'en' ? 'en-GB' : langCode; // Prefer British English for Jarvis
    
    // Default parameters
    utterance.rate = 0.9;    // Slightly slower than default
    utterance.pitch = 0.9;   // Slightly lower pitch
    utterance.volume = 1.0;  // Full volume
    
    console.log(`Speaking in language: ${language} (${utterance.lang})`, text);
    
    // Enhanced voice selection logic
    try {
      // Force voices to load if needed
      if (window.speechSynthesis.getVoices().length === 0) {
        // Some browsers need a manual trigger
        window.speechSynthesis.getVoices();
      }
      
      // Get voices with a small delay to ensure they're loaded
      setTimeout(() => {
        const voices = window.speechSynthesis.getVoices();
        
        if (voices && voices.length > 0) {
          console.log(`Available voices: ${voices.length}`);
          
          // For debugging: log all available voices
          voices.forEach((voice, i) => {
            console.log(`Voice ${i}: ${voice.name} (${voice.lang}) - ${voice.localService ? 'local' : 'remote'}`);
          });
          
          // For Jarvis, prioritize British English voices
          let targetLang = language === 'en' ? 'en-GB' : langCode;
          let languageVoices = voices.filter(voice => 
            voice.lang.startsWith(targetLang.split('-')[0])
          );
          
          // If no British voices found for English, fall back to any English
          if (language === 'en' && languageVoices.length === 0) {
            languageVoices = voices.filter(voice => 
              voice.lang.startsWith('en')
            );
          }
          
          if (languageVoices.length > 0) {
            // Get preferences for this language
            const prefs = voicePreferences[language] || voicePreferences.en;
            
            // Try to find a voice by preferred name first
            if (prefs.preferredVoiceNames && prefs.preferredVoiceNames.length > 0) {
              for (const name of prefs.preferredVoiceNames) {
                const matchedVoice = languageVoices.find(v => 
                  v.name.includes(name) || v.voiceURI.includes(name)
                );
                
                if (matchedVoice) {
                  utterance.voice = matchedVoice;
                  console.log(`Using Jarvis-like voice: ${matchedVoice.name}`);
                  break;
                }
              }
            }
            
            // If no preferred voice found, try by gender for male voice
            if (!utterance.voice && prefs.preferredGender === 'male') {
              const maleVoices = languageVoices.filter(voice => {
                // Try to guess gender from voice name
                const voiceName = voice.name.toLowerCase();
                return voiceName.includes('male') || 
                      voiceName.includes('david') || 
                      voiceName.includes('george') || 
                      voiceName.includes('daniel') || 
                      voiceName.includes('thomas');
              });
              
              if (maleVoices.length > 0) {
                utterance.voice = maleVoices[0];
                console.log(`Using male voice for Jarvis: ${utterance.voice.name}`);
              }
            }
            
            // If still no voice, use any language-matching voice
            if (!utterance.voice) {
              utterance.voice = languageVoices[0];
              console.log(`Using default language voice: ${utterance.voice.name}`);
            }
          } else {
            console.warn(`No matching voice found for ${langCode}, using default`);
          }
        }
        
        // J.A.R.V.I.S. specific voice tuning (especially for English)
        if (language === 'en' || voiceType === 'jarvis') {
          utterance.pitch = 0.85;  // Slightly lower pitch for authority
          utterance.rate = 0.9;    // Slightly slower for clarity
        }
        
        window.speechSynthesis.speak(utterance);
      }, 100); // Small delay to ensure voices are loaded
      
      return true;
    } catch (e) {
      console.warn('Error selecting voice:', e);
      // Fallback to basic speech
      window.speechSynthesis.speak(utterance);
      return true;
    }
  } catch (error) {
    console.error('Error using speech synthesis:', error);
    return false;
  }
};

// Custom hook for voice control
export const useVoiceControl = (recipeData) => {
  const { currentLanguage, t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [voiceResponse, setVoiceResponse] = useState('');
  const [supported, setSupported] = useState(null);
  const recognitionRef = useRef(null);
  const processingRef = useRef(false);
  
  // Check browser support on mount
  useEffect(() => {
    const support = checkBrowserSupportForSpeech();
    setSupported(support);
    
    // Log support status for debugging
    console.log('Speech support:', support);
    
    return () => {
      // Clean up any existing recognition on unmount
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.warn('Error stopping speech recognition:', e);
        }
      }
    };
  }, []);
  
  // Define command patterns for the current language
  const patterns = commandPatterns[currentLanguage] || commandPatterns.en;
  
  // Function to check if a command matches any pattern in a category
  const matchesPattern = useCallback((command, patternCategory) => {
    if (!command || !patternCategory) return false;
    
    const lowerCommand = command.toLowerCase().trim();
    
    // Find any matching patterns
    const matches = patternCategory.filter(pattern => {
      const patternLower = pattern.toLowerCase();
      const isMatch = lowerCommand.includes(patternLower);
      if (isMatch) {
        console.log(`✅ Command matched pattern: "${pattern}" in language: ${currentLanguage}`);
      }
      return isMatch;
    });
    
    return matches.length > 0;
  }, [currentLanguage]);
  
  // Process the recognized speech
  const processCommand = useCallback((command) => {
    if (processingRef.current || !command) return;
    
    processingRef.current = true;
    const lowerCommand = command.toLowerCase().trim();
    console.log(`Processing command in ${currentLanguage}:`, lowerCommand);
    
    let response = '';
    let commandRecognized = false;
    
    // Check each command pattern
    if (matchesPattern(lowerCommand, patterns.ingredients)) {
      commandRecognized = true;
      if (recipeData?.ingredients?.length > 0) {
        response = `${t('ingredients')}: ${recipeData.ingredients.join(', ')}`;
      } else {
        response = t('no_ingredients');
      }
    } 
    else if (matchesPattern(lowerCommand, patterns.instructions)) {
      commandRecognized = true;
      if (recipeData?.instructions?.length > 0) {
        response = `${t('instructions')}: ${recipeData.instructions[currentStep]}`;
      } else {
        response = t('no_instructions');
      }
    } 
    else if (matchesPattern(lowerCommand, patterns.nutrition)) {
      commandRecognized = true;
      if (recipeData?.nutrition) {
        const nutritionInfo = recipeData.nutrition;
        response = `${t('nutritional_information')}: ${t('calories')} ${nutritionInfo.calories?.value || 0} ${t('protein')} ${nutritionInfo.protein?.value || 0}g, ${t('carbs')} ${nutritionInfo.carbs?.value || 0}g, ${t('fats')} ${nutritionInfo.fats?.value || 0}g`;
      } else {
        response = t('no_nutrition_info');
      }
    } 
    else if (matchesPattern(lowerCommand, patterns.next)) {
      commandRecognized = true;
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
    else if (matchesPattern(lowerCommand, patterns.previous)) {
      commandRecognized = true;
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
    else if (matchesPattern(lowerCommand, patterns.repeat)) {
      commandRecognized = true;
      if (recipeData?.instructions?.length > 0) {
        response = recipeData.instructions[currentStep];
      } else {
        response = t('no_instructions');
      }
    }
    
    // Command not recognized
    if (!commandRecognized) {
      console.log(`❌ Command not recognized in ${currentLanguage}:`, lowerCommand);
      
      // Provide helpful suggestions in the current language
      const suggestionIngredient = patterns.ingredients[0] || '';
      const suggestionInstruction = patterns.instructions[0] || '';
      const suggestionNext = patterns.next[0] || '';
      
      response = `${t('command_not_recognized')}. ${t('try_saying')}: "${suggestionIngredient}", "${suggestionInstruction}", "${suggestionNext}"`;
    }
    
    console.log(`Response (${currentLanguage}):`, response);
    setVoiceResponse(response);
    
    // Use 'jarvis' voice type for all responses
    speak(response, currentLanguage, 'jarvis');
    
    // Reset processing flag with delay
    setTimeout(() => {
      processingRef.current = false;
    }, 1000);
    
    return response;
  }, [recipeData, currentStep, currentLanguage, t, patterns, matchesPattern]);
  
  // Handle speech recognition result
  const handleSpeechResult = useCallback((result) => {
    if (result && typeof result === 'string') {
      processCommand(result);
    }
  }, [processCommand]);
  
  // Handle speech recognition end
  const handleSpeechEnd = useCallback(() => {
    setIsListening(false);
  }, []);
  
  // Start voice control
  const startVoiceControl = useCallback(() => {
    if (isListening) return;
    
    // Check for browser support
    if (!supported || !supported.recognition) {
      setVoiceResponse(t('browser_not_supported'));
      speak(t('browser_not_supported'), currentLanguage);
      return;
    }
    
    try {
      // First, speak the J.A.R.V.I.S. style greeting
      const jarvisGreeting = "Hello Sir. J.A.R.V.I.S. here, ready for your service as audio commando.";
      setVoiceResponse(jarvisGreeting);
      // Use 'jarvis' voice type for the greeting
      speak(jarvisGreeting, currentLanguage, 'jarvis');
      
      // Wait a moment before starting the actual recognition
      setTimeout(() => {
        // Create a new recognition instance
        const langCode = languageCodes[currentLanguage] || 'en-US';
        console.log(`Starting voice recognition with language: ${currentLanguage} (${langCode})`);
        
        const recognition = createSpeechRecognition(
          langCode,
          handleSpeechResult,
          handleSpeechEnd
        );
        
        if (!recognition) {
          throw new Error('Failed to create speech recognition');
        }
        
        // Store the recognition instance
        recognitionRef.current = recognition;
        
        // Start listening
        recognition.start();
        setIsListening(true);
        setVoiceResponse(t('listening'));
      }, 2500); // Wait 2.5 seconds after the greeting before starting to listen
    } catch (error) {
      console.error('Error starting voice control:', error);
      setVoiceResponse(t('voice_control_error'));
      speak(t('voice_control_error'), currentLanguage);
      setIsListening(false);
    }
  }, [isListening, supported, currentLanguage, t, handleSpeechResult, handleSpeechEnd]);
  
  // Stop voice control
  const stopVoiceControl = useCallback(() => {
    if (!isListening) return;
    
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis && window.speechSynthesis.cancel();
      setVoiceResponse('');
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping voice control:', error);
    }
  }, [isListening]);
  
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
    supported: supported ? supported.recognition && supported.synthesis : false
  };
};