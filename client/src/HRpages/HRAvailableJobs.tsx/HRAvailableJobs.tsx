import { useState, useEffect } from "react";
import styles from "./HRAvailableJobs.module.css";
import { Search, Plus, Edit, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TiptapEditor from "../../components/TiptapEditor/TiptapEditor";

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
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    jobTitle: "",
    jobCategory: "",
    jobType: "",
    hiringStatus: "",
    jobRequirements: "",
    jobResponsibilities: "",
    seekersRequired: ""
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteJob = async () => {
    if (!editingJob) return;

    setIsDeleting(true);

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/jobs/${editingJob.job_id}`
      );

      if (response.data.success) {
        // Remove the deleted job from the jobs list
        const updatedJobs = jobs.filter(job => job.job_id !== editingJob.job_id);
        setJobs(updatedJobs);
        setFilteredJobs(updatedJobs);
        setShowDeleteConfirm(false);
        closeEditModal();
        alert("Job deleted successfully!");
      } else {
        alert(response.data.message || "Failed to delete job");
      }
    } catch (error: any) {
      console.error("Failed to delete job:", error);
      alert("Failed to delete job. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeleteJob = () => {
    setShowDeleteConfirm(true);
  };

  const cancelDeleteJob = () => {
    setShowDeleteConfirm(false);
  };

  const handleViewJob = (job: any) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  const closeJobModal = () => {
    setSelectedJob(null);
    setShowJobModal(false);
  };

  const handleEditJob = (job: any) => {
    setEditingJob(job);
    setEditFormData({
      jobTitle: job.title || "",
      jobCategory: job.job_category || "",
      jobType: job.job_type || "",
      hiringStatus: job.hiring_status || "",
      jobRequirements: job.job_requirements || "",
      jobResponsibilities: job.job_responsibilities || "",
      seekersRequired: job.seekers_required?.toString() || ""
    });
    setShowEditModal(true);
    closeJobModal(); // Close view modal if open
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingJob(null);
    setEditFormData({
      jobTitle: "",
      jobCategory: "",
      jobType: "",
      hiringStatus: "",
      jobRequirements: "",
      jobResponsibilities: "",
      seekersRequired: ""
    });
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateJob = async () => {
    if (!editingJob) return;

    // Validation
    if (!editFormData.jobTitle.trim()) {
      alert("Please enter a job title");
      return;
    }
    if (!editFormData.jobCategory) {
      alert("Please select a job category");
      return;
    }
    if (!editFormData.jobType) {
      alert("Please select a job type");
      return;
    }
    if (!editFormData.hiringStatus) {
      alert("Please select a hiring status");
      return;
    }
    if (!editFormData.seekersRequired || parseInt(editFormData.seekersRequired) < 1) {
      alert("Please enter a valid number of seekers required");
      return;
    }

    setIsUpdating(true);

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/jobs/${editingJob.job_id}`,
        {
          job_id: editingJob.job_id,
          jobTitle: editFormData.jobTitle.trim(),
          jobCategory: editFormData.jobCategory,
          jobType: editFormData.jobType,
          hiringStatus: editFormData.hiringStatus,
          jobRequirements: editFormData.jobRequirements,
          jobResponsibilities: editFormData.jobResponsibilities,
          seekersRequired: parseInt(editFormData.seekersRequired)
        }
      );

      if (response.data.success) {
        // Update the jobs list with the edited job
        const updatedJobs = jobs.map(job => 
          job.job_id === editingJob.job_id 
            ? {
                ...job,
                title: editFormData.jobTitle.trim(),
                job_category: editFormData.jobCategory,
                job_type: editFormData.jobType,
                hiring_status: editFormData.hiringStatus,
                job_requirements: editFormData.jobRequirements,
                job_responsibilities: editFormData.jobResponsibilities,
                seekers_required: parseInt(editFormData.seekersRequired)
              }
            : job
        );
        
        setJobs(updatedJobs);
        setFilteredJobs(updatedJobs);
        closeEditModal();
        alert("Job updated successfully!");
      } else {
        alert(response.data.message || "Failed to update job");
      }
    } catch (error: any) {
      console.error("Failed to update job:", error);
      alert("Failed to update job. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };



  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/jobs`);
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
                <span className={styles.totalCount}>
                  {filteredJobs.length} of {jobs.length} Jobs

                  {filtersApplied && <span className={styles.filteredIndicator}> (Filtered)</span>}
                </span>
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
                          <button 
                            className={styles.actionBtn} 
                            title="Edit Job"
                            onClick={() => handleEditJob(job)}
                          >
                            <Edit size={14} />
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
              {isFilterExpanded ? '▶' : '◀'}
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
                <button 
                  className={styles.editJobBtn}
                  onClick={() => handleEditJob(selectedJob)}
                >
                  <Edit size={16} />
                  Edit Job
                </button>
                <button className={styles.closeModalBtn} onClick={closeJobModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingJob && (
        <div className={styles.modalOverlay}>
          <div className={styles.editModal}>
            {/* Edit Modal Header */}
            <div className={styles.editModalHeader}>
              <div className={styles.editModalTitleSection}>
                <h2 className={styles.editModalTitle}>✏️ Edit Job</h2>
                <p className={styles.editModalSubtitle}>Update job information</p>
              </div>
              <button className={styles.modalCloseBtn} onClick={closeEditModal}>
                ×
              </button>
            </div>

            {/* Edit Modal Content */}
            <div className={styles.editModalContent}>
              {/* Job Title */}
              <div className={styles.editFormGroup}>
                <label className={styles.editFormLabel}>
                  Job Title <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.editFormInput}
                  value={editFormData.jobTitle}
                  onChange={(e) => handleEditInputChange("jobTitle", e.target.value)}
                  placeholder="Enter job title"
                />
              </div>

              {/* Job Category and Type Row */}
              <div className={styles.editFormRow}>
                <div className={styles.editFormGroup}>
                  <label className={styles.editFormLabel}>
                    Job Category <span className={styles.required}>*</span>
                  </label>
                  <select
                    className={styles.editFormSelect}
                    value={editFormData.jobCategory}
                    onChange={(e) => handleEditInputChange("jobCategory", e.target.value)}
                  >
                    <option value="">Select Category</option>
                    <option value="operative">Operative</option>
                    <option value="academic">Academic</option>
                  </select>
                </div>

                <div className={styles.editFormGroup}>
                  <label className={styles.editFormLabel}>
                    Job Type <span className={styles.required}>*</span>
                  </label>
                  <select
                    className={styles.editFormSelect}
                    value={editFormData.jobType}
                    onChange={(e) => handleEditInputChange("jobType", e.target.value)}
                  >
                    <option value="">Select Type</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
              </div>

              {/* Hiring Status and Seekers Required Row */}
              <div className={styles.editFormRow}>
                <div className={styles.editFormGroup}>
                  <label className={styles.editFormLabel}>
                    Hiring Status <span className={styles.required}>*</span>
                  </label>
                  <select
                    className={styles.editFormSelect}
                    value={editFormData.hiringStatus}
                    onChange={(e) => handleEditInputChange("hiringStatus", e.target.value)}
                  >
                    <option value="">Select Status</option>
                    <option value="Hiring">Hiring</option>
                    <option value="Not Hiring">Not Hiring</option>
                  </select>
                </div>

                <div className={styles.editFormGroup}>
                  <label className={styles.editFormLabel}>
                    Seekers Required <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    className={styles.editFormInput}
                    value={editFormData.seekersRequired}
                    onChange={(e) => handleEditInputChange("seekersRequired", e.target.value)}
                    placeholder="Number of positions"
                  />
                </div>
              </div>

              {/* Job Responsibilities */}
              <div className={styles.editFormGroup}>
                <label className={styles.editFormLabel}>Job Responsibilities</label>
                <TiptapEditor
                  content={editFormData.jobResponsibilities}
                  onChange={(content) => handleEditInputChange("jobResponsibilities", content)}
                  placeholder="Enter job responsibilities..."
                />
              </div>

              {/* Job Requirements */}
              <div className={styles.editFormGroup}>
                <label className={styles.editFormLabel}>Job Requirements</label>
                <TiptapEditor
                  content={editFormData.jobRequirements}
                  onChange={(content) => handleEditInputChange("jobRequirements", content)}
                  placeholder="Enter job requirements..."
                />
              </div>
            </div>

            {/* Edit Modal Footer */}
            <div className={styles.editModalFooter}>
              <div className={styles.editModalActions}>
                <button 
                  className={styles.saveEditBtn}
                  onClick={handleUpdateJob}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Updating..." : "Update Job"}
                </button>

                <button 
                  className={styles.deleteJobBtn}
                  onClick={confirmDeleteJob}
                  disabled={isUpdating || isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Job"}
                </button>

                <button 
                  className={styles.cancelEditBtn}
                  onClick={closeEditModal}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className={styles.deleteConfirmOverlay}>
                <div className={styles.deleteConfirmModal}>
                  <div className={styles.deleteConfirmHeader}>
                    <h3>🗑️ Confirm Job Deletion</h3>
                  </div>
                  <div className={styles.deleteConfirmContent}>
                    <p>Are you sure you want to delete this job?</p>
                    <div className={styles.deleteJobDetails}>
                      <strong>Job Title:</strong> {editingJob?.title}<br/>
                      <strong>Category:</strong> {editingJob?.job_category}<br/>
                      <strong>Type:</strong> {editingJob?.job_type}
                    </div>
                    <div className={styles.deleteWarning}>
                      ⚠️ This action cannot be undone. All associated data will be permanently removed.
                    </div>
                  </div>
                  <div className={styles.deleteConfirmActions}>
                    <button 
                      className={styles.confirmDeleteBtn}
                      onClick={handleDeleteJob}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Yes, Delete Job"}
                    </button>
                    <button 
                      className={styles.cancelDeleteBtn}
                      onClick={cancelDeleteJob}
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HRAvailableJobs;