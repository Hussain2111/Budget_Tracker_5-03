import { useEffect, useMemo, useState } from "react";
import {
    Card, Col, Row, Spin, message, Progress,
    Button, Modal, Form, Select, InputNumber,
    DatePicker, Statistic,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { dashboardService, ledgerService, budgetService } from "../services/apiService";
import EmptyState from "./EmptyState";

const Budget = () => {
    const currentMonth = useMemo(() => dayjs(), []);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const stored = localStorage.getItem("selectedMonthForBudget");
        if (stored) {
            localStorage.removeItem("selectedMonthForBudget");
            return dayjs(stored);
        }
        return currentMonth; 
    });

    const [monthlySummary, setMonthlySummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [budgets, setBudgets] = useState([]);
    const [loadingBudgets, setLoadingBudgets] = useState(false);
    const [allRows, setAllRows] = useState([]);
    const [loadingLedger, setLoadingLedger] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [budgetForm] = Form.useForm();

    const fetchAll = async (monthDayjs) => {
        const month = monthDayjs.month() + 1;
        const year = monthDayjs.year();

        setLoadingSummary(true);
        setLoadingBudgets(true);
        setLoadingLedger(true);

        const [summaryRes, budgetRes, ledgerRes] = await Promise.allSettled([
            dashboardService.monthlySummary(month, year),
            budgetService.getAll(month, year),
            ledgerService.getAll({ month, year }),
        ]);

        if (summaryRes.status === "fulfilled") setMonthlySummary(summaryRes.value.data);
        else message.error("Failed to load summary");
        setLoadingSummary(false);

        if (budgetRes.status === "fulfilled") setBudgets(budgetRes.value.data || []);
        else message.error("Failed to load budgets");
        setLoadingBudgets(false);

        if (ledgerRes.status === "fulfilled") setAllRows(ledgerRes.value.data || []);
        else message.error("Failed to load transactions");
        setLoadingLedger(false);
    };

    useEffect(() => {
        fetchAll(selectedMonth);
    }, []);

    const formatMoney = (v) => Number(v || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    });

    const categorySpending = useMemo(() => {
        const map = {};
        allRows.forEach(row => {
            if (row.kind === "expense") {
                map[row.type] = (map[row.type] || 0) + Math.abs(Number(row.amount || 0));
            }
        });
        return map;
    }, [allRows]);

    const expenseCategories = useMemo(() => {
        return [...new Set(allRows
            .filter(r => r.kind === "expense")
            .map(r => r.type)
        )].sort();
    }, [allRows]);

    const getBudgetStatus = (spent, limit) => {
        const pct = limit > 0 ? (spent / limit) * 100 : 0;
        if (pct >= 100) return { color: "#ff4d4f", label: "Over budget" };
        if (pct >= 75) return { color: "#faad14", label: "Warning" };
        return { color: "#52c41a", label: "On track" };
    };

    const handleOpenModal = (budget = null, category = null) => {
        setEditingBudget(budget);
        budgetForm.setFieldsValue(budget
            ? { category: budget.category, amount: Number(budget.amount) }
            : { category, amount: undefined }
        );
        setModalOpen(true);
    };

    const handleSave = async (values) => {
        try {
            await budgetService.upsert({
                category: values.category,
                amount: values.amount,
                month: selectedMonth.month() + 1,
                year: selectedMonth.year(),
            });
            message.success(editingBudget ? "Budget updated" : "Budget created");
            setModalOpen(false);
            budgetForm.resetFields();
            fetchAll(selectedMonth);
        } catch {
            message.error("Failed to save budget");
        }
    };

    const handleDelete = async (id) => {
        try {
            await budgetService.delete(id);
            message.success("Budget deleted");
            fetchAll(selectedMonth);
        } catch {
            message.error("Failed to delete budget");
        }
    };

    const savingsValue = Number(monthlySummary?.monthlySavings ?? 0);

    return (
        <div style={{ padding: 20 }}>
            {/* Month selector */}
            <Card style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>
                        Budget — {selectedMonth.format("MMMM YYYY")}
                    </div>
                    <DatePicker
                        picker="month"
                        value={selectedMonth}
                        allowClear={false}
                        onChange={(val) => {
                            if (!val) return;
                            setSelectedMonth(val);
                            fetchAll(val);
                        }}
                    />
                </div>
            </Card>

            <Row gutter={[16, 16]}>
                {/* Summary stats */}
                <Col xs={24} md={8}>
                    <Card>
                        <Spin spinning={loadingSummary}>
                            <Statistic
                                title="Total Income"
                                value={formatMoney(monthlySummary?.totalIncome)}
                                prefix="$"
                                valueStyle={{ color: "#3f8600" }}
                            />
                        </Spin>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Spin spinning={loadingSummary}>
                            <Statistic
                                title="Total Expenses"
                                value={formatMoney(monthlySummary?.totalExpenses)}
                                prefix="$"
                                valueStyle={{ color: "#cf1322" }}
                            />
                        </Spin>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Spin spinning={loadingSummary}>
                            <Statistic
                                title="Net Savings"
                                value={formatMoney(savingsValue)}
                                prefix="$"
                                valueStyle={{ color: savingsValue < 0 ? "#cf1322" : "#3f8600" }}
                            />
                        </Spin>
                    </Card>
                </Col>

                {/* Budget category cards */}
                <Col xs={24}>
                    <Card
                        title="Category Budgets"
                        extra={
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                size="small"
                                onClick={() => handleOpenModal()}
                            >
                                Add Budget
                            </Button>
                        }
                    >
                        <Spin spinning={loadingBudgets || loadingLedger}>
                            {expenseCategories.length === 0 ? (
                                <EmptyState
                                    icon="📋"
                                    title="No spending this month"
                                    description="Add expenses in the Transactions tab and then set budget limits for each category here."
                                />
                            ) : (
                                <Row gutter={[16, 16]}>
                                    {expenseCategories.map((category) => {
                                        const budget = budgets.find(b => b.category === category);
                                        const spent = categorySpending[category] || 0;
                                        const limit = budget ? Number(budget.amount) : 0;
                                        const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                                        const status = getBudgetStatus(spent, limit);

                                        return (
                                            <Col xs={24} sm={12} md={8} lg={6} key={category}>
                                                <Card
                                                    size="small"
                                                    style={{
                                                        borderStyle: budget ? "solid" : "dashed",
                                                        height: "100%",
                                                    }}
                                                    actions={budget ? [
                                                        <EditOutlined
                                                            key="edit"
                                                            onClick={() => handleOpenModal(budget)}
                                                        />,
                                                        <DeleteOutlined
                                                            key="delete"
                                                            onClick={() => handleDelete(budget.id)}
                                                        />,
                                                    ] : []}
                                                >
                                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                                        {category}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 12 }}>
                                                        {budget
                                                            ? `$${formatMoney(spent)} of $${formatMoney(limit)}` 
                                                            : `$${formatMoney(spent)} spent`}
                                                    </div>
                                                    {budget ? (
                                                        <>
                                                            <Progress
                                                                percent={Math.round(pct)}
                                                                strokeColor={status.color}
                                                                size="small"
                                                            />
                                                            <div style={{
                                                                marginTop: 6,
                                                                fontSize: 11,
                                                                color: status.color,
                                                                fontWeight: 500,
                                                            }}>
                                                                {status.label}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            type="dashed"
                                                            size="small"
                                                            icon={<PlusOutlined />}
                                                            onClick={() => handleOpenModal(null, category)}
                                                            style={{ width: "100%" }}
                                                        >
                                                            Set limit
                                                        </Button>
                                                    )}
                                                </Card>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            )}
                        </Spin>
                    </Card>
                </Col>
            </Row>

            <Modal
                title={editingBudget ? "Edit Budget Limit" : "Set Budget Limit"}
                open={modalOpen}
                onOk={() => budgetForm.submit()}
                onCancel={() => { setModalOpen(false); budgetForm.resetFields(); }}
            >
                <Form form={budgetForm} layout="vertical" onFinish={handleSave}>
                    <Form.Item
                        label="Category"
                        name="category"
                        rules={[{ required: true }]}
                    >
                        <Select
                            disabled={!!editingBudget}
                            options={expenseCategories.map(c => ({ label: c, value: c }))}
                            placeholder="Select a category"
                        />
                    </Form.Item>
                    <Form.Item
                        label="Monthly Limit"
                        name="amount"
                        rules={[{ required: true, message: "Please enter a limit" }]}
                    >
                        <InputNumber
                            min={0.01}
                            step={0.01}
                            prefix="$"
                            style={{ width: "100%" }}
                            placeholder="0.00"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Budget;