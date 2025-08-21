/**
 * HRApply Page
 *
 * This component displays a summary of a specific job application for HR review, including job information,
 * document attachment, and position details.
 *
 * Features:
 * - Fetches application details from the backend using the applicationId from the URL.
 * - Displays job information, document attachment (with download link), and position details in read-only format.
 * - Handles loading and not-found states.
 * - Provides navigation to all applicants and to the next section of the applicant's details.
 *
 * Usage:
 * - Used as a route page: `/hr/apply?applicationId=...`
 *
 * State:
 * - application: Application details object.
 * - loading: Loading state for data fetch.
 *
 * Dependencies:
 * - axios for HTTP requests.
 * - react-router-dom for navigation and query params.
 * - HRApply.module.css for styling.
 *
 * @component
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./HRApply.module.css";
import axios from "axios";

const HRApply: React.FC = () => {
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/application/${applicationId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setApplication(res.data.data || null);
      } catch (e) {
        setApplication(null);
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, [applicationId]);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!application) return <div className={styles.notFound}>Application not found.</div>;

  // Extract file info
  const fileName = application.file_name;
  const filePath = application.file_path;
  const serverFileName = filePath ? filePath.split(/[/\\]/).pop() : "";

  return (
    <div className={styles.mainPanel}>
      <div className={styles.formWrapper}>
        <div className={styles.formContainer}>
          <h2 className={styles.sectionTitle}>Job Information</h2>
          <div className={styles.formSection}>
            <div className={styles.inputGroup}>
              <span className={styles.labelText}>Position Type</span>
              <div className={styles.jobInfoDisplay}>{application.job_type}</div>
            </div>
            <div className={styles.inputGroup}>
              <span className={styles.labelText}>Position</span>
              <div className={styles.jobInfoDisplay}>{application.title}</div>
            </div>
          </div>
        </div>

        <div className={styles.formContainer}>
          <h2 className={styles.sectionTitle}>Document Attachment</h2>
          <div className={styles.formSection}>
            <div className={styles.inputGroup}>
              <span className={styles.labelText}>Document Type</span>
              <div className={styles.jobInfoDisplay}>{application.document_type}</div>
            </div>
            <div className={styles.inputGroup}>
              <span className={styles.labelText}>Document Name</span>
              <div className={styles.jobInfoDisplay}>{application.document_name}</div>
            </div>
            <div className={styles.inputGroup}>
              <span className={styles.labelText}>Uploaded File</span>
              <div className={styles.jobInfoDisplay}>
                {fileName && serverFileName ? (
                  <a
                    href={`${import.meta.env.VITE_BACKEND_URL.replace(/\/api$/, "")}/uploads/${serverFileName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {fileName}
                  </a>
                ) : "—"}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.formContainer}>
          <h2 className={styles.sectionTitle}>Position Details</h2>
          <div className={styles.formSection}>
            <div className={styles.inputGroup}>
              <span className={styles.labelText}>Current Salary (S$)</span>
              <div className={styles.jobInfoDisplay}>{application.current_salary ?? "—"}</div>
            </div>
            <div className={styles.inputGroup}>
              <span className={styles.labelText}>Expected Salary (S$)</span>
              <div className={styles.jobInfoDisplay}>{application.expected_salary ?? "—"}</div>
            </div>
            <div className={styles.inputGroup}>
              <span className={styles.labelText}>Earliest Starting Date</span>
              <div className={styles.jobInfoDisplay}>{application.earliest_start_date ?? "—"}</div>
            </div>
            <div className={styles.inputGroup}>
              <span className={styles.labelText}>Source Obtained From</span>
              <div className={styles.jobInfoDisplay}>{application.source_obtained_from ?? "—"}</div>
            </div>
            <div className={styles.inputGroup}>
              <span className={styles.labelText}>Total Work Experience (Years)</span>
              <div className={styles.jobInfoDisplay}>{application.total_work_experience ?? "—"}</div>
            </div>
            <div className={styles.inputGroup}>
              <span className={styles.labelText}>Relevant Work Experience (Years)</span>
              <div className={styles.jobInfoDisplay}>{application.relevant_work_experience ?? "—"}</div>
            </div>
          </div>
        </div>

        <div className={styles.formButtons}>
          <button 
            className={`${styles.btn} ${styles.btnSave}`} 
            onClick={() => navigate("/hr/applicants")}
          >
            Back to All Applicants
          </button>
          <button 
            className={`${styles.btnSubmit} ${styles.submit}`} 
            onClick={() => navigate(`/hr/applicant-details/personal-particulars?applicationId=${applicationId}`)}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default HRApply;