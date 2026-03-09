import { createContext, useContext, useState, useEffect } from 'react';

// Currency metadata with symbols and names
const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  CHF: { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
};

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [baseCurrency, setBaseCurrency] = useState(() => {
    // Try to get from localStorage first, fallback to user data, then default to USD
    const stored = localStorage.getItem('baseCurrency');
    if (stored && CURRENCIES[stored]) {
      return CURRENCIES[stored];
    }
    
    // Try to get from user data in localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.baseCurrency && CURRENCIES[user.baseCurrency]) {
          return CURRENCIES[user.baseCurrency];
        }
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    
    return CURRENCIES.USD;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Convert amount using exchange rate and round to 2 decimal places
  const convert = (amount, exchangeRate = 1.0) => {
    if (typeof amount !== 'number' || typeof exchangeRate !== 'number') {
      return 0;
    }
    return Math.round(amount * exchangeRate * 100) / 100;
  };

  // Format amount with currency symbol
  const format = (amount, exchangeRate = 1.0) => {
    const convertedAmount = convert(amount, exchangeRate);
    return `${baseCurrency.symbol}${convertedAmount.toFixed(2)}`;
  };

  // Update base currency
  const updateBaseCurrency = async (currencyCode) => {
    if (!CURRENCIES[currencyCode]) {
      throw new Error(`Invalid currency code: ${currencyCode}`);
    }

    const newCurrency = CURRENCIES[currencyCode];
    
    // Update local state immediately
    setBaseCurrency(newCurrency);
    localStorage.setItem('baseCurrency', currencyCode);

    // Update on backend
    try {
      setIsLoading(true);
      const { authService } = await import('./services/apiService');
      await authService.updateProfile({ baseCurrency: currencyCode });
      
      // Update user data in localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        user.baseCurrency = currencyCode;
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Failed to update base currency on backend:', error);
      // Revert on error
      const currentCurrency = localStorage.getItem('baseCurrency') || 'USD';
      setBaseCurrency(CURRENCIES[currentCurrency]);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sync with user data when it changes
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.baseCurrency && CURRENCIES[user.baseCurrency]) {
          const currentStored = localStorage.getItem('baseCurrency');
          if (!currentStored || currentStored !== user.baseCurrency) {
            setBaseCurrency(CURRENCIES[user.baseCurrency]);
            localStorage.setItem('baseCurrency', user.baseCurrency);
          }
        }
      } catch (e) {
        console.error('Failed to sync user currency:', e);
      }
    }
  }, []);

  const value = {
    baseCurrency,
    currencies: CURRENCIES,
    convert,
    format,
    updateBaseCurrency,
    isLoading,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
