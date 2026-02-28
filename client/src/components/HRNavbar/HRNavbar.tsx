import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Bell,
  User,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import logo from "../../assets/EAIM-logo.png";
import styles from "./HRNavbar.module.css";
import { useTheme } from "../../hooks/useTheme";

const HRNavbar: React.FC = () => {
  const { isDark: darkMode, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const email = "user@eaim.edu.sg";

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
      </div>

      <div className={styles.navbarRight}>
        <button
          className={`${styles.iconButton} ${darkMode ? styles.dark : ""}`}
          onClick={toggleTheme}
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
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default HRNavbar;