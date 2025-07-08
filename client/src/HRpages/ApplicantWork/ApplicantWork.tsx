import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const proficiencyLevels = ["Advanced", "Intermediate", "Beginner"];
const languageOptions = ["English", "Mandarin", "Malay", "Tamil", "Hindi", "French", "German", "Japanese"];
const languageProficiencies = ["Excellent", "Good", "Fair", "Not Applicable"];

const ApplicantExperience: React.FC = () => {
  const [showWork, setShowWork] = useState(true);
  const [showTeaching, setShowTeaching] = useState(true);
  const [showSkills, setShowSkills] = useState(true);
  const [showLanguages, setShowLanguages] = useState(true);
  const navigate = useNavigate();
  const [workExperiences, setWorkExperiences] = useState([
    {
      id: 1,
      company: "", role: "", fromMonth: "", fromYear: "",
      toMonth: "", toYear: "", salary: "", description: "", reason: ""
    }
  ]);

  const [teachingExperiences, setTeachingExperiences] = useState([
    {
      id: 1,
      institution: "", position: "", subject: "", fromMonth: "", fromYear: "",
      toMonth: "", toYear: "", salary: "", reason: ""
    }
  ]);

  const [skills, setSkills] = useState([{ id: 1, name: "", level: "" }]);
  const [languages, setLanguages] = useState([{ id: 1, name: "", spoken: "", written: "", reading: "" }]);

  type RecordWithId = { id: number; [key: string]: any };

  type SetFn<T> = React.Dispatch<React.SetStateAction<T[]>>;

  const updateRecord = <T extends RecordWithId>(
      setFn: SetFn<T>,
      current: T[],
      id: number,
      field: keyof T,
      value: any
  ) => {
    setFn(current.map(r => r.id === id ? { ...r, [field]: value } : r));
  };
  
  return (
    <div className="main-panel">
      <div className="form-wrapper">

        {/* Work Experience */}
        <div className="form-container">
          <h2 
            className="section-title"
            onClick={() => setShowWork(prev => !prev)}
          >
            Work Experience
          </h2>
          {showWork && (
            <div>
              {workExperiences.map((record, index) => (
                <div key={record.id} className={`form-section ${index > 0 ? 'record' : ''}`}>
                  {index > 0}
                  
                  <div><span className="label-text">Company Name</span>
                    <input className="input" value={record.company} onChange={e => updateRecord(setWorkExperiences, workExperiences, record.id, "company", e.target.value)} />
                  </div>

                  <div><span className="label-text">Position</span>
                    <input className="input" value={record.role} onChange={e => updateRecord(setWorkExperiences, workExperiences, record.id, "role", e.target.value)} />
                  </div>

                  <div><span className="label-text">Monthly Salary ($)</span>
                    <input className="input" value={record.salary} onChange={e => updateRecord(setWorkExperiences, workExperiences, record.id, "salary", e.target.value)} />
                  </div>

                  <div><span className="label-text">Job Description</span>
                    <textarea className="input" value={record.description} onChange={e => updateRecord(setWorkExperiences, workExperiences, record.id, "description", e.target.value)} />
                  </div>

                  <div><span className="label-text">Reasons for Leaving</span>
                    <input className="input" value={record.reason} onChange={e => updateRecord(setWorkExperiences, workExperiences, record.id, "reason", e.target.value)} />
                  </div>

                  <div><span className="label-text">From</span>
                    <div className="input-pair">
                      <select className="input" value={record.fromMonth} onChange={e => updateRecord(setWorkExperiences, workExperiences, record.id, "fromMonth", e.target.value)}>
                        <option value="">Month</option>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <input className="input" placeholder="Year" value={record.fromYear} onChange={e => updateRecord(setWorkExperiences, workExperiences, record.id, "fromYear", e.target.value)} />
                    </div>
                  </div>

                  <div><span className="label-text">To</span>
                    <div className="input-pair">
                      <select className="input" value={record.toMonth} onChange={e => updateRecord(setWorkExperiences, workExperiences, record.id, "toMonth", e.target.value)}>
                        <option value="">Month</option>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <input className="input" placeholder="Year" value={record.toYear} onChange={e => updateRecord(setWorkExperiences, workExperiences, record.id, "toYear", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Teaching Experience */}
        <div className="form-container">
          <h2 className="section-title"
            onClick={() => setShowTeaching(prev => !prev)}
            >Teaching Experience
          </h2>
          {showTeaching && (
            <div>
              {teachingExperiences.map((record, index) => (
                <div key={record.id} className={`form-section ${index > 0 ? 'record' : ''}`}>
                  {index > 0}
                  
                  <div><span className="label-text">Institution Name</span>
                    <input className="input" value={record.institution} onChange={e => updateRecord(setTeachingExperiences, teachingExperiences, record.id, "institution", e.target.value)} />
                  </div>

                  <div><span className="label-text">Position</span>
                    <input className="input" value={record.position} onChange={e => updateRecord(setTeachingExperiences, teachingExperiences, record.id, "position", e.target.value)} />
                  </div>

                  <div><span className="label-text">Monthly Salary ($)</span>
                    <input className="input" value={record.salary} onChange={e => updateRecord(setTeachingExperiences, teachingExperiences, record.id, "salary", e.target.value)} />
                  </div>

                  <div><span className="label-text">Subject / Modules Taught</span>
                    <input className="input" value={record.subject} onChange={e => updateRecord(setTeachingExperiences, teachingExperiences, record.id, "subject", e.target.value)} />
                  </div>

                  <div><span className="label-text">Reasons for Leaving</span>
                    <input className="input" value={record.reason} onChange={e => updateRecord(setTeachingExperiences, teachingExperiences, record.id, "reason", e.target.value)} />
                  </div>

                  <div><span className="label-text">From</span>
                    <div className="input-pair">
                      <select className="input" value={record.fromMonth} onChange={e => updateRecord(setTeachingExperiences, teachingExperiences, record.id, "fromMonth", e.target.value)}>
                        <option value="">Month</option>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <input className="input" placeholder="Year" value={record.fromYear} onChange={e => updateRecord(setTeachingExperiences, teachingExperiences, record.id, "fromYear", e.target.value)} />
                    </div>
                  </div>

                  <div><span className="label-text">To</span>
                    <div className="input-pair">
                      <select className="input" value={record.toMonth} onChange={e => updateRecord(setTeachingExperiences, teachingExperiences, record.id, "toMonth", e.target.value)}>
                        <option value="">Month</option>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <input className="input" placeholder="Year" value={record.toYear} onChange={e => updateRecord(setTeachingExperiences, teachingExperiences, record.id, "toYear", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="form-container">
          <h2 
            className="section-title"
            onClick={() => setShowSkills(prev => !prev)}
          >
            Skills
          </h2>
          {showSkills && (
            <div>
              {skills.map((skill, index) => (
                <div key={skill.id} className={`form-section ${index > 0 ? 'record' : ''}`}>
                  {index > 0}
                  
                  <div><span className="label-text">Skill (Software & OS)</span>
                    <input className="input" value={skill.name} onChange={e => updateRecord(setSkills, skills, skill.id, "name", e.target.value)} />
                  </div>

                  <div><span className="label-text">Proficiency</span>
                    <select className="input" value={skill.level} onChange={e => updateRecord(setSkills, skills, skill.id, "level", e.target.value)}>
                      <option value="">Select</option>
                      {proficiencyLevels.map(level => <option key={level} value={level}>{level}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Languages */}
        <div className="form-container">
          <h2 
            className="section-title"
            onClick={() => setShowLanguages(prev => !prev)}
          >
            Languages
          </h2>
          {showLanguages && (
            <div>
              {languages.map((lang, index) => (
                <div key={lang.id} className={`form-section ${index > 0 ? 'record' : ''}`}>
                  {index > 0}

                  <div>
                    <span className="label-text">Language {index === 0 && <span className="required-asterisk">*</span>}</span>
                    <select className="input" value={lang.name} onChange={e => updateRecord(setLanguages, languages, lang.id, "name", e.target.value)}>
                      <option value="">Select</option>
                      {languageOptions.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  <div>
                    <span className="label-text">Spoken {index === 0 && <span className="required-asterisk">*</span>}</span>
                    <select className="input" value={lang.spoken} onChange={e => updateRecord(setLanguages, languages, lang.id, "spoken", e.target.value)}>
                      <option value="">Select</option>
                      {languageProficiencies.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  <div>
                    <span className="label-text">Written {index === 0 && <span className="required-asterisk">*</span>}</span>
                    <select className="input" value={lang.written} onChange={e => updateRecord(setLanguages, languages, lang.id, "written", e.target.value)}>
                      <option value="">Select</option>
                      {languageProficiencies.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  <div>
                    <span className="label-text">Reading {index === 0 && <span className="required-asterisk">*</span>}</span>
                    <select className="input" value={lang.reading} onChange={e => updateRecord(setLanguages, languages, lang.id, "reading", e.target.value)}>
                      <option value="">Select</option>
                      {languageProficiencies.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-buttons">
          <button className="btn submit" onClick={() => navigate("/hr/applicant-details/family")}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default ApplicantExperience;
