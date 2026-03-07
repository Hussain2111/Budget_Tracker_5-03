import { InfoCircleOutlined } from "@ant-design/icons";

const InsightBanner = ({ topSpendingCategory, momDelta, monthProgress, monthlyData, formatMoney }) => {
  const getInsightText = () => {
    if (topSpendingCategory && monthlyData) {
      const spent = Number(topSpendingCategory.amount || 0);
      const limit = 800; // Example limit - you might want to get this from API
      const remaining = limit - spent;
      const daysLeft = 30 - monthProgress;
      const projectedOverspend = spent > (limit * (monthProgress / 100));
      
      if (projectedOverspend) {
        return (
          <>
            <strong>{topSpendingCategory.type}</strong> is your top category this month — {formatMoney(spent)} of your {formatMoney(limit)} limit with {daysLeft} days left. On pace to overspend by ~{formatMoney(Math.abs(remaining))}.
          </>
        );
      }
    }
    return (
      <>
        <strong>Great job!</strong> Your spending is on track this month. Keep monitoring your categories to stay within budget.
      </>
    );
  };

  return (
    <div className="insight-banner">
      <span className="insight-icon">
        <InfoCircleOutlined />
      </span>
      <span className="insight-text">
        {getInsightText()}
      </span>
    </div>
  );
};

export default InsightBanner;
