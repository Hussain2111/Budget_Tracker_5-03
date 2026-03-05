import React, { useState, useEffect } from "react";
import {
    Tabs,
    Table,
    Button,
    Modal,
    Form,
    Input,
    InputNumber,
    DatePicker,
    Select,
    Tag,
    Space,
    message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { expenseService, incomeService } from "../services/apiService";
import dayjs from "dayjs";

const EXPENSE_CATEGORIES = [
    "Food & Dining",
    "Transport",
    "Utilities",
    "Housing",
    "Healthcare",
    "Entertainment",
    "Shopping",
    "Education",
    "Travel",
    "Other",
];

const INCOME_CATEGORIES = [
    "Salary",
    "Freelance",
    "Investment",
    "Rental",
    "Business",
    "Gift",
    "Other",
];

const TransactionForm = ({ form, categories, kind }) => (
    <>
        <Form.Item
            label="Name"
            name="name"
            rules={[
                { required: true, message: "Name is required" },
                { min: 2, message: "Name must be at least 2 characters" },
                { max: 80, message: "Name must be at most 80 characters" },
            ]}
        >
            <Input placeholder={kind === "expense" ? "e.g., Groceries" : "e.g., Monthly Salary"} />
        </Form.Item>

        <Form.Item
            label="Category"
            name="type"
            rules={[{ required: true, message: "Please select a category" }]}
        >
            <Select
                placeholder="Select a category"
                options={categories.map((c) => ({ label: c, value: c }))}
                showSearch
                allowClear
            />
        </Form.Item>

        <Form.Item
            label="Amount ($)"
            name="amount"
            rules={[
                { required: true, message: "Amount is required" },
                {
                    type: "number",
                    min: 0.01,
                    message: "Amount must be greater than $0.00",
                },
            ]}
        >
            <InputNumber
                min={0.01}
                step={0.01}
                precision={2}
                prefix="$"
                style={{ width: "100%" }}
                placeholder="0.00"
            />
        </Form.Item>

        <Form.Item
            label="Date"
            name="date"
            rules={[
                { required: true, message: "Date is required" },
                () => ({
                    validator(_, value) {
                        if (!value || value.isBefore(dayjs().add(1, "day"))) {
                            return Promise.resolve();
                        }
                        return Promise.reject(new Error("Date cannot be in the future"));
                    },
                }),
            ]}
        >
            <DatePicker
                style={{ width: "100%" }}
                disabledDate={(d) => d && d.isAfter(dayjs(), "day")}
                format="YYYY-MM-DD"
            />
        </Form.Item>

        <Form.Item
            label="Description"
            name="description"
            rules={[{ max: 250, message: "Description must be at most 250 characters" }]}
        >
            <Input.TextArea rows={3} placeholder="Optional notes..." showCount maxLength={250} />
        </Form.Item>
    </>
);

const makeColumns = (onEdit, onDelete) => [
    {
        title: "Name",
        dataIndex: "name",
        key: "name",
        sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
        title: "Category",
        dataIndex: "type",
        key: "type",
        render: (t) => <Tag color="blue">{t}</Tag>,
        filters: [],
    },
    {
        title: "Amount",
        dataIndex: "amount",
        key: "amount",
        align: "right",
        sorter: (a, b) => Number(a.amount) - Number(b.amount),
        render: (amt) => (
            <span style={{ fontWeight: 600 }}>${parseFloat(amt).toFixed(2)}</span>
        ),
    },
    {
        title: "Date",
        dataIndex: "date",
        key: "date",
        sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
        render: (d) => dayjs(d).format("MMM D, YYYY"),
    },
    {
        title: "Description",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
        render: (desc) => desc || <span style={{ color: "#888" }}>N/A</span>,
    },
    {
        title: "Actions",
        key: "actions",
        width: 120,
        render: (_, record) => (
            <Space>
                <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => onEdit(record)}
                    style={{ color: "#1890ff" }}
                />
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onDelete(record.id)}
                />
            </Space>
        ),
    },
];

const TransactionTab = ({ kind, service, categories }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editRecord, setEditRecord] = useState(null);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await service.getAll();
            setData(res.data);
        } catch {
            message.error(`Failed to load ${kind} records`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openAdd = () => {
        setEditRecord(null);
        form.resetFields();
        setModalOpen(true);
    };

    const openEdit = (record) => {
        setEditRecord(record);
        form.setFieldsValue({ ...record, date: dayjs(record.date) });
        setModalOpen(true);
    };

    const handleDelete = (id) => {
        Modal.confirm({
            title: `Delete ${kind}?`,
            content: "This action cannot be undone.",
            okText: "Delete",
            okButtonProps: { danger: true },
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    await service.delete(id);
                    message.success(`${kind} deleted`);
                    fetchData();
                } catch {
                    message.error(`Failed to delete ${kind}`);
                }
            },
        });
    };

    const handleSubmit = async (values) => {
        const payload = { ...values, date: values.date.format("YYYY-MM-DD") };
        try {
            if (editRecord) {
                await service.update(editRecord.id, payload);
                message.success(`${kind} updated`);
            } else {
                await service.create(payload);
                message.success(`${kind} added`);
            }
            setModalOpen(false);
            form.resetFields();
            fetchData();
        } catch {
            message.error(`Failed to save ${kind}`);
        }
    };

    const isExpense = kind === "Expense";

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openAdd}
                    style={{ background: isExpense ? "#ff4d4f" : "#52c41a", borderColor: isExpense ? "#ff4d4f" : "#52c41a" }}
                >
                    Add {kind}
                </Button>
            </div>

            <Table
                columns={makeColumns(openEdit, handleDelete)}
                dataSource={data.map((d) => ({ ...d, key: d.id }))}
                loading={loading}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                scroll={{ x: "max-content" }}
            />

            <Modal
                title={`${editRecord ? "Edit" : "Add"} ${kind}`}
                open={modalOpen}
                onOk={() => form.submit()}
                onCancel={() => { setModalOpen(false); form.resetFields(); }}
                okText={editRecord ? "Save Changes" : `Add ${kind}`}
                okButtonProps={{ style: { background: isExpense ? "#ff4d4f" : "#52c41a", borderColor: isExpense ? "#ff4d4f" : "#52c41a" } }}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    style={{ marginTop: 16 }}
                    scrollToFirstError
                >
                    <TransactionForm form={form} categories={categories} kind={kind.toLowerCase()} />
                </Form>
            </Modal>
        </div>
    );
};

const Transactions = () => (
    <div style={{ padding: "8px 0" }}>
        <Tabs
            defaultActiveKey="expenses"
            size="large"
            className="transactions-tabs"
            items={[
                {
                    key: "expenses",
                    label: "🧾 Expenses",
                    children: (
                        <TransactionTab
                            kind="Expense"
                            service={expenseService}
                            categories={EXPENSE_CATEGORIES}
                        />
                    ),
                },
                {
                    key: "income",
                    label: "💵 Income",
                    children: (
                        <TransactionTab
                            kind="Income"
                            service={incomeService}
                            categories={INCOME_CATEGORIES}
                        />
                    ),
                },
            ]}
        />
    </div>
);

export default Transactions;