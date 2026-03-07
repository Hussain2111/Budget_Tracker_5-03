import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Tag, message, Spin, Select, Input, InputNumber, Button, Progress, Modal, Form, DatePicker } from 'antd';
import { EditOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { dashboardService, ledgerService, budgetService } from '../services/apiService';


const Budget = () => {
    const currentMonth = useMemo(() => dayjs(), []);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        // Check if we have a selected month from localStorage (set by MonthlyHistory)
        const storedMonth = localStorage.getItem('selectedMonthForBudget');
        if (storedMonth) {
            // Clear it after reading so it doesn't affect future navigation
            localStorage.removeItem('selectedMonthForBudget');
            return dayjs(storedMonth);
        }
        return currentMonth;
    });

    const [monthlySummary, setMonthlySummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);

    const [rows, setRows] = useState([]);
    const [loadingLedger, setLoadingLedger] = useState(false);
    const [allRows, setAllRows] = useState([]); // Store all rows for client-side filtering

    const [budgets, setBudgets] = useState([]);
    const [loadingBudgets, setLoadingBudgets] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [isBudgetModalVisible, setIsBudgetModalVisible] = useState(false);
    const [budgetForm] = Form.useForm();

    const [categoryFilter, setCategoryFilter] = useState('all');
    const [kindFilter, setKindFilter] = useState('all');
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

    const fetchBudgets = async (monthDayjs) => {
        setLoadingBudgets(true);
        try {
            const month = monthDayjs.month() + 1;
            const year = monthDayjs.year();
            const res = await budgetService.getAll(month, year);
            setBudgets(res.data || []);
        } catch (e) {
            // Handle 404 error gracefully - budget endpoints may not exist yet
            if (e.response?.status === 404) {
                console.log('Budget endpoints not implemented yet - using mock data');
                setBudgets([]); // Empty budgets for now
            } else {
                message.error('Failed to load budget limits');
                console.error(e);
            }
        } finally {
            setLoadingBudgets(false);
        }
    };

    const fetchLedger = async (monthDayjs) => {
        setLoadingLedger(true);
        try {
            const month = monthDayjs.month() + 1;
            const year = monthDayjs.year();

            const params = {
                month,
                year,
                kind: kindFilter !== 'all' ? kindFilter : undefined,
                category: categoryFilter !== 'all' ? categoryFilter : undefined,
                minAmount,
                maxAmount,
                q,
                sort,
                order,
            };

            const res = await ledgerService.getAll(params);
            const data = res.data || [];
            setAllRows(data); // Store all rows for client-side filtering
        } catch (e) {
            message.error('Failed to load ledger transactions');
            console.error(e);
        } finally {
            setLoadingLedger(false);
        }
    };

    // Client-side filtering function
    const filterRows = useMemo(() => {
        let filtered = [...allRows];
        
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(r => r.type === categoryFilter);
        }
        
        if (kindFilter !== 'all') {
            filtered = filtered.filter(r => r.kind === kindFilter);
        }
        
        if (q) {
            filtered = filtered.filter(r => 
                r.description?.toLowerCase().includes(q.toLowerCase()) ||
                r.type?.toLowerCase().includes(q.toLowerCase())
            );
        }
        
        if (minAmount) {
            filtered = filtered.filter(r => Number(r.amount) >= minAmount);
        }
        
        if (maxAmount) {
            filtered = filtered.filter(r => Number(r.amount) <= maxAmount);
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            let aVal = a[sort];
            let bVal = b[sort];
            
            if (sort === 'date' || sort === 'amount') {
                aVal = Number(aVal);
                bVal = Number(bVal);
            }
            
            if (order === 'ASC') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
        
        return filtered;
    }, [allRows, categoryFilter, kindFilter, q, minAmount, maxAmount, sort, order]);

    // Update filtered rows whenever dependencies change
    // Note: Removed useEffect that set rows from filterRows to avoid unnecessary render cycle

    useEffect(() => {
        fetchMonthlySummary(selectedMonth);
        fetchLedger(selectedMonth);
        fetchBudgets(selectedMonth);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatMoney = (value) => {
        const num = Number(value || 0);
        return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Calculate category spending for the current month
    const categorySpending = useMemo(() => {
        const spending = {};
        allRows.forEach(row => {
            if (row.kind === 'expense') {
                spending[row.type] = (spending[row.type] || 0) + Number(row.amount || 0);
            }
        });
        return spending;
    }, [allRows]);

    // Get all unique expense categories
    const expenseCategories = useMemo(() => {
        const categories = new Set();
        allRows.forEach(row => {
            if (row.kind === 'expense') {
                categories.add(row.type);
            }
        });
        return Array.from(categories).sort();
    }, [allRows]);

    // Handle budget editing
    const handleEditBudget = (budget) => {
        setEditingBudget(budget);
        budgetForm.setFieldsValue({
            category: budget.category,
            amount: Number(budget.amount),
        });
        setIsBudgetModalVisible(true);
    };

    const handleCreateBudget = (category) => {
        setEditingBudget(null);
        budgetForm.setFieldsValue({
            category: category,
            amount: undefined,
        });
        setIsBudgetModalVisible(true);
    };

    const handleSaveBudget = async (values) => {
        try {
            const month = selectedMonth.month() + 1;
            const year = selectedMonth.year();
            const payload = {
                category: values.category,
                amount: values.amount,
                month,
                year,
            };

            // Always use upsert - backend handles both create and update
            await budgetService.upsert(payload);
            message.success(editingBudget ? 'Budget limit updated' : 'Budget limit created');

            setIsBudgetModalVisible(false);
            budgetForm.resetFields();
            fetchBudgets(selectedMonth);
        } catch (e) {
            // Handle 404 error gracefully - budget endpoints may not exist yet
            if (e.response?.status === 404) {
                message.info('Budget feature not available yet - coming soon!');
                // Create a temporary budget in local state for demo
                const tempBudget = {
                    id: Date.now(), // Temporary ID
                    category: values.category,
                    amount: values.amount,
                    month: selectedMonth.month() + 1,
                    year: selectedMonth.year(),
                };
                
                if (editingBudget) {
                    setBudgets(prev => prev.map(b => b.id === editingBudget.id ? tempBudget : b));
                } else {
                    setBudgets(prev => [...prev, tempBudget]);
                }
                
                setIsBudgetModalVisible(false);
                budgetForm.resetFields();
            } else {
                message.error('Failed to save budget limit');
                console.error(e);
            }
        }
    };

    const handleDeleteBudget = async (id) => {
        try {
            await budgetService.delete(id);
            message.success('Budget limit deleted');
            fetchBudgets(selectedMonth);
        } catch (e) {
            // Handle 404 error gracefully - budget endpoints may not exist yet
            if (e.response?.status === 404) {
                message.info('Budget feature not available yet - coming soon!');
                // Remove from local state for demo
                setBudgets(prev => prev.filter(b => b.id !== id));
            } else {
                message.error('Failed to delete budget limit');
                console.error(e);
            }
        }
    };

    // Handle category card click to filter ledger
    const handleCategoryClick = (category) => {
        setCategoryFilter(category);
    };

    // Get budget status for progress bar
    const getBudgetStatus = (spent, limit) => {
        const percentage = limit > 0 ? (spent / limit) * 100 : 0;
        if (percentage >= 100) return { color: '#ff4d4f', status: 'Over budget' };
        if (percentage >= 75) return { color: '#faad14', status: 'Warning' };
        return { color: '#52c41a', status: 'On track' };
    };

    const categories = useMemo(() => {
        const set = new Set(allRows.map((r) => r.type).filter(Boolean));
        return Array.from(set).sort();
    }, [allRows]);

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
                            fetchMonthlySummary(val);
                            fetchLedger(val);
                            fetchBudgets(val);
                        }}
                    />
                </div>
            </Card>

            <Row gutter={[16, 16]}>
                {/* Category Budget Cards */}
                <Col span={24}>
                    <Spin spinning={loadingBudgets}>
                        <Row gutter={[16, 16]}>
                            {expenseCategories.map((category) => {
                                const budget = budgets.find(b => b.category === category);
                                const spent = categorySpending[category] || 0;
                                const limit = budget ? Number(budget.amount) : 0;
                                const percentage = limit > 0 ? (spent / limit) * 100 : 0;
                                const status = getBudgetStatus(spent, limit);

                                if (budget) {
                                    // Card with budget limit
                                    return (
                                        <Col xs={24} sm={12} md={8} lg={6} key={`budget-${category}`}>
                                            <Card
                                                size="small"
                                                hoverable
                                                onClick={() => handleCategoryClick(category)}
                                                style={{ cursor: 'pointer' }}
                                                actions={[
                                                    <EditOutlined key={`edit-${category}`} onClick={(e) => { e.stopPropagation(); handleEditBudget(budget); }} />,
                                                    <DeleteOutlined key={`delete-${category}`} onClick={(e) => { e.stopPropagation(); handleDeleteBudget(budget.id); }} />,
                                                ]}
                                            >
                                                <div style={{ marginBottom: 12 }}>
                                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{category}</div>
                                                    <div style={{ fontSize: 12, color: '#666' }}>
                                                        ${formatMoney(spent)} of ${formatMoney(limit)}
                                                    </div>
                                                </div>
                                                <Progress
                                                    percent={Math.min(percentage, 100)}
                                                    strokeColor={status.color}
                                                    size="small"
                                                    format={() => `${percentage.toFixed(0)}%`}
                                                />
                                                <div style={{ marginTop: 8, fontSize: 11, color: status.color, fontWeight: 500 }}>
                                                    {status.status}
                                                </div>
                                            </Card>
                                        </Col>
                                    );
                                } else {
                                    // Card without budget limit (dashed)
                                    return (
                                        <Col xs={24} sm={12} md={8} lg={6} key={`no-budget-${category}`}>
                                            <Card
                                                size="small"
                                                hoverable
                                                onClick={() => handleCategoryClick(category)}
                                                style={{ cursor: 'pointer', borderStyle: 'dashed' }}
                                            >
                                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{category}</div>
                                                    <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                                                        ${formatMoney(spent)} spent
                                                    </div>
                                                    <Button
                                                        type="dashed"
                                                        icon={<PlusOutlined />}
                                                        size="small"
                                                        onClick={(e) => { e.stopPropagation(); handleCreateBudget(category); }}
                                                    >
                                                        Set limit
                                                    </Button>
                                                </div>
                                            </Card>
                                        </Col>
                                    );
                                }
                            })}
                        </Row>
                    </Spin>
                </Col>

                {/* Summary Stats */}
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

                {/* Ledger Table */}
                <Col span={24}>
                    <Card title={`Central Ledger (${selectedMonth.format('MMMM YYYY')})`}>
                        <Spin spinning={loadingLedger}>
                            {/* Filter Controls */}
                            <div style={{ marginBottom: 16, padding: '12px', backgroundColor: '#f5f5f5', borderRadius: 6 }}>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
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
                                </div>
                            </div>

                            <Table columns={columns} dataSource={filterRows} pagination={{ pageSize: 10 }} />
                        </Spin>
                    </Card>
                </Col>
            </Row>

            {/* Budget Modal */}
            <Modal
                title={editingBudget ? 'Edit Budget Limit' : 'Set Budget Limit'}
                open={isBudgetModalVisible}
                onOk={() => budgetForm.submit()}
                onCancel={() => {
                    setIsBudgetModalVisible(false);
                    budgetForm.resetFields();
                }}
            >
                <Form form={budgetForm} layout="vertical" onFinish={handleSaveBudget}>
                    <Form.Item
                        label="Category"
                        name="category"
                        rules={[{ required: true, message: 'Please select a category' }]}
                    >
                        <Select disabled={!!editingBudget}>
                            {expenseCategories.map(cat => (
                                <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Budget Limit"
                        name="amount"
                        rules={[{ required: true, message: 'Please enter a budget limit' }]}
                    >
                        <InputNumber
                            min={0}
                            step={0.01}
                            style={{ width: '100%' }}
                            prefix="$"
                            placeholder="0.00"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Budget;