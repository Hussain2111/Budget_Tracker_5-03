import { useState, useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { authService } from "../services/apiService";
import "./Auth.css";

const FinaLogo = () => (
  <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
    <path d="M11 2C6.03 2 2 6.03 2 11s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" fill="rgba(255,255,255,0.2)"/>
    <path d="M8 15V9.5L11 7l3 2.5V15" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.5 15v-3h3v3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function ResetPassword({ onSuccess, onBack }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [token, setToken] = useState("");
  const [tokenMissing, setTokenMissing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
    } else {
      setTokenMissing(true);
    }
  }, []);

  const handleSubmit = async ({ newPassword }) => {
    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      setDone(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Reset failed. The link may have expired.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (tokenMissing) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>⚠️</div>
          <h1 className="auth-title">Invalid link</h1>
          <p className="auth-subtitle" style={{ marginBottom: 20 }}>
            This password reset link is invalid or has expired.
          </p>
          <button className="auth-switch-btn" onClick={onBack}>
            ← Request a new link
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>✅</div>
          <h1 className="auth-title">Password reset!</h1>
          <p className="auth-subtitle" style={{ marginBottom: 20 }}>
            Your password has been updated. You can now sign in with your new password.
          </p>
          <Button
            type="primary"
            size="large"
            block
            className="auth-submit-btn"
            onClick={onSuccess}
          >
            Go to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo-mark"><FinaLogo /></div>
          <span className="auth-logo-name">Fina</span>
        </div>

        <h1 className="auth-title">Set new password</h1>
        <p className="auth-subtitle">Choose a strong password for your Fina account.</p>

        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item
            label="New password"
            name="newPassword"
            rules={[
              { required: true, message: "Please enter a new password" },
              { min: 6, message: "At least 6 characters" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Minimum 6 characters"
              size="large"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            label="Confirm new password"
            name="confirmPassword"
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Repeat your new password"
              size="large"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
              className="auth-submit-btn"
            >
              Reset password
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
