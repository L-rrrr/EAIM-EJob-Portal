import "./ManagerNavbar.css";
import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ColorModeContext } from "../../ThemeContext";
import {
  User,
  LogOut,
  Sun,
  Moon,
  Eye,
  EyeOff,
} from "lucide-react";
import logo from "../../assets/EAIM-logo.png";

const ManagerNavbar: React.FC = () => {
  const { darkMode, toggleDarkMode } = useContext(ColorModeContext);
  const [showProfile, setShowProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("current-password");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const email = "manager@eaim.edu.sg";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current && !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
    alert("Password changed successfully!");
    setPassword(newPassword);
    setNewPassword("");
    setConfirmPassword("");
    setShowProfile(false);
  };

  return (
    <nav className="manager-navbar">
      <div className="navbar-left">
        <img src={logo} alt="Logo" className="navbar-logo" />
        <Link to="/manager/available-jobs" className="navbar-link">Current Jobs</Link>
        <Link to="/manager/new-job" className="navbar-link">New Job Requisition</Link>
        <Link to="/manager/interviews" className="navbar-link">Assess Interview</Link>
      </div>

      <div className="navbar-right">
        <button
          className={`icon-button ${darkMode ? "dark" : ""}`}
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Moon /> : <Sun />}
        </button>

        <LogOut className="navbar-icon" onClick={() => navigate("/login")} />

        <div className="profile-wrapper" ref={profileRef}>
          <User className="navbar-icon" onClick={() => setShowProfile(prev => !prev)} />
          {showProfile && (
            <div className="profile-popup">
              <p><strong>Email:</strong> {email}</p>

              <div className="password-row">
                <label>Current Password:</label>
                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    readOnly
                  />
                  <button className="eye-button" onClick={() => setShowPassword(prev => !prev)} type="button">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <label>New Password:</label>
              <input className="edit-password-field"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <label>Confirm New Password:</label>
              <input className="edit-password-field"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button className="change-btn" onClick={handleChangePassword}>Change Password</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default ManagerNavbar;
