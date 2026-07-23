import { useEffect, useRef } from 'react';

/**
 * Custom hook for scroll-based animation
 * Animates all text elements in hero from blue to white as user scrolls
 */
export const useScrollAnimation = () => {
  const heroRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;

      const heroElement = heroRef.current;
      
      // Get all text elements with scroll-animated class
      const animatedElements = heroElement.querySelectorAll('.scroll-animated');
      
      // Get the hero section's position and dimensions
      const heroRect = heroElement.getBoundingClientRect();
      const heroHeight = heroRect.height;
      
      // Calculate scroll progress (0 to 1)
      // Animation starts when hero is at the top and completes when hero is fully scrolled past
      const scrollProgress = Math.min(Math.max(-heroRect.top / heroHeight, 0), 1);
      
      // Apply animation to all text elements based on scroll progress
      animatedElements.forEach(element => {
        if (scrollProgress > 0.3) {
          // Transition to blue when 30% scrolled down
          element.classList.remove('animate-to-white');
          element.classList.add('animate-to-blue');
        } else {
          // Keep white when at the top or scrolling back up
          element.classList.remove('animate-to-blue');
          element.classList.add('animate-to-white');
        }
      });
    };

    // Add scroll event listener with throttling for performance
    let ticking = false;
    const throttledScrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial call to set correct state
    handleScroll();

    // Add event listener
    window.addEventListener('scroll', throttledScrollHandler, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', throttledScrollHandler);
    };
  }, []);

  return { heroRef };
};
