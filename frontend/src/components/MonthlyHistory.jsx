import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Row, Select, Spin, Table, message, Statistic } from 'antd';
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

const MonthlyHistory = () => {
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

    // Handle row click to navigate to Budget page
    const handleRowClick = (record) => {
        const monthDayjs = dayjs(`${record.year}-${String(record.month).padStart(2, '0')}-01`);
        // Store selected month in localStorage for Budget component to pick up
        localStorage.setItem('selectedMonthForBudget', monthDayjs.toISOString());
        // Navigate to budget page by updating the active page
        // Note: This is a temporary solution using localStorage + reload
        // TODO: Replace with proper navigation when React Router is implemented
        localStorage.setItem('ACTIVE_PAGE', 'budget');
        window.location.reload();
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
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} md={8}>
                            <Card>
                                <Statistic 
                                    title="Average Monthly Income" 
                                    value={formatMoney(summaryStats.avgIncome)} 
                                    prefix="$" 
                                />
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card>
                                <Statistic 
                                    title="Average Monthly Expenses" 
                                    value={formatMoney(summaryStats.avgExpenses)} 
                                    prefix="$" 
                                />
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card>
                                {summaryStats.bestSavingsMonth ? (
                                    <Statistic
                                        title={`Best Savings Month — ${dayjs(`${summaryStats.bestSavingsMonth.year}-${String(summaryStats.bestSavingsMonth.month).padStart(2, '0')}-01`).format('MMM YYYY')}`}
                                        value={formatMoney(summaryStats.bestSavingsAmount)}
                                        prefix="$"
                                    />
                                ) : (
                                    <Statistic
                                        title="Best Savings Month"
                                        value="-"
                                        prefix="$"
                                    />
                                )}
                            </Card>
                        </Col>
                    </Row>

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
                            <Table
                                columns={columns}
                                dataSource={filteredRows.map((r) => ({ ...r, key: `${r.year}-${r.month}` }))}
                                pagination={false}
                                {...tableProps}
                            />
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