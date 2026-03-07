const MetricCard = ({ title, value, subtitle, badge, badgeType, valueColor }) => {
  const getBadgeClass = () => {
    switch(badgeType) {
      case 'up-good': return 'metric-badge up-good';
      case 'up-bad': return 'metric-badge up-bad';
      case 'down-good': return 'metric-badge down-good';
      default: return 'metric-badge';
    }
  };

  const getValueClass = () => {
    switch(valueColor) {
      case 'green': return 'metric-value green';
      case 'indigo': return 'metric-value indigo';
      default: return 'metric-value';
    }
  };

  return (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-name">{title}</span>
        {badge && <span className={getBadgeClass()}>{badge}</span>}
      </div>
      <div className={getValueClass()}>{value}</div>
      {subtitle && <div className="metric-sub">{subtitle}</div>}
    </div>
  );
};

export default MetricCard;
