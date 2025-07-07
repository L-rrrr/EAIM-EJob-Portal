import { useState } from "react";
import { ChevronDown, ChevronUp, Calendar, Clock, MapPin, Briefcase, Users, CheckCircle, AlertCircle } from "lucide-react";
import styles from "./JobsApplied.module.css";

type Job = {
  id: number;
  title: string;
  dateApplied: string;
  interviewDate?: string;
  jobType: "Full Time" | "Part Time" | "Freelance";
  applicationStatus: string;
  jobCategory: string;
  jobResponsibilities: string;
  jobRequirements: string;
};

const initialJobs: Job[] = [
  {
    id: 1,
    title: "Freelance Lecturer (Business & Management)",
    dateApplied: "2025-06-01",
    interviewDate: "2025-06-05",
    jobType: "Freelance",
    applicationStatus: "Interview Scheduled",
    jobCategory: "lecturer",
    jobResponsibilities: `
      <ul>
        <li>Deliver high-quality lectures and seminars in Business and Management subjects</li>
        <li>Develop and update course materials, including presentations, assignments, and assessments</li>
        <li>Provide academic guidance and mentorship to students</li>
        <li>Assess student performance through examinations, assignments, and continuous evaluation</li>
        <li>Participate in departmental meetings and academic committees</li>
        <li>Conduct research in relevant areas and publish findings in academic journals</li>
        <li>Collaborate with other faculty members on curriculum development</li>
        <li>Maintain accurate records of student attendance and academic progress</li>
      </ul>
    `,
    jobRequirements: `
      <ul>
        <li>Master's degree in Business Administration, Management, or related field</li>
        <li>Minimum 3 years of teaching experience in higher education</li>
        <li>Strong knowledge of business principles, management theories, and current industry trends</li>
        <li>Excellent verbal and written communication skills</li>
        <li>Proficiency in educational technology and online learning platforms</li>
        <li>Ability to engage and motivate students from diverse backgrounds</li>
        <li>Research experience and published work in business/management field preferred</li>
        <li>Professional certification in relevant business areas (CPA, MBA, etc.) is an advantage</li>
      </ul>
    `
  },
  {
    id: 2,
    title: "Operations Manager",
    dateApplied: "2025-05-28",
    jobType: "Full Time",
    applicationStatus: "Application Under Review",
    jobCategory: "manager",
    jobResponsibilities: `
      <ul>
        <li>Oversee daily operations and ensure smooth functioning of all departments</li>
        <li>Develop and implement operational policies and procedures</li>
        <li>Monitor performance metrics and KPIs to optimize efficiency</li>
        <li>Manage budgets and resource allocation for operational activities</li>
        <li>Lead and coordinate cross-functional teams to achieve organizational goals</li>
        <li>Identify process improvements and implement best practices</li>
        <li>Ensure compliance with regulatory requirements and company policies</li>
        <li>Prepare regular reports on operational performance for senior management</li>
        <li>Handle vendor relationships and negotiate contracts</li>
        <li>Manage risk assessment and mitigation strategies</li>
      </ul>
    `,
    jobRequirements: `
      <ul>
        <li>Bachelor's degree in Business Administration, Operations Management, or related field</li>
        <li>Minimum 5 years of experience in operations management or similar role</li>
        <li>Strong analytical and problem-solving skills</li>
        <li>Proven leadership experience with ability to manage diverse teams</li>
        <li>Excellent project management and organizational skills</li>
        <li>Proficiency in data analysis tools and business intelligence software</li>
        <li>Knowledge of lean manufacturing principles and process optimization</li>
        <li>Strong financial acumen and budget management experience</li>
        <li>Excellent communication and interpersonal skills</li>
        <li>PMP certification or similar project management qualification preferred</li>
      </ul>
    `
  }
];

const JobsApplied: React.FC = () => {
  const [savedJobs] = useState<Job[]>(initialJobs);
  const [expandedJobIds, setExpandedJobIds] = useState<Set<number>>(new Set());

  const toggleJobDetails = (id: number) => {
    setExpandedJobIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Interview Scheduled":
        return <CheckCircle size={14} />;
      case "Application Under Review":
        return <AlertCircle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Interview Scheduled":
        return styles.statusScheduled;
      case "Application Under Review":
        return styles.statusReview;
      default:
        return styles.statusDefault;
    }
  };

  return (
    <div className={styles.jobsAppliedPage}>
      <div className={styles.jobsAppliedContainer}>
        <div className={styles.pageHeader}>
          <h2>Your Job Applications</h2>
          <p className={styles.pageSubtitle}>Track your application progress and interview schedules</p>
        </div>

        {savedJobs.length === 0 ? (
          <div className={styles.noJobsCard}>
            <div className={styles.noJobsIcon}>
              <Briefcase size={48} />
            </div>
            <h3>No Applications Yet</h3>
            <p>You haven't applied to any jobs yet. Start exploring opportunities!</p>
          </div>
        ) : (
          <div className={styles.jobsGrid}>
            {savedJobs.map((job) => (
              <div key={job.id} className={styles.jobCard}>
                <div
                  className={styles.jobHeader}
                  onClick={() => toggleJobDetails(job.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") toggleJobDetails(job.id);
                  }}
                  aria-expanded={expandedJobIds.has(job.id)}
                >
                  <div className={styles.jobMainInfo}>
                    <div className={styles.jobTitleSection}>
                      <h3 className={styles.jobTitle}>{job.title}</h3>
                      <div className={styles.jobMeta}>
                        <span className={styles.jobTypeBadge}>
                          <Clock size={12} />
                          {job.jobType}
                        </span>
                        <span className={styles.jobCategoryBadge}>
                          <MapPin size={12} />
                          {job.jobCategory === "lecturer" ? "Academic" : "Operations"}
                        </span>
                        <span className={`${styles.jobStatusBadge} ${getStatusColor(job.applicationStatus)}`}>
                          {getStatusIcon(job.applicationStatus)}
                          {job.applicationStatus}
                        </span>
                      </div>
                    </div>
                    
                    <div className={styles.jobDates}>
                      <div className={styles.dateInfo}>
                        <Calendar size={14} />
                        <span>Applied: {new Date(job.dateApplied).toLocaleDateString()}</span>
                      </div>
                      {job.interviewDate && (
                        <div className={`${styles.dateInfo} ${styles.interviewDate}`}>
                          <Users size={14} />
                          <span>Interview: {new Date(job.interviewDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.expandIndicator}>
                    {expandedJobIds.has(job.id) ? 
                      <ChevronUp size={20} /> : 
                      <ChevronDown size={20} />
                    }
                  </div>
                </div>

                {expandedJobIds.has(job.id) && (
                  <div className={styles.jobDetails}>
                    <div className={styles.detailsSection}>
                      <h4 className={styles.sectionTitle}>
                        <Briefcase size={16} />
                        Job Responsibilities
                      </h4>
                      <div 
                        className={styles.sectionContent}
                        dangerouslySetInnerHTML={{ __html: job.jobResponsibilities }} 
                      />
                    </div>

                    <div className={styles.detailsSection}>
                      <h4 className={styles.sectionTitle}>
                        <Users size={16} />
                        Job Requirements
                      </h4>
                      <div 
                        className={styles.sectionContent}
                        dangerouslySetInnerHTML={{ __html: job.jobRequirements }} 
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsApplied;