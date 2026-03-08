import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Row, Select, Spin, Table, message, Statistic } from 'antd';
import EmptyState from './EmptyState';
import {
    LineChart,
    Line as ReLine,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
    ReferenceDot,
} from 'recharts';
import dayjs from 'dayjs';
import { dashboardService } from '../services/apiService';

const MonthlyHistory = ({ onNavigate }) => {
    const [months, setMonths] = useState(12);
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);

    const fetchHistory = async (m) => {
        setLoading(true);
        try {
            const res = await dashboardService.monthlyHistory(m);
            setRows(res.data?.data || []);
        } catch (e) {
            message.error('Failed to load monthly history');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory(months);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatMoney = (value) => {
        const num = Number(value || 0);
        return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // transform rows into wide-format data for recharts
    const chartData = useMemo(() => {
        return (rows || []).map((r) => {
            const label = dayjs(`${r.year}-${String(r.month).padStart(2, '0')}-01`).format('MMM YYYY');
            return {
                month: label,
                Income: Number(r.totalIncome || 0),
                Expenses: Number(r.totalExpenses || 0),
                Savings: Number(r.monthlySavings || 0),
                year: r.year,
                monthNum: r.month,
            };
        });
    }, [rows]);

    // Filter out empty months for table display
    const filteredRows = useMemo(() => {
        return (rows || []).filter(r => 
            Number(r.totalIncome || 0) !== 0 || Number(r.totalExpenses || 0) !== 0
        );
    }, [rows]);

    // Calculate summary stats
    const summaryStats = useMemo(() => {
        if (!filteredRows.length) {
            return {
                avgIncome: 0,
                avgExpenses: 0,
                bestSavingsMonth: null,
                bestSavingsAmount: 0,
                firstTransactionMonth: null,
            };
        }

        const totalIncome = filteredRows.reduce((sum, r) => sum + Number(r.totalIncome || 0), 0);
        const totalExpenses = filteredRows.reduce((sum, r) => sum + Number(r.totalExpenses || 0), 0);
        const avgIncome = totalIncome / filteredRows.length;
        const avgExpenses = totalExpenses / filteredRows.length;

        // Find best savings month
        const bestMonth = filteredRows.reduce((best, current) => {
            const currentSavings = Number(current.monthlySavings || 0);
            const bestSavings = Number(best.monthlySavings || 0);
            return currentSavings > bestSavings ? current : best;
        });

        // Find first transaction month
        const firstTransaction = filteredRows.reduce((first, current) => {
            const currentDate = dayjs(`${current.year}-${String(current.month).padStart(2, '0')}-01`);
            const firstDate = dayjs(`${first.year}-${String(first.month).padStart(2, '0')}-01`);
            return currentDate.isBefore(firstDate) ? current : first;
        });

        return {
            avgIncome,
            avgExpenses,
            bestSavingsMonth: bestMonth,
            bestSavingsAmount: Number(bestMonth.monthlySavings || 0),
            firstTransactionMonth: firstTransaction,
        };
    }, [filteredRows]);

    // Calculate savings streak
    const savingsStreak = useMemo(() => {
        if (!filteredRows.length) return 0;

        // Sort by date ascending so we can walk backwards from most recent
        const sorted = [...filteredRows].sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });

        let streak = 0;
        for (const row of sorted) {
            if (Number(row.monthlySavings || 0) > 0) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }, [filteredRows]);

    // Handle row click to navigate to Budget page
    const handleRowClick = (record) => {
        const monthDayjs = dayjs(`${record.year}-${String(record.month).padStart(2, '0')}-01`);
        localStorage.setItem('selectedMonthForBudget', monthDayjs.toISOString());
        onNavigate?.('budget');
    };

    const columns = [
        {
            title: 'Month',
            key: 'monthLabel',
            render: (_, r) =>
                dayjs(`${r.year}-${String(r.month).padStart(2, '0')}-01`).format('MMMM YYYY'),
        },
        {
            title: 'Income',
            dataIndex: 'totalIncome',
            key: 'totalIncome',
            align: 'right',
            render: (v) => `$${formatMoney(v)}`,
        },
        {
            title: 'Expenses',
            dataIndex: 'totalExpenses',
            key: 'totalExpenses',
            align: 'right',
            render: (v) => `$${formatMoney(v)}`,
        },
        {
            title: 'Savings',
            dataIndex: 'monthlySavings',
            key: 'monthlySavings',
            align: 'right',
            render: (v) => {
                const num = Number(v || 0);
                const color = num < 0 ? '#cf1322' : '#3f8600';
                return <span style={{ color }}>${formatMoney(num)}</span>;
            },
        },
    ];

    // Table props for clickable rows
    const tableProps = {
        onRow: (record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
            title: 'Click to view this month in detail',
        }),
    };

    return (
        <div style={{ padding: 20 }}>
            <Card
                title="Monthly Summary Over Time"
                extra={
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div>Months:</div>
                        <Select
                            value={months}
                            onChange={(val) => {
                                setMonths(val);
                                fetchHistory(val);
                            }}
                            style={{ width: 120 }}
                            options={[
                                { value: 6, label: '6' },
                                { value: 12, label: '12' },
                                { value: 24, label: '24' },
                            ]}
                        />
                    </div>
                }
            >
                <Spin spinning={loading}>
                    {/* Summary Stats */}
                    <div className="summary-stat-grid">
                        <div className="metric-card">
                            <div className="metric-name">Average Monthly Income</div>
                            <div className="metric-value">${formatMoney(summaryStats.avgIncome)}</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-name">Average Monthly Expenses</div>
                            <div className="metric-value">${formatMoney(summaryStats.avgExpenses)}</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-name">
                                {summaryStats.bestSavingsMonth ? 
                                    `Best Savings — ${dayjs(`${summaryStats.bestSavingsMonth.year}-${String(summaryStats.bestSavingsMonth.month).padStart(2, '0')}-01`).format('MMM YYYY')}` :
                                    'Best Savings Month'
                                }
                            </div>
                            <div className="metric-value">
                                {summaryStats.bestSavingsMonth ? `$${formatMoney(summaryStats.bestSavingsAmount)}` : '-'}
                            </div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-name">Savings Streak</div>
                            <div style={{ textAlign: "center", padding: "8px 0" }}>
                                <div style={{
                                    fontSize: 36,
                                    marginBottom: 4,
                                }}>
                                    {savingsStreak >= 3 ? "🔥" : savingsStreak >= 1 ? "✅" : "💤"}
                                </div>
                                <div style={{
                                    fontSize: 28,
                                    fontWeight: 700,
                                    color: savingsStreak >= 3 ? "#fa8c16" :
                                           savingsStreak >= 1 ? "#52c41a" : "#d9d9d9",
                                    lineHeight: 1,
                                    marginBottom: 4,
                                }}>
                                    {savingsStreak}
                                </div>
                                <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                                    Month savings streak
                                </div>
                                {savingsStreak >= 3 && (
                                    <div style={{
                                        marginTop: 6,
                                        fontSize: 11,
                                        color: "#fa8c16",
                                        fontWeight: 500,
                                    }}>
                                        Keep it going!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {savingsStreak >= 1 && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{
                                padding: "14px 20px",
                                borderRadius: 8,
                                background: savingsStreak >= 6 ? "#fff7e6" :
                                            savingsStreak >= 3 ? "#f6ffed" : "#f0f5ff",
                                borderLeft: `4px solid ${
                                    savingsStreak >= 6 ? "#fa8c16" :
                                    savingsStreak >= 3 ? "#52c41a" : "#1890ff"
                                }`,
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                marginBottom: 8,
                            }}>
                                <span style={{ fontSize: 20 }}>
                                    {savingsStreak >= 6 ? "🏆" : savingsStreak >= 3 ? "🔥" : "✅"}
                                </span>
                                <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
                                    {savingsStreak >= 6
                                        ? `${savingsStreak} months of positive savings in a row. Exceptional consistency.` 
                                        : savingsStreak >= 3
                                        ? `${savingsStreak}-month savings streak. You're building real momentum.` 
                                        : `You saved money last month. Keep the streak going this month.`}
                                </span>
                            </div>
                        </div>
                    )}

                    <Row gutter={[16, 16]}>
                        <Col xs={24}>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData}>
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(v) => `$${v}`} />
                                    <Tooltip formatter={(value, name) => [`$${formatMoney(value)}`, name]} />
                                    <Legend verticalAlign="bottom" height={36} />
                                    
                                    {/* First transaction annotation */}
                                    {summaryStats.firstTransactionMonth && (() => {
                                        const firstMonthLabel = dayjs(`${summaryStats.firstTransactionMonth.year}-${String(summaryStats.firstTransactionMonth.month).padStart(2, '0')}-01`).format('MMM YYYY');
                                        const firstMonthIndex = chartData.findIndex(d => d.month === firstMonthLabel);
                                        if (firstMonthIndex >= 0) {
                                            return (
                                                <ReferenceDot
                                                    x={firstMonthLabel}
                                                    y={chartData[firstMonthIndex].Income}
                                                    r={6}
                                                    fill="#1890ff"
                                                    stroke="#1890ff"
                                                    label={{ value: 'Started tracking', position: 'top', fontSize: 12, fill: '#1890ff' }}
                                                />
                                            );
                                        }
                                        return null;
                                    })()}
                                    
                                    <ReLine
                                        type="monotone"
                                        dataKey="Income"
                                        stroke="#3f8600"
                                        name="Income"
                                    />
                                    <ReLine
                                        type="monotone"
                                        dataKey="Expenses"
                                        stroke="#cf1322"
                                        name="Expenses"
                                    />
                                    <ReLine
                                        type="monotone"
                                        dataKey="Savings"
                                        stroke="#1890ff"
                                        name="Savings"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Col>

                        <Col xs={24}>
                           {filteredRows.length === 0 && !loading ? (
                                <EmptyState
                                    icon="📅"
                                    title="No history yet"
                                    description="Once you start logging income and expenses, your monthly history will appear here."
                                />
                            ) : (
                                <Table
                                    columns={columns}
                                    dataSource={filteredRows.map((r) => ({ ...r, key: `${r.year}-${r.month}` }))}
                                    pagination={false}
                                    {...tableProps}
                                />
                            )}
                            {filteredRows.length < rows.length && (
                                <div style={{ marginTop: 12, fontSize: 12, color: '#666', textAlign: 'center' }}>
                                    Showing months with activity only
                                </div>
                            )}
                        </Col>
                    </Row>
                </Spin>
            </Card>
        </div>
    );
};

export default MonthlyHistory;