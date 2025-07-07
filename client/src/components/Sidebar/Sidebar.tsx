import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Sidebar.module.css";
import {
  PanelLeft,
  CheckCircle,
  AlertCircle,
  User,
  GraduationCap,
  Contact,
  Briefcase,
  BookOpen,
  Settings
} from "lucide-react";

type Section = {
  label: string;
  completed: boolean;
  icon: React.ReactNode;
  path: string;
};

const profileSections: Section[] = [
  { label: "Personal Particulars", completed: false, icon: <User size={16} />, path: "/profile/personal-particulars" },
  { label: "Education", completed: false, icon: <GraduationCap size={16} />, path: "/profile/education" },
  { label: "Work & Skills", completed: false, icon: <Briefcase size={16} />, path: "/profile/work" },
  { label: "Family Background", completed: false, icon: <Contact size={16} />, path: "/profile/family" },
  { label: "Supporting Materials", completed: false, icon: <BookOpen size={16} />, path: "/profile/support" },
  // { label: "Settings", completed: false, icon: <Settings size={16} />, path: "/profile/settings" }
];

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

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
          <div className={styles.completeness}>Overall Completeness: 0%</div>
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