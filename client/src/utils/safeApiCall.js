/**
 * Safe API call wrapper to prevent crashes from network requests
 * Handles response validation, JSON parsing errors, and provides consistent error handling
 * Adapted for web from mobile implementation
 */

import { logger } from './logger';

const DEFAULT_TIMEOUT = 30000; // 30 seconds for activity creation

/**
 * Creates a timeout promise that rejects after specified time
 */
const createTimeoutPromise = (timeout) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);
  });
};

/**
 * Safe API call wrapper with comprehensive error handling
 * @param {string} url - The API endpoint URL
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @param {number} timeout - Request timeout in milliseconds
 * @returns {Promise<object>} - Parsed JSON response or throws descriptive error
 */
export const safeApiCall = async (url, options = {}, timeout = DEFAULT_TIMEOUT) => {
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    logger.debug(`[${requestId}] API Request:`, url, options.method || 'GET');
    
    // Validate inputs
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided to API call');
    }

    // Ensure headers exist and handle cookies for web
    const safeOptions = {
      ...options,
      credentials: options.credentials || 'include', // Include cookies by default
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
      delete safeOptions.headers['Content-Type'];
    }

    // Create fetch promise with timeout
    const fetchPromise = fetch(url, safeOptions);
    const timeoutPromise = createTimeoutPromise(timeout);
    
    // Race between fetch and timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    logger.debug(`[${requestId}] Response status:`, response.status);

    // Check if response is ok
    if (!response.ok) {
      const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      logger.error(`[${requestId}] API Error:`, errorMessage);
      
      // Try to get error details from response body
      let errorDetails = errorMessage;
      try {
        const errorBody = await response.text();
        if (errorBody) {
          try {
            const parsedError = JSON.parse(errorBody);
            // Handle Rails errors format
            if (parsedError.errors) {
              if (Array.isArray(parsedError.errors)) {
                errorDetails = parsedError.errors.join(', ');
              } else if (typeof parsedError.errors === 'object') {
                // Handle Rails validation errors object format
                errorDetails = Object.entries(parsedError.errors)
                  .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                  .join('; ');
              }
            } else if (parsedError.error) {
              errorDetails = parsedError.error;
            } else if (parsedError.message) {
              errorDetails = parsedError.message;
            }
          } catch {
            // If JSON parsing fails, use the text as error details
            errorDetails = errorBody.substring(0, 200); // Limit error length
          }
        }
      } catch (textError) {
        logger.debug(`[${requestId}] Could not read error response body:`, textError.message);
      }
      
      const error = new Error(errorDetails);
      error.status = response.status;
      error.statusText = response.statusText;
      error.requestId = requestId;
      throw error;
    }

    // Handle empty responses (204 No Content, etc.)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      logger.debug(`[${requestId}] Empty response received (expected)`);
      return {};
    }

    // Safely parse JSON response
    let data;
    try {
      const responseText = await response.text();
      
      if (!responseText.trim()) {
        // Handle empty response
        logger.debug(`[${requestId}] Empty response received`);
        return {};
      }
      
      data = JSON.parse(responseText);
      logger.debug(`[${requestId}] API Success:`, Object.keys(data || {}).length, 'keys in response');
      
    } catch (parseError) {
      logger.error(`[${requestId}] JSON Parse Error:`, parseError.message);
      throw new Error(`Invalid JSON response from server: ${parseError.message}`);
    }

    return data;
    
  } catch (error) {
    // Enhanced error logging
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      logger.error(`[${requestId}] Network Error:`, 'Check internet connection');
      const netError = new Error('Network connection failed. Please check your internet connection and try again.');
      netError.requestId = requestId;
      netError.isNetworkError = true;
      throw netError;
    }
    
    if (error.message.includes('timeout')) {
      logger.warn(`[${requestId}] Request timeout:`, error.message);
      const timeoutError = new Error('Request is taking longer than expected. Please wait or try again.');
      timeoutError.requestId = requestId;
      timeoutError.isTimeout = true;
      throw timeoutError;
    }
    
    // Re-throw with request ID for debugging
    logger.error(`[${requestId}] API Call Failed:`, error.message);
    error.requestId = requestId;
    throw error;
  }
};

/**
 * Retry wrapper for API calls with exponential backoff
 */
export const safeApiCallWithRetry = async (
  url, 
  options = {}, 
  maxRetries = 3, 
  timeout = DEFAULT_TIMEOUT
) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Exponential backoff: 0ms, 1000ms, 2000ms, 4000ms
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        logger.debug(`Retry attempt ${attempt} after ${delay}ms delay`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return await safeApiCall(url, options, timeout);
      
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx) except 408 (timeout) and 429 (rate limit)
      if (error.status && error.status >= 400 && error.status < 500 && 
          error.status !== 408 && error.status !== 429) {
        throw error;
      }
      
      // Don't retry if not a network/timeout error on last attempt
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      logger.warn(`API call failed (attempt ${attempt + 1}/${maxRetries}):`, error.message);
    }
  }
  
  throw lastError;
};

/**
 * Utility for handling common API error responses
 */
export const handleApiError = (error, userMessage = 'Something went wrong. Please try again.') => {
  logger.error('Handled API Error:', error);
  
  // Check for network errors
  if (error.isNetworkError) {
    return 'Unable to connect. Please check your internet connection.';
  }
  
  // Check for timeout errors
  if (error.isTimeout) {
    return 'This is taking longer than expected. Please try again.';
  }
  
  // Map specific errors to user-friendly messages
  if (error.status === 401) {
    return 'Your session has expired. Please log in again.';
  }
  
  if (error.status === 403) {
    return 'You don\'t have permission to perform this action.';
  }
  
  if (error.status === 404) {
    return 'The requested resource was not found.';
  }
  
  if (error.status === 422) {
    // Validation error - use the actual error message
    return error.message || 'Please check your input and try again.';
  }
  
  if (error.status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  if (error.status >= 500) {
    return 'Server error. Our team has been notified. Please try again later.';
  }
  
  // Use the error message if it's specific, otherwise use default
  if (error.message && !error.message.includes('HTTP')) {
    return error.message;
  }
  
  return userMessage;
};