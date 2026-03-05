import { useEffect, useMemo, useState } from "react";
import {
    Card,
    Col,
    DatePicker,
    Row,
    Statistic,
    message,
    Spin,
    Divider,
    Table,
    Tag,
    List,
} from "antd";
import { dashboardService, ledgerService } from "../services/apiService";
import dayjs from "dayjs";

const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [monthly, setMonthly] = useState(null);

    const [expenseCategories, setExpenseCategories] = useState([]);
    const [incomeCategories, setIncomeCategories] = useState([]);

    const [recentRows, setRecentRows] = useState([]);

    const [loadingSummary, setLoadingSummary] = useState(false);
    const [loadingMonthly, setLoadingMonthly] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingRecent, setLoadingRecent] = useState(false);

    const currentMonth = useMemo(() => dayjs(), []);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const fetchSummary = async () => {
        setLoadingSummary(true);
        try {
            const res = await dashboardService.summary();
            setSummary(res.data);
        } catch (e) {
            message.error("Failed to load dashboard summary");
            console.error(e);
        } finally {
            setLoadingSummary(false);
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
            message.error("Failed to load monthly summary");
            console.error(e);
        } finally {
            setLoadingMonthly(false);
        }
    };

    const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
            const month = selectedMonth.month() + 1;
            const year = selectedMonth.year();

            const [expRes, incRes] = await Promise.all([
                dashboardService.expensesByCategory({ month, year }),
                dashboardService.incomeByCategory({ month, year }),
            ]);

            const expSorted = [...(expRes.data || [])].sort(
                (a, b) => Number(b.amount) - Number(a.amount),
            );
            const incSorted = [...(incRes.data || [])].sort(
                (a, b) => Number(b.amount) - Number(a.amount),
            );

            setExpenseCategories(expSorted);
            setIncomeCategories(incSorted);
        } catch (e) {
            message.error("Failed to load category summaries");
            console.error(e);
        } finally {
            setLoadingCategories(false);
        }
    };

    const fetchRecentTransactions = async () => {
        setLoadingRecent(true);
        try {
            const res = await ledgerService.getAll({
                limit: 8,
                sort: "date",
                order: "DESC",
            });

            const rows = (res.data || []).map((r) => ({
                ...r,
                key: `${r.kind}-${r.id}`,
            }));

            setRecentRows(rows);
        } catch (e) {
            message.error("Failed to load recent transactions");
            console.error(e);
        } finally {
            setLoadingRecent(false);
        }
    };

    useEffect(() => {
        fetchSummary();
        fetchMonthly(selectedMonth);
        fetchCategories();
        fetchRecentTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatMoney = (value) => {
        const num = Number(value || 0);
        return num.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const balanceColor =
        summary && Number(summary.currentBalance) < 0 ? "#cf1322" : "#3f8600";

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
        <div style={{ padding: 20 }}>
            {/* ── Row 1: Summary KPI cards (equal height) ── */}
            <Row gutter={[16, 16]} align="stretch">
                <Col xs={24} sm={12} xl={6}>
                    <Card className="stat-card" style={{ borderTop: "3px solid #1890ff" }}>
                        <Spin spinning={loadingSummary}>
                            <Statistic
                                title="Current Balance"
                                value={formatMoney(summary?.currentBalance)}
                                prefix="$"
                                valueStyle={{ color: balanceColor, fontSize: 28 }}
                            />
                        </Spin>
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card className="stat-card" style={{ borderTop: "3px solid #52c41a" }}>
                        <Spin spinning={loadingSummary}>
                            <Statistic
                                title="Total Income"
                                value={formatMoney(summary?.totalIncome)}
                                prefix="$"
                                valueStyle={{ color: "#3f8600", fontSize: 28 }}
                            />
                        </Spin>
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card className="stat-card" style={{ borderTop: "3px solid #ff4d4f" }}>
                        <Spin spinning={loadingSummary}>
                            <Statistic
                                title="Total Expenses"
                                value={formatMoney(summary?.totalExpenses)}
                                prefix="$"
                                valueStyle={{ color: "#cf1322", fontSize: 28 }}
                            />
                        </Spin>
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card className="stat-card" style={{ borderTop: "3px solid #faad14" }}>
                        <Spin spinning={loadingSummary}>
                            <Statistic
                                title="Total Savings Goals"
                                value={formatMoney(summary?.totalSavingsGoal)}
                                prefix="$"
                                valueStyle={{ fontSize: 28 }}
                            />
                            <div style={{ marginTop: 8, color: "rgba(0,0,0,0.45)", fontSize: 12 }}>
                                {summary?.savingsCount ?? 0} active goal{summary?.savingsCount !== 1 ? "s" : ""}
                            </div>
                        </Spin>
                    </Card>
                </Col>
            </Row>

            {/* ── Row 2: Monthly summary + Categories ── */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }} align="stretch">
                <Col xs={24} lg={12}>
                    <Card
                        className="stat-card"
                        title={
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span>Monthly Summary</span>
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
                        }
                    >
                        <Spin spinning={loadingMonthly}>
                            <Row gutter={[16, 16]}>
                                <Col span={8}>
                                    <Statistic
                                        title="Income"
                                        value={formatMoney(monthly?.totalIncome)}
                                        prefix="$"
                                        valueStyle={{ color: "#3f8600" }}
                                    />
                                </Col>
                                <Col span={8}>
                                    <Statistic
                                        title="Expenses"
                                        value={formatMoney(monthly?.totalExpenses)}
                                        prefix="$"
                                        valueStyle={{ color: "#cf1322" }}
                                    />
                                </Col>
                                <Col span={8}>
                                    <Statistic
                                        title="Net Savings"
                                        value={formatMoney(monthly?.monthlySavings)}
                                        prefix="$"
                                        valueStyle={{
                                            color:
                                                monthly && Number(monthly.monthlySavings) < 0
                                                    ? "#cf1322"
                                                    : "#3f8600",
                                        }}
                                    />
                                </Col>
                            </Row>
                            <div style={{ marginTop: 16, color: "rgba(0,0,0,0.45)", fontSize: 12 }}>
                                {monthly?.incomeCount ?? 0} income · {monthly?.expenseCount ?? 0} expenses this month
                            </div>
                        </Spin>
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card className="stat-card" title="Top Categories This Month">
                        <Spin spinning={loadingCategories}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <div style={{ fontWeight: 600, marginBottom: 8, color: "#cf1322" }}>Expenses</div>
                                    <List
                                        size="small"
                                        dataSource={(expenseCategories || []).slice(0, 5)}
                                        locale={{ emptyText: "No expense data" }}
                                        renderItem={(item) => (
                                            <List.Item style={{ padding: "4px 0" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                                                    <span style={{ fontSize: 13 }}>{item.type}</span>
                                                    <span style={{ color: "#cf1322", fontWeight: 600 }}>-${formatMoney(item.amount)}</span>
                                                </div>
                                            </List.Item>
                                        )}
                                    />
                                </Col>
                                <Col span={12}>
                                    <div style={{ fontWeight: 600, marginBottom: 8, color: "#3f8600" }}>Income</div>
                                    <List
                                        size="small"
                                        dataSource={(incomeCategories || []).slice(0, 5)}
                                        locale={{ emptyText: "No income data" }}
                                        renderItem={(item) => (
                                            <List.Item style={{ padding: "4px 0" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                                                    <span style={{ fontSize: 13 }}>{item.type}</span>
                                                    <span style={{ color: "#3f8600", fontWeight: 600 }}>+${formatMoney(item.amount)}</span>
                                                </div>
                                            </List.Item>
                                        )}
                                    />
                                </Col>
                            </Row>
                        </Spin>
                    </Card>
                </Col>
            </Row>

            {/* ── Row 3: Recent transactions ── */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col span={24}>
                    <Card title="Recent Transactions">
                        <Spin spinning={loadingRecent}>
                            <Table
                                columns={recentColumns}
                                dataSource={recentRows}
                                pagination={false}
                                size="middle"
                                scroll={{ x: "max-content" }}
                            />
                        </Spin>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;