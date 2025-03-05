import React, { useState, useEffect } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaExclamationCircle } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from 'react-toastify';

/**
 * A reusable component for requesting and displaying microphone permission status
 */
const VoiceAccessButton = ({ onMicrophoneAccess }) => {
  const { t } = useLanguage();
  const [micPermission, setMicPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const [isRequesting, setIsRequesting] = useState(false);

  // Check permission on mount
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  // Check if microphone permission is already granted
  const checkMicrophonePermission = async () => {
    if (!navigator.permissions || !navigator.permissions.query) {
      // Browser doesn't support permissions API
      setMicPermission('unsupported');
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'microphone' });
      setMicPermission(result.state);
      
      // Listen for permission changes
      result.onchange = () => {
        setMicPermission(result.state);
        if (result.state === 'granted') {
          onMicrophoneAccess(true);
        } else if (result.state === 'denied') {
          onMicrophoneAccess(false);
        }
      };
    } catch (error) {
      console.warn('Error checking microphone permission:', error);
      setMicPermission('unsupported');
    }
  };

  // Request microphone access
  const requestMicrophoneAccess = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error(t('browser_not_supported'));
      return;
    }

    setIsRequesting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      onMicrophoneAccess(true);
      toast.success(t('microphone_access_granted'));
    } catch (error) {
      console.error('Error requesting microphone access:', error);
      setMicPermission('denied');
      onMicrophoneAccess(false);
      toast.error(t('microphone_access_denied'));
    } finally {
      setIsRequesting(false);
    }
  };

  // Render different buttons based on permission state
  if (micPermission === 'granted') {
    return (
      <button 
        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors"
        onClick={() => onMicrophoneAccess(true)}
      >
        <FaMicrophone />
        <span>{t('voice_control_ready')}</span>
      </button>
    );
  } else if (micPermission === 'denied') {
    return (
      <button 
        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors"
        onClick={() => window.open('chrome://settings/content/microphone')}
      >
        <FaMicrophoneSlash />
        <span>{t('enable_microphone_in_settings')}</span>
      </button>
    );
  } else if (micPermission === 'unsupported') {
    return (
      <button 
        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition-colors"
        disabled
      >
        <FaExclamationCircle />
        <span>{t('browser_not_supported')}</span>
      </button>
    );
  } else {
    return (
      <button 
        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors"
        onClick={requestMicrophoneAccess}
        disabled={isRequesting}
      >
        {isRequesting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
            <span>{t('requesting_access')}</span>
          </>
        ) : (
          <>
            <FaMicrophone />
            <span>{t('enable_voice_control')}</span>
          </>
        )}
      </button>
    );
  }
};

export default VoiceAccessButton;