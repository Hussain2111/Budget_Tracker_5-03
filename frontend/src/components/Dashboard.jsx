import { useEffect, useMemo, useState } from "react";
import { Spin, message, Table, Tag, DatePicker } from "antd";
import { dashboardService, ledgerService } from "../services/apiService";
import dayjs from "dayjs";
import { TrendCard } from "./dashboard/TrendCard";
import { BudgetPaceCard } from "./dashboard/BudgetPaceCard";
import { SpotlightInsight } from "./dashboard/SpotlightInsight";


// Utility functions for deriving dashboard insights
function calculateMonthProgress(monthDayjs) {
    const today = monthDayjs.date();
    const daysInMonth = monthDayjs.daysInMonth();
    return Math.round((today / daysInMonth) * 100);
}

function calculateMoMDelta(currentMonthData, previousMonthData) {
    if (!currentMonthData || !previousMonthData) return null;

    const currentExpenses = Number(currentMonthData.totalExpenses || 0);
    const previousExpenses = Number(previousMonthData.totalExpenses || 0);
    const currentIncome = Number(currentMonthData.totalIncome || 0);
    const previousIncome = Number(previousMonthData.totalIncome || 0);
    const currentSavings = Number(currentMonthData.monthlySavings || 0);
    const previousSavings = Number(previousMonthData.monthlySavings || 0);

    const expenseDelta = currentExpenses - previousExpenses;
    const incomeDelta = currentIncome - previousIncome;
    const savingsDelta = currentSavings - previousSavings;

    const expenseChangePercent = previousExpenses === 0 ? 0 : parseFloat(((expenseDelta / previousExpenses) * 100).toFixed(1));
    const incomeChangePercent = previousIncome === 0 ? 0 : parseFloat(((incomeDelta / previousIncome) * 100).toFixed(1));
    const savingsChangePercent = previousSavings === 0 ? 0 : parseFloat(((savingsDelta / previousSavings) * 100).toFixed(1));

    return {
        expenseDelta,
        expenseChangePercent,
        incomeDelta,
        incomeChangePercent,
        savingsDelta,
        savingsChangePercent,
    };
}

function getTopSpendingCategory(expenseCategories) {
    if (!expenseCategories || expenseCategories.length === 0) return null;
    return expenseCategories[0];
}

// Custom hook to consolidate all dashboard data fetches in parallel
function useDashboardData(selectedMonth) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        summary: null,
        monthly: null,
        previousMonthly: null,
        expenseCategories: [],
        incomeCategories: [],
        recentRows: [],
        monthProgress: 0,
        momDelta: null,
        topSpendingCategory: null,
        historicalData: {
            monthlyExpenses: [],
            monthlyIncome: [],
            threeMonthAvgExpenses: 0,
            threeMonthAvgIncome: 0,
        },
    });

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const month = selectedMonth.month() + 1;
                const year = selectedMonth.year();

                // Calculate previous months for MoM and 3-month average
                const previousMonth = selectedMonth.subtract(1, "month");
                const twoMonthsBack = selectedMonth.subtract(2, "months");
                const threeMonthsBack = selectedMonth.subtract(3, "months");

                const prevMonth = previousMonth.month() + 1;
                const prevYear = previousMonth.year();
                const twoBackMonth = twoMonthsBack.month() + 1;
                const twoBackYear = twoMonthsBack.year();
                const threeBackMonth = threeMonthsBack.month() + 1;
                const threeBackYear = threeMonthsBack.year();

                // Fire all requests in parallel, including 3 months of history for budget pace calculation
                const [summaryRes, monthlyRes, prevMonthlyRes, twoBackRes, threeBackRes, expRes, incRes, recentRes] = await Promise.all([
                    dashboardService.summary(),
                    dashboardService.monthlySummary(month, year),
                    dashboardService.monthlySummary(prevMonth, prevYear),
                    dashboardService.monthlySummary(twoBackMonth, twoBackYear),
                    dashboardService.monthlySummary(threeBackMonth, threeBackYear),
                    dashboardService.expensesByCategory({ month, year }),
                    dashboardService.incomeByCategory({ month, year }),
                    ledgerService.getAll({
                        limit: 8,
                        sort: "date",
                        order: "DESC",
                    }),
                ]);

                // Pre-compute and sort derived values
                const expSorted = [...(expRes.data || [])].sort(
                    (a, b) => Number(b.amount) - Number(a.amount),
                );
                const incSorted = [...(incRes.data || [])].sort(
                    (a, b) => Number(b.amount) - Number(a.amount),
                );

                const recentRows = (recentRes.data || []).map((r) => ({
                    ...r,
                    key: `${r.kind}-${r.id}`,
                }));

                // Calculate 3-month average for budget pace
                const monthlyExpenses = [
                    Number(monthlyRes.data?.totalExpenses || 0),
                    Number(prevMonthlyRes.data?.totalExpenses || 0),
                    Number(twoBackRes.data?.totalExpenses || 0),
                    Number(threeBackRes.data?.totalExpenses || 0),
                ];
                const monthlyIncome = [
                    Number(monthlyRes.data?.totalIncome || 0),
                    Number(prevMonthlyRes.data?.totalIncome || 0),
                    Number(twoBackRes.data?.totalIncome || 0),
                    Number(threeBackRes.data?.totalIncome || 0),
                ];

                const historicalData = {
                    monthlyExpenses,
                    monthlyIncome,
                    threeMonthAvgExpenses: monthlyExpenses.slice(1).reduce((a, b) => a + b, 0) / 3,
                    threeMonthAvgIncome: monthlyIncome.slice(1).reduce((a, b) => a + b, 0) / 3,
                };

                // Derive additional metrics
                const monthProgress = calculateMonthProgress(selectedMonth);
                const momDelta = calculateMoMDelta(monthlyRes.data, prevMonthlyRes.data);
                const topSpendingCategory = getTopSpendingCategory(expSorted);

                // Return single data object with all values
                setData({
                    summary: summaryRes.data,
                    monthly: monthlyRes.data,
                    previousMonthly: prevMonthlyRes.data,
                    expenseCategories: expSorted,
                    incomeCategories: incSorted,
                    recentRows,
                    monthProgress,
                    momDelta,
                    topSpendingCategory,
                    historicalData,
                });
            } catch (e) {
                console.error(e);
                message.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [selectedMonth]);

    return { loading, data };
}

const Dashboard = ({ onNavigate }) => {
    const currentMonth = useMemo(() => dayjs(), []);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    // Single hook call replaces all individual fetches and loading states
    const { loading, data } = useDashboardData(selectedMonth);

    const formatMoney = (value) => {
        const num = Number(value || 0);
        return num.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };


    const recentColumns = [
        {
            title: "Date",
            dataIndex: "date",
            key: "date",
            render: (d) => dayjs(d).format("YYYY-MM-DD"),
            width: 120,
        },
        { title: "Name", dataIndex: "name", key: "name" },
        { title: "Category", dataIndex: "type", key: "type", width: 160 },
        {
            title: "Kind",
            dataIndex: "kind",
            key: "kind",
            width: 110,
            render: (k) =>
                k === "income" ? (
                    <Tag color="green">Income</Tag>
                ) : (
                    <Tag color="red">Expense</Tag>
                ),
        },
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            width: 140,
            align: "right",
            render: (amt) => {
                const n = Number(amt);
                const color = n < 0 ? "#cf1322" : "#3f8600";
                const sign = n < 0 ? "-" : "+";
                return (
                    <span style={{ color }}>
            {sign}${formatMoney(Math.abs(n))}
          </span>
                );
            },
        },
    ];

    return (
        <div className="page-content">
            <Spin spinning={loading}>
                <div className="page-header">
                    <div className="page-title">
                        {selectedMonth.format("MMMM YYYY")}
                    </div>
                    <DatePicker
                        picker="month"
                        value={selectedMonth}
                        onChange={(val) => { if (val) setSelectedMonth(val); }}
                        allowClear={false}
                    />
                </div>
                {/* Metrics Row */}
                <div className="metric-row">
                    <TrendCard
                        title="Total Income"
                        value={formatMoney(data.monthly?.totalIncome)}
                        deltaPercent={data.momDelta?.incomeChangePercent}
                        color="#3f8600"
                        borderColor="#3f8600"
                    />
                    <TrendCard
                        title="Total Expenses"
                        value={formatMoney(data.monthly?.totalExpenses)}
                        deltaPercent={data.momDelta?.expenseChangePercent}
                        color="#cf1322"
                        borderColor="#cf1322"
                        invertPositive={true}
                    />
                    <TrendCard
                        title="Net Savings"
                        value={formatMoney(data.monthly?.monthlySavings)}
                        deltaPercent={data.momDelta?.savingsChangePercent}
                        color="#6366f1"
                        borderColor="#6366f1"
                    />
                </div>

                {/* Insight Banner */}
                <SpotlightInsight
                    topSpendingCategory={data.topSpendingCategory}
                    momDelta={data.momDelta}
                    monthProgress={data.monthProgress}
                    monthlyData={data.monthly}
                    historicalData={data.historicalData}
                    selectedMonth={selectedMonth}
                    formatMoney={formatMoney}
                />

                {/* Budget Pace Card */}
                <div style={{ marginBottom: 24 }}>
                    <BudgetPaceCard
                        monthlyData={data.monthly}
                        historicalData={data.historicalData}
                        selectedMonth={selectedMonth}
                        formatMoney={formatMoney}
                    />
                </div>

                {/* Two Column Layout */}
                <div className="two-col">
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Recent Transactions</span>
                            <span className="card-link" onClick={() => onNavigate?.("transactions")}>
                                View all →
                            </span>
                        </div>
                        <Table
                            columns={recentColumns}
                            dataSource={data.recentRows}
                            pagination={false}
                            size="small"
                            scroll={{ y: 300 }}
                        />
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Top Spending Categories</span>
                            <span className="card-link" onClick={() => onNavigate?.("budget")}>
                                View budget →
                            </span>
                        </div>
                        <div className="category-list">
                            {data.expenseCategories.slice(0, 5).map((category, index) => (
                                <div key={category.type} className="category-item">
                                    <div className="category-info">
                                        <div className="category-name">{category.type}</div>
                                        <div className="category-meta">
                                            {category.count || 1} transaction{category.count !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                    <div className="category-amount">
                                        ${formatMoney(category.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Spin>
        </div>
    );
};

export default Dashboard;