import React, { useState } from "react";
import { Form, Input, Button, Card, message, Space, Divider } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { authService } from "../services/apiService";

const Login = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await authService.login(values);
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      message.success(response.data.message);
      onLoginSuccess(response.data.user);
    } catch (error) {
      const errorMessage =
          error.response?.data?.message || error.message || "Login failed";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
   window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
      <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            background: "#f5f5f5",
          }}
      >
        <Card style={{ width: 400, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          <h1 style={{ textAlign: "center", marginBottom: 30 }}>Budget Tracker</h1>

          <Button
              onClick={handleGoogleLogin}
              style={{ width: "100%", height: 40 }}
          >
            Continue with Google
          </Button>

          <Divider style={{ margin: "16px 0" }}>or</Divider>

          <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            <Form.Item
                label="Username or Email"
                name="usernameOrEmail"
                rules={[{ required: true, message: "Please enter username or email" }]}
            >
              <Input
                  prefix={<UserOutlined />}
                  placeholder="Enter your username or email"
                  size="large"
              />
            </Form.Item>

            <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: "Please enter password" }]}
            >
              <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Enter your password"
                  size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  style={{ width: "100%", height: 40 }}
              >
                Login
              </Button>
            </Form.Item>

            <Space style={{ width: "100%", justifyContent: "center" }}>
              <span>Don&apos;t have an account?</span>
              <Button type="link" onClick={onSwitchToRegister}>
                Register
              </Button>
            </Space>
          </Form>
        </Card>
      </div>
  );
};

export default Login;