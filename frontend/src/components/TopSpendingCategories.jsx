const TopSpendingCategories = ({ categories, formatMoney }) => {
  const getCategoryColor = (categoryName) => {
    const colors = {
      'Housing': '#818CF8',
      'Food & Dining': '#FCA5A5',
      'Transport': '#FCD34D',
      'Utilities': '#6EE7B7',
      'Entertainment': '#C4B5FD',
      'default': '#9CA3AF'
    };
    return colors[categoryName] || colors.default;
  };

  const getPercentage = (amount) => {
    if (!categories || categories.length === 0) return 0;
    const maxAmount = Math.max(...categories.map(cat => Number(cat.amount || 0)));
    return maxAmount > 0 ? (Number(amount) / maxAmount) * 100 : 0;
  };

  return (
    <div className="cat-list">
      {categories?.slice(0, 5).map((category) => (
        <div key={category.type} className="cat-row">
          <span className="cat-name">{category.type}</span>
          <div className="cat-track">
            <div 
              className="cat-fill" 
              style={{ 
                width: `${getPercentage(category.amount)}%`,
                background: getCategoryColor(category.type)
              }}
            />
          </div>
          <span className="cat-amt">${formatMoney(category.amount)}</span>
        </div>
      ))}
    </div>
  );
};

export default TopSpendingCategories;
