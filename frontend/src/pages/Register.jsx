import { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { authService } from "../services/apiService";
import "./Auth.css";

const FinaLogo = () => (
  <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
    <path d="M11 2C6.03 2 2 6.03 2 11s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" fill="rgba(255,255,255,0.2)"/>
    <path d="M8 15V9.5L11 7l3 2.5V15" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.5 15v-3h3v3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Register({ onRegisterSuccess, onSwitchToLogin }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const handleSubmit = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...data } = values;
      await authService.register(data);
      setRegisteredEmail(values.email);
      setRegistered(true);
    } catch (error) {
      const msg = error.response?.data?.message || "Registration failed";
      message.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Post-registration: check email screen ──
  if (registered) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>✉️</div>
          <h1 className="auth-title">Check your inbox</h1>
          <p className="auth-subtitle" style={{ marginBottom: 20 }}>
            We sent a verification link to{" "}
            <strong style={{ color: "var(--forest-800)" }}>{registeredEmail}</strong>.
            Click it to activate your Fina account.
          </p>
          <div className="auth-alert auth-alert-info" style={{ textAlign: "left", marginBottom: 20 }}>
            <div className="auth-alert-icon">💡</div>
            <div className="auth-alert-text">
              The link expires in 24 hours. Check your spam folder if you don't see it.
            </div>
          </div>
          <button className="auth-switch-btn" onClick={onSwitchToLogin}>
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo-mark">
            <FinaLogo />
          </div>
          <span className="auth-logo-name">Fina</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Free forever. No credit card required.</p>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[
              { required: true, message: "Please enter a username" },
              { min: 3, message: "At least 3 characters" },
              { pattern: /^[a-zA-Z0-9_]+$/, message: "Letters, numbers and underscores only" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Choose a username"
              size="large"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Invalid email format" },
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

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Please enter a password" },
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
            label="Confirm Password"
            name="confirmPassword"
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Repeat your password"
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
              Create account
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-switch">
          Already have an account?{" "}
          <button className="auth-switch-btn" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
