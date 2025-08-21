/**
 * Home Page (Dashboard)
 *
 * This component serves as the main dashboard for applicants after login.
 *
 * Features:
 * - Displays overall profile completeness as a percentage.
 * - Shows the number of jobs applied and available jobs.
 * - Notifies the user of any upcoming interviews.
 * - Provides navigation to profile, jobs applied, and available jobs pages.
 * - Fetches and tracks completion status for all profile sections.
 * - Fetches available jobs and applied jobs from the backend.
 * - Responsive and visually organized dashboard cards.
 *
 * Usage:
 * - Used as the landing page after applicant login: `/home`
 *
 * State:
 * - personalParticularsCompleted, educationCompleted, workCompleted, familyCompleted, supportCompleted: Section completion flags.
 * - availableJobsCount: Number of jobs currently open for application.
 * - appliedJobs: List of jobs the user has applied for.
 * - interviewJob: The next scheduled interview (if any).
 *
 * Dependencies:
 * - axios for HTTP requests.
 * - react-router-dom for navigation.
 * - lucide-react for icons.
 * - Home.module.css for styling.
 *
 * @component
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Briefcase, ArrowRight, Info, Target } from "lucide-react";
import styles from "./Home.module.css";
import axios from "axios";

// Number of tables/sections required for profile completeness
const TOTAL_SECTIONS = 11;

// Mapping of section names to their table counts
const SECTION_TABLES = {
  personal: 4,
  education: 1,
  work: 2,
  family: 2,
  support: 2,
};

const Home: React.FC = () => {
  const navigate = useNavigate();

  // Section completion states
  const [personalParticularsCompleted, setPersonalParticularsCompleted] = useState(false);
  const [educationCompleted, setEducationCompleted] = useState(false);
  const [workCompleted, setWorkCompleted] = useState(false);
  const [familyCompleted, setFamilyCompleted] = useState(false);
  const [supportCompleted, setSupportCompleted] = useState(false);

  // Jobs and interview states
  const [availableJobsCount, setAvailableJobsCount] = useState<number>(0);
  const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
  const [interviewJob, setInterviewJob] = useState<{ job: string; interview_date: string } | null>(null);

  /**
   * Fetch profile completeness for all sections.
   * Updates section completion states.
   */
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

    // Listen for profile completeness updates
    const handler = () => fetchCompleteness();
    window.addEventListener("profile-completeness-updated", handler);
    return () => window.removeEventListener("profile-completeness-updated", handler);
  }, []);

  /**
   * Fetch the number of available jobs (with "Hiring" status).
   */
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/jobs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const hiringJobs = res.data.data.filter((job: any) => job.hiring_status === "Hiring");
          setAvailableJobsCount(hiringJobs.length);
        }
      } catch (e) {
        setAvailableJobsCount(0);
      }
    };
    fetchJobs();
  }, []);

  /**
   * Fetch applied jobs and check for any scheduled interviews.
   */
  useEffect(() => {
    const fetchAppliedJobs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/applied-jobs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setAppliedJobs(res.data.data);
          // Find the first job with Interview Scheduled
          const interview = res.data.data.find((job: any) => job.application_status === "Interview Scheduled");
          if (interview) {
            setInterviewJob({
              job: interview.title,
              interview_date: interview.interview_date
            });
          } else {
            setInterviewJob(null);
          }
        }
      } catch (e) {
        setAppliedJobs([]);
        setInterviewJob(null);
      }
    };
    fetchAppliedJobs();
  }, []);

  // Calculate completed tables for profile completeness
  const completedTables =
    (personalParticularsCompleted ? SECTION_TABLES.personal : 0) +
    (educationCompleted ? SECTION_TABLES.education : 0) +
    (workCompleted ? SECTION_TABLES.work : 0) +
    (familyCompleted ? SECTION_TABLES.family : 0) +
    (supportCompleted ? SECTION_TABLES.support : 0);

  // Calculate overall profile completeness percentage
  const progressPercent = Math.floor((completedTables / TOTAL_SECTIONS) * 100);

  return (
    <div className={styles.homeContent}>
      <div className={styles.homeContainer}>

        {/* Dashboard Cards Grid */}
        <div className={styles.dashboardGrid}>
          {/* Profile Status Card */}
          <div
            className={`${styles.dashboardCard} ${styles.profileCard}`}
            onClick={() => navigate("/profile/personal-particulars")}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <User size={24} />
              </div>
              <div className={styles.cardTitleSection}>
                <h3 className={styles.cardTitle}>Profile Status</h3>
                <span className={styles.cardSubtitle}>Update your information</span>
              </div>
              <div className={styles.cardAction}>
                <ArrowRight size={20} />
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.metricDisplay}>
                <span className={styles.metricValue}>
                  {progressPercent}%
                </span>
                <span className={styles.metricLabel}>Overall completeness</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressPercent}%` }}>
                </div>
              </div>
            </div>
          </div>

          {/* Jobs Applied Card */}
          <div
            className={`${styles.dashboardCard} ${styles.jobsCard}`}
            onClick={() => navigate("/jobs-applied")}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <Briefcase size={24} />
              </div>
              <div className={styles.cardTitleSection}>
                <h3 className={styles.cardTitle}>Jobs Applied</h3>
                <span className={styles.cardSubtitle}>Track your applications</span>
              </div>
              <div className={styles.cardAction}>
                <ArrowRight size={20} />
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.metricDisplay}>
                <span className={styles.metricValue}>{appliedJobs.length}</span>
                <span className={styles.metricLabel}>Number of Jobs Applied</span>
              </div>
              <div className={styles.statusBadge}>
                <Target size={16} />
                Active Applications
              </div>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <div className={styles.infoHeader}>
              <Info size={24} className={styles.infoIcon} />
              <h3 className={styles.infoTitle}>Important Information</h3>
            </div>
            <div className={styles.infoContent}>
              {/* Profile completeness info */}
              <div className={styles.infoItem}>
                <div className={styles.infoNumber}>1</div>
                <p>
                  {completedTables === TOTAL_SECTIONS
                    ? "Your Profile Status is complete. You may now apply for jobs."
                    : "Your Profile Status is incomplete. Please complete your profile before you apply for any job."}
                </p>
              </div>
              {/* Available jobs info */}
              <div className={styles.infoItem}>
                <div className={styles.infoNumber}>2</div>
                <p>
                  There are <strong>{availableJobsCount} jobs</strong> available now.
                </p>
              </div>
              {/* Interview info */}
              <div className={styles.infoItem}>
                <div className={styles.infoNumber}>3</div>
                <p>
                  {interviewJob
                    ? (
                      <>
                        You have an interview scheduled for <strong>{interviewJob.job}</strong> on <strong>{interviewJob.interview_date ? new Date(interviewJob.interview_date).toLocaleDateString() : "TBA"}</strong>.
                      </>
                    )
                    : "You have no upcoming interviews scheduled."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className={styles.ctaSection}>
          <button
            className={styles.applyNowButton}
            onClick={() => navigate("/available-jobs")}
          >
            <Briefcase size={20} />
            Apply Now
            <ArrowRight size={20} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Home;