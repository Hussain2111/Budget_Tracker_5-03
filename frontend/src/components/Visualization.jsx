import { useEffect, useMemo, useState } from 'react';
import { Card, Col, DatePicker, Row, Statistic, Spin, message, Divider } from 'antd';
import { Pie, Column } from '@ant-design/plots';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import { dashboardService } from '../services/apiService';

// Consistent color constants across the app
const CHART_COLORS = {
    INCOME: '#52c41a', // green
    EXPENSES: '#ff4d4f', // red
    SAVINGS: '#1890ff', // blue
};

const Visualization = () => {
    const currentMonth = useMemo(() => dayjs(), []);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const [loading, setLoading] = useState(false);
    const [loadingMonthly, setLoadingMonthly] = useState(false);
    const [loadingTrend, setLoadingTrend] = useState(false);

    const [expenseData, setExpenseData] = useState([]);
    const [incomeData, setIncomeData] = useState([]);

    const [monthly, setMonthly] = useState(null);
    const [trendData, setTrendData] = useState([]);

    const fetchCategoryData = async (monthDayjs = null) => {
        setLoading(true);
        try {
            let expRes, incRes;
            
            if (monthDayjs) {
                // Fetch data for specific month
                const month = monthDayjs.month() + 1;
                const year = monthDayjs.year();
                [expRes, incRes] = await Promise.all([
                    dashboardService.expensesByCategory({ month, year }),
                    dashboardService.incomeByCategory({ month, year }),
                ]);
            } else {
                // Fetch all-time data (fallback)
                [expRes, incRes] = await Promise.all([
                    dashboardService.expensesByCategory(),
                    dashboardService.incomeByCategory(),
                ]);
            }

            const exp = (expRes.data || []).map((x) => ({
                type: x.type,
                value: Number(x.amount),
            }));

            const inc = (incRes.data || []).map((x) => ({
                type: x.type,
                value: Number(x.amount),
            }));

            setExpenseData(exp);
            setIncomeData(inc);
        } catch (e) {
            message.error('Failed to load visualization data');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrendData = async () => {
        setLoadingTrend(true);
        try {
            const res = await dashboardService.monthlyHistory(6);
            const data = (res.data?.data || []).map((r) => {
                const label = dayjs(`${r.year}-${String(r.month).padStart(2, '0')}-01`).format('MMM YYYY');
                return {
                    month: label,
                    Income: Number(r.totalIncome || 0),
                    Expenses: Number(r.totalExpenses || 0),
                    Savings: Number(r.monthlySavings || 0),
                };
            });
            setTrendData(data);
        } catch (e) {
            message.error('Failed to load trend data');
            console.error(e);
        } finally {
            setLoadingTrend(false);
        }
    };

    const fetchMonthly = async (monthDayjs) => {
        setLoadingMonthly(true);
        try {
            const month = monthDayjs.month() + 1;
            const year = monthDayjs.year();
            const res = await dashboardService.monthlySummary(month, year);
            setMonthly(res.data);
        } catch (e) {
            message.error('Failed to load monthly summary for chart');
            console.error(e);
            setMonthly(null);
        } finally {
            setLoadingMonthly(false);
        }
    };

    useEffect(() => {
        fetchCategoryData(selectedMonth);
        fetchMonthly(selectedMonth);
        fetchTrendData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatMoney = (value) => {
        const num = Number(value || 0);
        return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const savingsValue = Number(monthly?.monthlySavings ?? 0);
    const savingsColor = savingsValue < 0 ? CHART_COLORS.EXPENSES : CHART_COLORS.SAVINGS;

    // Stacked bar chart data showing expenses vs savings
    const stackedBarData = useMemo(() => {
        const expenses = Number(monthly?.totalExpenses ?? 0);
        const savings = Math.max(0, Number(monthly?.monthlySavings ?? 0));
        return [
            { type: 'Expenses', value: expenses },
            { type: 'Savings', value: savings },
        ];
    }, [monthly]);

    const expensePieConfig = {
        data: expenseData,
        angleField: 'value',
        colorField: 'type',
        radius: 0.9,
        legend: { position: 'bottom' },
        label: {
            position: 'inside',
            formatter: (datum) => `${datum.type}\n$${formatMoney(datum.value)}`,
        },
        color: ({ type }) => {
            // Use consistent colors for expense categories
            const categoryColors = {
                'Food': '#ff7875',
                'Transport': '#ff9c6e',
                'Entertainment': '#ffc53d',
                'Utilities': '#95de64',
                'Healthcare': '#69c0ff',
                'Shopping': '#b37feb',
                'Other': '#d9d9d9'
            };
            return categoryColors[type] || CHART_COLORS.EXPENSES;
        },
    };

    const incomePieConfig = {
        data: incomeData,
        angleField: 'value',
        colorField: 'type',
        radius: 0.9,
        legend: { position: 'bottom' },
        label: {
            position: 'inside',
            formatter: (datum) => `${datum.type}\n$${formatMoney(datum.value)}`,
        },
        color: ({ type }) => {
            // Use consistent colors for income categories
            const categoryColors = {
                'Salary': '#95de64',
                'Freelance': '#b7eb8f',
                'Investment': '#ffd666',
                'Business': '#87d068',
                'Other': '#d9d9d9'
            };
            return categoryColors[type] || CHART_COLORS.INCOME;
        },
    };

    // Stacked column configuration for income breakdown
    const stackedColumnConfig = {
        data: stackedBarData,
        xField: 'type',
        yField: 'value',
        colorField: 'type',
        color: ({ type }) => type === 'Expenses' ? CHART_COLORS.EXPENSES : CHART_COLORS.SAVINGS,
        yAxis: {
            label: {
                formatter: (v) => `$${v}`,
            },
        },
        label: {
            position: 'middle',
            formatter: (datum) => `$${formatMoney(datum.value)}`,
        },
    };

    return (
        <div style={{ padding: 20 }}>
            <Card style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>Budget Visualization</div>
                    <DatePicker
                        picker="month"
                        value={selectedMonth}
                        onChange={(val) => {
                            if (!val) return;
                            setSelectedMonth(val);
                            fetchMonthly(val);
                            fetchCategoryData(val); // Update pie charts with selected month
                        }}
                    />
                </div>
            </Card>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card>
                        <Spin spinning={loadingMonthly}>
                            <Statistic title="Monthly Income" value={formatMoney(monthly?.totalIncome)} prefix="$" />
                        </Spin>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card>
                        <Spin spinning={loadingMonthly}>
                            <Statistic title="Monthly Expenses" value={formatMoney(monthly?.totalExpenses)} prefix="$" />
                        </Spin>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card>
                        <Spin spinning={loadingMonthly}>
                            <Statistic
                                title="Monthly Savings"
                                value={formatMoney(monthly?.monthlySavings)}
                                prefix="$"
                                valueStyle={{ color: savingsColor }}
                            />
                        </Spin>
                    </Card>
                </Col>

                <Col xs={24}>
                    <Card title={`Income Breakdown (${selectedMonth.format('MMM YYYY')})`}>
                        <Spin spinning={loadingMonthly}>
                            <Column {...stackedColumnConfig} />
                        </Spin>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card title={`Expenses by Category (${selectedMonth.format('MMM YYYY')})`}>
                        <Spin spinning={loading}>
                            {expenseData.length ? <Pie {...expensePieConfig} /> : 'No expense data for this month'}
                        </Spin>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card title={`Income by Category (${selectedMonth.format('MMM YYYY')})`}>
                        <Spin spinning={loading}>
                            {incomeData.length ? <Pie {...incomePieConfig} /> : 'No income data for this month'}
                        </Spin>
                    </Card>
                </Col>

                <Col xs={24}>
                    <Card title="6-Month Trend">
                        <Spin spinning={loadingTrend}>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={trendData}>
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(v) => `$${v}`} />
                                    <Tooltip formatter={(value, name) => [`$${formatMoney(value)}`, name]} />
                                    <Legend verticalAlign="bottom" height={36} />
                                    <Line
                                        type="monotone"
                                        dataKey="Income"
                                        stroke={CHART_COLORS.INCOME}
                                        name="Income"
                                        strokeWidth={2}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Expenses"
                                        stroke={CHART_COLORS.EXPENSES}
                                        name="Expenses"
                                        strokeWidth={2}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Savings"
                                        stroke={CHART_COLORS.SAVINGS}
                                        name="Savings"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Spin>
                    </Card>
                </Col>
            </Row>

            <Divider />

        </div>
    );
};

export default Visualization;