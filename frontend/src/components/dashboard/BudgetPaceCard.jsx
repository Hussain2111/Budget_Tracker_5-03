import { Card, Progress, Row, Col, Statistic, Alert } from "antd";

/**
 * BudgetPaceCard - Shows spending progress vs typical monthly average
 * Compares current spending (weighted by days elapsed) against 3-month average
 * 
 * @param {object} monthlyData - Current month summary: { totalExpenses, totalIncome }
 * @param {object} historicalData - 3-month average: { threeMonthAvgExpenses, threeMonthAvgIncome }
 * @param {object} selectedMonth - dayjs object for current selected month
 * @param {function} formatMoney - Utility to format currency
 */
export const BudgetPaceCard = ({
    monthlyData,
    historicalData,
    selectedMonth,
    formatMoney,
}) => {
    if (!monthlyData || !historicalData) {
        return null;
    }

    const today = selectedMonth.date();
    const daysInMonth = selectedMonth.daysInMonth();

    // Current spending
    const currentSpending = Number(monthlyData.totalExpenses || 0);
    const currentIncome = Number(monthlyData.totalIncome || 0);

    // 3-month averages
    const avgMonthlySpending = historicalData.threeMonthAvgExpenses;
    const avgMonthlyIncome = historicalData.threeMonthAvgIncome;

    // Spending and income pace (per day so far)
    const spendingPace = today > 0 ? currentSpending / today : 0;
    const incomePace = today > 0 ? currentIncome / today : 0;

    // Projected totals by end of month at current pace
    const projectedSpending = spendingPace * daysInMonth;
    const projectedIncome = incomePace * daysInMonth;

    // Progress: how much of typical monthly budget have we used?
    // Fallback: if no historical average, use current month income as denominator
    let budgetUtilization = 0;
    if (avgMonthlySpending > 0) {
        budgetUtilization = (currentSpending / avgMonthlySpending) * 100;
    } else if (currentIncome > 0) {
        // Fallback: show utilization as % of projected income
        budgetUtilization = (currentSpending / currentIncome) * 100;
    }
    // Otherwise utiliation stays 0 and circle is hidden

    const monthProgressPercent = (today / daysInMonth) * 100;

    // Warning condition: if we're on pace to spend more than we earn this month
    const isOutpacing = projectedSpending > projectedIncome && projectedIncome > 0;

    return (
        <Card className="stat-card" title="Budget Pace & Projection" style={{ height: "100%" }}>
            {/* ─── PRIMARY: Projection (headline) ─── */}
            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(0,0,0,0.65)", marginBottom: 12 }}>
                    At current pace by month end • Day {today} of {daysInMonth}
                </div>
                <Row gutter={24}>
                    <Col span={12}>
                        <div style={{ fontSize: 11, color: "rgba(0,0,0,0.65)", marginBottom: 4 }}>Projected Spending</div>
                        <div style={{ fontSize: 20, color: "#cf1322", fontWeight: 600 }}>
                            ${formatMoney(projectedSpending)}
                        </div>
                    </Col>
                    <Col span={12}>
                        <div style={{ fontSize: 11, color: "rgba(0,0,0,0.65)", marginBottom: 4 }}>Projected Income</div>
                        <div style={{ fontSize: 20, color: "#3f8600", fontWeight: 600 }}>
                            ${formatMoney(projectedIncome)}
                        </div>
                    </Col>
                </Row>
            </div>

            {/* ─── SUPPORTING: Progress & Context ─── */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "rgba(0,0,0,0.65)", marginBottom: 6 }}>
                    Progress: {Math.round(monthProgressPercent)}% through month
                </div>
                <Progress percent={Math.round(monthProgressPercent)} strokeColor="#1890ff" size="small" />
            </div>

            {/* ─── Budget Utilization (only if meaningful) ─── */}
            {budgetUtilization > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: "rgba(0,0,0,0.65)", marginBottom: 8 }}>
                        Budget Utilization
                        {avgMonthlySpending > 0 
                            ? ` (vs typical month: $${formatMoney(avgMonthlySpending)})` 
                            : ` (vs current income)`}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Progress
                            type="circle"
                            percent={Math.min(Math.round(budgetUtilization), 100)}
                            strokeColor={budgetUtilization > 100 ? "#ff4d4f" : "#faad14"}
                            size={50}
                            format={(pct) => `${pct}%`}
                        />
                        <div style={{ fontSize: 12 }}>
                            <div style={{ fontSize: 11, color: "rgba(0,0,0,0.65)" }}>Current Spending</div>
                            <div style={{ fontSize: 16, color: "#cf1322", fontWeight: 600 }}>
                                ${formatMoney(currentSpending)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Warning if outpacing income */}
            {isOutpacing && (
                <Alert
                    message="Spending on track to exceed income"
                    description={`At current pace, you'll spend $${formatMoney(projectedSpending)} 
                    but only earn $${formatMoney(projectedIncome)} this month.`}
                    type="warning"
                    showIcon
                    style={{ fontSize: 12 }}
                />
            )}
        </Card>
    );
};

export default BudgetPaceCard;
