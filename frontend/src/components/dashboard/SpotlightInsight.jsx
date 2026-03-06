import { Card, Empty } from "antd";
import { BulbOutlined } from "@ant-design/icons";

/**
 * SpotlightInsight - Generates a single compelling insight sentence
 * Highlights the most interesting data point users would want to notice/share
 * 
 * @param {object} topSpendingCategory - Top expense category: { type, amount }
 * @param {object} momDelta - Month-over-month delta: { expenseDelta, expenseChangePercent }
 * @param {number} monthProgress - Percentage through the month
 * @param {object} monthlyData - Current month summary: { totalExpenses, totalIncome }
 * @param {object} historicalData - Historical averages: { threeMonthAvgExpenses, threeMonthAvgIncome }
 * @param {object} selectedMonth - dayjs object for selected month
 * @param {function} formatMoney - Utility to format currency
 */
export const SpotlightInsight = ({
    topSpendingCategory,
    momDelta,
    monthProgress,
    monthlyData,
    historicalData,
    selectedMonth,
    formatMoney,
}) => {
    let insightText = null;
    let insightType = "default"; // success, warning, error

    // Calculate if on pace to overspend (highest priority)
    const today = selectedMonth?.date?.() || 0;
    const daysInMonth = selectedMonth?.daysInMonth?.() || 31;
    const isOnPaceToOverspend = monthlyData && historicalData && today > 0
        ? ((Number(monthlyData.totalExpenses || 0) / today) * daysInMonth) > (Number(monthlyData.totalIncome || 0))
        : false;

    // Rank different insights by interest/urgency
    if (isOnPaceToOverspend && monthlyData && monthlyData.totalIncome > 0) {
        // Overspend warning is highest priority
        const projectedSpending = (Number(monthlyData.totalExpenses || 0) / today) * daysInMonth;
        insightText = `On pace to spend $${formatMoney(projectedSpending)} this month — more than expected income.`;
        insightType = "warning";
    } else if (topSpendingCategory && monthProgress > 50) {
        // If we're in the latter half of the month and have spending data
        const categoryName = topSpendingCategory.type;
        const categoryAmount = formatMoney(topSpendingCategory.amount);
        insightText = `${categoryName} is your top expense at $${categoryAmount} this month.`;
        insightType = "spending";
    } else if (momDelta && Math.abs(momDelta.expenseChangePercent) > 10) {
        // If spending changed significantly month-over-month
        const direction = momDelta.expenseChangePercent > 0 ? "increased" : "decreased";
        const magnitude = Math.abs(momDelta.expenseChangePercent);
        insightText = `Your spending has ${direction} by ${magnitude}% compared to last month.`;
        insightType = momDelta.expenseChangePercent > 0 ? "warning" : "success";
    } else if (topSpendingCategory) {
        // Fallback: just mention top category
        const categoryName = topSpendingCategory.type;
        const categoryAmount = formatMoney(topSpendingCategory.amount);
        insightText = `${categoryName} is your top expense at $${categoryAmount} this month.`;
        insightType = "default";
    }

    if (!insightText) {
        return null;
    }

    const bgColor =
        insightType === "warning"
            ? "#fffbe6"
            : insightType === "success"
            ? "#f6ffed"
            : "transparent";

    const borderColor =
        insightType === "warning"
            ? "#faad14"
            : insightType === "success"
            ? "#52c41a"
            : "transparent";

    return (
        <Card
            className="stat-card"
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <BulbOutlined style={{ color: "#fadb14" }} />
                    Insight
                </div>
            }
            style={{ height: "100%", borderTop: `3px solid ${borderColor}` }}
        >
            <div
                style={{
                    padding: 12,
                    backgroundColor: bgColor,
                    borderRadius: 4,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "rgba(0,0,0,0.85)",
                }}
            >
                {insightText}
            </div>
        </Card>
    );
};

export default SpotlightInsight;
