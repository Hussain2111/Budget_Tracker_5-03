import { useEffect, useMemo, useState } from 'react';
import { Card, Col, DatePicker, Row, Statistic, Table, Tag, message, Spin, Select, Input, InputNumber, Button } from 'antd';
import dayjs from 'dayjs';
import { dashboardService, ledgerService } from '../services/apiService';

const { RangePicker } = DatePicker;

const Budget = () => {
    const currentMonth = useMemo(() => dayjs(), []);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const [monthlySummary, setMonthlySummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);

    const [rows, setRows] = useState([]);
    const [loadingLedger, setLoadingLedger] = useState(false);

    const [kindFilter, setKindFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const [range, setRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
    const [minAmount, setMinAmount] = useState();
    const [maxAmount, setMaxAmount] = useState();
    const [q, setQ] = useState('');
    const [sort, setSort] = useState('date');
    const [order, setOrder] = useState('DESC');

    const fetchMonthlySummary = async (monthDayjs) => {
        setLoadingSummary(true);
        try {
            const month = monthDayjs.month() + 1;
            const year = monthDayjs.year();
            const res = await dashboardService.monthlySummary(month, year);
            setMonthlySummary(res.data);
        } catch (e) {
            message.error('Failed to load monthly summary');
            console.error(e);
        } finally {
            setLoadingSummary(false);
        }
    };

    const fetchLedger = async (monthDayjs, overrideRange) => {
        setLoadingLedger(true);
        try {
            const usedRange = overrideRange || range;
            const startDate = usedRange?.[0]?.format('YYYY-MM-DD');
            const endDate = usedRange?.[1]?.format('YYYY-MM-DD');

            const month = monthDayjs.month() + 1;
            const year = monthDayjs.year();

            const params = {
                month,
                year,
                startDate,
                endDate,
                sort,
                order,
                kind: kindFilter === 'all' ? undefined : kindFilter,
                type: categoryFilter === 'all' ? undefined : categoryFilter,
                q: q?.trim() ? q.trim() : undefined,
                minAmount: typeof minAmount === 'number' ? minAmount : undefined,
                maxAmount: typeof maxAmount === 'number' ? maxAmount : undefined,
            };

            const res = await ledgerService.getAll(params);
            setRows((res.data || []).map((r) => ({ ...r, key: `${r.kind}-${r.id}` })));
        } catch (e) {
            message.error('Failed to load ledger transactions');
            console.error(e);
        } finally {
            setLoadingLedger(false);
        }
    };

    useEffect(() => {
        fetchMonthlySummary(selectedMonth);
        fetchLedger(selectedMonth);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatMoney = (value) => {
        const num = Number(value || 0);
        return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const categories = useMemo(() => {
        const set = new Set(rows.map((r) => r.type).filter(Boolean));
        return Array.from(set).sort();
    }, [rows]);

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            width: 120,
            render: (d) => dayjs(d).format('YYYY-MM-DD'),
        },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Category', dataIndex: 'type', key: 'type', width: 160 },
        {
            title: 'Kind',
            dataIndex: 'kind',
            key: 'kind',
            width: 110,
            render: (k) => (k === 'income' ? <Tag color="green">Income</Tag> : <Tag color="red">Expense</Tag>),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            width: 140,
            align: 'right',
            render: (amt) => {
                const color = Number(amt) < 0 ? '#cf1322' : '#3f8600';
                const sign = Number(amt) < 0 ? '-' : '+';
                return <span style={{ color }}>{sign}${formatMoney(Math.abs(Number(amt)))}</span>;
            },
        },
    ];

    const savingsValue = Number(monthlySummary?.monthlySavings ?? 0);
    const savingsColor = savingsValue < 0 ? '#cf1322' : '#3f8600';

    return (
        <div style={{ padding: 20 }}>
            <Card style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>Budget Summary</div>
                    <DatePicker
                        picker="month"
                        value={selectedMonth}
                        onChange={(val) => {
                            if (!val) return;
                            setSelectedMonth(val);
                            setRange([val.startOf('month'), val.endOf('month')]);
                            fetchMonthlySummary(val);
                            fetchLedger(val, [val.startOf('month'), val.endOf('month')]);
                        }}
                    />
                </div>
            </Card>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card>
                        <Spin spinning={loadingSummary}>
                            <Statistic title="Total Income" value={formatMoney(monthlySummary?.totalIncome)} prefix="$" />
                        </Spin>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card>
                        <Spin spinning={loadingSummary}>
                            <Statistic title="Total Expenses" value={formatMoney(monthlySummary?.totalExpenses)} prefix="$" />
                        </Spin>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card>
                        <Spin spinning={loadingSummary}>
                            <Statistic
                                title="Savings (Income − Expenses)"
                                value={formatMoney(monthlySummary?.monthlySavings)}
                                prefix="$"
                                valueStyle={{ color: savingsColor }}
                            />
                        </Spin>
                    </Card>
                </Col>

                <Col span={24}>
                    <Card
                        title={`Central Ledger (${selectedMonth.format('MMMM YYYY')})`}
                        extra={
                            <div style={{ margin: '10px 0', display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <RangePicker
                                    value={range}
                                    onChange={(val) => {
                                        if (!val) return;
                                        setRange(val);
                                    }}
                                />

                                <Input
                                    placeholder="Search (name/type/description)"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    style={{ width: 240 }}
                                />

                                <InputNumber
                                    placeholder="Min"
                                    value={minAmount}
                                    onChange={setMinAmount}
                                    style={{ width: 110 }}
                                />
                                <InputNumber
                                    placeholder="Max"
                                    value={maxAmount}
                                    onChange={setMaxAmount}
                                    style={{ width: 110 }}
                                />

                                <Select
                                    value={kindFilter}
                                    onChange={setKindFilter}
                                    style={{ width: 140 }}
                                    options={[
                                        { value: 'all', label: 'All' },
                                        { value: 'income', label: 'Income' },
                                        { value: 'expense', label: 'Expense' },
                                    ]}
                                />

                                <Select
                                    value={categoryFilter}
                                    onChange={setCategoryFilter}
                                    style={{ width: 200 }}
                                    options={[
                                        { value: 'all', label: 'All Categories' },
                                        ...categories.map((c) => ({ value: c, label: c })),
                                    ]}
                                />

                                <Select
                                    value={sort}
                                    onChange={setSort}
                                    style={{ width: 130 }}
                                    options={[
                                        { value: 'date', label: 'Sort: Date' },
                                        { value: 'amount', label: 'Sort: Amount' },
                                    ]}
                                />

                                <Select
                                    value={order}
                                    onChange={setOrder}
                                    style={{ width: 130 }}
                                    options={[
                                        { value: 'DESC', label: 'DESC' },
                                        { value: 'ASC', label: 'ASC' },
                                    ]}
                                />

                                <Button type="primary" onClick={() => fetchLedger(selectedMonth)}>
                                    Apply
                                </Button>
                            </div>
                        }
                    >
                        <Spin spinning={loadingLedger}>
                            <Table columns={columns} dataSource={rows} pagination={{ pageSize: 10 }} />
                        </Spin>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Budget;