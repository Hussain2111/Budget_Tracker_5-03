import { useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Table, message, Progress, Card } from 'antd';
import dayjs from 'dayjs';
import { savingsService, ledgerService } from '../services/apiService';

const { RangePicker } = DatePicker;

const Savings = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [form] = Form.useForm();

    const defaultRange = useMemo(() => {
        const start = dayjs().startOf('month');
        const end = dayjs().endOf('month');
        return [start, end];
    }, []);

    const [selectedRange, setSelectedRange] = useState(defaultRange);

    const [periodSavings, setPeriodSavings] = useState(0);
    const [loadingPeriod, setLoadingPeriod] = useState(false);

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

    const fetchPeriodSavings = async (range) => {
        setLoadingPeriod(true);
        try {
            const [start, end] = range;
            const startDate = start.format('YYYY-MM-DD');
            const endDate = end.format('YYYY-MM-DD');

            const res = await ledgerService.getAll({
                startDate,
                endDate,
                sort: 'date',
                order: 'DESC',
            });

            const rows = res.data || [];
            const savings = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

            setPeriodSavings(Number(savings));
        } catch (e) {
            message.error('Failed to calculate savings for the selected period');
            console.error(e);
            setPeriodSavings(0);
        } finally {
            setLoadingPeriod(false);
        }
    };

    useEffect(() => {
        fetchGoals();
        fetchPeriodSavings(selectedRange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            render: (v) => `$${Number(v || 0).toFixed(2)}`,
        },
        {
            title: 'Deadline',
            dataIndex: 'deadline',
            key: 'deadline',
            render: (d) => (d ? dayjs(d).format('YYYY-MM-DD') : ''),
        },
        {
            title: `Progress (Selected Period)`,
            key: 'progress',
            render: (_, record) => {
                const target = Number(record.targetAmount || 0);
                const current = Math.max(0, Number(periodSavings || 0));
                const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0;

                return (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Saved: ${formatMoney(current)}</span>
                            <span>Target: ${formatMoney(target)}</span>
                        </div>
                        <Progress
                            percent={Number(percent.toFixed(0))}
                            size="small"
                            status={percent >= 100 ? 'success' : 'active'}
                        />
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
                    <Button type="primary" size="small" onClick={() => handleEdit(record)}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                    <div style={{ fontWeight: 600 }}>
                        Calculated Savings for Period

                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <RangePicker
                            value={selectedRange}
                            onChange={(val) => {
                                if (!val) return;
                                setSelectedRange(val);
                                fetchPeriodSavings(val);
                            }}
                        />
                        <div style={{ minWidth: 220, textAlign: 'right' }}>
                            {loadingPeriod ? 'Loading...' : `Saved: $${formatMoney(Math.max(0, periodSavings))}`}
                        </div>
                    </div>
                </div>
            </Card>

            <div style={{ marginBottom: 16 }}>
                <Button type="primary" onClick={handleAdd}>
                    + Add Savings Goal
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={goals.map((g) => ({ ...g, key: g.id }))}
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

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
                        <InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="$" />
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
        </div>
    );
};

export default Savings;