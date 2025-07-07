import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import axios from "axios";
import styles from "./PostJob.module.css";

import {
  Plus,
  Edit,
  Eye,
  Calendar,
  Users,
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
  const [mode, setMode] = useState("post");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobCategory, setJobCategory] = useState("");
  const [hiringStatus, setHiringStatus] = useState("Hiring");
  const [jobType, setJobType] = useState("Full-Time");
  const [seekersRequired, setSeekersRequired] = useState(1);
  const [requisitions, setRequisitions] = useState([
    { id: 1, name: "Rachel Tan", jobTitle: "Preschool Teacher", requestedDate: "2025-06-10", status: "Pending" },
    { id: 2, name: "James Lim", jobTitle: "Operations Executive", requestedDate: "2025-06-11", status: "Pending" },
    { id: 3, name: "Aisyah Binte Rahman", jobTitle: "Finance Officer", requestedDate: "2025-06-12", status: "Pending" },
  ]);

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
              <Plus size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Jobs Posted Today</h3>
              <span className={styles.cardValue}>0</span>
              <span className={styles.cardSubtitle}>New postings</span>
            </div>
          </div>

          <div className={`${styles.statsCard} ${styles.pendingCard}`}>
            <div className={styles.cardIcon}>
              <Calendar size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Pending Requisitions</h3>
              <span className={styles.cardValue}>{requisitions.length}</span>
              <span className={styles.cardSubtitle}>Awaiting review</span>
            </div>
          </div>

          <div className={`${styles.statsCard} ${styles.activeCard}`}>
            <div className={styles.cardIcon}>
              <Users size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Active Positions</h3>
              <span className={styles.cardValue}>12</span>
              <span className={styles.cardSubtitle}>Currently hiring</span>
            </div>
          </div>
        </div>
      </div>

      {/* POST JOB FORM PANEL */}
      <div className={styles.mainPanelsSection}>
        <div className={styles.formPanel}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              {mode === "post" ? "📝 Post New Job" : "✏️ Edit Job"}
            </h2>
            <div className={styles.toggleButtons}>
              <button
                className={`${styles.toggleBtn} ${mode === "post" ? styles.active : ""}`}
                onClick={() => setMode("post")}
              >
                <Plus size={16} />
                Post Job
              </button>
              <button
                className={`${styles.toggleBtn} ${mode === "edit" ? styles.active : ""}`}
                onClick={() => setMode("edit")}
              >
                <Edit size={16} />
                Edit Job
              </button>
            </div>
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
                    <option value="">Select category</option>
                    <option value="manager">Manager / Executive</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="others">Others</option>
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
              <button type="button" className={styles.cancelBtn}>
                Cancel
              </button>
              <button type="submit" className={styles.submitBtn}>
                <Plus size={16} />
                {mode === "post" ? "Post Job" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* BOTTOM SECTION: REQUISITION LIST */}
        <div className={styles.requisitionPanel}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>📋 Requisition List</h2>
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
                  <tr key={req.id}>
                    <td>{req.name}</td>
                    <td>{req.jobTitle}</td>
                    <td>{req.requestedDate}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles.pending}`}>
                        {req.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button className={styles.actionBtn} title="View Details">
                          <Eye size={14} />
                        </button>
                        <button className={styles.reviewBtn} title="Review Request">
                          Review
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
    </div>
  );
};

export default PostJob;