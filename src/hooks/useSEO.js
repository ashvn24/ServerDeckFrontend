import { useEffect } from 'react';

export default function useSEO({ title, description, keywords, ogImage, ogType = 'website' } = {}) {
  useEffect(() => {
    // 1. Dynamic Page Title
    const baseTitle = 'ServerDeck — Unified Linux Infrastructure Control Panel';
    if (title) {
      document.title = `${title} | ServerDeck`;
    } else {
      document.title = baseTitle;
    }

    // Helper to find or create a meta tag
    const setMetaTag = (selectorAttr, selectorValue, content, isProperty = false) => {
      if (!content) return;
      const selector = isProperty 
        ? `meta[property="${selectorValue}"]` 
        : `meta[name="${selectorValue}"]`;
        
      let element = document.querySelector(selector);
      if (element) {
        element.setAttribute('content', content);
      } else {
        element = document.createElement('meta');
        if (isProperty) {
          element.setAttribute('property', selectorValue);
        } else {
          element.setAttribute('name', selectorValue);
        }
        element.setAttribute('content', content);
        document.head.appendChild(element);
      }
    };

    // 2. Meta description & keywords
    setMetaTag('name', 'description', description);
    if (keywords && keywords.length > 0) {
      setMetaTag('name', 'keywords', keywords.join(', '));
    }

    // 3. Open Graph (OG) tags
    const resolvedTitle = title ? `${title} | ServerDeck` : baseTitle;
    setMetaTag('property', 'og:title', resolvedTitle, true);
    setMetaTag('property', 'og:description', description, true);
    setMetaTag('property', 'og:type', ogType, true);
    setMetaTag('property', 'og:url', window.location.href, true);
    if (ogImage) {
      setMetaTag('property', 'og:image', ogImage, true);
    }

    // 4. Twitter Card tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', resolvedTitle);
    setMetaTag('name', 'twitter:description', description);
    if (ogImage) {
      setMetaTag('name', 'twitter:image', ogImage);
    }
  }, [title, description, keywords, ogImage, ogType]);
}
