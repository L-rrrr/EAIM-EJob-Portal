import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronUp, ChevronDown } from "lucide-react";
import axios from "axios";
import styles from "../../pages/Education/Education.module.css"; 
import supportStyles from "../../pages/Support/Support.module.css";

const SubmittedSupport: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  const [showReferences, setShowReferences] = useState(true);
  const [showAttachments, setShowAttachments] = useState(true);

  // Type definitions
  type ReferenceRecord = {
    id: number;
    reference_id?: number;
    name: string;
    occupation: string;
    contactNo: string;
    relationship: string;
  };

  type AttachmentRecord = {
    id: number;
    attachment_id?: number;
    documentType: string;
    documentName: string;
    file: File | null;
    file_name?: string;
    file_path?: string;
    file_size?: number;
    file_type?: string;
    server_file_name?: string;
  };

  // State with first 2 records being compulsory
  const [references, setReferences] = useState<ReferenceRecord[]>([
    { id: 1, reference_id: undefined, name: "", occupation: "", contactNo: "", relationship: "" },
    { id: 2, reference_id: undefined, name: "", occupation: "", contactNo: "", relationship: "" },
  ]);

  const [attachments, setAttachments] = useState<AttachmentRecord[]>([
    { id: 1, attachment_id: undefined, documentType: "Resume", documentName: "", file: null }
  ]);

  useEffect(() => {
    const fetchApplicantSupportData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!applicationId) {
          console.error("No application ID provided");
          return;
        }

        // Fetch applicant support data based on application ID
        const supportResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/application-full-details?applicationId=${applicationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (supportResponse.data && supportResponse.data.success) {
          const data = supportResponse.data.data;

          // Set references
          let referencesArr: any[] = [];
          if (data.references) {
            try {
              referencesArr = JSON.parse(data.references);
            } catch {
              referencesArr = [];
            }
          }
          if (Array.isArray(referencesArr) && referencesArr.length > 0) {
            const referenceRecords = referencesArr.map((rec: any, index: number) => ({
              id: index + 1,
              reference_id: rec.reference_id,
              name: rec.name || "",
              occupation: rec.occupation || "",
              contactNo: rec.contact_no || "",
              relationship: rec.relationship || "",
            }));

            // Ensure we always have at least 2 records for references
            while (referenceRecords.length < 2) {
              referenceRecords.push({
                id: referenceRecords.length + 1,
                reference_id: undefined,
                name: "",
                occupation: "",
                contactNo: "",
                relationship: "",
              });
            }

            setReferences(referenceRecords);
          }

          // Set attachments
          let attachmentsArr: any[] = [];
          if (data.attachments) {
            try {
              attachmentsArr = JSON.parse(data.attachments);
            } catch {
              attachmentsArr = [];
            }
          }
          if (Array.isArray(attachmentsArr) && attachmentsArr.length > 0) {
            const attachmentRecords = attachmentsArr.map((rec: any, index: number) => {
              const serverFileName = rec.file_path ? rec.file_path.split(/[/\\]/).pop() : "";
              return {
                id: index + 1,
                attachment_id: rec.attachment_id,
                documentType: rec.document_type || "",
                documentName: rec.document_name || "",
                file: null,
                file_name: rec.file_name || "",
                file_path: rec.file_path || "",
                server_file_name: serverFileName,
                file_size: rec.file_size || 0,
                file_type: rec.file_type || "",
              };
            });

            // Ensure we always have at least 1 record (Resume)
            while (attachmentRecords.length < 1) {
              attachmentRecords.push({
                id: attachmentRecords.length + 1,
                attachment_id: undefined,
                documentType: attachmentRecords.length === 0 ? "Resume" : "",
                documentName: "",
                file: null,
                file_name: "",
                file_path: "",
                server_file_name: "",
                file_size: 0,
                file_type: "",
              });
            }

            setAttachments(attachmentRecords);
          }
        }
      } catch (error) {
        console.error("Failed to fetch applicant support data", error);
      }
    };

    fetchApplicantSupportData();
  }, [applicationId]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={styles.mainPanel}>
      <div className={styles.formWrapper}>

        {/* References Section */}
        <div className={styles.formContainer}>
          <h2
            className={supportStyles.sectionTitle}
            onClick={() => setShowReferences(prev => !prev)}
          >
            <span className={styles.sectionTitleText}>
              References
            </span>
            <div className={styles.sectionArrow}>
              {showReferences ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>
          {showReferences && (
            <div>
              <div className={styles.labelHint}>
                Please provide at least 2 references. The first 2 references are required.
              </div>

              {references.map((ref, index) => (
                <div key={ref.id} className={`${styles.formSection} ${index >= 2 ? styles.record : ""}`}>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Referee Name<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={ref.name}
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Occupation<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={ref.occupation}
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Contact No.<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={ref.contactNo}
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Relationship<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={ref.relationship}
                      disabled
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attachments Section */}
        <div className={styles.formContainer}>
          <h2
            className={supportStyles.sectionTitle}
            onClick={() => setShowAttachments(prev => !prev)}
          >
            <span className={styles.sectionTitleText}>
              Attachments
            </span>
            <div className={styles.sectionArrow}>
              {showAttachments ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>
          {showAttachments && (
            <div>
              <div className={styles.labelHint}>
                Resume is compulsory. You can add more attachments if needed.
              </div>

              {attachments.map((att, index) => (
                <div key={att.id} className={`${styles.formSection} ${index > 0 ? styles.record : ""}`}>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Document Type<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    {index === 0 ? (
                      <input
                        type="text"
                        className={styles.input}
                        value="Resume"
                        disabled
                      />
                    ) : (
                      <select
                        className={styles.input}
                        value={att.documentType}
                        disabled
                      >
                        <option value="">-- Select Document Type --</option>
                        <option value="Resume">Resume</option>
                        <option value="Cover Letter">Cover Letter</option>
                        <option value="Certificate">Certificate</option>
                        <option value="Photo">Photo</option>
                        <option value="Passport">Passport</option>
                        <option value="Others">Others</option>
                      </select>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Document Name<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={att.documentName}
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Browse... (Max 10MB)<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="file"
                      className={styles.input}
                      disabled
                    />

                    <div className={supportStyles.fileHint}>
                      Accepted formats: JPEG, JPG, PNG, GIF, PDF, DOC, DOCX, TXT, XLS, XLSX (Max: 10MB)
                    </div>

                    {att.file_name && att.server_file_name && (
                      <div style={{ fontSize: "0.85rem", marginTop: "0.25rem", color: "green" }}>
                        Current file: {att.file_name}
                        {att.file_size && ` (${formatFileSize(att.file_size)})`}
                        {" "}
                        <a
                          href={`${import.meta.env.VITE_BACKEND_URL.replace(/\/api$/, "")}/uploads/${att.server_file_name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginLeft: "0.5em", color: "#2563eb", textDecoration: "underline" }}
                          download={att.file_name}
                        >
                          View
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.formButtons}>
          <button 
            className={`${styles.btn} ${styles.save}`} 
            onClick={() => navigate("/jobs-applied")}
          >
            Back to All Applications
          </button>

          <button 
            className={`${styles.btn} ${styles.submit}`} 
            onClick={() => navigate(`/submitted-application/family?applicationId=${applicationId}`)}
          >
            ← Previous
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmittedSupport;