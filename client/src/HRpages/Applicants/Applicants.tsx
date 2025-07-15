import { useState, useEffect } from "react";
import styles from "./Applicants.module.css";
import { Link } from "react-router-dom";
import axios from "axios";
import { Eye, Mail } from "lucide-react"; 

const Applicants = () => {
  const [search, setSearch] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [interviewFrom, setInterviewFrom] = useState("");
  const [interviewTo, setInterviewTo] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [analysisLevel, setAnalysisLevel] = useState("Basic");

  // Filter panel collapse state
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  // Replace mockData with dynamic data from database
  const [applicantsData, setApplicantsData] = useState<any[]>([]);
  const [filteredApplicants, setFilteredApplicants] = useState<any[]>([]);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // AI Analysis state
  const [selectedCandidate, setSelectedCandidate] = useState<{name: string, job: string} | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch applicants data from database
  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/applicants`,
          {
            headers: { 
              Authorization: `Bearer ${token}` // Add authorization header
            }
          }
        );
        
        if (response.data.success) {
          setApplicantsData(response.data.data);
          setFilteredApplicants(response.data.data);
        } else {
          console.error("Failed to fetch applicants:", response.data.message);
          setApplicantsData([]);
          setFilteredApplicants([]);
        }
      } catch (error) {
        console.error("Error fetching applicants:", error);
        setApplicantsData([]);
        setFilteredApplicants([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicants();
  }, []);

  const openAnalysisPanel = (candidateName: string, jobTitle: string) => {
    setSelectedCandidate({ name: candidateName, job: jobTitle });
    setAiAnalysis(""); // Clear previous analysis
  };

  // Separate function for actual analysis
  const startAnalysis = async () => {
    if (!selectedCandidate) return;
    
    setIsAnalyzing(true);
    setAiAnalysis("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/ai/candidate-analysis`,
        {
          candidateName: selectedCandidate.name,
          jobTitle: selectedCandidate.job,
          applicationData: `Applied for ${selectedCandidate.job} position. Current status: ${applicantsData.find(m => m.name === selectedCandidate.name)?.status || 'Unknown'}.`,
          analysisLevel: analysisLevel
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setAiAnalysis(response.data.data.analysis);
      } else {
        setAiAnalysis("Failed to analyze candidate profile. Please try again.");
      }
    } catch (error: any) {
      console.error("Failed to analyze candidate:", error);
      setAiAnalysis("Failed to analyze candidate profile. Please check your connection and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSelection = (item: string, list: string[], setList: (val: string[]) => void) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  // Helper function to parse date strings (DD-MM-YYYY format)
  const parseDate = (dateString: string) => {
    if (!dateString) return null;
    const [day, month, year] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  // Apply filters function
  const applyFilters = () => {
    let filtered = [...applicantsData];

    // Search filter
    if (search.trim()) {
      filtered = filtered.filter(applicant =>
        applicant.name.toLowerCase().includes(search.toLowerCase()) ||
        applicant.job.toLowerCase().includes(search.toLowerCase()) ||
        applicant.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(applicant => {
        const category = applicant.job_category?.toLowerCase();
        
        return selectedCategories.some(selectedCategory => {
          if (selectedCategory === "Operative") {
            return category === "operative"

          } else if (selectedCategory === "Academic") {
            return category === "academic"
          }
          return false;
        });
      });
    }

    // Status filter
    if (selectedStatus.length > 0) {
      filtered = filtered.filter(applicant => {
        return selectedStatus.some(status => {
          if (status === "Pending Review") {
            return applicant.status === "Pending review" || applicant.status === "Pending";
          } else if (status === "Shortlisted") {
            return applicant.status.includes("Shortlisted");
          } else {
            return applicant.status === status;
          }
        });
      });
    }

    // Applied date filters
    if (appliedFrom) {
      const fromDate = new Date(appliedFrom);
      filtered = filtered.filter(applicant => {
        const appliedDate = parseDate(applicant.applied);
        return appliedDate && appliedDate >= fromDate;
      });
    }

    if (appliedTo) {
      const toDate = new Date(appliedTo);
      filtered = filtered.filter(applicant => {
        const appliedDate = parseDate(applicant.applied);
        return appliedDate && appliedDate <= toDate;
      });
    }

    // Interview date filters
    if (interviewFrom) {
      const fromDate = new Date(interviewFrom);
      filtered = filtered.filter(applicant => {
        const interviewDate = parseDate(applicant.interview);
        return interviewDate && interviewDate >= fromDate;
      });
    }

    if (interviewTo) {
      const toDate = new Date(interviewTo);
      filtered = filtered.filter(applicant => {
        const interviewDate = parseDate(applicant.interview);
        return interviewDate && interviewDate <= toDate;
      });
    }

    setFilteredApplicants(filtered);
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    applyFilters();
    const hasActiveFilters = !!(search.trim() ||
                           selectedCategories.length > 0 ||
                           selectedStatus.length > 0 ||
                           appliedFrom ||
                           appliedTo ||
                           interviewFrom ||
                           interviewTo);
    setFiltersApplied(hasActiveFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearch("");
    setAppliedFrom("");
    setAppliedTo("");
    setInterviewFrom("");
    setInterviewTo("");
    setSelectedCategories([]);
    setSelectedStatus([]);
    setFilteredApplicants(applicantsData);
    setFiltersApplied(false);
  };

  const formatAiResponse = (text: string) => {
    return text
      // Convert ### headings to styled headings
      .replace(/###\s*(.*?)(?=\n|$)/g, '<h3 class="ai-section-heading">$1</h3>')
      
      // Convert --- separators to styled dividers
      .replace(/^---+$/gm, '<div class="ai-section-divider"></div>')
      
      // Convert **text** to bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      
      // Convert *text* to italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      
      // Convert bullet points (- item)
      .replace(/^-\s+(.*?)$/gm, '<li class="ai-bullet-point">$1</li>')
      
      // Wrap consecutive bullet points in ul tags
      .replace(/(<li class="ai-bullet-point">.*?<\/li>)(\s*<li class="ai-bullet-point">.*?<\/li>)*/gs, '<ul class="ai-bullet-list">$&</ul>')
      
      // Convert numbered lists (1. item)
      .replace(/^\d+\.\s+(.*?)$/gm, '<li class="ai-numbered-point">$1</li>')
      
      // Wrap consecutive numbered points in ol tags
      .replace(/(<li class="ai-numbered-point">.*?<\/li>)(\s*<li class="ai-numbered-point">.*?<\/li>)*/gs, '<ol class="ai-numbered-list">$&</ol>')
      
      // Convert line breaks to paragraphs for better spacing
      .replace(/\n\n/g, '</p><p class="ai-paragraph">')
      .replace(/^(.*)$/gm, '<p class="ai-paragraph">$1</p>')
      
      // Clean up empty paragraphs
      .replace(/<p class="ai-paragraph"><\/p>/g, '')
      .replace(/<p class="ai-paragraph">(<h3|<div|<ul|<ol)/g, '$1')
      .replace(/(<\/h3>|<\/div>|<\/ul>|<\/ol>)<\/p>/g, '$1');
  };

  return (
    <div className={styles.applicantsContainer}>
      {/* TOP SECTION: TABLE AND FILTER SIDE BY SIDE */}
      <div className={styles.topSection}> 
        {/* APPLICANTS TABLE PANEL */}
        <div className={styles.tablePanel}>
          <div className={styles.tableHeader}>
            <h2>📋 Application Information</h2>
            <div className={styles.tableStats}>
              <span className={styles.totalCount}>
                {filteredApplicants.length} of {applicantsData.length} Total Applicants
                {filtersApplied && <span className={styles.filteredIndicator}> (Filtered)</span>}
              </span>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading applicants...</p>
              </div>
            ) : (
              <table className={styles.applicantsTable}>
                <thead>
                  <tr>
                    <th>Applicant's Name</th>
                    <th>Job Applied</th>
                    <th>Applied Date</th>
                    <th>Interview Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                    <th>AI Analysis</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplicants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.noResults}>
                        {applicantsData.length === 0 ? "No applicants available" : "No applicants match your filter criteria"}
                      </td>
                    </tr>
                  ) : (
                    filteredApplicants.map((applicant, idx) => (
                      <tr key={`${applicant.application_id}-${idx}`}>
                        <td>
                          {applicant.name}
                        </td>
                        <td>{applicant.job}</td>
                        <td>{applicant.applied}</td>
                        <td>{applicant.interview || "Not scheduled"}</td>
                        <td>
                          <select
                            className={styles.statusSelect}
                            value={applicant.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              if (newStatus === applicant.status) return;
                              if (
                                window.confirm(
                                  "Changing the application status will notify the applicant. Do you want to proceed?"
                                )
                              ) {
                                try {
                                  const token = localStorage.getItem("token");
                                  await axios.put(
                                    `${import.meta.env.VITE_BACKEND_URL}/application-status/${applicant.application_id}`,
                                    { status: newStatus },
                                    { headers: { Authorization: `Bearer ${token}` } }
                                  );
                                  // Update the status in the table immediately
                                  setFilteredApplicants((prev) =>
                                    prev.map((a) =>
                                      a.application_id === applicant.application_id
                                        ? { ...a, status: newStatus }
                                        : a
                                    )
                                  );
                                  setApplicantsData((prev) =>
                                    prev.map((a) =>
                                      a.application_id === applicant.application_id
                                        ? { ...a, status: newStatus }
                                        : a
                                    )
                                  );
                                } catch (err) {
                                  alert("Failed to update status. Please try again.");
                                }
                              }
                            }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Reviewing">Reviewing</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Interview Scheduled" disabled>Interview Scheduled</option>
                          </select>
                        </td>

                        <td> {/* Add this new Actions column */}
                          <div className={styles.actionButtons}>
                            <Link 
                              to={`/hr/applicant-details/personal-particulars?userId=${applicant.user_id}`} 
                              className={styles.actionBtn}
                              title="View Details"
                            >
                              <Eye size={14} />
                            </Link>
                            
                            <button
                              className={styles.actionBtn}
                              onClick={() => {
                                // Email functionality will be added later
                                console.log(`Email ${applicant.name} at ${applicant.email}`);
                              }}
                              title="Send Email"
                            >
                              <Mail size={14} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <button
                            className={styles.aiAnalyzeBtn}
                            onClick={() => openAnalysisPanel(applicant.name, applicant.job)}
                          >
                            🤖 Analyze
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
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
                <label htmlFor="search-applicants">Search Applicants</label>
                <input
                  type="text"
                  id="search-applicants"
                  className={styles.customSearchInput}
                  placeholder="Enter applicant name or job"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Job Category */}
              <div className={styles.filterGroup}>
                <label>Job Category</label>
                <div className={styles.buttonGrid}>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedCategories.includes("Operative") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Operative", selectedCategories, setSelectedCategories)
                    }
                  >
                    Operative
                  </button>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedCategories.includes("Academic") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Academic", selectedCategories, setSelectedCategories)
                    }
                  >
                    Academic
                  </button>
                </div>
              </div>

              {/* Application Status */}
              <div className={styles.filterGroup}>
                <label>Application Status</label>
                <div className={styles.buttonGrid}>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedStatus.includes("Pending") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Pending", selectedStatus, setSelectedStatus)
                    }
                  >
                    Pending
                  </button>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedStatus.includes("Interview Scheduled") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Interview Scheduled", selectedStatus, setSelectedStatus)
                    }
                  >
                    Interview Scheduled
                  </button>

                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedStatus.includes("Reviewing") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Reviewing", selectedStatus, setSelectedStatus)
                    }
                  >
                    Reviewing
                  </button>

                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedStatus.includes("Rejected") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Rejected", selectedStatus, setSelectedStatus)
                    }
                  >
                    Rejected
                  </button>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedStatus.includes("Accepted") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Accepted", selectedStatus, setSelectedStatus)
                    }
                  >
                    Accepted
                  </button>
                </div>
              </div>

              {/* Date Filters */}
              <div className={styles.filterGroup}>
                <label>Applied Date From</label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={appliedFrom}
                  onChange={(e) => setAppliedFrom(e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <label>Applied Date To</label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={appliedTo}
                  onChange={(e) => setAppliedTo(e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <label>Interview Date From</label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={interviewFrom}
                  onChange={(e) => setInterviewFrom(e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <label>Interview Date To</label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={interviewTo}
                  onChange={(e) => setInterviewTo(e.target.value)}
                />
              </div>

              {/* Filter Action Buttons */}
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

      {/* BOTTOM SECTION: AI ANALYSIS PANEL */}
      {(selectedCandidate || isAnalyzing) && (
        <div className={styles.aiAnalysisPanel}>
          <div className={styles.aiPanelHeader}>
            <div className={styles.aiPanelTitle}>
              <h3>🤖 AI Background Analysis</h3>
                  <div className={styles.analysisLevelGroup}>
                    <label className={styles.analysisLevelLabel}>Analysis Level:</label>
                    <div className={styles.radioGroup}>
                      <label className={styles.radioOption}>
                        <input
                          type="radio"
                          name="analysisLevel"
                          value="Basic"
                          checked={analysisLevel === "Basic"}
                          onChange={(e) => setAnalysisLevel(e.target.value)}
                        />
                        <span>Basic</span>
                      </label>
                      <label className={styles.radioOption}>
                        <input
                          type="radio"
                          name="analysisLevel"
                          value="Standard"
                          checked={analysisLevel === "Standard"}
                          onChange={(e) => setAnalysisLevel(e.target.value)}
                        />
                        <span>Standard</span>
                      </label>
                      <label className={styles.radioOption}>
                        <input
                          type="radio"
                          name="analysisLevel"
                          value="Comprehensive"
                          checked={analysisLevel === "Comprehensive"}
                          onChange={(e) => setAnalysisLevel(e.target.value)}
                        />
                        <span>Comprehensive</span>
                      </label>
                    </div>
                  </div>
            </div>
            <div className={styles.aiPanelInfo}>
              {selectedCandidate && (
                <div className={styles.candidateInfo}>
                  <span className={styles.candidateName}>{selectedCandidate.name}</span>
                  <span className={styles.candidatePosition}> Applied Position: {selectedCandidate.job}</span>
                </div>
              )}
            </div>
            <button className={styles.closeAiPanel} onClick={() => {
              setSelectedCandidate(null);
              setAiAnalysis("");
            }}>×</button>
          </div>
          
          <div className={styles.aiPanelContent}>
            {!aiAnalysis && !isAnalyzing ? (
              <div className={styles.aiPlaceholder}>
                <div className={styles.aiPlaceholderContent}>
                  <h4>Ready to Analyze: {selectedCandidate?.name}</h4>
                  <p>Position: {selectedCandidate?.job}</p>
                  <p>Select your preferred analysis level above and click "Start Analysis" to begin the AI background review.</p>
                  
                  <button 
                    className={styles.startAnalysisBtn}
                    onClick={startAnalysis}
                    disabled={isAnalyzing}
                  >
                    🚀 Start Analysis
                  </button>
                </div>
              </div>
            ) : isAnalyzing ? (
              <div className={styles.aiLoading}>
                <div className={styles.loadingSpinner}></div>
                <p>Analyzing candidate background with AI...</p>
              </div>
            ) : (
              <div className={styles.aiAnalysisText}>
                <div 
                  className={styles.aiResponse}
                  dangerouslySetInnerHTML={{ __html: formatAiResponse(aiAnalysis) }}
                />
              </div>
            )}
          </div>
          
          <div className={styles.aiPanelFooter}>
            <div className={styles.aiPanelActions}>
              {aiAnalysis && (
                <button className={styles.refreshAnalysis} onClick={startAnalysis}>
                  🔄 Analyze Again
                </button>
              )}
            </div>
            <small>Powered by OpenAI API</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applicants;