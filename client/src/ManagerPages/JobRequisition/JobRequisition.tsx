import { useState, useEffect } from "react";
import styles from "./JobRequisition.module.css";
import { Plus, Eye, Pencil, ClipboardCheck, FileWarning, FileUp } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import axios from "axios";


const TiptapEditor = ({
  content,
  onChange,
  placeholder,
}: {
  content: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content,
    editorProps: {
      attributes: {
        class: styles.tiptapEditor,
        'data-placeholder': placeholder,
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "", false);
    }
    // eslint-disable-next-line
  }, [content]);

  if (!editor) return null;

  return (
    <div className={styles.editorWrapper}>
      <div className={styles.tiptapToolbar}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${styles.toolbarBtn} ${editor.isActive("bold") ? styles.isActive : ""}`}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${styles.toolbarBtn} ${editor.isActive("italic") ? styles.isActive : ""}`}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`${styles.toolbarBtn} ${editor.isActive("underline") ? styles.isActive : ""}`}
          title="Underline"
        >
          <span style={{ textDecoration: 'underline' }}>U</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${styles.toolbarBtn} ${editor.isActive("bulletList") ? styles.isActive : ""}`}
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${styles.toolbarBtn} ${editor.isActive("orderedList") ? styles.isActive : ""}`}
          title="Ordered List"
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className={styles.toolbarBtn}
          title="Undo"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className={styles.toolbarBtn}
          title="Redo"
        >
          ↷
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

const JobRequisition: React.FC = () => {
  type Requisition = {
    job_requisition_id: number;
    job_title: string;
    job_category: string;
    job_type: string;
    job_requirements?: string;
    job_responsibilities?: string;
    seekers_required: number;
    posting_date: string;
    status?: string;
    requisition_status?: string;
  };

  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  // Form fields
  const [jobTitle, setJobTitle] = useState("");
  const [jobCategory, setJobCategory] = useState("");
  const [jobType, setJobType] = useState("Full-Time");
  const [seekersRequired, setSeekersRequired] = useState(1);
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  // Modal for viewing requisition details
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [editReq, setEditReq] = useState<any>(null);

  const getSingaporeDateString = () => {
    const now = new Date();
    // Singapore is UTC+8, so add 8 hours to UTC time
    const sgTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return sgTime.toISOString().slice(0, 10);
  };

  useEffect(() => {
    const fetchRequisitions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/my-job-requisitions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          setRequisitions(res.data.data);
        }
      } catch (err) {
        setRequisitions([]);
      }
    };
    fetchRequisitions();
  }, []);

  useEffect(() => {
    if (editReq) {
      setJobTitle(editReq.job_title || "");
      setJobCategory(editReq.job_category || "");
      setJobType(editReq.job_type || "Full-Time");
      setSeekersRequired(editReq.seekers_required || 1);
      setResponsibilities(editReq.job_responsibilities || "");
      setRequirements(editReq.job_requirements || "");
    }
  }, [editReq]);

  // Update handleSubmit to handle both create and edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (editReq) {
        // Edit mode
        const res = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/update-job-requisition/${editReq.job_requisition_id}`,
          {
            jobTitle,
            jobCategory,
            jobType,
            seekersRequired,
            jobResponsibilities: responsibilities,
            jobRequirements: requirements,
            requisition_status: "Amended"
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          setRequisitions((prev) =>
            prev.map((r) =>
              r.job_requisition_id === editReq.job_requisition_id
                ? {
                    ...r,
                    job_title: jobTitle,
                    job_category: jobCategory,
                    job_type: jobType,
                    seekers_required: seekersRequired,
                    job_responsibilities: responsibilities,
                    job_requirements: requirements,
                    requisition_status: "Amended",
                  }
                : r
            )
          );
          setEditReq(null);
          setJobTitle("");
          setJobCategory("");
          setJobType("Full-Time");
          setSeekersRequired(1);
          setResponsibilities("");
          setRequirements("");
          alert("Requisition amended!");
        } else {
          alert(res.data.message || "Failed to amend requisition.");
        }
      } else {
        // Create mode
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-job-requisition`,
          {
            jobTitle,
            jobCategory,
            jobType,
            jobRequirements: requirements,
            jobResponsibilities: responsibilities,
            seekersRequired,
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (res.data.success) {
          alert("Job requisition submitted!");
          setRequisitions([
            ...requisitions,
            {
              job_requisition_id: requisitions.length + 1,
              job_title: jobTitle,
              job_category: jobCategory,
              job_type: jobType,
              job_requirements: requirements,
              job_responsibilities: responsibilities,
              seekers_required: seekersRequired,
              posting_date: getSingaporeDateString(),
              requisition_status: "Pending",
            },
          ]);
          setJobTitle("");
          setJobCategory("");
          setJobType("Full-Time");
          setSeekersRequired(1);
          setResponsibilities("");
          setRequirements("");
        } else {
          alert(res.data.message || "Failed to submit job requisition.");
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit job requisition.");
    }
  };

  function formatDate(dateStr: string) {
    if (!dateStr) return "—";
    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
  }

  return (
    <div className={styles.postJobContainer}>
      {/* TOP SECTION: STATS CARDS */}
      <div className={styles.topSection}>
        <div className={styles.statsGrid}>
          <div className={`${styles.statsCard} ${styles.totalJobsCard}`}>
            <div className={styles.cardIcon}>
              <FileUp size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Requisitions Submitted</h3>
              <span className={styles.cardValue}>{requisitions.length}</span>
              <span className={styles.cardSubtitle}>Total requests</span>
            </div>
          </div>
          <div className={`${styles.statsCard} ${styles.pendingCard}`}>
            <div className={styles.cardIcon}>
              <FileWarning size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Return for Amendment</h3>
              <span className={styles.cardValue}>
                {requisitions.filter(r => r.requisition_status === "Return for Amendment").length}
              </span>
              <span className={styles.cardSubtitle}>Awaiting my amendment</span>
            </div>
          </div>
          <div className={`${styles.statsCard} ${styles.activeCard}`}>
            <div className={styles.cardIcon}>
              <ClipboardCheck size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Verified</h3>
              <span className={styles.cardValue}>
                {requisitions.filter(r => r.status === "Verified").length}
              </span>
              <span className={styles.cardSubtitle}>Verified by HR</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN PANELS: FORM & REQUISITION LIST */}
      <div className={styles.mainPanelsSection}>
        {/* FORM PANEL */}
        <div className={styles.formPanel}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              {editReq ? "✏️ Edit Job Requisition" : "📝 Submit Job Requisition"}
            </h2>
            {editReq && (
              <button
                className={styles.cancelEditBtn}
                type="button"
                onClick={() => {
                  setEditReq(null);
                  setJobTitle("");
                  setJobCategory("");
                  setJobType("Full-Time");
                  setSeekersRequired(1);
                  setResponsibilities("");
                  setRequirements("");
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
          <form className={styles.postJobForm} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formColumn}>
                <div className={styles.formGroup}>
                  <label htmlFor="jobTitle">Job Title *</label>
                  <input
                    type="text"
                    id="jobTitle"
                    className={styles.formInput}
                    placeholder="Enter job title"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="jobCategory">Job Category *</label>
                  <select 
                    id="jobCategory"
                    className={styles.formSelect}
                    value={jobCategory} 
                    onChange={(e) => setJobCategory(e.target.value)} 
                    required
                  >
                    <option value="" disabled>Select category</option>
                    <option value="operative">Operative</option>
                    <option value="academic">Academic</option>
                  </select>
                </div>
              </div>

              <div className={styles.formColumn}>
                <div className={styles.formGroup}>
                  <label htmlFor="seekersRequired">No. of Job Seekers Required *</label>
                  <input
                    type="number"
                    id="seekersRequired"
                    className={styles.formInput}
                    min="1"
                    placeholder="e.g. 2"
                    value={seekersRequired}
                    onChange={(e) => setSeekersRequired(parseInt(e.target.value))}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="jobType">Job Type *</label>
                  <select 
                    id="jobType"
                    className={styles.formSelect}
                    value={jobType} 
                    onChange={(e) => setJobType(e.target.value)} 
                    required
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Job Responsibilities *</label>
              <TiptapEditor
                content={responsibilities}
                onChange={setResponsibilities}
                placeholder=""
              />
            </div>

            <div className={styles.formGroup}>
              <label>Job Requirements *</label>
              <TiptapEditor
                content={requirements}
                onChange={setRequirements}
                placeholder=""
              />
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.submitBtn}>
                <Plus size={16} />
                {editReq ? "Amend Job Requisition" : "Create Job Requisition"}
              </button>
            </div>
          </form>
        </div>

        {/* REQUISITION LIST PANEL */}
        <div className={styles.requisitionPanel}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>📋 My Requisitions</h2>
            <div className={styles.tableStats}>
              <span className={styles.totalCount}>{requisitions.length} Total</span>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.requisitionTable}>
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Requested Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.map((req) => (
                  <tr key={req.job_requisition_id}>
                    <td>{req.job_title}</td>
                    <td>{formatDate(req.posting_date)}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          req.requisition_status === "Pending"
                            ? styles.pending
                            : req.requisition_status === "Verified"
                            ? styles.verified
                            : req.requisition_status === "Amended"
                            ? styles.amended
                            : styles.rejected
                        }`}
                      >
                        {req.requisition_status || "Pending"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.actionBtn}
                          title="View Details"
                          onClick={() => setSelectedReq(req)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className={styles.actionBtn}
                          title="Edit"
                          onClick={() => setEditReq(req)}
                          style={{ marginLeft: 4 }}
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for requisition details */}
      {selectedReq && (
        <div className={styles.modalOverlay}>
          <div className={styles.jobModal}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleSection}>
                <h2 className={styles.modalTitle}>{selectedReq.job_title}</h2>
                <div className={styles.modalSubInfo}>
                  <span className={styles.modalCategory}>
                    {selectedReq.job_category === "academic"
                      ? "Academic"
                      : selectedReq.job_category === "operative"
                      ? "Operative"
                      : selectedReq.job_category}
                  </span>
                  <span className={styles.modalDivider}>•</span>
                  <span className={styles.modalType}>{selectedReq.job_type}</span>
                  <span className={styles.modalDivider}>•</span>
                  <span className={`${styles.modalStatus} ${
                    selectedReq.requisition_status === "Verified"
                      ? styles.verified
                      : selectedReq.requisition_status === "Pending"
                      ? styles.pending
                      : selectedReq.requisition_status === "Return for Amendment"
                      ? styles.rejected
                      : selectedReq.requisition_status === "Amended"
                      ? styles.amended
                      : ""
                  }`}>
                    {selectedReq.requisition_status === "Verified"
                      ? "🟢 Verified"
                      : selectedReq.requisition_status === "Pending"
                      ? "🟡 Pending"
                      : selectedReq.requisition_status === "Return for Amendment"
                      ? "🔴 Return for Amendment"
                      : selectedReq.requisition_status === "Amended"
                      ? "🟠 Amended"
                      : selectedReq.requisition_status}
                  </span>
                </div>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setSelectedReq(null)}>
                ×
              </button>
            </div>
      
            {/* Modal Content */}
            <div className={styles.modalContent}>
              {/* Overview Section */}
              <div className={styles.modalSection}>
                <div className={styles.sectionHeader}>
                  <h3>📋 Job Overview</h3>
                </div>
                <div className={styles.overviewGrid}>
                  <div className={styles.overviewItem}>
                    <span className={styles.overviewLabel}>Date Posted:</span>
                    <span className={styles.overviewValue}>{formatDate(selectedReq.posting_date)}</span>
                  </div>
                  <div className={styles.overviewItem}>
                    <span className={styles.overviewLabel}>Positions Required:</span>
                    <span className={styles.overviewValue}>{selectedReq.seekers_required}</span>
                  </div>
                  
                  <div className={styles.overviewItem}>
                    <span className={styles.overviewLabel}>Job Category:</span>
                    <span className={styles.overviewValue}>
                      {selectedReq.job_category === "academic"
                        ? "Academic"
                        : selectedReq.job_category === "operative"
                        ? "Operative"
                        : selectedReq.job_category}
                    </span>
                  </div>

                  <div className={styles.overviewItem}>
                    <span className={styles.overviewLabel}>Job Type:</span>
                    <span className={styles.overviewValue}>{selectedReq.job_type}</span>
                  </div>
                </div>
              </div>
      
              {/* Responsibilities Section */}
              <div className={styles.modalSection}>
                <div className={styles.sectionHeader}>
                  <h3>💼 Job Responsibilities</h3>
                </div>
                <div className={styles.sectionContent}>
                  <div className={styles.contentBox}>
                    {selectedReq.job_responsibilities ? (
                      <div
                        className={styles.formattedText}
                        dangerouslySetInnerHTML={{ __html: selectedReq.job_responsibilities }}
                      />
                    ) : (
                      <p className={styles.noContent}>No job responsibilities specified.</p>
                    )}
                  </div>
                </div>
              </div>
      
              {/* Requirements Section */}
              <div className={styles.modalSection}>
                <div className={styles.sectionHeader}>
                  <h3>🎯 Job Requirements</h3>
                </div>
                <div className={styles.sectionContent}>
                  <div className={styles.contentBox}>
                    {selectedReq.job_requirements ? (
                      <div
                        className={styles.formattedText}
                        dangerouslySetInnerHTML={{ __html: selectedReq.job_requirements }}
                      />
                    ) : (
                      <p className={styles.noContent}>No job requirements specified.</p>
                    )}
                  </div>
                </div>
              </div>
      
              {/* Remarks Section */}
              {selectedReq.remarks && (
                <div className={styles.modalSection}>
                  <div className={styles.sectionHeader}>
                    <h3>📝 Remarks</h3>
                  </div>
                  <div className={styles.sectionContent}>
                    <div className={styles.remarksBox}>
                      {selectedReq.remarks}
                    </div>
                  </div>
                </div>
              )}
            </div>
      
            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              <div className={styles.modalActions}>
                <button className={styles.closeModalBtn} onClick={() => setSelectedReq(null)}>
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

export default JobRequisition;