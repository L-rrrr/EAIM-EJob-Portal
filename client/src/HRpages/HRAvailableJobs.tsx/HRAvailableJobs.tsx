import { useState, useEffect } from "react";
import styles from "./HRAvailableJobs.module.css";
import { Search, Plus, Edit, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
};

const HRAvailableJobs: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedHiringStatuses, setSelectedHiringStatuses] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter panel collapse state
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  
  // AI Analysis state
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/jobs`);
        if (response.data.success) {
          setJobs(response.data.data);
        } else {
          console.error("Failed to fetch jobs:", response.data.message);
        }
      } catch (err) {
        console.error("Error fetching jobs:", err);
      }
    };

    fetchJobs();
  }, []);

  const toggleSelection = (item: string, list: string[], setList: (val: string[]) => void) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  // AI Analysis function
  const findSuitableCandidates = async () => {
    if (!aiSearchQuery.trim()) return;
    
    setIsAnalyzing(true);
    setAiResponse("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/ai/find-candidates`,
        {
          jobTitle: aiSearchQuery,
          jobsData: jobs
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setAiResponse(response.data.data.analysis);
      } else {
        setAiResponse("Failed to find suitable candidates. Please try again.");
      }
    } catch (error: any) {
      console.error("Failed to find candidates:", error);
      
      if (error.response?.status === 401) {
        setAiResponse("Authentication failed. Please log in again.");
      } else if (error.response?.status === 402) {
        setAiResponse("OpenAI API quota exceeded. Please contact administrator.");
      } else {
        // Mock response for demonstration
        setAiResponse(`Based on your query for "${aiSearchQuery}", here are the top 3 suitable candidates:

1. **Tan Wei Ling** - 3 years experience in administration, strong organizational skills, fluent in English and Mandarin.

2. **Lim Jia Hui** - Proven office management skills, excellent communication abilities, diploma in Business Administration.

3. **Nur Aisyah** - Fresh graduate with relevant internship experience, eager to learn, strong academic background.

You can view their full profiles in the Applicants section for detailed evaluation.`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={styles.jobsContainer}>
      {/* TOP SECTION: TABLE AND FILTER SIDE BY SIDE */}
      <div className={styles.topSection}>
        {/* JOBS TABLE PANEL */}
        <div className={styles.tablePanel}>
          <div className={styles.tableHeader}>
            <h2>💼 Available Jobs</h2>
            <div className={styles.tableStats}>
              <span className={styles.totalCount}>{jobs.length} Total Jobs</span>
              <button className={styles.addJobBtn} onClick={() => navigate("/hr/post-job")}>
                <Plus size={16} />
                Post New Job
              </button>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.jobsTable}>
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Hiring Status</th>
                  <th>Job Type</th>
                  <th>Date Posted</th>
                  <th>Required</th>
                  <th>Applicants</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {jobs.map((job, index) => (
                  <tr key={index}>
                    <td>{job.title}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${job.hiring_status === "Hiring" ? styles.hiring : styles.nothiring}`}>
                        {job.hiring_status === "Hiring" ? "Hiring" : "Not Hiring"}
                      </span>
                    </td>
                    <td>{job.job_type}</td>
                    <td>{formatDate(job.posting_date)}</td>
                    <td>{job.seekers_required}</td>
                    <td>{job.applicants_now || 0}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button className={styles.actionBtn} title="View Details">
                          <Eye size={14} />
                        </button>
                        <button className={styles.actionBtn} title="Edit Job">
                          <Edit size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLLAPSIBLE FILTER PANEL */}
        <div className={`${styles.filterPanel} ${isFilterExpanded ? styles.expanded : styles.collapsed}`}>
          <div className={styles.filterHeader} onClick={() => setIsFilterExpanded(!isFilterExpanded)}>
            <h3>🔍 Filters</h3>
            <button className={styles.collapseToggle}>
              {isFilterExpanded ? '◀' : '▶'}
            </button>
          </div>
          
          {isFilterExpanded && (
            <div className={styles.filterContent}>
              {/* Search Field */}
              <div className={styles.filterGroup}>
                <label htmlFor="search-jobs">Search Jobs</label>
                <input
                  type="text"
                  id="search-jobs"
                  className={styles.customSearchInput}
                  placeholder="Enter job title"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Job Category */}
              <div className={styles.filterGroup}>
                <label>Job Category</label>
                <div className={styles.buttonGrid}>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedCategories.includes("Manager / Executive") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Manager / Executive", selectedCategories, setSelectedCategories)
                    }
                  >
                    Manager
                  </button>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedCategories.includes("Lecturer") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Lecturer", selectedCategories, setSelectedCategories)
                    }
                  >
                    Lecturer
                  </button>
                </div>
              </div>

              {/* Hiring Status */}
              <div className={styles.filterGroup}>
                <label>Hiring Status</label>
                <div className={styles.buttonGrid}>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedHiringStatuses.includes("Hiring Now") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Hiring Now", selectedHiringStatuses, setSelectedHiringStatuses)
                    }
                  >
                    Hiring
                  </button>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedHiringStatuses.includes("Not Hiring") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Not Hiring", selectedHiringStatuses, setSelectedHiringStatuses)
                    }
                  >
                    Closed
                  </button>
                </div>
              </div>

              {/* Job Type */}
              <div className={styles.filterGroup}>
                <label>Job Type</label>
                <div className={styles.buttonGrid}>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedJobTypes.includes("Full Time") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Full Time", selectedJobTypes, setSelectedJobTypes)
                    }
                  >
                    Full Time
                  </button>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedJobTypes.includes("Part Time") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Part Time", selectedJobTypes, setSelectedJobTypes)
                    }
                  >
                    Part Time
                  </button>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedJobTypes.includes("Freelance") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Freelance", selectedJobTypes, setSelectedJobTypes)
                    }
                  >
                    Freelance
                  </button>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedJobTypes.includes("Contract") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Contract", selectedJobTypes, setSelectedJobTypes)
                    }
                  >
                    Contract
                  </button>
                </div>
              </div>

              {/* Date Filters */}
              <div className={styles.filterGroup}>
                <label>Posted Date From</label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <label>Posted Date To</label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              <button className={`${styles.applyFilterBtn} ${styles.compact}`}>Apply Filter</button>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: AI CANDIDATE FINDER */}
      <div className={styles.aiFinderPanel}>
        <div className={styles.aiPanelHeader}>
          <div className={styles.aiPanelTitle}>
            <h3>🤖 AI Candidate Finder</h3>
            <p>Find suitable candidates from application history for any job position</p>
          </div>
          <div className={styles.aiSearchSection}>
            <input
              type="text"
              className={styles.aiSearchInput}
              placeholder="Enter job title to find suitable candidates..."
              value={aiSearchQuery}
              onChange={(e) => setAiSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && findSuitableCandidates()}
            />
            <button 
              className={styles.aiSearchBtn}
              onClick={findSuitableCandidates}
              disabled={isAnalyzing || !aiSearchQuery.trim()}
            >
              <Search size={16} />
              {isAnalyzing ? "Searching..." : "Find Candidates"}
            </button>
          </div>
        </div>
        
        <div className={styles.aiPanelContent}>
          {isAnalyzing ? (
            <div className={styles.aiLoading}>
              <div className={styles.loadingSpinner}></div>
              <p>Analyzing application history to find suitable candidates...</p>
            </div>
          ) : (
            <div className={styles.aiResponseArea}>
              {aiResponse ? (
                <div className={styles.aiResponse}>{aiResponse}</div>
              ) : (
                <div className={styles.aiPlaceholder}>
                  <p>💡 Enter a job title above and click "Find Candidates" to get AI-powered candidate recommendations from your application database</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className={styles.aiPanelFooter}>
          <div className={styles.aiPanelActions}>
            <button className={styles.viewApplicantsBtn} onClick={() => navigate("/hr/applicants")}>
              👥 View All Applicants
            </button>
          </div>
          <small>Powered by OpenAI API</small>
        </div>
      </div>
    </div>
  );
};

export default HRAvailableJobs;