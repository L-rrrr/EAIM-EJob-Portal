import { useState } from "react";
import styles from "./Applicants.module.css";
import { Link } from "react-router-dom";
import axios from "axios";

const mockData = [
  { name: "Aaron Tan", job: "Lecturer (Discrete Maths)", applied: "01-06-2025", interview: "10-06-2025", status: "Pending review" },
  { name: "Lee Chong Wei", job: "Badminton Coach", applied: "03-06-2025", interview: "12-06-2025", status: "Shortlisted for Interview" },
  { name: "JJ Lin", job: "Vocal coach", applied: "02-06-2025", interview: "11-06-2025", status: "Accepted" },
  { name: "Daniel Ng", job: "Freelance Lecturer (Psychology)", applied: "04-06-2025", interview: "13-06-2025", status: "Rejected" },
  { name: "Elaine Goh", job: "Full-Time Lecturer (Business & Management)", applied: "05-06-2025", interview: "14-06-2025", status: "Pending review" },
  { name: "Frankie Tan", job: "Education Sales Manager", applied: "06-06-2025", interview: "15-06-2025", status: "Accepted" },
  { name: "Gina Lim", job: "Program Executive", applied: "07-06-2025", interview: "16-06-2025", status: "Rejected" },
  { name: "Henry Chia", job: "Head of School", applied: "08-06-2025", interview: "17-06-2025", status: "Pending review" },
  { name: "Ivy Ho", job: "Country Manager (Vietnam)", applied: "09-06-2025", interview: "18-06-2025", status: "Shortlisted for Interview" },
  { name: "Jake Wong", job: "Full-Time Lecturer (O Level)", applied: "10-06-2025", interview: "19-06-2025", status: "Accepted" },
];

const Applicants = () => {
  const [search, setSearch] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [interviewFrom, setInterviewFrom] = useState("");
  const [interviewTo, setInterviewTo] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

  // Filter panel collapse state
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  // AI Analysis state
  const [selectedCandidate, setSelectedCandidate] = useState<{name: string, job: string} | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const toggleSelection = (item: string, list: string[], setList: (val: string[]) => void) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };
  

  // Function to analyze candidate with OpenAI
  const analyzeCandidateWithAI = async (candidateName: string, jobTitle: string) => {
    setIsAnalyzing(true);
    setSelectedCandidate({ name: candidateName, job: jobTitle });
    setAiAnalysis("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/ai/candidate-analysis`,
        {
          candidateName,
          jobTitle,
          applicationData: `Applied for ${jobTitle} position. Current status: ${mockData.find(m => m.name === candidateName)?.status || 'Unknown'}.`
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
      
      if (error.response?.status === 401) {
        setAiAnalysis("Authentication failed. Please log in again.");
      } else if (error.response?.status === 402) {
        setAiAnalysis("OpenAI API quota exceeded. Please contact administrator.");
      } else if (error.response?.data?.message) {
        setAiAnalysis(`Error: ${error.response.data.message}`);
      } else {
        setAiAnalysis("Failed to analyze candidate profile. Please check your connection and try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatAiResponse = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert **text** to <strong>text</strong>
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Convert *text* to <em>text</em>
    .replace(/\n/g, '<br>'); // Convert line breaks
};

  return (
    <div className={styles.applicantsContainer}>
      {/* TOP SECTION: TABLE AND FILTER SIDE BY SIDE */}
      <div className={styles.topSection}>
        {/* APPLICANTS TABLE PANEL */}
        <div className={styles.tablePanel}>
          <div className={styles.tableHeader}>
            <h2>📋 Applicants Information</h2>
            <div className={styles.tableStats}>
              <span className={styles.totalCount}>{mockData.length} Total Applicants</span>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.applicantsTable}>
              <thead>
                <tr>
                  <th>Applicant's Name</th>
                  <th>Job Applied</th>
                  <th>Applied Date</th>
                  <th>Interview Date</th>
                  <th>Status</th>
                  <th>AI Analysis</th>
                </tr>
              </thead>
              <tbody>
                {mockData.map((applicant, idx) => (
                  <tr key={idx}>
                    <td>
                      <Link to={`/hr/applicant-details/personal-particulars`} className={styles.applicantNameLink}>
                        {applicant.name}
                      </Link>
                    </td>
                    <td>{applicant.job}</td>
                    <td>{applicant.applied}</td>
                    <td>{applicant.interview}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[applicant.status.toLowerCase().replace(/\s+/g, '')]}`}>
                        {applicant.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.aiAnalyzeBtn}
                        onClick={() => analyzeCandidateWithAI(applicant.name, applicant.job)}
                        disabled={isAnalyzing}
                      >
                        {isAnalyzing && selectedCandidate?.name === applicant.name ? 
                          "Analyzing..." : "🤖 Analyze"
                        }
                      </button>
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
                <label htmlFor="search-applicants">Search Applicants</label>
                <input
                  type="text"
                  id="search-applicants"
                  className={styles.customSearchInput}
                  placeholder="Enter applicant name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Job Category */}
              <div className={styles.filterGroup}>
                <label>Job Category</label>
                <div className={`${styles.buttonGroup} ${styles.compact}`}>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedCategories.includes("Manager / Executive") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Manager / Executive", selectedCategories, setSelectedCategories)
                    }
                  >
                    Manager / Executive
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

              {/* Date Filters - Default HTML Date Inputs */}
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

              {/* Application Status - Compact Grid */}
              <div className={styles.filterGroup}>
                <label>Application Status</label>
                <div className={styles.buttonGrid}>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedStatus.includes("Pending Review") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Pending Review", selectedStatus, setSelectedStatus)
                    }
                  >
                    Pending
                  </button>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedStatus.includes("Shortlisted") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Shortlisted", selectedStatus, setSelectedStatus)
                    }
                  >
                    Shortlisted
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

              <button className={`${styles.applyFilterBtn} ${styles.compact}`}>Apply Filter</button>
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
            {isAnalyzing ? (
              <div className={styles.aiLoading}>
                <div className={styles.loadingSpinner}></div>
                <p>Analyzing candidate background with AI...</p>
              </div>
            ) : (
              <div className={styles.aiAnalysisText}>
                {aiAnalysis ? (
                  <div 
                    className={styles.aiResponse}
                    dangerouslySetInnerHTML={{ __html: formatAiResponse(aiAnalysis) }}
                  />
                  
                  
                ) : (
                  <div className={styles.aiPlaceholder}>
                    <p>💡 Click "🤖 Analyze" button next to any candidate to get their background analysis</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className={styles.aiPanelFooter}>
            <div className={styles.aiPanelActions}>
              <button className={styles.refreshAnalysis} onClick={() => {
                if (selectedCandidate) {
                  analyzeCandidateWithAI(selectedCandidate.name, selectedCandidate.job);
                }
              }}>
                🔄 Refresh Analysis
              </button>
            </div>
            <small>Powered by OpenAI API</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applicants;