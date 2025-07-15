import styles from "./ManagerNavbar.module.css";
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  const [darkMode, setDarkMode] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("current-password");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const email = "manager@eaim.edu.sg";

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);


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

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };


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
    <nav className={styles.navbar}>
      <div className={styles.navbarLeft}>
        <img src={logo} alt="Logo" className={styles.navbarLogo} />
        <Link to="/manager/available-jobs" className={styles.navbarLink}>Current Jobs</Link>
        <Link to="/manager/new-job" className={styles.navbarLink}>Job Requisition</Link>
        <Link to="/manager/assessment" className={styles.navbarLink}>Assessment</Link>
      </div>

      <div className={styles.navbarRight}>
        <button
          className={`${styles.iconButton} ${darkMode ? styles.dark : ""}`}
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Moon /> : <Sun />}
        </button>

        <LogOut className={styles.navbarIcon} onClick={() => navigate("/login")} />

        <div className={styles.profileWrapper} ref={profileRef}>
          <User className={styles.navbarIcon} onClick={() => setShowProfile(prev => !prev)} />
          {showProfile && (
            <div className={styles.profilePopup}>
              <p><strong>Email:</strong> {email}</p>

              <div className={styles.passwordRow}>
                <label>Current Password:</label>
                <div className={styles.passwordField}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    readOnly
                  />
                  <button className={styles.eyeButton} onClick={() => setShowPassword(prev => !prev)} type="button">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <label>New Password:</label>
              <input className={styles.editPasswordField}
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <label>Confirm New Password:</label>
              <input className={styles.editPasswordField}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button className={styles.changeBtn} onClick={handleChangePassword}>Change Password</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default ManagerNavbar;