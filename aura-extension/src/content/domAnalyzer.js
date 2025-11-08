/**
 * Extract main readable content from pages
 * Prioritizes <main>, <article>, ARIA landmarks, fallback to body
 */

/**
 * Remove script and style elements and their content
 * @param {HTMLElement} element - Element to clean
 */
function removeScriptsAndStyles(element) {
  const scripts = element.querySelectorAll('script, style, noscript');
  scripts.forEach(el => el.remove());
}

/**
 * Get text content from an element, preserving some structure
 * @param {HTMLElement} element - Element to extract text from
 * @returns {string} Extracted text content
 */
function extractTextContent(element) {
  if (!element) return '';

  // Clone to avoid modifying the original
  const clone = element.cloneNode(true);
  removeScriptsAndStyles(clone);

  // Get text content, preserving line breaks for readability
  const text = clone.textContent || clone.innerText || '';
  
  // Clean up excessive whitespace while preserving paragraph breaks
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Check if an element is likely to contain main content
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if element likely contains main content
 */
function isMainContent(element) {
  if (!element) return false;

  // Check for semantic HTML5 elements
  const semanticTags = ['main', 'article', 'section'];
  if (semanticTags.includes(element.tagName.toLowerCase())) {
    return true;
  }

  // Check for ARIA landmarks
  const role = element.getAttribute('role');
  const ariaLandmarks = ['main', 'article', 'region', 'contentinfo'];
  if (role && ariaLandmarks.includes(role)) {
    return true;
  }

  // Check for common content class names (heuristic)
  const className = element.className || '';
  const contentIndicators = ['content', 'main-content', 'article', 'post', 'entry'];
  if (typeof className === 'string' && 
      contentIndicators.some(indicator => className.toLowerCase().includes(indicator))) {
    return true;
  }

  return false;
}

/**
 * Find the main content element on the page
 * @returns {HTMLElement|null} The main content element or null
 */
export function findMainContent() {
  // Priority 1: <main> element
  const main = document.querySelector('main');
  if (main && extractTextContent(main).length > 100) {
    return main;
  }

  // Priority 2: <article> elements (prefer the first substantial one)
  const articles = document.querySelectorAll('article');
  for (const article of articles) {
    const text = extractTextContent(article);
    if (text.length > 100) {
      return article;
    }
  }

  // Priority 3: ARIA landmarks with role="main"
  const ariaMain = document.querySelector('[role="main"]');
  if (ariaMain && extractTextContent(ariaMain).length > 100) {
    return ariaMain;
  }

  // Priority 4: ARIA landmarks with role="article"
  const ariaArticle = document.querySelector('[role="article"]');
  if (ariaArticle && extractTextContent(ariaArticle).length > 100) {
    return ariaArticle;
  }

  // Priority 5: Look for elements with main content indicators
  const allElements = document.querySelectorAll('div, section');
  let bestMatch = null;
  let bestScore = 0;

  for (const element of allElements) {
    if (isMainContent(element)) {
      const text = extractTextContent(element);
      const score = text.length;
      if (score > bestScore && score > 100) {
        bestScore = score;
        bestMatch = element;
      }
    }
  }

  if (bestMatch) {
    return bestMatch;
  }

  // Fallback: body content, but exclude common non-content elements
  const body = document.body;
  if (body) {
    // Remove common non-content sections
    const clone = body.cloneNode(true);
    const nonContent = clone.querySelectorAll('header, nav, footer, aside, .sidebar, .navigation, .menu');
    nonContent.forEach(el => el.remove());
    
    const text = extractTextContent(clone);
    if (text.length > 50) {
      return clone;
    }
  }

  return null;
}

/**
 * Extract readable text from the main content of the page
 * @returns {string} Extracted text content
 */
export function extractPageContent() {
  const mainContent = findMainContent();
  
  if (!mainContent) {
    // Ultimate fallback: just get body text
    return extractTextContent(document.body);
  }

  return extractTextContent(mainContent);
}

