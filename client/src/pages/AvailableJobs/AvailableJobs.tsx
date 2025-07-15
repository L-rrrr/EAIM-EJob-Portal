import { useEffect, useState } from "react";
import axios from "axios";
import { Bookmark, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./AvailableJobs.module.css";

type Job = {
  job_id: number;
  title: string;
  job_category: string;
  job_type: string;
  hiring_status?: "Hiring" | "Not Hiring"; 
  job_responsibilities: string;
  job_requirements: string;
};

const JobSection: React.FC<{
  title: string;
  jobs: Job[];
  expandedJobIds: Set<string>;
  onToggleJob: (id: string) => void;
  searchTerm: string;
  onBookMark: (job: Job) => void;
}> = ({ title, jobs, expandedJobIds, onToggleJob, searchTerm, onBookMark }) => {
  const navigate = useNavigate();

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.jobColumn}>
      <h2>{title}</h2>
      {filteredJobs.map(job => (
        <div key={job.job_id} className={styles.jobItem}>
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
              <Bookmark 
                className={styles.bookmarkIcon}
                onClick={e => {
                  e.stopPropagation();
                  onBookMark(job);
                }}
              />
              <button
                className={styles.applyButton}
                onClick={e => {
                  e.stopPropagation();
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
                }}
              >
                Apply
              </button>
            </div>
          </div>
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

const AvailableJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [expandedJobIds, setExpandedJobIds] = useState<Set<string>>(new Set());
  const [inputTerm, setInputTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/jobs`);
        if (res.data.success) {
          setJobs(res.data.data.filter((job: Job) => job.hiring_status === "Hiring"));
        }
      } catch (error) {
        console.error("Failed to fetch jobs", error);
      }
    };
    fetchJobs();
  }, []);

  
  const handleToggleJob = (id: string) => {
    setExpandedJobIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

 const handleBookmark = async (job: Job) => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/post-bookmarks`,
      {
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

  const academicJobs = jobs.filter(job => job.job_category === "academic");
  const operationJobs = jobs.filter(job => job.job_category === "operative");

  return (
    <div className={styles.availableJobsPage}>
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

      <div className={styles.jobsContainer}>
        <JobSection
          title="Academic/ Teaching Roles"
          jobs={academicJobs}
          expandedJobIds={expandedJobIds}
          onToggleJob={handleToggleJob}
          searchTerm={searchTerm}
          onBookMark={handleBookmark}
        />
        <JobSection
          title="Operation/ Management Roles"
          jobs={operationJobs}
          expandedJobIds={expandedJobIds}
          onToggleJob={handleToggleJob}
          searchTerm={searchTerm}
          onBookMark={handleBookmark}
        />
      </div>
    </div>
  );
};

export default AvailableJobs;