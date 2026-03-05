import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Row, Select, Spin, Table, message } from 'antd';
import {
    LineChart,
    Line as ReLine,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
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
            };
        });
    }, [rows]);

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
                    <Row gutter={[16, 16]}>
                        <Col xs={24}>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData}>
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(v) => `$${v}`} />
                                    <Tooltip formatter={(value, name) => [`$${formatMoney(value)}`, name]} />
                                    <Legend verticalAlign="bottom" height={36} />
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
                                dataSource={(rows || []).map((r) => ({ ...r, key: `${r.year}-${r.month}` }))}
                                pagination={false}
                            />
                        </Col>
                    </Row>
                </Spin>
            </Card>
        </div>
    );
};

export default MonthlyHistory;