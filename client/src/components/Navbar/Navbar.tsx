import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Bell,
  User,
  LogOut,
  CircleHelp,
  Bookmark,
  Sun,
  Moon,
  Settings,
} from "lucide-react";
import logo from "../../assets/EAIM-logo.png";
import styles from "./Navbar.module.css";

const Navbar: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const toggleNotifications = () => setShowNotifications((prev) => !prev);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarLeft}>
        <img src={logo} alt="Logo" className={styles.navbarLogo} />
        <Link to="/home" className={styles.navbarLink}>Home</Link>
        <Link to="/available-jobs" className={styles.navbarLink}>Available Jobs</Link>
        <Link to="/jobs-applied" className={styles.navbarLink}>Jobs Applied</Link>
        <Link to="/print-application" className={styles.navbarLink}>Print Application Form</Link>
      </div>

      <div className={styles.navbarRight}>
        <button
          className={`${styles.iconButton} ${darkMode ? styles.dark : ""}`}
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Moon /> : <Sun />}
        </button>

        <Bookmark 
          className={styles.navbarIcon} 
          onClick={() => navigate("/bookmark")} 
        />
        <CircleHelp 
          className={styles.navbarIcon} 
          onClick={() => navigate("/help")} 
        />

        <div className={styles.notificationWrapper} ref={notificationRef}>
          <Bell 
            className={styles.navbarIcon} 
            onClick={toggleNotifications} 
          />
          {showNotifications && (
            <div className={styles.notificationPopup}>
              <p><strong>New Notification</strong></p>
              <p>1. You have 3 new job updates.</p>
            </div>
          )}
        </div>

        <LogOut 
          className={styles.navbarIcon} 
          onClick={() => navigate("/login")} 
        />

        <Settings  // Add this Settings icon
          className={styles.navbarIcon} 
          onClick={() => navigate("/settings")} 
        />

        <User 
          className={styles.navbarIcon} 
          onClick={() => navigate("/profile/personal-particulars")} 
        />
      </div>
    </nav>
  );
};

export default Navbar;