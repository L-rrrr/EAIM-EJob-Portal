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
import axios from "axios";

const Navbar: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/applied-jobs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const jobs = res.data.data;
          const newNotifications: string[] = [];
          jobs.forEach((job: any) => {
            if (job.application_status === "Interview Scheduled" && job.interview_date) {
              newNotifications.push(
                `You have an interview scheduled for "${job.title}" on ${job.interview_date ? new Date(job.interview_date).toLocaleDateString() : "TBA"}.`
              );
            }
            if (job.application_status === "Accepted") {
              newNotifications.push(
                `Congratulations! Your application for "${job.title}" has been accepted.`
              );
            }
            if (job.application_status === "Rejected") {
              newNotifications.push(
                `Your application for "${job.title}" has been rejected.`
              );
            }
          });
          setNotifications(newNotifications);
        }
      } catch (e) {
        setNotifications([]);
      }
    };
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);


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
              {notifications.length === 0 ? (
                <p>No new notifications.</p>
              ) : (
                <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                  {notifications.map((msg, idx) => (
                    <li key={idx}>
                      <span className={styles.notificationNumber}>{idx + 1}.</span> {msg}
                    </li>
                  ))}
                </ul>
              )}
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