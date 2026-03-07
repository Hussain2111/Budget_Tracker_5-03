import React, { useState, useEffect, useMemo } from "react";
import EmptyState from "./EmptyState";
import {
    Tabs, Table, Button, Modal, Form, Input, InputNumber,
    DatePicker, Select, Tag, Space, message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { expenseService, incomeService } from "../services/apiService";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

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
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [dateRange, setDateRange] = useState([null, null]);

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

    const filteredData = useMemo(() => {
        let result = [...data];

        if (search.trim()) {
            const needle = search.trim().toLowerCase();
            result = result.filter(r =>
                r.name?.toLowerCase().includes(needle) ||
                r.description?.toLowerCase().includes(needle) ||
                r.type?.toLowerCase().includes(needle)
            );
        }

        if (categoryFilter !== "all") {
            result = result.filter(r => r.type === categoryFilter);
        }

        if (dateRange[0] && dateRange[1]) {
            result = result.filter(r => {
                const d = dayjs(r.date);
                return d.isAfter(dateRange[0].subtract(1, "day")) &&
                       d.isBefore(dateRange[1].add(1, "day"));
            });
        }

        return result;
    }, [data, search, categoryFilter, dateRange]);

    const filteredTotal = useMemo(() => {
        return filteredData.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    }, [filteredData]);

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

            <div style={{
                display: "flex",
                gap: 10,
                marginBottom: 16,
                flexWrap: "wrap",
                alignItems: "center",
                padding: "12px 16px",
                background: "#fafafa",
                borderRadius: 8,
                border: "1px solid #f0f0f0",
            }}>
                <Input
                    placeholder="Search by name, category, description..."
                    prefix={<SearchOutlined style={{ color: "#9CA3AF" }} />}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    allowClear
                    style={{ width: 280 }}
                />
                <Select
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    style={{ width: 180 }}
                    options={[
                        { value: "all", label: "All Categories" },
                        ...categories.map(c => ({ value: c, label: c })),
                    ]}
                />
                <RangePicker
                    value={dateRange}
                    onChange={val => setDateRange(val || [null, null])}
                    format="YYYY-MM-DD"
                />
                {(search || categoryFilter !== "all" || dateRange[0]) && (
                    <Button
                        size="small"
                        onClick={() => {
                            setSearch("");
                            setCategoryFilter("all");
                            setDateRange([null, null]);
                        }}
                    >
                        Clear filters
                    </Button>
                )}
            </div>

            {filteredData.length === 0 && !loading ? (
                <EmptyState
                    icon="🧾"
                    title={data.length > 0 ? "No results match your filters" : `No ${kind.toLowerCase()}s yet`}
                    description={data.length > 0
                        ? "Try adjusting your search or clearing the filters."
                        : `Start tracking your ${kind.toLowerCase()}s by adding your first entry.`}
                    action={data.length === 0 ? `+ Add ${kind}` : null}
                    onAction={data.length === 0 ? openAdd : null}
                />
            ) : (
                <Table
                    columns={makeColumns(openEdit, handleDelete)}
                    dataSource={filteredData.map((d) => ({ ...d, key: d.id }))}
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    scroll={{ x: "max-content" }}
                    footer={() => (
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontWeight: 600,
                            color: "#374151",
                        }}>
                            <span>{filteredData.length} transaction{filteredData.length !== 1 ? "s" : ""}</span>
                            <span style={{ color: kind === "Expense" ? "#cf1322" : "#3f8600" }}>
                                Total: ${filteredData.reduce((sum, r) =>
                                    sum + Number(r.amount || 0), 0
                                ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}
                />
            )}

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