import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Reset window scroll to top-left corner on page change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant', // instant scroll to avoid transitions
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
