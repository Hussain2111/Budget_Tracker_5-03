import { useEffect, useState } from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Table, message, Progress, Card, Spin } from 'antd';
import dayjs from 'dayjs';
import { savingsService } from '../services/apiService';
import { useCurrency } from '../CurrencyContext';

function classifyGoal(goal) {
    const target = Number(goal.targetAmount || 0);
    const current = Number(goal.currentAmount || 0);
    const percent = target > 0 ? (current / target) * 100 : 0;
    const deadlineDate = dayjs(goal.deadline);
    const monthsRemaining = deadlineDate.diff(dayjs(), 'month', true);
    const totalMonths = deadlineDate.diff(dayjs(goal.createdAt), 'month', true);
    const elapsedMonths = totalMonths - monthsRemaining;
    const expectedPercent = totalMonths > 0 ? (elapsedMonths / totalMonths) * 100 : 0;
    const isOverdue = monthsRemaining <= 0 && percent < 100;
    const isAtRisk = !isOverdue && percent < expectedPercent * 0.8;
    const isComplete = percent >= 100;
    return { percent, monthsRemaining, isOverdue, isAtRisk, isComplete, expectedPercent };
}

const Savings = () => {
    const { baseCurrency } = useCurrency();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [form] = Form.useForm();

    const [isContributeModalVisible, setIsContributeModalVisible] = useState(false);
    const [contributeForm] = Form.useForm();
    const [contributingGoal, setContributingGoal] = useState(null);
    const [contributing, setContributing] = useState(false);

    const [historyGoal, setHistoryGoal] = useState(null);
    const [contributions, setContributions] = useState([]);
    const [loadingContributions, setLoadingContributions] = useState(false);

    const fetchGoals = async () => {
        setLoading(true);
        try {
            const res = await savingsService.getAll();
            setGoals(res.data || []);
        } catch (e) {
            message.error('Failed to load savings goals');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, []);

    const handleAdd = () => {
        setIsEditMode(false);
        setSelectedGoal(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setIsEditMode(true);
        setSelectedGoal(record);
        form.setFieldsValue({
            name: record.name,
            targetAmount: Number(record.targetAmount),
            deadline: record.deadline ? dayjs(record.deadline) : null,
            description: record.description,
        });
        setIsModalVisible(true);
    };

    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Delete Savings Goal',
            content: 'Are you sure you want to delete this goal?',
            okText: 'Yes',
            cancelText: 'No',
            onOk: async () => {
                try {
                    await savingsService.delete(id);
                    message.success('Goal deleted');
                    fetchGoals();
                } catch (e) {
                    message.error('Failed to delete goal');
                    console.error(e);
                }
            },
        });
    };

    const handleSubmit = async (values) => {
        const payload = {
            name: values.name,
            targetAmount: values.targetAmount,
            deadline: values.deadline.format('YYYY-MM-DD'),
            description: values.description,
        };

        try {
            if (isEditMode) {
                await savingsService.update(selectedGoal.id, payload);
                message.success('Goal updated');
            } else {
                await savingsService.create(payload);
                message.success('Goal created');
            }
            setIsModalVisible(false);
            form.resetFields();
            fetchGoals();
        } catch (e) {
            message.error('Failed to save goal');
            console.error(e);
        }
    };

    const handleOpenContributeModal = (record) => {
        setContributingGoal(record);
        contributeForm.resetFields();
        setIsContributeModalVisible(true);
    };

    const handleContribute = async (values) => {
        if (!contributingGoal) return;

        setContributing(true);
        try {
            await savingsService.contribute(contributingGoal.id, {
                amount: values.amount,
                note: values.note,
            });
            message.success('Contribution saved!');
            setIsContributeModalVisible(false);
            contributeForm.resetFields();
            fetchGoals();
        } catch (e) {
            message.error('Failed to save contribution');
            console.error(e);
        } finally {
            setContributing(false);
        }
    };

    const handleViewHistory = async (record) => {
        setHistoryGoal(record);
        setLoadingContributions(true);
        try {
            const res = await savingsService.getContributions(record.id);
            setContributions(res.data || []);
        } catch {
            message.error('Failed to load contribution history');
        } finally {
            setLoadingContributions(false);
        }
    };

    const formatMoney = (value) => {
        const num = Number(value || 0);
        return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        {
            title: 'Target Amount',
            dataIndex: 'targetAmount',
            key: 'targetAmount',
            render: (v) => `${baseCurrency.symbol}${formatMoney(v)}`,
        },
        {
            title: 'Deadline',
            dataIndex: 'deadline',
            key: 'deadline',
            render: (d) => (d ? dayjs(d).format('YYYY-MM-DD') : ''),
        },
        {
            title: 'Progress',
            key: 'progress',
            render: (_, record) => {
                const { percent, monthsRemaining, isOverdue, isAtRisk, isComplete, expectedPercent } = classifyGoal(record);
                const target = Number(record.targetAmount || 0);
                const current = Number(record.currentAmount || 0);
                const amountRemaining = Math.max(0, target - current);
                const monthlyNeeded = monthsRemaining > 0 ? amountRemaining / monthsRemaining : 0;

                const strokeColor = isOverdue ? '#ff4d4f' : isAtRisk ? '#faad14' : '#52c41a';
                const statusLabel = isOverdue ? '⚠ Overdue' : isAtRisk ? '⚠ At Risk' : '✓ On Track';
                const labelColor = isOverdue ? '#ff4d4f' : isAtRisk ? '#faad14' : '#52c41a';

                return (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span>Saved: {baseCurrency.symbol}{formatMoney(current)}</span>
                            <span>Target: {baseCurrency.symbol}{formatMoney(target)}</span>
                        </div>
                        <Progress
                            percent={Number(percent.toFixed(0))}
                            size="small"
                            strokeColor={strokeColor}
                        />
                        <div style={{ marginTop: 8, fontSize: 12, color: labelColor, fontWeight: 600 }}>
                            {statusLabel}
                        </div>
                        {!isComplete && monthsRemaining > 0 && (
                            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                                Monthly target: {baseCurrency.symbol}{formatMoney(monthlyNeeded)}
                            </div>
                        )}
                        {isComplete && (
                            <div style={{ marginTop: 8, fontSize: 12, color: '#52c41a', fontWeight: 600 }}>
                                Goal complete! 🎉
                            </div>
                        )}
                    </div>
                );
            },
        },
        { title: 'Description', dataIndex: 'description', key: 'description' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button type="primary" size="small" onClick={() => handleOpenContributeModal(record)}>
                        Contribute
                    </Button>
                    <Button type="default" size="small" onClick={() => handleViewHistory(record)}>
                        History
                    </Button>
                    <Button type="default" size="small" onClick={() => handleEdit(record)}>
                        Edit
                    </Button>
                    <Button danger size="small" onClick={() => handleDelete(record.id)}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div style={{ padding: 20 }}>
            <Card style={{ marginBottom: 16 }}>
                {(() => {
                    const totalSaved = goals.reduce((sum, g) => sum + Number(g.currentAmount || 0), 0);
                    const totalTarget = goals.reduce((sum, g) => sum + Number(g.targetAmount || 0), 0);
                    const onTrackCount = goals.filter(g => {
                        const { isOverdue, isAtRisk, isComplete } = classifyGoal(g);
                        return !isOverdue && !isAtRisk && !isComplete;
                    }).length;
                    const atRiskCount = goals.filter(g => {
                        const { isOverdue, isAtRisk } = classifyGoal(g);
                        return isOverdue || isAtRisk;
                    }).length;

                    return (
                        <div className="savings-grid">
                            <div>
                                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Total Saved</div>
                                <div style={{ fontSize: 20, fontWeight: 600 }}>{baseCurrency.symbol}{formatMoney(totalSaved)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Total Target</div>
                                <div style={{ fontSize: 20, fontWeight: 600 }}>{baseCurrency.symbol}{formatMoney(totalTarget)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>On Track</div>
                                <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>{onTrackCount} goals</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>At Risk</div>
                                <div style={{ fontSize: 20, fontWeight: 600, color: atRiskCount > 0 ? '#faad14' : '#999' }}>{atRiskCount} goals</div>
                            </div>
                        </div>
                    );
                })()}
            </Card>

            <div style={{ marginBottom: 16 }} className="form-actions">
                <Button type="primary" onClick={handleAdd}>
                    + Add Savings Goal
                </Button>
            </div>

            {goals.length === 0 && !loading ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🏦</div>
                    <div className="empty-state-title">No savings goals yet</div>
                    <div className="empty-state-description">
                        Set a goal — a holiday, an emergency fund, a new laptop — and track your progress toward it.
                    </div>
                    <Button type="primary" onClick={handleAdd}>+ Add Savings Goal</Button>
                </div>
            ) : (
                <Table
                    columns={columns}
                    dataSource={goals.map((g) => ({ ...g, key: g.id }))}
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            )}

            <Modal
                title={isEditMode ? 'Edit Savings Goal' : 'Add Savings Goal'}
                open={isModalVisible}
                onOk={() => form.submit()}
                onCancel={() => setIsModalVisible(false)}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
                    <Form.Item
                        label="Goal Name"
                        name="name"
                        rules={[{ required: true, message: 'Please enter a goal name' }]}
                    >
                        <Input placeholder="e.g., Emergency Fund" />
                    </Form.Item>

                    <Form.Item
                        label="Target Amount"
                        name="targetAmount"
                        rules={[{ required: true, message: 'Please enter a target amount' }]}
                    >
                        <InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix={baseCurrency.symbol} />
                    </Form.Item>

                    <Form.Item
                        label="Deadline"
                        name="deadline"
                        rules={[{ required: true, message: 'Please select a deadline' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item label="Description" name="description">
                        <Input.TextArea rows={3} placeholder="Optional description" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={`Contribute to ${contributingGoal?.name || ''}`}
                open={isContributeModalVisible}
                onOk={() => contributeForm.submit()}
                onCancel={() => setIsContributeModalVisible(false)}
                okText="Contribute"
                confirmLoading={contributing}
            >
                {contributingGoal && (
                    <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span>Current:</span>
                            <span style={{ fontWeight: 600 }}>{baseCurrency.symbol}{formatMoney(contributingGoal.currentAmount || 0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Target:</span>
                            <span style={{ fontWeight: 600 }}>{baseCurrency.symbol}{formatMoney(contributingGoal.targetAmount || 0)}</span>
                        </div>
                    </div>
                )}
                <Form form={contributeForm} layout="vertical" onFinish={handleContribute} style={{ marginTop: 16 }}>
                    <Form.Item
                        label="Contribution Amount"
                        name="amount"
                        rules={[{ required: true, message: 'Please enter an amount' }]}
                    >
                        <InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix={baseCurrency.symbol} />
                    </Form.Item>

                    <Form.Item label="Note (optional)" name="note">
                        <Input.TextArea rows={2} placeholder="e.g., Monthly contribution" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={`Contribution History — ${historyGoal?.name || ''}`}
                open={!!historyGoal}
                onCancel={() => { setHistoryGoal(null); setContributions([]); }}
                footer={null}
                width={600}
            >
                <Spin spinning={loadingContributions}>
                    {contributions.length === 0 && !loadingContributions ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📭</div>
                            <div className="empty-state-title">No contributions yet</div>
                            <div className="empty-state-description">
                                Use the Contribute button to start building toward this goal.
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{
                                marginBottom: 16,
                                padding: "12px 16px",
                                background: "#f6ffed",
                                borderRadius: 8,
                                display: "flex",
                                justifyContent: "space-between",
                            }}>
                                <span style={{ color: "#52c41a", fontWeight: 600 }}>
                                    Total contributed
                                </span>
                                <span style={{ color: "#52c41a", fontWeight: 700 }}>
                                    ${contributions
                                        .reduce((sum, c) => sum + Number(c.amount), 0)
                                        .toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                </span>
                            </div>
                            <Table
                                size="small"
                                pagination={{ pageSize: 8 }}
                                dataSource={contributions.map(c => ({ ...c, key: c.id }))}
                                columns={[
                                    {
                                        title: "Date",
                                        dataIndex: "date",
                                        key: "date",
                                        render: d => dayjs(d).format("MMM D, YYYY"),
                                    },
                                    {
                                        title: "Amount",
                                        dataIndex: "amount",
                                        key: "amount",
                                        align: "right",
                                        render: amt => (
                                            <span style={{ color: "#52c41a", fontWeight: 600 }}>
                                                +${Number(amt).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        ),
                                    },
                                    {
                                        title: "Note",
                                        dataIndex: "note",
                                        key: "note",
                                        render: note => note || (
                                            <span style={{ color: "#d9d9d9" }}>—</span>
                                        ),
                                    },
                                ]}
                            />
                        </>
                    )}
                </Spin>
            </Modal>
        </div>
    );
};

export default Savings;