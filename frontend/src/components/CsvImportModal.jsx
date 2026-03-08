import { useState, useRef } from "react";
import {
  Modal,
  Steps,
  Upload,
  Button,
  Select,
  Table,
  Alert,
  message,
  Tag,
  Spin,
} from "antd";
import { InboxOutlined, CheckCircleOutlined } from "@ant-design/icons";
import Papa from "papaparse";
import { importService } from "../services/apiService";

const { Dragger } = Upload;

const REQUIRED_FIELDS = ["name", "amount", "date"];
const OPTIONAL_FIELDS = ["type", "description"];
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

const FIELD_LABELS = {
  name: "Name *",
  amount: "Amount *",
  date: "Date *",
  type: "Category",
  description: "Description",
};

/**
 * Tries to auto-detect which CSV column maps to which app field.
 * Uses simple heuristics on the column header names.
 */
function autoDetectMapping(headers) {
  const mapping = {};
  const lower = headers.map((h) => h.toLowerCase().trim());

  const rules = {
    name: ["name", "description", "merchant", "payee", "title", "memo", "details"],
    amount: ["amount", "sum", "value", "debit", "credit", "price", "cost"],
    date: ["date", "time", "datetime", "transaction date", "posted"],
    type: ["type", "category", "cat", "group", "label"],
    description: ["description", "note", "notes", "memo", "details", "narration"],
  };

  for (const [field, candidates] of Object.entries(rules)) {
    for (const candidate of candidates) {
      const idx = lower.findIndex(
        (h) => h === candidate || h.includes(candidate),
      );
      if (idx !== -1 && !Object.values(mapping).includes(headers[idx])) {
        mapping[field] = headers[idx];
        break;
      }
    }
  }

  return mapping;
}

/**
 * Parses a raw CSV value into a clean amount number.
 * Handles: "$1,234.56", "(500.00)", "-200", "1.234,56" (EU format)
 */
function parseAmount(raw) {
  if (!raw) return NaN;
  let str = String(raw).trim();
  // Remove currency symbols and spaces
  str = str.replace(/[$€£¥\s]/g, "");
  // Handle accounting negatives: (500) → -500
  if (str.startsWith("(") && str.endsWith(")")) {
    str = "-" + str.slice(1, -1);
  }
  // Remove thousands separators (commas) but keep decimal dot
  str = str.replace(/,(?=\d{3}(?:\.|$))/g, "");
  return parseFloat(str);
}

/**
 * Tries to parse a date string into YYYY-MM-DD.
 * Handles common formats: MM/DD/YYYY, DD-MM-YYYY, ISO, etc.
 */
function parseDate(raw) {
  if (!raw) return null;
  const str = String(raw).trim();

  // Already ISO-ish: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }

  // MM/DD/YYYY or MM-DD-YYYY
  const mdyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (mdyMatch) {
    const [, m, d, y] = mdyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // DD/MM/YYYY (EU)
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Fallback: let Date parse it
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

export default function CsvImportModal({ open, onClose, onImported }) {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState("expense");
  const [rawHeaders, setRawHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const reset = () => {
    setStep(0);
    setKind("expense");
    setRawHeaders([]);
    setRawRows([]);
    setMapping({});
    setPreview([]);
    setValidationErrors([]);
    setImporting(false);
    setResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // ── Step 0: File upload ───────────────────────────────────────
  const handleFile = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data.length) {
          message.error("CSV file is empty");
          return;
        }
        const headers = Object.keys(results.data[0]);
        setRawHeaders(headers);
        setRawRows(results.data.slice(0, 500)); // cap at 500
        setMapping(autoDetectMapping(headers));
        setStep(1);
      },
      error: () => message.error("Failed to parse CSV file"),
    });
    return false; // prevent antd auto-upload
  };

  // ── Step 1: Column mapping ────────────────────────────────────
  const buildPreview = () => {
    const errors = [];
    const rows = rawRows.map((row, i) => {
      const name = mapping.name ? String(row[mapping.name] || "").trim() : "";
      const amountRaw = mapping.amount ? row[mapping.amount] : "";
      const amount = parseAmount(amountRaw);
      const dateRaw = mapping.date ? row[mapping.date] : "";
      const date = parseDate(dateRaw);
      const type = mapping.type
        ? String(row[mapping.type] || "").trim() || "Other"
        : "Other";
      const description = mapping.description
        ? String(row[mapping.description] || "").trim()
        : "";

      const rowErrors = [];
      if (!name) rowErrors.push("name missing");
      if (isNaN(amount) || amount <= 0) rowErrors.push(`invalid amount "${amountRaw}"`);
      if (!date) rowErrors.push(`invalid date "${dateRaw}"`);

      if (rowErrors.length) {
        errors.push(`Row ${i + 1}: ${rowErrors.join(", ")}`);
      }

      return { key: i, name, amount, date, type, description, _valid: rowErrors.length === 0 };
    });

    setPreview(rows);
    setValidationErrors(errors);
    setStep(2);
  };

  // ── Step 2: Preview ───────────────────────────────────────────
  const handleImport = async () => {
    const validRows = preview.filter((r) => r._valid);
    if (!validRows.length) {
      message.error("No valid rows to import");
      return;
    }

    setImporting(true);
    try {
      const res = await importService.importCsv(
        kind,
        validRows.map(({ name, amount, date, type, description }) => ({
          name,
          amount,
          date,
          type,
          description,
        })),
      );
      setResult(res.data);
      setStep(3);
      onImported?.();
    } catch (err) {
      message.error(err?.response?.data?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  // ── Column-mapping select options ────────────────────────────
  const headerOptions = [
    { value: "__none__", label: "— skip —" },
    ...rawHeaders.map((h) => ({ value: h, label: h })),
  ];

  const previewColumns = [
    { title: "Name", dataIndex: "name", key: "name", width: 160, ellipsis: true },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 90,
      render: (v, r) => (
        <span style={{ color: r._valid ? "#3f8600" : "#cf1322" }}>
          {isNaN(v) ? "—" : `$${Number(v).toFixed(2)}`}
        </span>
      ),
    },
    { title: "Date", dataIndex: "date", key: "date", width: 110, render: (v) => v || <span style={{ color: "#cf1322" }}>—</span> },
    { title: "Category", dataIndex: "type", key: "type", width: 120, ellipsis: true },
    {
      title: "",
      key: "status",
      width: 40,
      render: (_, r) =>
        r._valid ? (
          <CheckCircleOutlined style={{ color: "#52c41a" }} />
        ) : (
          <span style={{ color: "#cf1322", fontWeight: 700 }}>✕</span>
        ),
    },
  ];

  const validCount = preview.filter((r) => r._valid).length;

  return (
    <Modal
      title="Import from CSV"
      open={open}
      onCancel={handleClose}
      width={700}
      footer={null}
      destroyOnClose
    >
      <Steps
        current={step}
        size="small"
        style={{ marginBottom: 24 }}
        items={[
          { title: "Upload" },
          { title: "Map columns" },
          { title: "Preview" },
          { title: "Done" },
        ]}
      />

      {/* ── Step 0: Upload ── */}
      {step === 0 && (
        <div>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontWeight: 500 }}>Import as:</span>
            <Select
              value={kind}
              onChange={setKind}
              style={{ width: 140 }}
              options={[
                { value: "expense", label: "🧾 Expenses" },
                { value: "income", label: "💵 Income" },
              ]}
            />
          </div>
          <Dragger
            accept=".csv"
            beforeUpload={handleFile}
            showUploadList={false}
            style={{ padding: "12px 0" }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag a CSV file here</p>
            <p className="ant-upload-hint">
              Supports any bank export. Up to 500 rows. Headers required.
            </p>
          </Dragger>
          <div style={{ marginTop: 16, fontSize: 12, color: "#8c8c8c" }}>
            <strong>Expected columns (any order):</strong> name/description, amount, date, category (optional), notes (optional)
          </div>
        </div>
      )}

      {/* ── Step 1: Column mapping ── */}
      {step === 1 && (
        <div>
          <Alert
            type="info"
            message="Map your CSV columns to the app fields below. Auto-detection has pre-filled what it could."
            style={{ marginBottom: 16 }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {ALL_FIELDS.map((field) => (
              <div key={field}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: REQUIRED_FIELDS.includes(field) ? "#000" : "#8c8c8c" }}>
                  {FIELD_LABELS[field]}
                </div>
                <Select
                  style={{ width: "100%" }}
                  value={mapping[field] || "__none__"}
                  onChange={(val) =>
                    setMapping((prev) => ({
                      ...prev,
                      [field]: val === "__none__" ? undefined : val,
                    }))
                  }
                  options={headerOptions}
                />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button onClick={() => setStep(0)}>← Back</Button>
            <Button
              type="primary"
              onClick={buildPreview}
              disabled={!mapping.name || !mapping.amount || !mapping.date}
            >
              Preview →
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Preview ── */}
      {step === 2 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <Tag color="green">{validCount} valid</Tag>
              {validationErrors.length > 0 && (
                <Tag color="red">{validationErrors.length} will be skipped</Tag>
              )}
            </div>
            <span style={{ fontSize: 12, color: "#8c8c8c" }}>
              Showing first {Math.min(preview.length, 50)} of {rawRows.length} rows
            </span>
          </div>

          {validationErrors.length > 0 && (
            <Alert
              type="warning"
              message={`${validationErrors.length} rows have issues and will be skipped`}
              description={
                <ul style={{ margin: 0, paddingLeft: 16, maxHeight: 80, overflowY: "auto" }}>
                  {validationErrors.slice(0, 5).map((e, i) => <li key={i} style={{ fontSize: 11 }}>{e}</li>)}
                  {validationErrors.length > 5 && <li style={{ fontSize: 11 }}>...and {validationErrors.length - 5} more</li>}
                </ul>
              }
              style={{ marginBottom: 12 }}
            />
          )}

          <Table
            size="small"
            dataSource={preview.slice(0, 50)}
            columns={previewColumns}
            pagination={false}
            scroll={{ y: 260 }}
            rowClassName={(r) => (!r._valid ? "row-invalid" : "")}
          />

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <Button onClick={() => setStep(1)}>← Back</Button>
            <Button
              type="primary"
              onClick={handleImport}
              loading={importing}
              disabled={validCount === 0}
            >
              Import {validCount} row{validCount !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Done ── */}
      {step === 3 && result && (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Import complete
          </div>
          <div style={{ fontSize: 14, color: "#8c8c8c", marginBottom: 24 }}>
            <strong style={{ color: "#3f8600" }}>{result.imported} transactions</strong> imported successfully
            {result.skipped > 0 && (
              <>, <strong style={{ color: "#cf1322" }}>{result.skipped} skipped</strong></>
            )}
          </div>
          {result.errors?.length > 0 && (
            <Alert
              type="warning"
              message="Some rows were skipped"
              description={result.errors.slice(0, 5).join("\n")}
              style={{ marginBottom: 16, textAlign: "left" }}
            />
          )}
          <Button type="primary" onClick={handleClose}>
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
}