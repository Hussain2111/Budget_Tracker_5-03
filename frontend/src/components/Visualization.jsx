import { useEffect, useMemo, useState } from 'react';
import { Card, Col, DatePicker, Row, Statistic, Spin, message, Divider } from 'antd';
import { Pie, Column } from '@ant-design/plots';
import dayjs from 'dayjs';
import { dashboardService } from '../services/apiService';

const Visualization = () => {
    const currentMonth = useMemo(() => dayjs(), []);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const [loading, setLoading] = useState(false);
    const [loadingMonthly, setLoadingMonthly] = useState(false);

    const [expenseData, setExpenseData] = useState([]);
    const [incomeData, setIncomeData] = useState([]);

    const [monthly, setMonthly] = useState(null);

    const fetchCategoryData = async () => {
        setLoading(true);
        try {
            const [expRes, incRes] = await Promise.all([
                dashboardService.expensesByCategory(),
                dashboardService.incomeByCategory(),
            ]);

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
        fetchCategoryData();
        fetchMonthly(selectedMonth);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatMoney = (value) => {
        const num = Number(value || 0);
        return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const savingsValue = Number(monthly?.monthlySavings ?? 0);
    const savingsColor = savingsValue < 0 ? '#cf1322' : '#3f8600';

    const monthlyBarData = useMemo(() => {
        return [
            { name: 'Income', amount: Number(monthly?.totalIncome ?? 0) },
            { name: 'Expenses', amount: Number(monthly?.totalExpenses ?? 0) },
            { name: 'Savings', amount: Number(monthly?.monthlySavings ?? 0) },
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
            text: (datum) => `${datum.type}\n$${formatMoney(datum.value)}`,
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
            text: (datum) => `${datum.type}\n$${formatMoney(datum.value)}`,
        },

    };

    const monthlyColumnConfig = {
        data: monthlyBarData,
        xField: 'name',
        yField: 'amount',
        colorField: 'name',
        legend: false,
        yAxis: {
            label: {
                formatter: (v) => `$${v}`,
            },
        },
        tooltip: {
            formatter: (datum) => ({ name: datum.name, value: `$${formatMoney(datum.amount)}` }),
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
                    <Card title={`Income vs Expenses vs Savings (${selectedMonth.format('MMM YYYY')})`}>
                        <Spin spinning={loadingMonthly}>
                            <Column {...monthlyColumnConfig} />
                        </Spin>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card title="Expenses by Category (All Time)">
                        <Spin spinning={loading}>
                            {expenseData.length ? <Pie {...expensePieConfig} /> : 'No expense data'}
                        </Spin>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card title="Income by Category (All Time)">
                        <Spin spinning={loading}>
                            {incomeData.length ? <Pie {...incomePieConfig} /> : 'No income data'}
                        </Spin>
                    </Card>
                </Col>
            </Row>

            <Divider />

        </div>
    );
};

export default Visualization;