import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Calendar, Clock, MapPin, Briefcase, Users, CheckCircle, AlertCircle } from "lucide-react";
import styles from "./JobsApplied.module.css";
import axios from "axios";

type Job = {
  application_id: number;
  job_id: number;
  title: string;
  applied_date: string;
  interview_date?: string;
  job_type: "Full Time" | "Part Time" | "Freelance";
  application_status: string;
  job_category: string;
  job_responsibilities: string;
  job_requirements: string;
};

const JobsApplied: React.FC = () => {
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);
  const [expandedJobIds, setExpandedJobIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppliedJobs();
  }, []);

  const fetchAppliedJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/applied-jobs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setAppliedJobs(response.data.data);
      } else {
        setError("Failed to fetch applied jobs");
      }
    } catch (err: any) {
      console.error("Error fetching applied jobs:", err);
      setError("Failed to load applied jobs");
    } finally {
      setLoading(false);
    }
  };

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
      case "Shortlisted":
        return <CheckCircle size={14} />;
      case "Reviewed":
        return <AlertCircle size={14} />;
      case "Accepted":
        return <CheckCircle size={14} />;
      case "Rejected":
        return <AlertCircle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Shortlisted":
        return styles.statusScheduled;
      case "Reviewed":
        return styles.statusReview;
      case "Accepted":
        return styles.statusAccepted;
      case "Rejected":
        return styles.statusRejected;
      default:
        return styles.statusDefault;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  };

  const formatInterviewDate = (dateString?: string) => {
    if (!dateString) return "Not scheduled";
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  };

  if (loading) {
    return (
      <div className={styles.jobsAppliedPage}>
        <div className={styles.jobsAppliedContainer}>
          <div className={styles.pageHeader}>
            <h2>Your Job Applications</h2>
            <p className={styles.pageSubtitle}>Loading your applications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.jobsAppliedPage}>
        <div className={styles.jobsAppliedContainer}>
          <div className={styles.pageHeader}>
            <h2>Your Job Applications</h2>
            <p className={styles.pageSubtitle} style={{ color: "red" }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.jobsAppliedPage}>
      <div className={styles.jobsAppliedContainer}>
        <div className={styles.pageHeader}>
          <h2>Your Job Applications</h2>
          <p className={styles.pageSubtitle}>Track your application progress and interview schedules</p>
        </div>

        {appliedJobs.length === 0 ? (
          <div className={styles.noJobsCard}>
            <div className={styles.noJobsIcon}>
              <Briefcase size={48} />
            </div>
            <h3>No Applications Yet</h3>
            <p>You haven't applied to any jobs yet. Start exploring opportunities!</p>
          </div>
        ) : (
          <div className={styles.jobsGrid}>
            {appliedJobs.map((job) => (
              <div key={job.application_id} className={styles.jobCard}>
                <div
                  className={styles.jobHeader}
                  onClick={() => toggleJobDetails(job.application_id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") toggleJobDetails(job.application_id);
                  }}
                  aria-expanded={expandedJobIds.has(job.application_id)}
                >
                  <div className={styles.jobMainInfo}>
                    <div className={styles.jobTitleSection}>
                      <h3 className={styles.jobTitle}>{job.title}</h3>
                      <div className={styles.jobMeta}>
                        <span className={styles.jobTypeBadge}>
                          <Clock size={12} />
                          {job.job_type}
                        </span>
                        <span className={styles.jobCategoryBadge}>
                          <MapPin size={12} />
                          {job.job_category}
                        </span>
                        <span className={`${styles.jobStatusBadge} ${getStatusColor(job.application_status)}`}>
                          {getStatusIcon(job.application_status)}
                          {job.application_status}
                        </span>
                      </div>
                    </div>
                    
                    <div className={styles.jobDates}>
                      <div className={styles.dateInfo}>
                        <Calendar size={14} />
                        <span>Applied: {formatDate(job.applied_date)}</span>
                      </div>
                      <div className={`${styles.dateInfo} ${styles.interviewDate}`}>
                        <Users size={14} />
                        <span>Interview: {formatInterviewDate(job.interview_date)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.expandIndicator}>
                    {expandedJobIds.has(job.application_id) ? 
                      <ChevronUp size={20} /> : 
                      <ChevronDown size={20} />
                    }
                  </div>
                </div>

                {expandedJobIds.has(job.application_id) && (
                  <div className={styles.jobDetails}>
                    <div className={styles.detailsSection}>
                      <h4 className={styles.sectionTitle}>
                        <Briefcase size={16} />
                        Job Responsibilities
                      </h4>
                      <div 
                        className={styles.sectionContent}
                        dangerouslySetInnerHTML={{ __html: job.job_responsibilities || "No responsibilities listed" }} 
                      />
                    </div>

                    <div className={styles.detailsSection}>
                      <h4 className={styles.sectionTitle}>
                        <Users size={16} />
                        Job Requirements
                      </h4>
                      <div 
                        className={styles.sectionContent}
                        dangerouslySetInnerHTML={{ __html: job.job_requirements || "No requirements listed" }} 
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