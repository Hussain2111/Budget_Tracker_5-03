// In-memory cache for exchange rates
let cache = {
  rates: null,
  timestamp: null,
  baseCurrency: null,
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetch exchange rates for a given base currency
 * @param {string} baseCurrency - The base currency code (e.g., 'USD', 'EUR')
 * @returns {Promise<Object>} - Promise that resolves to rates object
 */
export const getRates = async (baseCurrency) => {
  if (!baseCurrency) {
    throw new Error('Base currency is required');
  }

  // Check if we have cached data that's still valid
  const now = Date.now();
  if (
    cache.rates &&
    cache.timestamp &&
    cache.baseCurrency === baseCurrency &&
    (now - cache.timestamp) < CACHE_DURATION
  ) {
    console.log(`Using cached rates for ${baseCurrency}`);
    return cache.rates;
  }

  try {
    console.log(`Fetching fresh rates for ${baseCurrency}`);
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.rates) {
      throw new Error('Invalid response format: missing rates');
    }

    // Update cache
    cache = {
      rates: data.rates,
      timestamp: now,
      baseCurrency: baseCurrency,
    };

    console.log(`Successfully cached rates for ${baseCurrency}`);
    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // If we have old cached data, return it as fallback
    if (cache.rates && cache.baseCurrency === baseCurrency) {
      console.warn('Using stale cached rates as fallback');
      return cache.rates;
    }
    
    throw error;
  }
};

/**
 * Get the exchange rate between two currencies
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number>} - Exchange rate
 */
export const getExchangeRate = async (fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    return 1.0;
  }

  const rates = await getRates(fromCurrency);
  return rates[toCurrency] || 1.0;
};

/**
 * Clear the exchange rate cache
 */
export const clearCache = () => {
  cache = {
    rates: null,
    timestamp: null,
    baseCurrency: null,
  };
  console.log('Exchange rate cache cleared');
};

/**
 * Get cache information for debugging
 */
export const getCacheInfo = () => {
  return {
    ...cache,
    isExpired: cache.timestamp ? (Date.now() - cache.timestamp) >= CACHE_DURATION : true,
    age: cache.timestamp ? Date.now() - cache.timestamp : null,
  };
};
