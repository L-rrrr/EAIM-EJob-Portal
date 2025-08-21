/**
 * AvailableJobs Page
 *
 * This component displays all available jobs for applicants to view, search, apply, and bookmark.
 *
 * Features:
 * - Fetches and displays jobs from the backend, filtered by "Hiring" status.
 * - Separates jobs into "Academic/ Teaching Roles" and "Operation/ Management Roles".
 * - Allows users to search jobs by title.
 * - Expands/collapses job details (responsibilities and requirements).
 * - Allows users to bookmark jobs (with backend check for duplicates).
 * - Prevents applying to the same job more than once.
 * - Shows which jobs the user has already applied for.
 *
 * Usage:
 * - Used as a route page: `/available-jobs`
 *
 * State:
 * - jobs: List of all jobs fetched from the backend.
 * - expandedJobIds: Set of job titles currently expanded for details.
 * - inputTerm: The current value in the search input.
 * - searchTerm: The debounced or actual search term used for filtering.
 * - appliedJobIds: Set of job IDs the user has already applied for.
 *
 * Dependencies:
 * - axios for HTTP requests.
 * - react-router-dom for navigation.
 * - lucide-react for icons.
 * - AvailableJobs.module.css for styling.
 *
 * @component
 */

import { useEffect, useState } from "react";
import axios from "axios";
import { Bookmark, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./AvailableJobs.module.css";

// Job type definition for job objects
type Job = {
  job_id: number;
  title: string;
  job_category: string;
  job_type: string;
  hiring_status?: "Hiring" | "Not Hiring";
  job_responsibilities: string;
  job_requirements: string;
};

/**
 * JobSection Component
 * Renders a column of jobs for a given category, with expand/collapse, apply, and bookmark actions.
 */
const JobSection: React.FC<{
  title: string;
  jobs: Job[];
  expandedJobIds: Set<string>;
  onToggleJob: (id: string) => void;
  searchTerm: string;
  onBookMark: (job: Job) => void;
  appliedJobIds: Set<number>;
}> = ({ title, jobs, expandedJobIds, onToggleJob, searchTerm, onBookMark, appliedJobIds }) => {
  const navigate = useNavigate();

  // Filter jobs by search term (case-insensitive match on title)
  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.jobColumn}>
      <h2>{title}</h2>
      {filteredJobs.map(job => (
        <div key={job.job_id} className={styles.jobItem}>
          {/* Job header: click to expand/collapse details */}
          <div
            className={styles.jobHeader}
            onClick={() => onToggleJob(job.title)}
            tabIndex={0}
            role="button"
            aria-expanded={expandedJobIds.has(job.title)}
          >
            <span>{job.title}</span>
            <div className={styles.jobActions}>
              <span className={styles.jobType}>{job.job_type}</span>
              {/* Bookmark icon: click to bookmark job */}
              <Bookmark 
                className={styles.bookmarkIcon}
                onClick={e => {
                  e.stopPropagation();
                  onBookMark(job);
                }}
              />
              {/* Apply button: disables if already applied */}
              <button
                className={styles.applyButton}
                onClick={e => {
                  e.stopPropagation();
                  if (appliedJobIds.has(job.job_id)) {
                    alert("You have already applied for this job.");
                  } else {
                    navigate("/apply", { 
                      state: { 
                        jobData: {
                          job_id: job.job_id,
                          title: job.title,
                          job_type: job.job_type,
                          job_category: job.job_category
                        }
                      }
                    });
                  }
                }}
              >
                Apply
              </button>
            </div>
          </div>
          {/* Expanded job details */}
          {expandedJobIds.has(job.title) && (
            <div className={styles.jobDetails}>
              <strong>Responsibilities:</strong>
              <div dangerouslySetInnerHTML={{ __html: job.job_responsibilities }} />
              <strong>Requirements:</strong>
              <div dangerouslySetInnerHTML={{ __html: job.job_requirements }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Main AvailableJobs Page Component
 */
const AvailableJobs: React.FC = () => {
  // State for all jobs fetched from backend
  const [jobs, setJobs] = useState<Job[]>([]);
  // State for expanded job titles (for showing details)
  const [expandedJobIds, setExpandedJobIds] = useState<Set<string>>(new Set());
  // State for search input and search term
  const [inputTerm, setInputTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // State for job IDs the user has already applied for
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());

  // Fetch jobs and applied jobs on mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/jobs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          // Only show jobs with "Hiring" status
          setJobs(res.data.data.filter((job: Job) => job.hiring_status === "Hiring"));
        }
      } catch (error) {
        console.error("Failed to fetch jobs", error);
      }
    };

    const fetchAppliedJobs = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/applied-jobs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setAppliedJobIds(new Set(res.data.data.map((job: { job_id: number }) => job.job_id)));
        }
      } catch (error) {
        console.error("Failed to fetch applied jobs", error);
      }
    };

    fetchJobs();
    fetchAppliedJobs();
  }, []);

  // Toggle expand/collapse for a job
  const handleToggleJob = (id: string) => {
    setExpandedJobIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // Handle bookmarking a job
  const handleBookmark = async (job: Job) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/post-bookmarks`,
        {
          job_id: job.job_id,
          title: job.title,
          jobCategory: job.job_category,
          jobType: job.job_type,
          hiringStatus: job.hiring_status,
          jobRequirements: job.job_requirements,
          jobResponsibilities: job.job_responsibilities,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      alert(res.data.message || "Job bookmarked successfully!");
    } catch (error: any) {
      if (error.response && error.response.status === 400 && error.response.data?.message === "This job is already bookmarked.") {
        alert("This job has already been bookmarked.");
      } else {
        console.error("Bookmark failed:", error);
        alert("Failed to bookmark job.");
      }
    }
  };

  // Split jobs into academic and operation categories
  const academicJobs = jobs.filter(job => job.job_category === "academic");
  const operationJobs = jobs.filter(job => job.job_category === "operative");

  return (
    <div className={styles.availableJobsPage}>
      {/* Search bar for filtering jobs by title */}
      <div className={styles.searchBar}>
        <Search className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search jobs..."
          value={inputTerm}
          onChange={e => {
            setInputTerm(e.target.value);
            setSearchTerm(e.target.value);
          }}
        />
      </div>

      {/* Job sections for each category */}
      <div className={styles.jobsContainer}>
        <JobSection
          title="Academic/ Teaching Roles"
          jobs={academicJobs}
          expandedJobIds={expandedJobIds}
          onToggleJob={handleToggleJob}
          searchTerm={searchTerm}
          onBookMark={handleBookmark}
          appliedJobIds={appliedJobIds}
        />
        <JobSection
          title="Operation/ Management Roles"
          jobs={operationJobs}
          expandedJobIds={expandedJobIds}
          onToggleJob={handleToggleJob}
          searchTerm={searchTerm}
          onBookMark={handleBookmark}
          appliedJobIds={appliedJobIds}
        />
      </div>
    </div>
  );
};

export default AvailableJobs;