import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./Sidebar.module.css";
import axios from "axios";
import {
  PanelLeft,
  CheckCircle,
  AlertCircle,
  User,
  GraduationCap,
  Contact,
  Briefcase,
  BookOpen,
} from "lucide-react";

type Section = {
  label: string;
  completed: boolean;
  icon: React.ReactNode;
  path: string;
};

const TOTAL_SECTIONS = 11;

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [personalParticularsCompleted, setPersonalParticularsCompleted] = useState(false);
  const [educationCompleted, setEducationCompleted] = useState(false);
  const [workCompleted, setWorkCompleted] = useState(false);
  const [familyCompleted, setFamilyCompleted] = useState(false);
  const [supportCompleted, setSupportCompleted] = useState(false);

  const SECTION_TABLES = {
    personal: 4,
    education: 1,
    work: 2,
    family: 2,
    support: 2,
  };

  const completedTables =
    (personalParticularsCompleted ? SECTION_TABLES.personal : 0) +
    (educationCompleted ? SECTION_TABLES.education : 0) +
    (workCompleted ? SECTION_TABLES.work : 0) +
    (familyCompleted ? SECTION_TABLES.family : 0) +
    (supportCompleted ? SECTION_TABLES.support : 0);

  const progressPercent = Math.floor((completedTables / TOTAL_SECTIONS) * 100);

  useEffect(() => {
    const fetchCompleteness = async () => {
      try {
        const token = localStorage.getItem("token");
        const [
          personalRes,
          educationRes,
          workRes,
          familyRes,
          supportRes
        ] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/personal-particulars-completeness`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/education-completeness`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/work-completeness`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/family-completeness`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/support-completeness`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setPersonalParticularsCompleted(personalRes.data.complete);
        setEducationCompleted(educationRes.data.complete);
        setWorkCompleted(workRes.data.complete);
        setFamilyCompleted(familyRes.data.complete);
        setSupportCompleted(supportRes.data.complete);
      } catch (e) {
        setPersonalParticularsCompleted(false);
        setEducationCompleted(false);
        setWorkCompleted(false);
        setFamilyCompleted(false);
        setSupportCompleted(false);
      }
    };
    fetchCompleteness();

    const handler = () => fetchCompleteness();
    window.addEventListener("profile-completeness-updated", handler);
    return () => window.removeEventListener("profile-completeness-updated", handler);
  }, []);
  


  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const profileSections: Section[] = [
    { label: "Personal Particulars", completed: personalParticularsCompleted, icon: <User size={16} />, path: "/profile/personal-particulars" },
    { label: "Education", completed: educationCompleted, icon: <GraduationCap size={16} />, path: "/profile/education" },
    { label: "Work & Skills", completed: workCompleted, icon: <Briefcase size={16} />, path: "/profile/work" },
    { label: "Family Background", completed: familyCompleted, icon: <Contact size={16} />, path: "/profile/family" },
    { label: "Supporting Materials", completed: supportCompleted, icon: <BookOpen size={16} />, path: "/profile/support" },
  ];

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.sidebarHeader}>
        {!collapsed && <h3 className={styles.sidebarTitle}>My Profile</h3>}
        <button onClick={toggleSidebar} className={styles.toggleButton}>
          <PanelLeft size={20} />
        </button>
      </div>

      {!collapsed && (
        <>
          <div className={styles.completeness}>
            Overall Completeness: {progressPercent}%
          </div>
          <ul className={styles.profileSections}>
            {profileSections.map((section, index) => (
              <li key={index} className={styles.profileItem}>
                <Link to={section.path} className={styles.profileLabel}>
                  {section.icon} {section.label}
                </Link>
                {section.completed ? (
                  <CheckCircle color="green" size={18} className={styles.statusIcon} />
                ) : (
                  <AlertCircle color="var(--alert-circle-color)" size={18} className={styles.statusIcon} />
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default Sidebar;