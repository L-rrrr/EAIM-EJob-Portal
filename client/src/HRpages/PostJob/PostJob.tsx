import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import axios from "axios";
import styles from "./PostJob.module.css";

import {
  Plus,
  Eye,
  SquarePen,
  ClipboardCheck,
  FileWarning,
  FileUp
} from "lucide-react";

// Replace the TiptapEditor component with this version
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

const PostJob: React.FC = () => {
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobCategory, setJobCategory] = useState("");
  const [hiringStatus, setHiringStatus] = useState("Hiring");
  const [jobType, setJobType] = useState("Full-Time");
  const [seekersRequired, setSeekersRequired] = useState(1);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [viewReq, setViewReq] = useState<any>(null);
  const [reviewReq, setReviewReq] = useState<any>(null);
  const [reviewForm, setReviewForm] = useState<any>(null);
  const [reviewRemarks, setReviewRemarks] = useState("");

  type Requisition = {
    job_requisition_id: string | number;
    requestor_name?: string;
    user_id?: string;
    job_title?: string;
    posting_date?: string;
    requisition_status?: string;
  };
  

  const fetchRequisitions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/all-job-requisitions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setRequisitions(res.data.data);
      }
    } catch (err) {
      setRequisitions([]);
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, []);

  function formatDate(dateStr: string) {
    if (!dateStr) return "—";
    // Handles both 'YYYY-MM-DD' and 'YYYY-MM-DD HH:MM:SS'
    const [date] = dateStr.split(" ");
    const [year, month, day] = date.split("-");
    return `${day}-${month}-${year}`;
  }

  const handleViewRequisition = async (req: Requisition) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/job-requisition/${req.job_requisition_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setViewReq(res.data.data);
      } else {
        alert("Failed to load requisition details.");
      }
    } catch (err) {
      alert("Failed to load requisition details.");
    }
  };

  const handleReviewRequisition = async (req: Requisition) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/job-requisition/${req.job_requisition_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setReviewReq(res.data.data);
        setReviewForm({ ...res.data.data });
        setReviewRemarks(res.data.data.remarks || "");
      }
    } catch (err) {
      alert("Failed to load requisition details.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/post-jobs`, {
        jobTitle,
        jobCategory,
        jobType,
        hiringStatus,
        jobRequirements: requirements,
        jobResponsibilities: responsibilities,
        seekersRequired,
      });
      
      alert("Job posted successfully!");
      // Reset form
      setJobTitle("");
      setJobCategory("");
      setResponsibilities("");
      setRequirements("");
      setSeekersRequired(1);
    } catch (error) {
      alert("Failed to post job.");
      console.error(error);
    }
  };

  return (
    <div className={styles.postJobContainer}>
      {/* TOP SECTION: POST JOB FORM AND STATS */}
      <div className={styles.topSection}>
        {/* STATS CARDS */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statsCard} ${styles.totalJobsCard}`}>
            <div className={styles.cardIcon}>
              <FileUp size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Jobs Posted Today</h3>
              <span className={styles.cardValue}>0</span>
              <span className={styles.cardSubtitle}>New postings</span>
            </div>
          </div>

          <div className={`${styles.statsCard} ${styles.pendingCard}`}>
            <div className={styles.cardIcon}>
              <FileWarning size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Pending Requisitions</h3>
              <span className={styles.cardValue}>
                {requisitions.filter(
                  req =>
                    req.requisition_status === "Pending" ||
                    req.requisition_status === "Amended"
                ).length}
              </span>
              <span className={styles.cardSubtitle}>Awaiting my review</span>
            </div>
          </div>

          <div className={`${styles.statsCard} ${styles.activeCard}`}>
            <div className={styles.cardIcon}>
              <ClipboardCheck size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Verified Requisitions</h3>
              <span className={styles.cardValue}>
                {requisitions.filter(req => req.requisition_status === "Verified").length}
              </span>
              <span className={styles.cardSubtitle}>Awaiting to be posted</span>
            </div>
          </div>
        </div>
      </div>

      {/* POST JOB FORM PANEL */}
      <div className={styles.mainPanelsSection}>
        <div className={styles.formPanel}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              📝 Post New Job
            </h2>
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

                <div className={styles.formGroup}>
                  <label htmlFor="hiringStatus">Hiring Status *</label>
                  <select 
                    id="hiringStatus"
                    className={styles.formSelect}
                    value={hiringStatus} 
                    onChange={(e) => setHiringStatus(e.target.value)} 
                    required
                  >
                    <option value="Hiring">Hiring</option>
                    <option value="Not Hiring">Not Hiring</option>
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
                Post Job
              </button>
            </div>
          </form>
        </div>

        {/* BOTTOM SECTION: REQUISITION LIST */}
        <div className={styles.requisitionPanel}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>📋 Job Requisition List</h2>
            <div className={styles.tableStats}>
              <span className={styles.totalCount}>{requisitions.length} Pending Requests</span>
            </div>
          </div>
          
          <div className={styles.tableWrapper}>
            <table className={styles.requisitionTable}>
              <thead>
                <tr>
                  <th>Requestor Name</th>
                  <th>Job Title</th>
                  <th>Requested Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.map((req) => (
                  <tr key={req.job_requisition_id}>
                    <td>{req.requestor_name || req.user_id || "—"}</td>
                    <td>{req.job_title || "—"}</td>
                    <td>{formatDate(req.posting_date ?? "")}</td>
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
                        {req.requisition_status === "Verified" ? (
                          <>
                            <button
                              className={styles.actionBtn}
                              title="Review"
                              onClick={() => handleReviewRequisition(req)}
                            >
                              <SquarePen size={14} />
                            </button>
                            <button
                              className={styles.actionBtn}
                              title="Post Job"
                              onClick={() => handleViewRequisition(req)}
                            >
                              Post Job
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className={styles.actionBtn}
                              title="View Details"
                              onClick={() => handleViewRequisition(req)}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              className={styles.actionBtn}
                              title="Review"
                              onClick={() => handleReviewRequisition(req)}
                            >
                              <SquarePen size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {viewReq && (
        <div className={styles.modalOverlay}>
          <div className={styles.jobModal}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleSection}>
                <h2 className={styles.modalTitle}>{viewReq.job_title}</h2>
                <div className={styles.modalSubInfo}>
                  <span className={styles.modalCategory}>
                    {viewReq.job_category === "academic"
                      ? "Academic"
                      : viewReq.job_category === "operative"
                      ? "Operative"
                      : viewReq.job_category}
                  </span>
                  <span className={styles.modalDivider}>•</span>
                  <span className={styles.modalType}>{viewReq.job_type}</span>
                  <span className={styles.modalDivider}>•</span>
                  <span className={`${styles.modalStatus} ${
                    viewReq.requisition_status === "Verified"
                      ? styles.verified
                      : viewReq.requisition_status === "Pending"
                      ? styles.pending
                      : viewReq.requisition_status === "Return for Amendment"
                      ? styles.rejected
                      : ""
                  }`}>
                    {viewReq.requisition_status === "Verified"
                      ? "🟢 Verified"
                      : viewReq.requisition_status === "Pending"
                      ? "🟡 Pending"
                      : viewReq.requisition_status === "Return for Amendment"
                      ? "🔴 Return for Amendment"
                      : viewReq.requisition_status === "Amended"
                      ? "🟠 Amended"
                      : viewReq.requisition_status}
                  </span>
                </div>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setViewReq(null)}>
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
                    <span className={styles.overviewValue}>{formatDate(viewReq.posting_date)}</span>
                  </div>
                  <div className={styles.overviewItem}>
                    <span className={styles.overviewLabel}>Positions Required:</span>
                    <span className={styles.overviewValue}>{viewReq.seekers_required}</span>
                  </div>
                  <div className={styles.overviewItem}>
                    <span className={styles.overviewLabel}>Requestor:</span>
                    <span className={styles.overviewValue}>{viewReq.requestor_name || viewReq.user_id || "—"}</span>
                  </div>
                  <div className={styles.overviewItem}>
                    <span className={styles.overviewLabel}>Job Category:</span>
                    <span className={styles.overviewValue}>
                      {viewReq.job_category === "academic"
                        ? "Academic"
                        : viewReq.job_category === "operative"
                        ? "Operative"
                        : viewReq.job_category}
                    </span>
                  </div>
                  <div className={styles.overviewItem}>
                    <span className={styles.overviewLabel}>Job Type:</span>
                    <span className={styles.overviewValue}>{viewReq.job_type || "—"}</span>
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
                    {viewReq.job_responsibilities ? (
                      <div
                        className={styles.formattedText}
                        dangerouslySetInnerHTML={{ __html: viewReq.job_responsibilities }}
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
                    {viewReq.job_requirements ? (
                      <div
                        className={styles.formattedText}
                        dangerouslySetInnerHTML={{ __html: viewReq.job_requirements }}
                      />
                    ) : (
                      <p className={styles.noContent}>No job requirements specified.</p>
                    )}
                  </div>
                </div>
              </div>
      
              {/* Remarks Section */}
              {viewReq.remarks && (
                <div className={styles.modalSection}>
                  <div className={styles.sectionHeader}>
                    <h3>📝 Remarks</h3>
                  </div>
                  <div className={styles.sectionContent}>
                    <div className={styles.remarksBox}>
                      {viewReq.remarks}
                    </div>
                  </div>
                </div>
              )}
            </div>
      
            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              <div className={styles.modalActions}>
                <button className={styles.closeModalBtn} onClick={() => setViewReq(null)}>
                  Close
                </button>
                {viewReq.requisition_status === "Verified" && (
                  <button
                    className={styles.saveEditBtn}
                    onClick={async () => {
                      const token = localStorage.getItem("token");
                      const res = await axios.post(
                        `${import.meta.env.VITE_BACKEND_URL}/job-requisition/${viewReq.job_requisition_id}/post-job`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      if (res.data.success) {
                        alert("Job posted successfully!");
                        setViewReq(null);
                        fetchRequisitions(); // Refresh list
                      } else {
                        alert(res.data.message || "Failed to post job.");
                      }
                    }}
                  >
                    Post Job
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {reviewReq && (
        <div className={styles.modalOverlay}>
          <div className={styles.editModal}>
            {/* Edit Modal Header */}
            <div className={styles.editModalHeader}>
              <div className={styles.editModalTitleSection}>
                <h2 className={styles.editModalTitle}>✏️ Edit Job Requisition</h2>
                <p className={styles.editModalSubtitle}>Update requisition information</p>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setReviewReq(null)}>
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
                  value={reviewForm.job_title}
                  onChange={e => setReviewForm({ ...reviewForm, job_title: e.target.value })}
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
                    value={reviewForm.job_category}
                    onChange={e => setReviewForm({ ...reviewForm, job_category: e.target.value })}
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
                    value={reviewForm.job_type}
                    onChange={e => setReviewForm({ ...reviewForm, job_type: e.target.value })}
                  >
                    <option value="">Select Type</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
              </div>
      
              {/* Seekers Required */}
              <div className={styles.editFormGroup}>
                <label className={styles.editFormLabel}>
                  Seekers Required <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className={styles.editFormInput}
                  value={reviewForm.seekers_required}
                  onChange={e => setReviewForm({ ...reviewForm, seekers_required: parseInt(e.target.value) })}
                  placeholder="Number of positions"
                />
              </div>
      
              {/* Job Responsibilities */}
              <div className={styles.editFormGroup}>
                <label className={styles.editFormLabel}>Job Responsibilities</label>
                <TiptapEditor
                  content={reviewForm.job_responsibilities}
                  onChange={content => setReviewForm({ ...reviewForm, job_responsibilities: content })}
                  placeholder=""
                />
              </div>
      
              {/* Job Requirements */}
              <div className={styles.editFormGroup}>
                <label className={styles.editFormLabel}>Job Requirements</label>
                <TiptapEditor
                  content={reviewForm.job_requirements}
                  onChange={content => setReviewForm({ ...reviewForm, job_requirements: content })}
                  placeholder=""
                />
              </div>
      
              {/* Remarks for Return for Amendment */}
              <div className={styles.editFormGroup}>
                <label className={styles.editFormLabel}>Remarks (for Return for Amendment)</label>
                <textarea
                  className={styles.editFormInput}
                  value={reviewRemarks}
                  onChange={e => setReviewRemarks(e.target.value)}
                  placeholder="Advice for amendment (if any)"
                />
              </div>
            </div>
      
            {/* Edit Modal Footer */}
            <div className={styles.editModalFooter}>
              <div className={styles.editModalActions}>
                <button
                  className={styles.saveEditBtn}
                  onClick={async () => {
                    const token = localStorage.getItem("token");
                    await axios.put(
                      `${import.meta.env.VITE_BACKEND_URL}/job-requisition/${reviewReq.job_requisition_id}/review`,
                      {
                        ...reviewForm,
                        requisition_status: "Verified",
                        remarks: ""
                      },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    alert("Job requisition verified!");
                    setReviewReq(null);
                    fetchRequisitions();
                  }}
                >
                  Verified
                </button>
                <button
                  className={styles.returnEditBtn}
                  onClick={async () => {
                    if (!reviewRemarks.trim()) {
                      alert("Please provide remarks for amendment.");
                      return;
                    }
                    const token = localStorage.getItem("token");
                    await axios.put(
                      `${import.meta.env.VITE_BACKEND_URL}/job-requisition/${reviewReq.job_requisition_id}/review`,
                      {
                        ...reviewForm,
                        requisition_status: "Return for Amendment",
                        remarks: reviewRemarks
                      },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    alert("Job requisition returned for amendment!");
                    setReviewReq(null);
                    fetchRequisitions();
                  }}
                >
                  Return for Amendment
                </button>
                <button className={styles.cancelEditBtn} onClick={() => setReviewReq(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostJob;