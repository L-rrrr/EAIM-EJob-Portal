import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import styles from "../Sidebar/Sidebar.module.css";

import {
  PanelLeft,
  User,
  GraduationCap,
  Contact,
  Briefcase,
  BookOpen,
  FileText
} from "lucide-react";

type Section = {
  label: string;
  icon: React.ReactNode;
  path: string;
};

interface HRSidebarProps {
  applicantName?: string;
}

const HRSidebar: React.FC<HRSidebarProps> = ({ applicantName }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const applicationId = searchParams.get('applicationId');

  // Update hrSections to include userId in the path
  const hrSections: Section[] = [
    { label: "Overview", icon: <FileText size={16} />, path: `/hr/applicant-details/overview?applicationId=${applicationId}&userId=${userId}` },
    { label: "Personal Particulars", icon: <User size={16} />, path: `/hr/applicant-details/personal-particulars?applicationId=${applicationId}&userId=${userId}` },
    { label: "Education", icon: <GraduationCap size={16} />, path: `/hr/applicant-details/education?applicationId=${applicationId}&userId=${userId}` },
    { label: "Work & Skills", icon: <Briefcase size={16} />, path: `/hr/applicant-details/work?applicationId=${applicationId}&userId=${userId}` },
    { label: "Family Background", icon: <Contact size={16} />, path: `/hr/applicant-details/family?applicationId=${applicationId}&userId=${userId}` },
    { label: "Supporting Materials", icon: <BookOpen size={16} />, path: `/hr/applicant-details/support?applicationId=${applicationId}&userId=${userId}` },
  ];

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.sidebarHeader}>
        {!collapsed && (
          <h3 className={styles.sidebarTitle}>
            {applicantName ? `${applicantName}'s Details` : "Applicant Details"}
          </h3>
        )}
        <button onClick={toggleSidebar} className={styles.toggleButton}>
          <PanelLeft size={20} />
        </button>
      </div>

      {!collapsed && (
        <>
          <ul className={styles.profileSections}>
            {hrSections.map((section, index) => (
              <li key={index} className={styles.profileItem}>
                <Link to={section.path} className={styles.profileLabel}>
                  {section.icon} {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default HRSidebar;