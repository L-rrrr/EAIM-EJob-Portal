import { useState } from "react";
import styles from "./JobRequisition.module.css";
import { Plus, Eye, Calendar, Users } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";


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

const JobRequisition: React.FC = () => {
  // Example requisitions with status
  const [requisitions, setRequisitions] = useState([
    { id: 1, name: "Rachel Tan", jobTitle: "Preschool Teacher", requestedDate: "2025-06-10", status: "Pending" },
    { id: 2, name: "James Lim", jobTitle: "Operations Executive", requestedDate: "2025-06-11", status: "Approved" },
    { id: 3, name: "Aisyah Binte Rahman", jobTitle: "Finance Officer", requestedDate: "2025-06-12", status: "Rejected" },
  ]);
  // Form fields
  const [jobTitle, setJobTitle] = useState("");
  const [jobCategory, setJobCategory] = useState("");
  const [jobType, setJobType] = useState("Full-Time");
  const [seekersRequired, setSeekersRequired] = useState(1);
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  // Modal for viewing requisition details
  const [selectedReq, setSelectedReq] = useState<any>(null);

  // Submit handler (simulate sending request)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRequisitions([
      ...requisitions,
      {
        id: requisitions.length + 1,
        name: "You",
        jobTitle,
        requestedDate: new Date().toISOString().slice(0, 10),
        status: "Pending",
      },
    ]);
    setJobTitle("");
    setJobCategory("");
    setJobType("Full-Time");
    setSeekersRequired(1);
    setResponsibilities("");
    setRequirements("");
  };

  return (
    <div className={styles.postJobContainer}>
      {/* TOP SECTION: STATS CARDS */}
      <div className={styles.topSection}>
        <div className={styles.statsGrid}>
          <div className={`${styles.statsCard} ${styles.totalJobsCard}`}>
            <div className={styles.cardIcon}>
              <Plus size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Requisitions Submitted</h3>
              <span className={styles.cardValue}>{requisitions.length}</span>
              <span className={styles.cardSubtitle}>Total requests</span>
            </div>
          </div>
          <div className={`${styles.statsCard} ${styles.pendingCard}`}>
            <div className={styles.cardIcon}>
              <Calendar size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Pending</h3>
              <span className={styles.cardValue}>
                {requisitions.filter(r => r.status === "Pending").length}
              </span>
              <span className={styles.cardSubtitle}>Awaiting review</span>
            </div>
          </div>
          <div className={`${styles.statsCard} ${styles.activeCard}`}>
            <div className={styles.cardIcon}>
              <Users size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Approved</h3>
              <span className={styles.cardValue}>
                {requisitions.filter(r => r.status === "Approved").length}
              </span>
              <span className={styles.cardSubtitle}>Approved requests</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN PANELS: FORM & REQUISITION LIST */}
      <div className={styles.mainPanelsSection}>
        {/* FORM PANEL */}
        <div className={styles.formPanel}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>📝 Submit Job Requisition</h2>
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
                Post Job
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.map((req) => (
                  <tr key={req.id}>
                    <td>{req.name}</td>
                    <td>{req.jobTitle}</td>
                    <td>{req.requestedDate}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          req.status === "Pending"
                            ? styles.pending
                            : req.status === "Approved"
                            ? styles.approved
                            : styles.rejected
                        }`}
                      >
                        {req.status}
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
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{selectedReq.jobTitle}</h2>
              <button className={styles.modalCloseBtn} onClick={() => setSelectedReq(null)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div><strong>Requestor:</strong> {selectedReq.name}</div>
              <div><strong>Date:</strong> {selectedReq.requestedDate}</div>
              <div><strong>Status:</strong> <span
                className={`${styles.statusBadge} ${
                  selectedReq.status === "Pending"
                    ? styles.pending
                    : selectedReq.status === "Approved"
                    ? styles.approved
                    : styles.rejected
                }`}
              >{selectedReq.status}</span></div>
              <div style={{ marginTop: 16 }}>
                <strong>Responsibilities:</strong>
                <div>{selectedReq.responsibilities || "N/A"}</div>
              </div>
              <div style={{ marginTop: 8 }}>
                <strong>Requirements:</strong>
                <div>{selectedReq.requirements || "N/A"}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobRequisition;