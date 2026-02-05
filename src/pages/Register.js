import { useState } from "react";
import API from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "../styles/auth-premium.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/register", {
        name,
        email,
        password,
      });
      login(res.data);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="header-badge">Start Your Journey</div>
          <h1>Create Your Account</h1>
          <p>Join thousands managing their finances smartly</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="auth-form" onSubmit={submitHandler}>
          <div className="form-group">
            <label htmlFor="name">👤 Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">📧 Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">🔐 Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="auth-button" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating account...
              </>
            ) : (
              "✨ Create Account"
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>Already have an account?</span>
        </div>

        <Link to="/login" className="switch-auth-link">
          Login here →
        </Link>
      </div>

      <div className="auth-side">
        <div className="premium-banner">
          <div className="banner-background"></div>
          <div className="banner-content">
            <div className="logo-section">
              <div className="animated-logo">💰</div>
              <h2>FinanceTracker</h2>
            </div>
            <p className="tagline">Take Control of Your Money, Achieve Your Dreams</p>
            
            <div className="features-premium">
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <div>
                  <h4>Smart Analytics</h4>
                  <p>Visual dashboards & detailed reports</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🏆</span>
                <div>
                  <h4>Budget Management</h4>
                  <p>Organize & control your spending</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <div>
                  <h4>100% Secure</h4>
                  <p>Your data is safe & private</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <div>
                  <h4>Easy to Use</h4>
                  <p>Simple interface built for everyone</p>
                </div>
              </div>
            </div>
            
            <div className="animated-shapes">
              <div className="shape shape-1"></div>
              <div className="shape shape-2"></div>
              <div className="shape shape-3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
