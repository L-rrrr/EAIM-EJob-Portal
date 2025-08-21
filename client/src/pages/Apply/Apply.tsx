import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, ChevronUp, Upload } from "lucide-react";
import styles from "./Apply.module.css";
import axios from "axios";

// Total number of profile sections/tables for completeness calculation
const TOTAL_SECTIONS = 11;
// Number of tables per profile section
const SECTION_TABLES = {
  personal: 4,
  education: 1,
  work: 2,
  family: 2,
  support: 2,
};

const Apply: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Get job data passed from previous page (AvailableJobs)
  const jobData = location.state?.jobData;

  // UI state for collapsible sections
  const [showJobInfo, setShowJobInfo] = useState(true);
  const [showAttachment, setShowAttachment] = useState(true);
  const [showPositionDetails, setShowPositionDetails] = useState(true);

  // Validation error messages for form fields
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Profile completeness state for each section
  const [personalParticularsCompleted, setPersonalParticularsCompleted] = useState(false);
  const [educationCompleted, setEducationCompleted] = useState(false);
  const [workCompleted, setWorkCompleted] = useState(false);
  const [familyCompleted, setFamilyCompleted] = useState(false);
  const [supportCompleted, setSupportCompleted] = useState(false);

  // Job info (id, type, title)
  const [jobInfo] = useState({
    job_id: jobData?.job_id || null,
    positionType: jobData?.job_type || "Not Specified",
    position: jobData?.title || "Not Specified",
  });

  // Attachment state (document type, name, file)
  const [attachment, setAttachment] = useState({
    documentType: "",
    documentName: "",
    uploadedFile: null as File | null
  });

  // Position details state (salary, experience, etc.)
  const [positionDetails, setPositionDetails] = useState({
    currentSalary: "",
    expectedSalary: "",
    earliestStartingDate: "",
    sourceObtainedFrom: "",
    totalWorkExperience: "",
    relevantWorkExperience: ""
  });

  // Validate uploaded file (type and size)
  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (file.size > maxSize) {
      return "File size must be less than 10MB";
    }

    if (!allowedTypes.includes(file.type)) {
      return "Only JPEG, JPG, PNG, GIF, PDF, DOC, DOCX, TXT, XLS, and XLSX files are allowed";
    }

    return null;
  };

  // Get today's date in Singapore timezone (YYYY-MM-DD)
  const getSingaporeDateString = () => {
    const now = new Date();
    // Singapore is UTC+8, so add 8 hours to UTC time
    const sgTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return sgTime.toISOString().slice(0, 10);
  };

  // Fetch profile completeness for each section on mount and when profile is updated
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

    // Listen for custom event to refresh completeness
    const handler = () => fetchCompleteness();
    window.addEventListener("profile-completeness-updated", handler);
    return () => window.removeEventListener("profile-completeness-updated", handler);
  }, []);

  // Redirect to available jobs if no job data is present
  useEffect(() => {
    if (!jobData) navigate("/available-jobs");
  }, [jobData, navigate]);

  // Calculate profile completeness percentage
  const completedTables =
    (personalParticularsCompleted ? SECTION_TABLES.personal : 0) +
    (educationCompleted ? SECTION_TABLES.education : 0) +
    (workCompleted ? SECTION_TABLES.work : 0) +
    (familyCompleted ? SECTION_TABLES.family : 0) +
    (supportCompleted ? SECTION_TABLES.support : 0);

  const profileCompleteness = Math.floor((completedTables / TOTAL_SECTIONS) * 100);

  // Handle file input change and validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setValidationErrors(prev => ({ ...prev, uploadedFile: validationError }));
        setAttachment(prev => ({ ...prev, uploadedFile: null }));
        e.target.value = '';
      } else {
        setAttachment(prev => ({ ...prev, uploadedFile: file }));
        if (validationErrors.uploadedFile) {
          setValidationErrors(prev => {
            const updated = { ...prev };
            delete updated.uploadedFile;
            return updated;
          });
        }
      }
    }
  };

  // Validate all required fields before submission
  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate attachment fields
    if (!attachment.documentType.trim()) {
      errors.documentType = "Document type is required";
    }
    if (!attachment.documentName.trim()) {
      errors.documentName = "Document name is required";
    }
    if (!attachment.uploadedFile) {
      errors.uploadedFile = "File upload is required";
    }

    // Validate position details
    if (!positionDetails.currentSalary.trim()) {
      errors.currentSalary = "Current salary is required";
    }
    if (!positionDetails.expectedSalary.trim()) {
      errors.expectedSalary = "Expected salary is required";
    }
    if (!positionDetails.earliestStartingDate) {
      errors.earliestStartingDate = "Earliest starting date is required";
    }
    if (!positionDetails.sourceObtainedFrom) {
      errors.sourceObtainedFrom = "Source obtained from is required";
    }
    if (!positionDetails.totalWorkExperience.trim()) {
      errors.totalWorkExperience = "Total work experience is required";
    }
    if (!positionDetails.relevantWorkExperience.trim()) {
      errors.relevantWorkExperience = "Relevant work experience is required";
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      alert("Please fill in all required fields before submitting your application.");
      return false;
    }

    return true;
  };

  // Handle application submission
  const handleSubmit = async () => {
    // Block submission if profile is incomplete
    if (profileCompleteness < 100) {
      alert("Please complete your profile before submitting your application.");
      return;
    }

    const isValid = validateAllFields();
    if (!isValid) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication token not found. Please log in again.");
        return;
      }

      // 1. Fetch all relevant info from backend for full application details
      const [
        personalParticularsRes,
        sgAddressRes,
        overseasAddressRes,
        militaryServiceRes,
        educationBackgroundRes,
        scholarshipAwardsRes,
        otherQualificationsRes,
        workExperienceRes,
        teachingExperienceRes,
        skillsRes,
        languagesRes,
        familyBackgroundRes,
        emergencyContactRes,
        referencesRes,
        attachmentsRes
      ] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-personal-particulars`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-sg-address`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-overseas-address`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-military-service`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-education`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-scholarship-awards`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-other-qualifications`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-work-experience`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-teaching-experience`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-skills`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-languages`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-family-background`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-emergency-contact`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-references`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-attachments`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      // 2. Prepare the data as JSON strings or IDs as needed for backend
      const fullDetails = {
        personal_particulars: JSON.stringify(personalParticularsRes.data.data || {}),
        singapore_address: JSON.stringify(sgAddressRes.data.data || {}),
        overseas_address: JSON.stringify(overseasAddressRes.data.data || {}),
        military_service: JSON.stringify(militaryServiceRes.data.data || {}),
        education_background: JSON.stringify(educationBackgroundRes.data.data || []),
        scholarship_awards: JSON.stringify(scholarshipAwardsRes.data.data || []),
        other_qualifications: JSON.stringify(otherQualificationsRes.data.data || []),
        work_experience: JSON.stringify(workExperienceRes.data.data || []),
        teaching_experience: JSON.stringify(teachingExperienceRes.data.data || []),
        skills: JSON.stringify(skillsRes.data.data || []),
        languages: JSON.stringify(languagesRes.data.data || []),
        family_background: JSON.stringify(familyBackgroundRes.data.data || []),
        emergency_contact: JSON.stringify(emergencyContactRes.data.data || []),
        references: JSON.stringify(referencesRes.data.data || []),
        attachments: JSON.stringify(attachmentsRes.data.data || []),
        apply_info: JSON.stringify(positionDetails),
      };

      // 3. Submit application and get application_id
      const formData = new FormData();
      if (jobInfo.job_id) formData.append('job_id', jobInfo.job_id.toString());
      formData.append('documentType', attachment.documentType);
      formData.append('documentName', attachment.documentName);
      if (attachment.uploadedFile) formData.append('file', attachment.uploadedFile);
      formData.append('currentSalary', positionDetails.currentSalary);
      formData.append('expectedSalary', positionDetails.expectedSalary);
      formData.append('earliestStartingDate', positionDetails.earliestStartingDate);
      formData.append('sourceObtainedFrom', positionDetails.sourceObtainedFrom);
      formData.append('totalWorkExperience', positionDetails.totalWorkExperience);
      formData.append('relevantWorkExperience', positionDetails.relevantWorkExperience);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/submit-application`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        const application_id = response.data.data.application_id;

        // 4. Save full details to tbl_application_full_details
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-application-full-details`,
          {
            application_id,
            user_id: personalParticularsRes.data.data?.user_id,
            job_id: jobInfo.job_id,
            ...fullDetails,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        alert("Application submitted successfully!");
        navigate("/jobs-applied");
      } else {
        alert("Failed to submit application: " + response.data.message);
      }
    } catch (error: any) {
      console.error("Application submission error:", error);
      if (error.response) {
        alert(`Failed to submit application: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        alert("Network error: Could not reach server");
      } else {
        alert("Error: " + error.message);
      }
    }
  };

  // Options for "Source Obtained From" dropdown
  const sourceOptions = [
    "Agency", "Career Fair", "EASB website", "EASB Staff", "EASB Student",
    "JobsDB", "JobsCentral", "JobStreet", "ST Jobs", "Jobs Bank", "Others"
  ];

  return (
    <div className={styles.mainPanel}>
      <div className={styles.formWrapper}>
        {/* Job Info Section */}
        <div className={styles.formContainer}>
          <h2
            className={styles.sectionTitle}
            onClick={() => setShowJobInfo(prev => !prev)}
            style={{ cursor: "pointer" }}
          >
            <span className={styles.sectionTitleText}>
              Job Information
            </span>
            <div className={styles.sectionArrow}>
              {showJobInfo ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>

          {showJobInfo && (
            <div className={styles.formSection}>
              <div className={styles.inputGroup}>
                <span className={styles.labelText}>Position Type</span>
                <div className={styles.jobInfoDisplay}>
                  {jobInfo.positionType}
                </div>
              </div>
              <div className={styles.inputGroup}>
                <span className={styles.labelText}>Position</span>
                <div className={styles.jobInfoDisplay}>
                  {jobInfo.position}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Attachment Section */}
        <div className={styles.formContainer}>
          <h2
            className={styles.sectionTitle}
            onClick={() => setShowAttachment(prev => !prev)}
            style={{ cursor: "pointer" }}
          >
            <span className={styles.sectionTitleText}>
              Document Attachment
            </span>
            <div className={styles.sectionArrow}>
              {showAttachment ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>

          {showAttachment && (
            <div className={styles.formSection}>
              {/* Document Type */}
              <div className={styles.inputGroup}>
                <span className={styles.labelText}>
                  Document Type
                  <span className={styles.requiredAsterisk}>*</span>
                </span>
                <select
                  className={styles.input}
                  value={attachment.documentType}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAttachment(prev => ({ ...prev, documentType: value }));
                    if (validationErrors.documentType && value.trim()) {
                      setValidationErrors(prev => {
                        const updated = { ...prev };
                        delete updated.documentType;
                        return updated;
                      });
                    }
                  }}
                  style={{
                    borderColor: validationErrors.documentType ? "red" : undefined,
                  }}
                >
                  <option value="" disabled>-- Select Document Type --</option>
                  <option value="Resume">Resume</option>
                  <option value="Cover Letter">Cover Letter</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Photo">Photo</option>
                  <option value="Passport">Passport</option>
                  <option value="Others">Others</option>
                </select>
                {validationErrors.documentType && (
                  <div className={styles.errorMessage}>
                    {validationErrors.documentType}
                  </div>
                )}
              </div>

              {/* Document Name */}
              <div className={styles.inputGroup}>
                <span className={styles.labelText}>
                  Document Name
                  <span className={styles.requiredAsterisk}>*</span>
                </span>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g., john_doe_resume.pdf"
                  value={attachment.documentName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAttachment(prev => ({ ...prev, documentName: value }));
                    if (validationErrors.documentName && value.trim()) {
                      setValidationErrors(prev => {
                        const updated = { ...prev };
                        delete updated.documentName;
                        return updated;
                      });
                    }
                  }}
                  style={{
                    borderColor: validationErrors.documentName ? "red" : undefined,
                  }}
                />
                {validationErrors.documentName && (
                  <div className={styles.errorMessage}>
                    {validationErrors.documentName}
                  </div>
                )}
              </div>

              {/* File Upload */}
              <div className={styles.inputGroup}>
                <span className={styles.labelText}>
                  Upload File
                  <span className={styles.requiredAsterisk}>*</span>
                </span>
                <div className={styles.fileInputWrapper}>
                  <input
                    type="file"
                    id="fileUpload"
                    className={styles.fileInput}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.xls,.xlsx"
                    onChange={handleFileChange}
                    style={{
                      borderColor: validationErrors.uploadedFile ? "red" : undefined,
                    }}
                  />
                  <label htmlFor="fileUpload" className={styles.fileInputLabel}>
                    <Upload size={20} />
                    {attachment.uploadedFile ? attachment.uploadedFile.name : "Choose file"}
                  </label>
                </div>
                <div className={styles.fileHint}>
                  Accepted formats: JPEG, JPG, PNG, GIF, PDF, DOC, DOCX, TXT, XLS, XLSX (Max: 10MB)
                </div>
                {validationErrors.uploadedFile && (
                  <div className={styles.errorMessage}>
                    {validationErrors.uploadedFile}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Position Details Section */}
        <div className={styles.formContainer}>
          <h2
            className={styles.sectionTitle}
            onClick={() => setShowPositionDetails(prev => !prev)}
            style={{ cursor: "pointer" }}
          >
            <span className={styles.sectionTitleText}>
              Position Details
            </span>
            <div className={styles.sectionArrow}>
              {showPositionDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>

          {showPositionDetails && (
            <div className={styles.formSection}>
              {/* Current Salary */}
              <div className={styles.inputGroup}>
                <span className={styles.labelText}>
                  Current Salary (S$)
                  <span className={styles.requiredAsterisk}>*</span>
                </span>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="e.g., 5000"
                  value={positionDetails.currentSalary}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPositionDetails(prev => ({ ...prev, currentSalary: value }));
                    if (validationErrors.currentSalary && value.trim()) {
                      setValidationErrors(prev => {
                        const updated = { ...prev };
                        delete updated.currentSalary;
                        return updated;
                      });
                    }
                  }}
                  style={{
                    borderColor: validationErrors.currentSalary ? "red" : undefined,
                  }}
                />
                {validationErrors.currentSalary && (
                  <div className={styles.errorMessage}>
                    {validationErrors.currentSalary}
                  </div>
                )}
              </div>

              {/* Expected Salary */}
              <div className={styles.inputGroup}>
                <span className={styles.labelText}>
                  Expected Salary (S$)
                  <span className={styles.requiredAsterisk}>*</span>
                </span>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="e.g., 6000"
                  value={positionDetails.expectedSalary}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPositionDetails(prev => ({ ...prev, expectedSalary: value }));
                    if (validationErrors.expectedSalary && value.trim()) {
                      setValidationErrors(prev => {
                        const updated = { ...prev };
                        delete updated.expectedSalary;
                        return updated;
                      });
                    }
                  }}
                  style={{
                    borderColor: validationErrors.expectedSalary ? "red" : undefined,
                  }}
                />
                {validationErrors.expectedSalary && (
                  <div className={styles.errorMessage}>
                    {validationErrors.expectedSalary}
                  </div>
                )}
              </div>

              {/* Earliest Starting Date */}
              <div className={styles.inputGroup}>
                <span className={styles.labelText}>
                  Earliest Starting Date
                  <span className={styles.requiredAsterisk}>*</span>
                </span>
                <input
                  type="date"
                  className={styles.input}
                  min={getSingaporeDateString()} 
                  value={positionDetails.earliestStartingDate}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPositionDetails(prev => ({ ...prev, earliestStartingDate: value }));
                    if (validationErrors.earliestStartingDate && value) {
                      setValidationErrors(prev => {
                        const updated = { ...prev };
                        delete updated.earliestStartingDate;
                        return updated;
                      });
                    }
                  }}
                  style={{
                    borderColor: validationErrors.earliestStartingDate ? "red" : undefined,
                  }}
                />
                {validationErrors.earliestStartingDate && (
                  <div className={styles.errorMessage}>
                    {validationErrors.earliestStartingDate}
                  </div>
                )}
              </div>

              {/* Source Obtained From */}
              <div className={styles.inputGroup}>
                <span className={styles.labelText}>
                  Source Obtained From
                  <span className={styles.requiredAsterisk}>*</span>
                </span>
                <select
                  className={styles.input}
                  value={positionDetails.sourceObtainedFrom}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPositionDetails(prev => ({ ...prev, sourceObtainedFrom: value }));
                    if (validationErrors.sourceObtainedFrom && value) {
                      setValidationErrors(prev => {
                        const updated = { ...prev };
                        delete updated.sourceObtainedFrom;
                        return updated;
                      });
                    }
                  }}
                  style={{
                    borderColor: validationErrors.sourceObtainedFrom ? "red" : undefined,
                  }}
                >
                  <option value="" disabled>-- Select source --</option>
                  {sourceOptions.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
                {validationErrors.sourceObtainedFrom && (
                  <div className={styles.errorMessage}>
                    {validationErrors.sourceObtainedFrom}
                  </div>
                )}
              </div>

              {/* Total Work Experience */}
              <div className={styles.inputGroup}>
                <span className={styles.labelText}>
                  Total Work Experience (Years)
                  <span className={styles.requiredAsterisk}>*</span>
                </span>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g., 3"
                  value={positionDetails.totalWorkExperience}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPositionDetails(prev => ({ ...prev, totalWorkExperience: value }));
                    if (validationErrors.totalWorkExperience && value.trim()) {
                      setValidationErrors(prev => {
                        const updated = { ...prev };
                        delete updated.totalWorkExperience;
                        return updated;
                      });
                    }
                  }}
                  style={{
                    borderColor: validationErrors.totalWorkExperience ? "red" : undefined,
                  }}
                />
                {validationErrors.totalWorkExperience && (
                  <div className={styles.errorMessage}>
                    {validationErrors.totalWorkExperience}
                  </div>
                )}
              </div>

              {/* Relevant Work Experience */}
              <div className={styles.inputGroup}>
                <span className={styles.labelText}>
                  Relevant Work Experience (Years)
                  <span className={styles.requiredAsterisk}>*</span>
                </span>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g., 2"
                  value={positionDetails.relevantWorkExperience}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPositionDetails(prev => ({ ...prev, relevantWorkExperience: value }));
                    if (validationErrors.relevantWorkExperience && value.trim()) {
                      setValidationErrors(prev => {
                        const updated = { ...prev };
                        delete updated.relevantWorkExperience;
                        return updated;
                      });
                    }
                  }}
                  style={{
                    borderColor: validationErrors.relevantWorkExperience ? "red" : undefined,
                  }}
                />
                {validationErrors.relevantWorkExperience && (
                  <div className={styles.errorMessage}>
                    {validationErrors.relevantWorkExperience}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Completeness Section */}
        <div className={styles.formContainer}>
          <div className={styles.formSection}>
            <div className={styles.profileCompleteness}>
              <span className={styles.labelText}>
                Profile Completeness: <strong>{profileCompleteness}%</strong>
              </span>
              <button 
                className={styles.profileButton}
                onClick={() => navigate("/profile/personal-particulars")}
              >
                Go to Profile
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className={styles.formButtons}>
          <button 
            className={`${styles.btnSubmit} ${styles.submit}`}
            onClick={handleSubmit}
          >
            Submit Application
          </button>
        </div>
      </div>
    </div>
  );
};

export default Apply;