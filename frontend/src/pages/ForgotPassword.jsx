import { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { authService } from "../services/apiService";
import "./Auth.css";

const FinaLogo = () => (
  <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
    <path d="M11 2C6.03 2 2 6.03 2 11s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" fill="rgba(255,255,255,0.2)"/>
    <path d="M8 15V9.5L11 7l3 2.5V15" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.5 15v-3h3v3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function ForgotPassword({ onBack }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch {
      message.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo-mark"><FinaLogo /></div>
          <span className="auth-logo-name">Fina</span>
        </div>

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📬</div>
            <h1 className="auth-title">Check your inbox</h1>
            <p className="auth-subtitle" style={{ marginBottom: 24 }}>
              If that email is registered, we've sent a password reset link. It expires in 1 hour.
            </p>
            <div className="auth-alert auth-alert-info" style={{ textAlign: "left", marginBottom: 20 }}>
              <div className="auth-alert-icon">💡</div>
              <div className="auth-alert-text">
                Check your spam folder if you don't see it within a few minutes.
              </div>
            </div>
            <button className="auth-switch-btn" onClick={onBack}>← Back to login</button>
          </div>
        ) : (
          <>
            <h1 className="auth-title">Forgot password?</h1>
            <p className="auth-subtitle">
              Enter your email and we'll send you a link to reset your password.
            </p>

            <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
              <Form.Item
                label="Email address"
                name="email"
                rules={[
                  { required: true, message: "Please enter your email" },
                  { type: "email", message: "Invalid email" },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="you@example.com"
                  size="large"
                  type="email"
                  autoComplete="email"
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
                  Send reset link
                </Button>
              </Form.Item>
            </Form>

            <div className="auth-switch">
              <button className="auth-switch-btn" onClick={onBack}>
                ← Back to login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
