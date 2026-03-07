const RecentTransactionsList = ({ transactions, formatMoney }) => {
  const getCategoryColor = (category) => {
    const colors = {
      'Food & Dining': '#FCA5A5',
      'Transport': '#FCD34D',
      'Entertainment': '#C4B5FD',
      'Utilities': '#6EE7B7',
      'Salary': '#6EE7B7',
      'default': '#9CA3AF'
    };
    return colors[category] || colors.default;
  };

  return (
    <div className="tx-list">
      {transactions?.slice(0, 5).map((transaction) => (
        <div key={transaction.key} className="tx-row">
          <div 
            className="tx-dot" 
            style={{ background: getCategoryColor(transaction.type) }}
          />
          <div className="tx-info">
            <div className="tx-name">{transaction.name}</div>
            <div className="tx-meta">{transaction.type} · {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
          </div>
          <span className={`tx-amount ${transaction.kind === 'income' ? 'pos' : 'neg'}`}>
            {transaction.kind === 'income' ? '+' : '-'}${formatMoney(Math.abs(transaction.amount))}
          </span>
        </div>
      ))}
    </div>
  );
};

export default RecentTransactionsList;
