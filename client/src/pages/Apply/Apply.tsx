import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, ChevronUp, Upload } from "lucide-react";
import styles from "./Apply.module.css";
import axios from "axios";

const Apply: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const jobData = location.state?.jobData;
  const [showJobInfo, setShowJobInfo] = useState(true);
  const [showAttachment, setShowAttachment] = useState(true);
  const [showPositionDetails, setShowPositionDetails] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [jobInfo] = useState({
    job_id: jobData?.job_id || null,
    positionType: jobData?.job_type || "Not Specified",
    position: jobData?.title || "Not Specified",
    // jobCategory: jobData?.job_category || "Not Specified",
  });


  const [attachment, setAttachment] = useState({
    documentType: "",
    documentName: "",
    uploadedFile: null as File | null
  });

  const [positionDetails, setPositionDetails] = useState({
    currentSalary: "",
    expectedSalary: "",
    earliestStartingDate: "",
    sourceObtainedFrom: "",
    totalWorkExperience: "",
    relevantWorkExperience: ""
  });

  const [profileCompleteness] = useState(50);

  // File validation
  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];

    if (file.size > maxSize) {
      return "File size must be less than 10MB";
    }

    if (!allowedTypes.includes(file.type)) {
      return "Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed";
    }

    return null;
  };

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

  const handleSubmit = async () => {
    const isValid = validateAllFields();
    
    if (!isValid) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Authentication token not found. Please log in again.");
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      
      // Add job information
      if (jobInfo.job_id) {
        formData.append('job_id', jobInfo.job_id.toString());
      }
      
      // Add attachment data
      formData.append('documentType', attachment.documentType);
      formData.append('documentName', attachment.documentName);
      if (attachment.uploadedFile) {
        formData.append('file', attachment.uploadedFile);
      }
      
      // Add position details
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
              <div className={styles.inputGroup}>
                <span className={styles.labelText}>
                  Document Type
                  <span className={styles.requiredAsterisk}>*</span>
                </span>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g., Resume, Cover Letter, Portfolio"
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
                />
                {validationErrors.documentType && (
                  <div className={styles.errorMessage}>
                    {validationErrors.documentType}
                  </div>
                )}
              </div>

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
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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
                  Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max: 10MB)
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

              <div className={styles.inputGroup}>
                <span className={styles.labelText}>
                  Earliest Starting Date
                  <span className={styles.requiredAsterisk}>*</span>
                </span>
                <input
                  type="date"
                  className={styles.input}
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
                  <option value="" disabled>Select source</option>
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

              <div className={styles.inputGroup}>
                <span className={styles.labelText}>
                  Total Work Experience (Years)
                  <span className={styles.requiredAsterisk}>*</span>
                </span>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g., 3 years"
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

              <div className={styles.inputGroup}>
                <span className={styles.labelText}>
                  Relevant Work Experience (Years)
                  <span className={styles.requiredAsterisk}>*</span>
                </span>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g., 2 years"
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