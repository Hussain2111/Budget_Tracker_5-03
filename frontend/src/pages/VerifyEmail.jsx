import { useState, useEffect } from "react";
import { Button, Spin } from "antd";
import { authService } from "../services/apiService";
import "./Auth.css";

const FinaLogo = () => (
  <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
    <path d="M11 2C6.03 2 2 6.03 2 11s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" fill="rgba(255,255,255,0.2)"/>
    <path d="M8 15V9.5L11 7l3 2.5V15" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.5 15v-3h3v3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function VerifyEmail({ onVerified, onBack }) {
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token found in the link.");
      return;
    }

    authService
      .verifyEmail(token)
      .then((res) => {
        // Auto-login: store the token returned after verification
        if (res.data?.access_token) {
          localStorage.setItem("access_token", res.data.access_token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setErrorMsg(
          err.response?.data?.message ||
            "Verification failed. The link may have expired.",
        );
      });
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-brand" style={{ justifyContent: "center", marginBottom: 24 }}>
          <div className="auth-logo-mark"><FinaLogo /></div>
          <span className="auth-logo-name">Fina</span>
        </div>

        {status === "loading" && (
          <>
            <Spin size="large" style={{ marginBottom: 16 }} />
            <h1 className="auth-title">Verifying your email…</h1>
            <p className="auth-subtitle">This will only take a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🎉</div>
            <h1 className="auth-title">Email verified!</h1>
            <p className="auth-subtitle" style={{ marginBottom: 24 }}>
              Your Fina account is now active. Let's get started.
            </p>
            <Button
              type="primary"
              size="large"
              block
              className="auth-submit-btn"
              onClick={onVerified}
            >
              Go to dashboard →
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 14 }}>❌</div>
            <h1 className="auth-title">Verification failed</h1>
            <div className="auth-alert auth-alert-error" style={{ textAlign: "left", marginBottom: 20 }}>
              <div className="auth-alert-icon">⚠️</div>
              <div className="auth-alert-text">{errorMsg}</div>
            </div>
            <p className="auth-subtitle" style={{ marginBottom: 16 }}>
              Request a new verification email from the login page.
            </p>
            <button className="auth-switch-btn" onClick={onBack}>
              ← Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
