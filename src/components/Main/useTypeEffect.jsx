import { useEffect, useState } from 'react';

const useTypingEffect = (text, delay = 10, initialDelay = 100) => {
  const [displayText, setDisplayText] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let index = 0;
    let typingTimer;
    let raf;
    let initialTimer;

    setDisplayText('');
    setDone(false);

    raf = requestAnimationFrame(() => {
      initialTimer = setTimeout(() => {
        typingTimer = setInterval(() => {
          if (index < text.length) {
            setDisplayText(prev => prev + text.charAt(index));
            index++;
          } else {
            clearInterval(typingTimer);
            setDone(true);
          }
        }, delay);
      }, initialDelay);
    });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(initialTimer);
      clearInterval(typingTimer);
      setDone(false);
    };
  }, [text, delay, initialDelay]);

  return { displayText, done };
};

export default useTypingEffect;
