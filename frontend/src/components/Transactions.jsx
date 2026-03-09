import React, { useState, useEffect, useMemo, useCallback } from "react";
import EmptyState from "./EmptyState";
import CsvImportModal from "./CsvImportModal";
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
  Switch,
  Tooltip,
  message,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UploadOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { expenseService, incomeService } from "../services/apiService";
import { getRates } from "../services/exchangeRateService";
import { useCurrency } from "../CurrencyContext";
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

// ── Transaction Form ─────────────────────────────────────────────
const TransactionForm = ({ form, categories, kind }) => {
  const { baseCurrency, currencies, convert } = useCurrency();
  const isRecurring = Form.useWatch("isRecurring", form);
  const selectedCurrency = Form.useWatch("currency", form) || baseCurrency.code;
  const amount = Form.useWatch("amount", form) || 0;
  const exchangeRate = Form.useWatch("exchangeRate", form) || 1.0;
  const [loadingRate, setLoadingRate] = useState(false);

  // Currency options for dropdown
  const currencyOptions = Object.values(currencies).map((currency) => ({
    label: `${currency.symbol} ${currency.code} - ${currency.name}`,
    value: currency.code,
  }));

  // Fetch exchange rate when currency changes
  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (selectedCurrency === baseCurrency.code) {
        // Base currency - set rate to 1.0
        form.setFieldsValue({ exchangeRate: 1.0 });
        return;
      }

      setLoadingRate(true);
      try {
        const rates = await getRates(baseCurrency.code);
        const rate = rates[selectedCurrency];
        if (rate) {
          form.setFieldsValue({ exchangeRate: rate });
        }
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
        message.error('Failed to fetch exchange rate. Please enter manually.');
        // Default to 1.0 with warning
        form.setFieldsValue({ exchangeRate: 1.0 });
      } finally {
        setLoadingRate(false);
      }
    };

    if (selectedCurrency) {
      fetchExchangeRate();
    }
  }, [selectedCurrency, baseCurrency.code, form]);

  // Calculate converted amount for preview
  const convertedAmount = convert(amount, exchangeRate);

  return (
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
        <Input
          placeholder={kind === "expense" ? "e.g., Groceries" : "e.g., Monthly Salary"}
        />
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
        label="Currency"
        name="currency"
        initialValue={baseCurrency.code}
        rules={[{ required: true, message: "Please select a currency" }]}
      >
        <Select
          placeholder="Select currency"
          options={currencyOptions}
          showSearch
          filterOption={(input, option) =>
            option.label.toLowerCase().includes(input.toLowerCase())
          }
        />
      </Form.Item>

      <Form.Item
        label={`Amount (${currencies[selectedCurrency]?.symbol || "$"})`}
        name="amount"
        rules={[
          { required: true, message: "Amount is required" },
          { type: "number", min: 0.01, message: "Amount must be greater than 0" },
        ]}
      >
        <InputNumber
          min={0.01}
          step={0.01}
          precision={2}
          prefix={currencies[selectedCurrency]?.symbol || "$"}
          style={{ width: "100%" }}
          placeholder="0.00"
        />
      </Form.Item>

      {/* Exchange rate field - only show for non-base currencies */}
      {selectedCurrency !== baseCurrency.code && (
        <>
          <Form.Item
            label={
              <Space>
                Exchange Rate
                <Tooltip title={`1 ${selectedCurrency} = ? ${baseCurrency.code}`}>
                  <span style={{ fontSize: 12, color: "#666" }}>ⓘ</span>
                </Tooltip>
              </Space>
            }
            name="exchangeRate"
            rules={[
              { required: true, message: "Exchange rate is required" },
              { type: "number", min: 0.0001, message: "Exchange rate must be greater than 0" },
            ]}
          >
            <InputNumber
              min={0.0001}
              step={0.0001}
              precision={4}
              style={{ width: "100%" }}
              placeholder="1.0000"
              addonAfter={loadingRate ? <Spin size="small" /> : null}
            />
          </Form.Item>
          
          {/* Warning for manual rate entry */}
          {!loadingRate && form.getFieldValue('exchangeRate') === 1.0 && selectedCurrency !== baseCurrency.code && (
            <div style={{
              marginBottom: 16,
              padding: 8,
              backgroundColor: '#fff7e6',
              border: '1px solid #ffd591',
              borderRadius: 4,
              fontSize: 12,
              color: '#d46b08'
            }}>
              <strong>⚠️ Manual Entry Required:</strong> Could not fetch exchange rate automatically. 
              Please verify and enter the correct rate manually.
            </div>
          )}
        </>
      )}

      {/* Conversion preview */}
      {selectedCurrency !== baseCurrency.code && amount > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: 8,
            backgroundColor: "#f5f5f5",
            borderRadius: 4,
            fontSize: 12,
            color: "#666",
          }}
        >
          <strong>Conversion Preview:</strong>{" "}
          {currencies[selectedCurrency]?.symbol}
          {amount.toFixed(2)} = {baseCurrency.symbol}
          {convertedAmount.toFixed(2)}
        </div>
      )}

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
              return Promise.reject(new Error("Date cannot be in future"));
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
        <Input.TextArea
          rows={2}
          placeholder="Optional notes..."
          showCount
          maxLength={250}
        />
      </Form.Item>

      {/* ── Recurring toggle ── */}
      <div className="recurring-toggle">
        <Form.Item
          name="isRecurring"
          valuePropName="checked"
          style={{ marginBottom: isRecurring ? 12 : 0 }}
        >
          <Switch
            checkedChildren={<SyncOutlined />}
            unCheckedChildren="One-time"
          />
        </Form.Item>

        {isRecurring && (
          <>
            <div className="recurring-description">
              This transaction will be automatically recreated each month when
              you log in.
            </div>
            <Form.Item
              label="Frequency"
              name="recurringFrequency"
              rules={[{ required: true, message: "Please select a frequency" }]}
              style={{ marginBottom: 0 }}
            >
              <Select
                options={[{ value: "monthly", label: "Monthly" }]}
                placeholder="Select frequency"
                style={{ width: 160 }}
              />
            </Form.Item>
          </>
        )}
      </div>
    </>
  );
};

// ── Column factory ───────────────────────────────────────────────
const makeColumns = (onEdit, onDelete, baseCurrency, currencies, convert) => [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    sorter: (a, b) => a.name.localeCompare(b.name),
    render: (name, record) => (
      <span>
        {name}
        {record.isRecurring && (
          <Tooltip title="Recurring monthly">
            <SyncOutlined
              style={{ marginLeft: 6, fontSize: 11, color: "#1890ff" }}
            />
          </Tooltip>
        )}
        {record.recurringParentId && (
          <Tooltip title="Auto-generated from recurring template">
            <Tag
              color="blue"
              style={{ marginLeft: 6, fontSize: 10, padding: "0 4px" }}
            >
              auto
            </Tag>
          </Tooltip>
        )}
      </span>
    ),
  },
  {
    title: "Category",
    dataIndex: "type",
    key: "type",
    render: (t) => <Tag color="blue">{t}</Tag>,
  },
  {
    title: "Amount",
    dataIndex: "amount",
    key: "amount",
    align: "right",
    sorter: (a, b) => Number(a.amount) - Number(b.amount),
    render: (amt, record) => {
      const currency = currencies[record.currency] || currencies.USD;
      const convertedAmount = convert(Number(amt), Number(record.exchangeRate ?? 1.0));
      const isForeignCurrency = record.currency && record.currency !== baseCurrency.code;
      
      return (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600 }}>
            {currency.symbol}{parseFloat(amt).toFixed(2)}
          </div>
          {isForeignCurrency && (
            <div style={{ fontSize: 11, color: '#666' }}>
              ≈ {baseCurrency.symbol}{convertedAmount.toFixed(2)}
            </div>
          )}
        </div>
      );
    },
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
    render: (desc) => desc || <span style={{ color: "#888" }}>—</span>,
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

// ── Transaction Tab ──────────────────────────────────────────────
const TransactionTab = ({ kind, service, categories, onImported }) => {
  const { baseCurrency, currencies, convert, format } = useCurrency();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState([null, null]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await service.getAll();
      setData(res.data);
    } catch {
      message.error(`Failed to load ${kind} records`);
    } finally {
      setLoading(false);
    }
  }, [kind, service]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    let result = [...data];

    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.name?.toLowerCase().includes(needle) ||
          r.description?.toLowerCase().includes(needle) ||
          r.type?.toLowerCase().includes(needle),
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter((r) => r.type === categoryFilter);
    }

    if (dateRange[0] && dateRange[1]) {
      result = result.filter((r) => {
        const d = dayjs(r.date);
        return (
          d.isAfter(dateRange[0].subtract(1, "day")) &&
          d.isBefore(dateRange[1].add(1, "day"))
        );
      });
    }

    return result;
  }, [data, search, categoryFilter, dateRange]);

  const openAdd = () => {
    setEditRecord(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditRecord(record);
    form.setFieldsValue({
      ...record,
      date: dayjs(record.date),
      currency: record.currency || baseCurrency.code,
      exchangeRate: record.exchangeRate || 1.0,
    });
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
    const payload = {
      ...values,
      date: values.date.format("YYYY-MM-DD"),
      isRecurring: values.isRecurring || false,
      recurringFrequency: values.isRecurring ? values.recurringFrequency : undefined,
      // Include currency and exchange rate
      currency: values.currency || baseCurrency.code,
      exchangeRate: values.exchangeRate || 1.0,
    };

    try {
      if (editRecord) {
        await service.update(editRecord.id, payload);
        message.success(`${kind} updated`);
      } else {
        await service.create(payload);
        const successMsg = payload.isRecurring
          ? `${kind} added and set to repeat monthly`
          : `${kind} added`;
        message.success(successMsg);
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
      {/* Action bar */}
      <div className="transaction-actions">
        <div className="recurring-indicator">
          {data.filter((d) => d.isRecurring).length > 0 && (
            <span>
              <SyncOutlined />
              {data.filter((d) => d.isRecurring).length} recurring template
              {data.filter((d) => d.isRecurring).length !== 1 ? "s" : ""} active
            </span>
          )}
        </div>
        <Space>
          <Button
            icon={<UploadOutlined />}
            onClick={() => setCsvModalOpen(true)}
          >
            Import CSV
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAdd}
            className={`btn-${isExpense ? "expense" : "income"}`}
          >
            Add {kind}
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <div className="transaction-filters">
        <Input
          placeholder="Search by name, category, description..."
          prefix={<SearchOutlined style={{ color: "#9CA3AF" }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 280 }}
        />
        <Select
          value={categoryFilter}
          onChange={setCategoryFilter}
          style={{ width: 180 }}
          options={[
            { value: "all", label: "All Categories" },
            ...categories.map((c) => ({ value: c, label: c })),
          ]}
        />
        <RangePicker
          value={dateRange}
          onChange={(val) => setDateRange(val || [null, null])}
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

      {/* Table */}
      {filteredData.length === 0 && !loading ? (
        <EmptyState
          icon="🧾"
          title={
            data.length > 0
              ? "No results match your filters"
              : `No ${kind.toLowerCase()}s yet`
          }
          description={
            data.length > 0
              ? "Try adjusting your search or clearing the filters."
              : `Start tracking by adding your first ${kind.toLowerCase()}, or import a CSV from your bank.`
          }
          action={data.length === 0 ? `+ Add ${kind}` : null}
          onAction={data.length === 0 ? openAdd : null}
        />
      ) : (
        <Table
          columns={makeColumns(openEdit, handleDelete, baseCurrency, currencies, convert)}
          dataSource={filteredData.map((d) => ({ ...d, key: d.id }))}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: "max-content" }}
          footer={() => (
            <div className="table-footer">
              <span>
                {filteredData.length} transaction
                {filteredData.length !== 1 ? "s" : ""}
              </span>
              <span className={`table-footer-total${isExpense ? " expense" : ""}`}>
                Total: {format(
                  filteredData.reduce((sum, r) => 
                    sum + convert(Number(r.amount || 0), Number(r.exchangeRate ?? 1.0)), 0
                  )
                )}
              </span>
            </div>
          )}
        />
      )}

      {/* Add / Edit modal */}
      <Modal
        title={`${editRecord ? "Edit" : "Add"} ${kind}`}
        open={modalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        okText={editRecord ? "Save Changes" : `Add ${kind}`}
        okButtonProps={{
          className: `btn-${isExpense ? "expense" : "income"}`,
        }}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 16 }}
          scrollToFirstError
        >
          <TransactionForm
            form={form}
            categories={categories}
            kind={kind.toLowerCase()}
          />
        </Form>
      </Modal>

      {/* CSV import modal */}
      <CsvImportModal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onImported={() => {
          fetchData();
          onImported?.();
        }}
      />
    </div>
  );
};

// ── Main Transactions component ──────────────────────────────────
const Transactions = ({ onImported }) => (
  <div style={{ padding: "8px 0" }}>
    <Tabs
      defaultActiveKey="expenses"
      size="large"
      items={[
        {
          key: "expenses",
          label: "🧾 Expenses",
          children: (
            <TransactionTab
              kind="Expense"
              service={expenseService}
              categories={EXPENSE_CATEGORIES}
              onImported={onImported}
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
              onImported={onImported}
            />
          ),
        },
      ]}
    />
  </div>
);

export default Transactions;