import { useState, useEffect } from "react";
import styles from "./ManagerAvailableJobs.module.css";
import { Plus, Eye } from "lucide-react";
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

// Add this function before the return statement
const formatJobContent = (content: string) => {
  if (!content) return null;
  
  // Remove empty paragraphs and clean up the content
  const cleanContent = content
    .replace(/<p><br><\/p>/g, '') // Remove empty paragraphs with br
    .replace(/<p><\/p>/g, '') // Remove completely empty paragraphs
    .replace(/<p>\s*<\/p>/g, '') // Remove paragraphs with only whitespace
    .trim();
  
  if (!cleanContent || cleanContent === '<p></p>') {
    return null;
  }
  
  return cleanContent;
};

const HRAvailableJobs: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedHiringStatuses, setSelectedHiringStatuses] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);


  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showJobModal, setShowJobModal] = useState(false);

  const handleViewJob = (job: any) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  const closeJobModal = () => {
    setSelectedJob(null);
    setShowJobModal(false);
  };



  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/jobs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setJobs(response.data.data);
          setFilteredJobs(response.data.data);
        } else {
          console.error("Failed to fetch jobs:", response.data.message);
        }
      } catch (err) {
        console.error("Error fetching jobs:", err);
      }
    };

    fetchJobs();
  }, []);

  const applyFilters = () => {
    let filtered = [...jobs];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(job => {
        // Direct match since database values are "Operative" and "Academic"
        return selectedCategories.includes(job.job_category);
      });
    }

    // Hiring status filter
    if (selectedHiringStatuses.length > 0) {
      filtered = filtered.filter(job => {
        const statusMap: { [key: string]: string[] } = {
          "Hiring Now": ["Hiring", "Hiring Now"],
          "Not Hiring": ["Not Hiring", "Closed"]
        };
        
        return selectedHiringStatuses.some(status =>
          statusMap[status]?.includes(job.hiring_status) ||
          job.hiring_status === status
        );
      });
    }

    // Job type filter
    if (selectedJobTypes.length > 0) {
      filtered = filtered.filter(job =>
        selectedJobTypes.includes(job.job_type)
      );
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(job => {
        const jobDate = new Date(job.posting_date);
        const fromDate = new Date(dateFrom);
        return jobDate >= fromDate;
      });
    }

    if (dateTo) {
      filtered = filtered.filter(job => {
        const jobDate = new Date(job.posting_date);
        const toDate = new Date(dateTo);
        return jobDate <= toDate;
      });
    }

    setFilteredJobs(filtered);
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedHiringStatuses([]);
    setSelectedJobTypes([]);
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
    setFilteredJobs(jobs); // Reset to show all jobs
    setFiltersApplied(false);
  };

  const handleApplyFilters = () => {
    applyFilters();
    const hasActiveFilters = selectedCategories.length > 0 || 
                          selectedHiringStatuses.length > 0 || 
                          selectedJobTypes.length > 0 || 
                          !!dateFrom || 
                          !!dateTo || 
                          !!searchQuery.trim();
    setFiltersApplied(Boolean(hasActiveFilters));
  };

  const toggleSelection = (item: string, list: string[], setList: (val: string[]) => void) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
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
                <span className={styles.totalCount}>
                  {filteredJobs.length} of {jobs.length} Jobs

                  {filtersApplied && <span className={styles.filteredIndicator}> (Filtered)</span>}
                </span>
                <button className={styles.addJobBtn} onClick={() => navigate("/manager/new-job")}>
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
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.noResults}>
                      {jobs.length === 0 ? "No jobs available" : "No jobs match your filter criteria"}
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job, index) => (
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
                          <button 
                            className={styles.actionBtn} 
                            title="View Details"
                            onClick={() => handleViewJob(job)}
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
                    className={`${styles.filterBtn} ${styles.compact} ${selectedCategories.includes("operative") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("operative", selectedCategories, setSelectedCategories)
                    }
                  >
                    Operative
                  </button>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedCategories.includes("academic") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("academic", selectedCategories, setSelectedCategories)
                    }
                  >
                    Academic
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
                    className={`${styles.filterBtn} ${styles.compact} ${selectedJobTypes.includes("Full-Time") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Full-Time", selectedJobTypes, setSelectedJobTypes)
                    }
                  >
                    Full-Time
                  </button>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedJobTypes.includes("Part-Time") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Part-Time", selectedJobTypes, setSelectedJobTypes)
                    }
                  >
                    Part-Time
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

              <div className={styles.filterActions}>
                <button 
                  className={`${styles.applyFilterBtn} ${styles.compact}`}
                  onClick={handleApplyFilters}
                >
                  Apply Filter
                </button>
                <button 
                  className={`${styles.resetFilterBtn} ${styles.compact}`}
                  onClick={clearAllFilters}
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add this modal before the closing </div> of jobsContainer */}
      {showJobModal && selectedJob && (
        <div className={styles.modalOverlay}>
          <div className={styles.jobModal}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleSection}>
                <h2 className={styles.modalTitle}>{selectedJob.title}</h2>
                <div className={styles.modalSubInfo}>
                  <span className={styles.modalCategory}>
                    {selectedJob.job_category === "academic" ? "Academic" : 
                    selectedJob.job_category === "operative" ? "Operative" : 
                    selectedJob.job_category}
                  </span>
                  <span className={styles.modalDivider}>•</span>
                  <span className={styles.modalType}>{selectedJob.job_type}</span>
                  <span className={styles.modalDivider}>•</span>
                  <span className={`${styles.modalStatus} ${selectedJob.hiring_status === "Hiring" ? styles.hiring : styles.notHiring}`}>
                    {selectedJob.hiring_status === "Hiring" ? "🟢 Hiring" : "🔴 Not Hiring"}
                  </span>
                </div>
              </div>
              <button className={styles.modalCloseBtn} onClick={closeJobModal}>
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className={styles.modalContent}>
              {/* Job Overview */}
              <div className={styles.modalSection}>
                <div className={styles.sectionHeader}>
                  <h3>📋 Job Overview</h3>
                </div>
                <div className={styles.overviewGrid}>
                  <div className={styles.overviewItem}>
                    <span className={styles.overviewLabel}>Date Posted:</span>
                    <span className={styles.overviewValue}>{formatDate(selectedJob.posting_date)}</span>
                  </div>
                  <div className={styles.overviewItem}>
                    <span className={styles.overviewLabel}>Positions Required:</span>
                    <span className={styles.overviewValue}>{selectedJob.seekers_required}</span>
                  </div>
                  <div className={styles.overviewItem}>
                    <span className={styles.overviewLabel}>Current Applicants:</span>
                    <span className={styles.overviewValue}>{selectedJob.applicants_now || 0}</span>
                  </div>
                  <div className={styles.overviewItem}>
                    <span className={styles.overviewLabel}>Job Category:</span>
                    <span className={styles.overviewValue}>
                      {selectedJob.job_category === "academic" ? "Academic" : 
                      selectedJob.job_category === "operative" ? "Operative" : 
                      selectedJob.job_category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Job Responsibilities */}
              <div className={styles.modalSection}>
                <div className={styles.sectionHeader}>
                  <h3>💼 Job Responsibilities</h3>
                </div>
                <div className={styles.sectionContent}>
                  <div className={styles.contentBox}>
                    {formatJobContent(selectedJob.job_responsibilities) ? (
                      <div 
                        className={styles.formattedText}
                        dangerouslySetInnerHTML={{ __html: formatJobContent(selectedJob.job_responsibilities) || "" }}
                      />
                    ) : (
                      <p className={styles.noContent}>No job responsibilities specified.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Job Requirements */}
              <div className={styles.modalSection}>
                <div className={styles.sectionHeader}>
                  <h3>🎯 Job Requirements</h3>
                </div>
                <div className={styles.sectionContent}>
                  <div className={styles.contentBox}>
                    {formatJobContent(selectedJob.job_requirements) ? (
                      <div 
                        className={styles.formattedText}
                        dangerouslySetInnerHTML={{ __html: formatJobContent(selectedJob.job_requirements) || "" }}
                      />
                    ) : (
                      <p className={styles.noContent}>No job requirements specified.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              <div className={styles.modalActions}>
                <button className={styles.closeModalBtn} onClick={closeJobModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRAvailableJobs;