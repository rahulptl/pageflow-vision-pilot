import { useState, useEffect } from 'react';

interface UseAnimatedMessagesProps {
  messages: string[];
  interval?: number;
  isActive: boolean;
}

export const useAnimatedMessages = ({ 
  messages, 
  interval = 2000, 
  isActive 
}: UseAnimatedMessagesProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(messages[0]);

  useEffect(() => {
    if (!isActive) {
      setCurrentIndex(0);
      setCurrentMessage(messages[0]);
      return;
    }

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % messages.length;
        setCurrentMessage(messages[nextIndex]);
        return nextIndex;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isActive, messages, interval]);

  return currentMessage;
};