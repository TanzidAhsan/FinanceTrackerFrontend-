import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import "../styles/navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
          <span className="logo-icon">💰</span>
          <span className="logo-text">FinanceTracker</span>
        </Link>

        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          <span className={`hamburger ${mobileMenuOpen ? "active" : ""}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        <div className={`navbar-menu ${mobileMenuOpen ? "active" : ""}`}>
          {user ? (
            <>
              <Link
                to="/"
                className={`nav-link ${isActive("/") ? "active" : ""}`}
                onClick={closeMobileMenu}
              >
                Dashboard
              </Link>

              <Link
                to="/transactions"
                className={`nav-link ${isActive("/transactions") ? "active" : ""}`}
                onClick={closeMobileMenu}
              >
                Transactions
              </Link>

              <Link
                to="/reports"
                className={`nav-link ${isActive("/reports") ? "active" : ""}`}
                onClick={closeMobileMenu}
              >
                Reports
              </Link>

              <Link
                to="/meals"
                className={`nav-link ${isActive("/meals") ? "active" : ""}`}
                onClick={closeMobileMenu}
              >
                Meal Management
              </Link>

              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className={`nav-link ${isActive("/admin") ? "active" : ""}`}
                  onClick={closeMobileMenu}
                >
                  Admin
                </Link>
              )}

              <button 
                className="mobile-logout-btn" 
                onClick={() => {
                  closeMobileMenu();
                  logout();
                }}
              >
                 Logout
              </button>
            </>
          ) : (
            <>
               
              <Link
                to="/register"
                className="mobile-register-btn"
                onClick={closeMobileMenu}
              >
                Register
              </Link>
            </>
          )}
        </div>

        <div className="navbar-right">
          {user ? (
            <div className="user-section">
              <span className="user-name">👤 {user.name}</span>
              <button className="logout-btn" onClick={logout}>
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="login-link">
                Login
              </Link>
              <Link to="/register" className="register-btn">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
