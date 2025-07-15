import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Bell,
  User,
  LogOut,
  Sun,
  Moon,
  Eye,
  EyeOff,
} from "lucide-react";
import logo from "../../assets/EAIM-logo.png";
import styles from "./HRNavbar.module.css";

const HRNavbar: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("current-password");
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const email = "user@eaim.edu.sg";

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current && !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfile(false);
      }
      if (
        notificationRef.current && !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className={styles.hrNavbar}>
      <div className={styles.navbarLeft}>
        <img src={logo} alt="Logo" className={styles.navbarLogo} />
        <Link to="/hr/dashboard" className={styles.navbarLink}>Dashboard</Link>
        <Link to="/hr/available-jobs" className={styles.navbarLink}>Available Jobs</Link>
        <Link to="/hr/applicants" className={styles.navbarLink}>Applications</Link>
        <Link to="/hr/post-job" className={styles.navbarLink}>Post Jobs</Link>
        <Link to="/hr/interview" className={styles.navbarLink}>Interviews</Link>
        <Link to="/hr/application-form" className={styles.navbarLink}>Print Application Form</Link>
      </div>

      <div className={styles.navbarRight}>
        <button
          className={`${styles.iconButton} ${darkMode ? styles.dark : ""}`}
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Moon /> : <Sun />}
        </button>

        <div className={styles.notificationWrapper} ref={notificationRef}>
          <Bell className={styles.navbarIcon} onClick={() => setShowNotifications(prev => !prev)} />
          {showNotifications && (
            <div className={styles.notificationPopup}>
              <p><strong>New Notification</strong></p>
              <p>1. New applicant for job posting.</p>
            </div>
          )}
        </div>

        <LogOut className={styles.navbarIcon} onClick={() => navigate("/login")} />

        <div className={styles.profileWrapper} ref={profileRef}>
          <User className={styles.navbarIcon} onClick={() => setShowProfile(prev => !prev)} />
          {showProfile && (
            <div className={styles.profilePopup}>
              <div className={styles.username}>
                <p><strong>Email:</strong> {email}</p>
              </div>

              <div className={styles.passwordRow}>
                <label><strong>Current Password:</strong></label>
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
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default HRNavbar;