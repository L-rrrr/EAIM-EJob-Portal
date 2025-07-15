import { useState } from "react";
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
  q1: "1",
  q1_remark: "",
  q2: "1",
  q2_remark: "",
  q3: "1",
  q3_remark: "",
  q4: "1",
  q4_remark: "",
  q5: "1",
  q5_remark: "",
  q6: "1",
  q6_remark: "",
  q7: "1",
  q7_remark: "",
  q8: "1",
  q8_remark: "",
  q9: "1",
  q9_remark: "",
  q10: "1",
  q10_remark: "",
  q11: "1",
  q11_remark: "",
  q12: "1",
  q12_remark: "",
  q13: "1",
  q13_remark: "",
  q14: "1",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit logic here
    alert("Interview assessment submitted!");
    setForm(initialState);
  };

  // First 10 fields for the 4-column grid
  const first10Fields = [
    { name: "candidateName", label: "Candidate Name", required: true, type: "text" },
    { name: "age", label: "Age", required: true, type: "number" },
    { name: "department", label: "Department", required: true, type: "text" },
    { name: "position", label: "Position Applied", required: true, type: "text" },
    { name: "currentSalary", label: "Current Salary ($)", required: false, type: "number" },
    { name: "expectedSalary", label: "Expected Salary ($)", required: false, type: "number" },
    { name: "interviewer", label: "Interviewer Name", required: true, type: "text" },
    { name: "noticePeriod", label: "Notice Period", required: false, type: "text" },
    { name: "interviewDate", label: "Interview Date", required: true, type: "date" },
    { name: "interviewTime", label: "Interview Time", required: true, type: "time" }
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
              <span className={styles.cardValue}>12</span>
              <span className={styles.cardSubtitle}>Total assessments</span>
            </div>
          </div>
          <div className={`${styles.statsCard} ${styles.pendingCard}`}>
            <div className={styles.cardIcon}>
              <Users size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Pending</h3>
              <span className={styles.cardValue}>5</span>
              <span className={styles.cardSubtitle}>Awaiting review</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mainPanelsSection}>
        <div className={styles.formPanel}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>📝 Interview Assessment</h2>
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
                  />
                </div>
              ))}
            </div>

            <div className={styles.sectionDivider} />

            <div className={styles.questionsSection}>
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
    </div>
  );
};

export default Assessment;