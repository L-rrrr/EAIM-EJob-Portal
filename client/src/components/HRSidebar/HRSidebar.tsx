import { useState } from "react";
import { Link } from "react-router-dom";
import "./HRSidebar.css";
import {
  PanelLeft,
  User,
  GraduationCap,
  Contact,
  Briefcase,
  BookOpen,
  MessageCircleQuestion
} from "lucide-react";

type Section = {
  label: string;
  icon: React.ReactNode;
  path: string;
};

const profileSections: Section[] = [
  { label: "Personal Particulars", icon: <User size={16} />, path: "/hr/applicant-details/personal-particulars" },
  { label: "Education", icon: <GraduationCap size={16} />, path: "/hr/applicant-details/education" },
  { label: "Work & Skills", icon: <Briefcase size={16} />, path: "/hr/applicant-details/work" },
  { label: "Family Background", icon: <Contact size={16} />, path: "/hr/applicant-details/family" },
  { label: "Supporting Materials", icon: <BookOpen size={16} />, path: "/hr/applicant-details/support" },
  { label: "Find Out More", icon: <MessageCircleQuestion size={16} />, path: "/hr/applicant-details/background-check" }
];

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        {!collapsed && <h3 className="sidebar-title">Alice Tan</h3>}
        <button onClick={toggleSidebar} className="toggle-button">
          <PanelLeft size={20} />
        </button>
      </div>

      {!collapsed && (
        <>
          <ul className="profile-sections">
            {profileSections.map((section, index) => (
              <li key={index} className="profile-item">
                <Link to={section.path} className="profile-label">
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

export default Sidebar;
