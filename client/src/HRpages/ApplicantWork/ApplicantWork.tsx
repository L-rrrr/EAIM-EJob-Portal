import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp} from "lucide-react";
import styles from "../../pages/Education/Education.module.css";
import workStyles from "../../pages/Work/Work.module.css";
import axios from "axios";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const proficiencyLevels = ["Advanced", "Intermediate", "Beginner"];
const languageOptions = ["English", "Mandarin", "Malay", "Tamil", "Hindi", "French", "German", "Japanese"];
const languageProficiencies = ["Excellent", "Good", "Fair", "Not Applicable"];

const ApplicantWork: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [showWork, setShowWork] = useState(true);
  const [showTeaching, setShowTeaching] = useState(true);
  const [showSkills, setShowSkills] = useState(true);
  const [showLanguages, setShowLanguages] = useState(true);

  const skillOptions = [
    "React", "Angular", "Vue.js", "Node.js", "Express.js", 
    "Python", "Java", "C#", ".NET", "Spring Boot",
    "JavaScript", "TypeScript", "HTML/CSS", "PHP", "Laravel",
    "MySQL", "PostgreSQL", "MongoDB", "Redis",
    "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes",
    "Git", "Jenkins", "Linux", "Figma"
  ];

  type WorkExperienceRecord = {
    id: number;
    work_id?: number;
    company: string;
    role: string;
    salary: string;
    description: string;
    reason: string;
    fromMonth: string;
    fromYear: string;
    toMonth: string;
    toYear: string;
  };

  type TeachingExperienceRecord = {
    id: number;
    teaching_id?: number;
    institution: string;
    position: string;
    salary: string;
    subject: string;
    reason: string;
    fromMonth: string;
    fromYear: string;
    toMonth: string;
    toYear: string;
  };

  type SkillRecord = {
    id: number;
    skill_id?: number;
    name: string;
    level: string;
  };

  type LanguageRecord = {
    id: number;
    language_id?: number;
    name: string;
    spoken: string;
    written: string;
    reading: string;
  };

  const [workExperiences, setWorkExperiences] = useState<WorkExperienceRecord[]>([]);
  const [teachingExperiences, setTeachingExperiences] = useState<TeachingExperienceRecord[]>([]);
  const [skills, setSkills] = useState<SkillRecord[]>([{
    id: 1,
    name: "",
    level: ""
  }]);
  const [languages, setLanguages] = useState<LanguageRecord[]>([{ 
    id: 1, 
    name: "", 
    spoken: "", 
    written: "", 
    reading: "" 
  }]);

  useEffect(() => {
    const fetchApplicantWorkData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!userId) {
          console.error("No user ID provided");
          return;
        }

        // Fetch applicant work data based on user ID
        const workResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/get-applicant-work/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (workResponse.data && workResponse.data.success) {
          const data = workResponse.data.data;

          // Set work experience
          if (Array.isArray(data.workExperience) && data.workExperience.length > 0) {
            const workRecords = data.workExperience.map((rec: any, idx: number) => ({
              id: idx + 1,
              work_id: rec.work_id,
              company: rec.company || "",
              role: rec.role || "",
              salary: rec.salary || "",
              description: rec.description || "",
              reason: rec.reason || "",
              fromMonth: rec.from_month || "",
              fromYear: rec.from_year || "",
              toMonth: rec.to_month || "",
              toYear: rec.to_year || "",
            }));
            setWorkExperiences(workRecords);
          } else {
            setWorkExperiences([]);
          }

          // Set teaching experience
          if (Array.isArray(data.teachingExperience) && data.teachingExperience.length > 0) {
            const teachingRecords = data.teachingExperience.map((rec: any, idx: number) => ({
              id: idx + 1,
              teaching_id: rec.teaching_id,
              institution: rec.institution || "",
              position: rec.position || "",
              salary: rec.salary || "",
              subject: rec.subject || "",
              reason: rec.reason || "",
              fromMonth: rec.from_month || "",
              fromYear: rec.from_year || "",
              toMonth: rec.to_month || "",
              toYear: rec.to_year || "",
            }));
            setTeachingExperiences(teachingRecords);
          } else {
            setTeachingExperiences([]);
          }

          // Set skills
          if (Array.isArray(data.skills) && data.skills.length > 0) {
            const skillRecords = data.skills.map((rec: any, idx: number) => ({
              id: idx + 1,
              skill_id: rec.skill_id,
              name: rec.name || "",
              level: rec.level || "",
            }));
            setSkills(skillRecords);
          } else {
            setSkills([]);
          }

          // Set languages
          if (Array.isArray(data.languages) && data.languages.length > 0) {
            const languageRecords = data.languages.map((rec: any, idx: number) => ({
              id: idx + 1,
              language_id: rec.language_id,
              name: rec.name || "",
              spoken: rec.spoken || "",
              written: rec.written || "",
              reading: rec.reading || "",
            }));
            setLanguages(languageRecords);
          } else {
            setLanguages([]);
          }
        }
      } catch (error: any) {
        console.error("Failed to fetch applicant work data", error);
      }
    };

    fetchApplicantWorkData();
  }, [userId]);

  return (
    <div className={styles.mainPanel}>
      <div className={styles.formWrapper}>

        {/* Work Experience */}
        <div className={styles.formContainer}>
          <h2
            className={workStyles.sectionTitle}
            onClick={() => setShowWork(prev => !prev)}
          >
            <span className={styles.sectionTitleText}>
              Work Experience (Optional)
            </span>
            <div className={styles.sectionArrow}>
              {showWork ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>
          {showWork && (
            <div>
              <div className={styles.labelHint}>
                Please provide all relevant work experience and provide your most recent work experience for the first record if applicable. 
              </div>
              
              {workExperiences.length === 0 && (
                <div className={styles.noRecordsMessage}>
                  No work experience records found.
                </div>
              )}

              {workExperiences.map((record) => (
                <div key={record.id} className={`${styles.formSection} ${styles.record}`}>
                  
                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Company Name<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      className={styles.input}
                      value={record.company} 
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Position<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      className={styles.input}
                      value={record.role} 
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Monthly Salary ($)<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      className={styles.input}
                      value={record.salary} 
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Job Description<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <textarea 
                      className={styles.input}
                      value={record.description} 
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Reasons for Leaving<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      className={styles.input}
                      value={record.reason} 
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      From<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <div className={styles.inputPair}>
                      <select 
                        className={styles.input}
                        value={record.fromMonth} 
                        disabled
                      >
                        <option value="">Month</option>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <input 
                        className={styles.input}
                        placeholder="Year" 
                        value={record.fromYear} 
                        disabled
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      To<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <div className={styles.inputPair}>
                      <select 
                        className={styles.input}
                        value={record.toMonth} 
                        disabled
                      >
                        <option value="">Month</option>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <input 
                        className={styles.input}
                        placeholder="Year" 
                        value={record.toYear} 
                        disabled
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Teaching Experience */}
        <div className={styles.formContainer}>
          <h2
            className={workStyles.sectionTitle}
            onClick={() => setShowTeaching(prev => !prev)}
          >
            <span className={styles.sectionTitleText}>
              Teaching Experience (Optional)
            </span>
            <div className={styles.sectionArrow}>
              {showTeaching ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>
          {showTeaching && (
            <div>
              <div className={styles.labelHint}>
                Please provide all relevant teaching experience if you are applying for any teaching roles and provide your most recent teaching experience for the first record if applicable.
              </div>
              
              {teachingExperiences.length === 0 && (
                <div className={styles.noRecordsMessage}>
                  No teaching experience records found.
                </div>
              )}

              {teachingExperiences.map((record) => (
                <div key={record.id} className={`${styles.formSection} ${styles.record}`}>
                  
                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Institution Name<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      className={styles.input}
                      value={record.institution} 
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Position<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      className={styles.input}
                      value={record.position} 
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Monthly Salary ($)<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      className={styles.input}
                      value={record.salary} 
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Subject / Modules Taught<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      className={styles.input}
                      value={record.subject} 
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Reasons for Leaving<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      className={styles.input}
                      value={record.reason} 
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      From<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <div className={styles.inputPair}>
                      <select 
                        className={styles.input}
                        value={record.fromMonth} 
                        disabled
                      >
                        <option value="">Month</option>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <input 
                        className={styles.input}
                        placeholder="Year" 
                        value={record.fromYear} 
                        disabled
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      To<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <div className={styles.inputPair}>
                      <select 
                        className={styles.input}
                        value={record.toMonth} 
                        disabled
                      >
                        <option value="">Month</option>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <input 
                        className={styles.input}
                        placeholder="Year" 
                        value={record.toYear} 
                        disabled
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skills */}
        <div className={styles.formContainer}>
          <h2
            className={workStyles.sectionTitle}
            onClick={() => setShowSkills(prev => !prev)}
          >
            <span className={styles.sectionTitleText}>
              Skills
            </span>
            <div className={styles.sectionArrow}>
              {showSkills ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>
          {showSkills && (
            <div>
              {skills.map((skill, index) => (
                <div key={skill.id} className={`${styles.formSection} ${index > 0 ? styles.record : ''}`}>
                  
                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Skill (Software & OS)<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select
                      className={styles.input}
                      value={skill.name}
                      disabled
                    >
                      <option value="">Select Skill</option>
                      {skillOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Proficiency<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select
                      className={styles.input}
                      value={skill.level}
                      disabled
                    >
                      <option value="">Select</option>
                      {proficiencyLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Languages */}
        <div className={styles.formContainer}>
          <h2
            className={workStyles.sectionTitle}
            onClick={() => setShowLanguages(prev => !prev)}
          >
            <span className={styles.sectionTitleText}>
              Languages
            </span>
            <div className={styles.sectionArrow}>
              {showLanguages ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>
          {showLanguages && (
            <div>
              {languages.map((lang, index) => (
                <div key={lang.id} className={`${styles.formSection} ${index > 0 ? styles.record : ''}`}>
                  
                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Language<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select 
                      className={styles.input}
                      value={lang.name} 
                      disabled
                    >
                      <option value="">Select</option>
                      {languageOptions.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Spoken<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select 
                      className={styles.input}
                      value={lang.spoken} 
                      disabled
                    >
                      <option value="">Select</option>
                      {languageProficiencies.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Written<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select 
                      className={styles.input}
                      value={lang.written} 
                      disabled
                    >
                      <option value="">Select</option>
                      {languageProficiencies.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Reading<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select 
                      className={styles.input}
                      value={lang.reading} 
                      disabled
                    >
                      <option value="">Select</option>
                      {languageProficiencies.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.formButtons}>
          <button 
            className={`${styles.btn} ${styles.save}`} 
            onClick={() => navigate("/hr/applicants")}
          >
            Back to All Applicants
          </button>

          <button 
            className={`${styles.btn} ${styles.submit}`} 
            onClick={() => navigate(`/hr/applicant-details/education?userId=${userId}`)}
          >
            ← Previous
          </button>
          <button 
            className={`${styles.btn} ${styles.submit}`} 
            onClick={() => navigate(`/hr/applicant-details/family?userId=${userId}`)}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicantWork;