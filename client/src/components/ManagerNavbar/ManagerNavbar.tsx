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
          <User
            className={styles.navbarIcon}
            onClick={() => {
              setShowProfile(prev => !prev);
              setPassword(""); // Clear password when opening, like HRNavbar
              setShowPassword(false);
            }}
          />
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

export default ManagerNavbar;