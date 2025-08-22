/**
 * Assessment Page
 *
 * This component allows managers to assess job applicants by filling out a detailed interview assessment form.
 * It also displays lists of pending and completed assessments, and allows viewing completed assessment details.
 *
 * Features:
 * - Fetches pending and completed applications for review from the backend.
 * - Allows managers to select a pending application and submit a multi-question assessment.
 * - Displays completed assessments in read-only mode.
 * - Calculates candidate age from date of birth.
 * - Handles form state, submission, and validation.
 * - Responsive UI with loading states and stats cards.
 *
 * State:
 * - form: Holds all assessment form field values.
 * - loadingReviewApps: Loading state for fetching applications.
 * - selectedApp: The application currently being assessed.
 * - pendingApps: List of applications awaiting assessment.
 * - completedApps: List of applications with completed assessments.
 * - selectedCompletedApp: The completed assessment currently being viewed.
 *
 * Dependencies:
 * - fetch API for HTTP requests.
 * - React useState, useEffect for state and lifecycle.
 * - lucide-react for icons.
 * - Assessment.module.css for styling.
 *
 * @component
 */

import { useState, useEffect } from "react";
import styles from "./Assessment.module.css";
import { Plus, Users, ClipboardList } from "lucide-react";

const ratingOptions = ["1", "2", "3", "4", "5"];

const overallImpressionOptions = [
  { value: "1", label: "Definitely Unacceptable" },
  { value: "2", label: "Unsatisfactory/Only Marginal" },
  { value: "3", label: "Satisfactory" },
  { value: "4", label: "Very Satisfactory" },
  { value: "5", label: "Outstanding" }
];

const recommendationOptions = [
  { value: "1", label: "Not Recommended" },
  { value: "2", label: "Recommended" },
  { value: "3", label: "Highly Recommended" },
  { value: "4", label: "KIV" }
];

const initialState = {
  candidateName: "",
  age: "",
  department: "",
  position: "",
  currentSalary: "",
  expectedSalary: "",
  interviewer: "",
  noticePeriod: "",
  interviewDate: "",
  interviewTime: "",
  q1: "5",
  q1_remark: "",
  q2: "5",
  q2_remark: "",
  q3: "5",
  q3_remark: "",
  q4: "5",
  q4_remark: "",
  q5: "5",
  q5_remark: "",
  q6: "5",
  q6_remark: "",
  q7: "5",
  q7_remark: "",
  q8: "5",
  q8_remark: "",
  q9: "5",
  q9_remark: "",
  q10: "5",
  q10_remark: "",
  q11: "5",
  q11_remark: "",
  q12: "5",
  q12_remark: "",
  q13: "5",
  q13_remark: "",
  q14: "5",
  comments: ""
};

const questionList = [
  {
    key: "q1",
    label: "Education & Training",
    desc: "(Sufficient education, grades of relevant subjects, appropriate qualifications for the job)"
  },
  {
    key: "q2",
    label: "Work/ Relevant Experience",
    desc: "(Technical/Supervisor/ Administrative experience)"
  },
  {
    key: "q3",
    label: "Proven Producer Role",
    desc: "(Past key successes -projects & $ amount or total annual revenue achieved)"
  },
  {
    key: "q4",
    label: "Appearance",
    desc: "(Neat, pleasant, smart, sloppy, sickly, robust)"
  },
  {
    key: "q5",
    label: "Personality",
    desc: "(Cheerful, sociable, likeable, assertive, sense of humour, confident, outgoing, polite, shy, unresponsive)"
  },
  {
    key: "q6",
    label: "Attitude/ Team Player",
    desc: ""
  },
  {
    key: "q7",
    label: "Character/ Temperament",
    desc: "(Sincere, trustworthy, disciplined, responsible, emotionally mature, independent, passive, weak, indecisive)"
  },
  {
    key: "q8",
    label: "Ability To Communicate",
    desc: "(Coherent, persuasive, able to listen, fluent, long-winded)"
  },
  {
    key: "q9",
    label: "Motivation",
    desc: "(Reason for application enthusiastic, conscientious, indifferent)"
  },
  {
    key: "q10",
    label: "Mental Alertness",
    desc: "(Intelligent, sharp, logical reasoning, sound judgment, well-informed, naive, slow)"
  },
  {
    key: "q11",
    label: "Leadership Qualities",
    desc: "(Sufficient education, grades of relevant subjects, appropriate qualifications for the job)"
  },
  {
    key: "q12",
    label: "Job Stability",
    desc: "(Steady employment record, job-hopper)"
  }
];

const Assessment: React.FC = () => {
  const [form, setForm] = useState(initialState);
  const [loadingReviewApps, setLoadingReviewApps] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [pendingApps, setPendingApps] = useState<any[]>([]);
  const [completedApps, setCompletedApps] = useState<any[]>([]);
  const [selectedCompletedApp, setSelectedCompletedApp] = useState<any | null>(null);

  useEffect(() => {
    const fetchReviewApps = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/manager-review-applications`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success) {
          setPendingApps(data.pending);
          setCompletedApps(data.completed);
        }
      } finally {
        setLoadingReviewApps(false);
      }
    };
    fetchReviewApps();
  }, []);

  // When an application is selected, prefill the form with its info (and disable editing for those fields)
  useEffect(() => {
    if (selectedApp) {
      // Calculate age from date_of_birth
      let age = "";
      if (selectedApp.date_of_birth) {
        const dob = new Date(selectedApp.date_of_birth);
        const today = new Date();
        age = String(today.getFullYear() - dob.getFullYear() - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0));
      }
      setForm(prev => ({
        ...prev,
        candidateName: selectedApp.candidate_name || "",
        age: age,
        department: selectedApp.department || "",
        position: selectedApp.job_title || "",
        currentSalary: selectedApp.current_salary ? String(selectedApp.current_salary) : "",
        expectedSalary: selectedApp.expected_salary ? String(selectedApp.expected_salary) : "",
        interviewer: "",
        noticePeriod: "",
        interviewDate: selectedApp.interview_date ? selectedApp.interview_date.slice(0, 10) : "",
        interviewTime: selectedApp.interview_time || "",
        // keep other fields as is
      }));
    } else {
      setForm(initialState);
    }
  }, [selectedApp]);

    // Fetch completed assessment details when a completed row is clicked
  const handleViewCompleted = async (app: any) => {
    setLoadingReviewApps(true);
    setSelectedCompletedApp(null);
    setSelectedApp(null);
    try {
      const token = localStorage.getItem("token");
      // Fetch the assessment details for this application_id
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/get-assessment-details/${app.application_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success && data.assessment) {
        setSelectedCompletedApp({ 
          ...app, 
          ...data.assessment,
          candidateName: data.assessment.candidate_name,
          currentSalary: data.assessment.current_salary,
          expectedSalary: data.assessment.expected_salary,
          interviewDate: data.assessment.interview_date,
          interviewTime: data.assessment.interview_time
        });
      }
    } finally {
      setLoadingReviewApps(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedApp) {
    alert("Please select an application to assess.");
    return;
  }
  try {
    const token = localStorage.getItem("token");
    const payload = { 
      application_id: selectedApp.application_id,
      candidate_name: form.candidateName,
      age: form.age,
      department: form.department,
      position: form.position,
      current_salary: form.currentSalary,
      expected_salary: form.expectedSalary,
      interviewer: form.interviewer,
      notice_period: form.noticePeriod,
      interview_date: form.interviewDate,
      interview_time: form.interviewTime,
      q1: form.q1,
      q1_remark: form.q1_remark,
      q2: form.q2,
      q2_remark: form.q2_remark,
      q3: form.q3,
      q3_remark: form.q3_remark,
      q4: form.q4,
      q4_remark: form.q4_remark,
      q5: form.q5,
      q5_remark: form.q5_remark,
      q6: form.q6,
      q6_remark: form.q6_remark,
      q7: form.q7,
      q7_remark: form.q7_remark,
      q8: form.q8,
      q8_remark: form.q8_remark,
      q9: form.q9,
      q9_remark: form.q9_remark,
      q10: form.q10,
      q10_remark: form.q10_remark,
      q11: form.q11,
      q11_remark: form.q11_remark,
      q12: form.q12,
      q12_remark: form.q12_remark,
      q13: form.q13,
      q13_remark: form.q13_remark,
      q14: form.q14,
      comments: form.comments,
    };
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/save-assessment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    alert("Interview assessment submitted!");
    setForm(initialState);
    setSelectedApp(null);
    setLoadingReviewApps(true);
    // Refresh lists
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/manager-review-applications`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    if (data.success) {
      setPendingApps(data.pending);
      setCompletedApps(data.completed);
    }
    setLoadingReviewApps(false);
  } catch {
    alert("Failed to submit assessment.");
  }
};

  // First 10 fields for the 4-column grid
  const first10Fields = [
    { name: "candidateName", label: "Candidate Name", required: true, type: "text", disabled: true },
    { name: "age", label: "Age", required: true, type: "number", disabled: false },
    { name: "department", label: "Department", required: true, type: "text", disabled: false },
    { name: "position", label: "Position Applied", required: true, type: "text", disabled: true },
    { name: "currentSalary", label: "Current Salary ($)", required: false, type: "number", disabled: false },
    { name: "expectedSalary", label: "Expected Salary ($)", required: false, type: "number", disabled: false },
    { name: "interviewer", label: "Interviewer Name", required: true, type: "text", disabled: false },
    { name: "noticePeriod", label: "Notice Period", required: false, type: "text", disabled: false },
    { name: "interviewDate", label: "Interview Date", required: true, type: "date", disabled: false },
    { name: "interviewTime", label: "Interview Time", required: true, type: "time", disabled: false }
  ];

  return (
    <div className={styles.postJobContainer}>
      {/* TOP SECTION: STATS CARDS */}
      <div className={styles.topSection}>
        <div className={styles.statsGrid}>
          <div className={`${styles.statsCard} ${styles.totalJobsCard}`}>
            <div className={styles.cardIcon}>
              <ClipboardList size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Assessments Submitted</h3>
              <span className={styles.cardValue}>{completedApps.length}</span>
              <span className={styles.cardSubtitle}>Total assessments</span>
            </div>
          </div>
          <div className={`${styles.statsCard} ${styles.pendingCard}`}>
            <div className={styles.cardIcon}>
              <Users size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Pending</h3>
              <span className={styles.cardValue}>{pendingApps.length}</span>
              <span className={styles.cardSubtitle}>Awaiting review</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Assessment List */}
      <div className={styles.reviewListPanel}>
        <h3 className={styles.reviewListTitle}>Pending Assessment</h3>
        {loadingReviewApps ? (
          <div className={styles.reviewListLoading}>Loading...</div>
        ) : pendingApps.length === 0 ? (
          <div className={styles.reviewListEmpty}>No applications to review.</div>
        ) : (
          <table className={styles.reviewListTable}>
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Applied Job</th>
                <th>Interview Date</th>
                <th>Assigned by</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingApps.map(app => (
                <tr key={app.application_id}>
                  <td>{app.candidate_name}</td>
                  <td>{app.job_title}</td>
                  <td>{app.interview_date ? app.interview_date.slice(0, 10) : "—"}</td>
                  <td>{app.assigned_by || "—"}</td>
                  <td>
                    <button
                      className={styles.selectBtn}
                      onClick={() => {
                        setSelectedApp(app);
                        setSelectedCompletedApp(null);
                      }}
                    >
                      Assess
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Completed Assessment List */}
      <div className={styles.reviewListPanel}>
        <h3 className={styles.reviewListTitle}>Completed Assessment</h3>
        {loadingReviewApps ? (
          <div className={styles.reviewListLoading}>Loading...</div>
        ) : completedApps.length === 0 ? (
          <div className={styles.reviewListEmpty}>No completed assessments.</div>
        ) : (
          <table className={styles.reviewListTable}>
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Applied Job</th>
                <th>Interview Date</th>
                <th>Assessed On</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {completedApps.map(app => (
                <tr key={app.application_id}>
                  <td>{app.candidate_name}</td>
                  <td>{app.job_title}</td>
                  <td>{app.interview_date ? app.interview_date.slice(0, 10) : "—"}</td>
                  <td>{app.assessment_date ? app.assessment_date.slice(0, 10) : "—"}</td>
                  <td>
                    <button
                      className={styles.selectBtn}
                      onClick={() => handleViewCompleted(app)}
                    >
                      View
                    </button>
                  </td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Completed Assessment Details Form */}
      {selectedCompletedApp && (
        <div className={styles.mainPanelsSection}>
          <div className={styles.formPanel}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>📝 Completed Assessment Details</h2>
              <button
                type="button"
                className={styles.collapseBtn}
                onClick={() => setSelectedCompletedApp(null)}
              >
                Hide
              </button>
            </div>
            <form className={styles.postJobForm}>
              {/* 4-column grid for first 10 fields */}
              <div className={styles.formSection}>
                {first10Fields.map(field => (
                  <div className={styles.inputGroup} key={field.name}>
                    <label className={styles.labelText}>
                      {field.label}
                      {field.required && <span className={styles.requiredAsterisk}>*</span>}
                    </label>
                    <input
                      className={styles.input}
                      name={field.name}
                      type={field.type}
                      value={selectedCompletedApp[field.name] || ""}
                      disabled // All fields are disabled for completed assessment
                      readOnly
                    />
                  </div>
                ))}
              </div>
              <div className={styles.sectionDivider} />
              <div className={styles.questionsSection}>
                <div className={styles.mcqInstruction}>
                  Please rate each aspect below. <strong>1</strong> means <strong>Very Poor</strong> and <strong>5</strong> means <strong>Excellent</strong>.
                </div>
                {questionList.map((q, idx) => (
                  <div className={styles.questionBlock} key={q.key}>
                    <div className={styles.questionHeader}>
                      <span className={styles.questionNumber}>{idx + 1}.</span>
                      <span className={styles.questionTitle}>{q.label}</span>
                      <span className={styles.questionDesc}>{q.desc}</span>
                    </div>
                    <div className={styles.ratingRow}>
                      {ratingOptions.map((opt) => (
                        <label key={opt} className={styles.ratingLabel}>
                          <input
                            type="radio"
                            name={q.key}
                            value={opt}
                            checked={String(selectedCompletedApp[q.key]) === String(opt)}
                            disabled
                            readOnly
                          />
                          <span className={styles.ratingValue}>{opt}</span>
                        </label>
                      ))}
                    </div>
                    <textarea
                      className={styles.remarkInput}
                      name={`${q.key}_remark`}
                      placeholder="Remark"
                      value={selectedCompletedApp[`${q.key}_remark`] || ""}
                      disabled
                      readOnly
                    />
                  </div>
                ))}
              </div>
              <div className={styles.sectionDivider} />
              <div className={styles.questionBlock}>
                <div className={styles.questionHeader}>
                  <span className={styles.questionNumber}>13.</span>
                  <span className={styles.questionTitle}>Overall Impression</span>
                </div>
                <div className={styles.ratingRow}>
                  {overallImpressionOptions.map(opt => (
                    <label key={opt.value} className={styles.ratingLabel}>
                      <input
                        type="radio"
                        name="q13"
                        value={opt.value}
                        checked={String(selectedCompletedApp.q13) === String(opt.value)}
                        disabled
                        readOnly
                      />
                      <span className={styles.ratingValue}>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <textarea
                  className={styles.remarkInput}
                  name="q13_remark"
                  placeholder="Remark"
                  value={selectedCompletedApp.q13_remark || ""}
                  disabled
                  readOnly
                />
              </div>
              <div className={styles.questionBlock}>
                <div className={styles.questionHeader}>
                  <span className={styles.questionNumber}>14.</span>
                  <span className={styles.questionTitle}>Interviewer's Recommendation</span>
                </div>
                <div className={styles.ratingRow}>
                  {recommendationOptions.map(opt => (
                    <label key={opt.value} className={styles.ratingLabel}>
                      <input
                        type="radio"
                        name="q14"
                        value={opt.value}
                        // checked={selectedCompletedApp.q14 === opt.value}
                        checked={String(selectedCompletedApp.q14) === String(opt.value)}
                        disabled
                        readOnly
                      />
                      <span className={styles.ratingValue}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Comments (Summary of candidate)</label>
                <textarea
                  className={styles.remarkInput}
                  name="comments"
                  placeholder="Enter summary or additional comments"
                  value={selectedCompletedApp.comments || ""}
                  disabled
                  readOnly
                />
              </div>
            </form>
          </div>
        </div>
      )}


      {selectedApp ? (
        <div className={styles.mainPanelsSection}>
          <div className={styles.formPanel}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>📝 Interview Assessment</h2>
              <button
                type="button"
                className={styles.collapseBtn}
                onClick={() => setSelectedApp(null)}
              >
                Hide
              </button>
            </div>
            <form className={styles.postJobForm} onSubmit={handleSubmit}>
              {/* 4-column grid for first 10 fields */}
              <div className={styles.formSection}>
                {first10Fields.map(field => (
                  <div className={styles.inputGroup} key={field.name}>
                    <label className={styles.labelText}>
                      {field.label}
                      {field.required && <span className={styles.requiredAsterisk}>*</span>}
                    </label>
                    <input
                      className={styles.input}
                      name={field.name}
                      type={field.type}
                      value={form[field.name as keyof typeof form] as string}
                      onChange={handleChange}
                      required={field.required}
                      disabled={field.disabled}
                    />
                  </div>
                ))}
              </div>

              <div className={styles.sectionDivider} />


              <div className={styles.questionsSection}>
                <div className={styles.mcqInstruction}>
                  Please rate each aspect below. <strong>1</strong> means <strong>Very Poor</strong> and <strong>5</strong> means <strong>Excellent</strong>.
                </div>
                {questionList.map((q, idx) => (
                  <div className={styles.questionBlock} key={q.key}>
                    <div className={styles.questionHeader}>
                      <span className={styles.questionNumber}>{idx + 1}.</span>
                      <span className={styles.questionTitle}>{q.label}</span>
                      <span className={styles.questionDesc}>{q.desc}</span>
                    </div>
                    <div className={styles.ratingRow}>
                      {ratingOptions.map((opt) => (
                        <label key={opt} className={styles.ratingLabel}>
                          <input
                            type="radio"
                            name={q.key}
                            value={opt}
                            checked={form[q.key as keyof typeof form] === opt}
                            onChange={handleChange}
                            required
                          />
                          <span className={styles.ratingValue}>{opt}</span>
                        </label>
                      ))}
                    </div>
                    <textarea
                      className={styles.remarkInput}
                      name={`${q.key}_remark`}
                      placeholder="Remark"
                      value={form[`${q.key}_remark` as keyof typeof form] as string}
                      onChange={handleChange}
                    />
                  </div>
                ))}
              </div>

              <div className={styles.sectionDivider} />

              <div className={styles.questionBlock}>
                <div className={styles.questionHeader}>
                  <span className={styles.questionNumber}>13.</span>
                  <span className={styles.questionTitle}>Overall Impression</span>
                </div>
                <div className={styles.ratingRow}>
                  {overallImpressionOptions.map(opt => (
                    <label key={opt.value} className={styles.ratingLabel}>
                      <input
                        type="radio"
                        name="q13"
                        value={opt.value}
                        checked={form.q13 === opt.value}
                        onChange={handleChange}
                        required
                      />
                      <span className={styles.ratingValue}>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <textarea
                  className={styles.remarkInput}
                  name="q13_remark"
                  placeholder="Remark"
                  value={form.q13_remark}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.questionBlock}>
                <div className={styles.questionHeader}>
                  <span className={styles.questionNumber}>14.</span>
                  <span className={styles.questionTitle}>Interviewer's Recommendation</span>
                </div>
                <div className={styles.ratingRow}>
                  {recommendationOptions.map(opt => (
                    <label key={opt.value} className={styles.ratingLabel}>
                      <input
                        type="radio"
                        name="q14"
                        value={opt.value}
                        checked={form.q14 === opt.value}
                        onChange={handleChange}
                        required
                      />
                      <span className={styles.ratingValue}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Comments (Summary of candidate)</label>
                <textarea
                  className={styles.remarkInput}
                  name="comments"
                  placeholder="Enter summary or additional comments"
                  value={form.comments}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn}>
                  <Plus size={16} />
                  Submit Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className={styles.selectPrompt}>
        </div>
      )}
    </div>
  );
};

export default Assessment;