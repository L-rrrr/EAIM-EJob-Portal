import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import styles from "../Education/Education.module.css";
import workStyles from "./Work.module.css";
import axios from "axios";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const proficiencyLevels = ["Advanced", "Intermediate", "Beginner"];
const languageOptions = ["English", "Mandarin", "Malay", "Tamil", "Hindi", "French", "German", "Japanese"];
const languageProficiencies = ["Excellent", "Good", "Fair", "Not Applicable"];

const Experience: React.FC = () => {
  const [showWork, setShowWork] = useState(true);
  const [showTeaching, setShowTeaching] = useState(true);
  const [showSkills, setShowSkills] = useState(true);
  const [showLanguages, setShowLanguages] = useState(true);
  const navigate = useNavigate();
  const skillOptions = [
    "React", "Angular", "Vue.js", "Node.js", "Express.js", 
    "Python", "Java", "C#", ".NET", "Spring Boot",
    "JavaScript", "TypeScript", "HTML/CSS", "PHP", "Laravel",
    "MySQL", "PostgreSQL", "MongoDB", "Redis",
    "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes",
    "Git", "Jenkins", "Linux", "Figma"
  ];

  const [workExperiences, setWorkExperiences] = useState<WorkExperienceRecord[]>([]);

  const [teachingExperiences, setTeachingExperiences] = useState<TeachingExperienceRecord[]>([]);

  const [skills, setSkills] = useState<SkillRecord[]>([{
    id: 1,
    name: "",
    level: ""
  }]);
  
  const [languages, setLanguages] = useState<LanguageRecord[]>([{ id: 1, name: "", spoken: "", written: "", reading: "" }]);


  const addWorkExperience = () => {
    // Generate ID based on existing records or start from 1
    const newId = workExperiences.length > 0 
    ? Math.max(...workExperiences.map(r => r.id)) + 1 
    : 1;

    setWorkExperiences([
      ...workExperiences,
      {
        id: newId,
        work_id: undefined,
        company: "",
        role: "",
        salary: "",
        description: "",
        reason: "",
        fromMonth: "",
        fromYear: "",
        toMonth: "",
        toYear: "",
      }
    ]);
  };

  const addTeachingExperience = () => {
    // Generate ID based on existing records or start from 1
    const newId = teachingExperiences.length > 0 
      ? Math.max(...teachingExperiences.map(r => r.id)) + 1 
      : 1;

    setTeachingExperiences([
      ...teachingExperiences,
      {
        id: newId,
        teaching_id: undefined,
        institution: "",
        position: "",
        salary: "",
        subject: "",
        reason: "",
        fromMonth: "",
        fromYear: "",
        toMonth: "",
        toYear: "",
      }
    ]);
  };

  const addSkill = () => {
    // Generate ID based on existing records or start from 1
    const newId = skills.length > 0 
      ? Math.max(...skills.map(r => r.id)) + 1 
      : 1;

    setSkills([
      ...skills,
      {
        id: newId,
        skill_id: undefined,
        name: "",
        level: "",
      }
    ]);
  };

  const addLanguage = () => {
    // Generate ID based on existing records or start from 1
    const newId = languages.length > 0 
      ? Math.max(...languages.map(r => r.id)) + 1 
      : 1;
    setLanguages([
      ...languages,
      {
        id: newId,
        language_id: undefined,
        name: "",
        spoken: "",
        written: "",
        reading: "",
      }
    ]);
  };


const deleteWorkExperience = async (id: number) => {
  const recordToDelete = workExperiences.find(record => record.id === id);
  
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this work experience record? This action cannot be undone."
  );
  
  if (!confirmDelete) {
    return;
  }

  try {
    // If the record has a work_id (exists in database), delete from backend
    if (recordToDelete?.work_id) {
      const token = localStorage.getItem("token");
      
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/delete-work-experience`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { work_id: recordToDelete.work_id }
        }
      );

      if (response.data.success) {
        console.log("Work experience record deleted from database successfully");
      }
    }
    
    // Remove from frontend state
    setWorkExperiences(workExperiences.filter(record => record.id !== id));
    
    // Clear any validation errors for this record
    if (workValidationErrors[id]) {
      setWorkValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
    
    
  } catch (error) {
    console.error("Failed to delete work experience record:", error);
    alert("Failed to delete record from database, but removed from form.");
    
    // Still remove from frontend even if backend delete fails
    setWorkExperiences(workExperiences.filter(record => record.id !== id));
    
    // Clear validation errors
    if (workValidationErrors[id]) {
      setWorkValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  }
};

const deleteTeachingExperience = async (id: number) => {
  const recordToDelete = teachingExperiences.find(record => record.id === id);
  
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this teaching experience record? This action cannot be undone."
  );
  
  if (!confirmDelete) {
    return;
  }

  try {
    // If the record has a teaching_id (exists in database), delete from backend
    if (recordToDelete?.teaching_id) {
      const token = localStorage.getItem("token");
      
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/delete-teaching-experience`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { teaching_id: recordToDelete.teaching_id }
        }
      );

      if (response.data.success) {
        console.log("Teaching experience record deleted from database successfully");
      }
    }
    
    // Remove from frontend state
    setTeachingExperiences(teachingExperiences.filter(record => record.id !== id));
    
    // Clear any validation errors for this record
    if (teachingValidationErrors[id]) {
      setTeachingValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
    
    
  } catch (error) {
    console.error("Failed to delete teaching experience record:", error);
    alert("Failed to delete record from database, but removed from form.");
    
    // Still remove from frontend even if backend delete fails
    setTeachingExperiences(teachingExperiences.filter(record => record.id !== id));
    
    // Clear validation errors
    if (teachingValidationErrors[id]) {
      setTeachingValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  }
};

const deleteSkill = async (id: number) => {
  const recordToDelete = skills.find(record => record.id === id);
  
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this skill record? This action cannot be undone."
  );
  
  if (!confirmDelete) {
    return;
  }

  try {
    // If the record has a skill_id (exists in database), delete from backend
    if (recordToDelete?.skill_id) {
      const token = localStorage.getItem("token");
      
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/delete-skills`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { skill_id: recordToDelete.skill_id }
        }
      );

      if (response.data.success) {
        console.log("Skill record deleted from database successfully");
      }
    }
    
    // Remove from frontend state
    setSkills(skills.filter(record => record.id !== id));
    
    // Clear any validation errors for this record
    if (skillValidationErrors[id]) {
      setSkillValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
    
  } catch (error) {
    console.error("Failed to delete skill record:", error);
    alert("Failed to delete record from database, but removed from form.");
    
    // Still remove from frontend even if backend delete fails
    setSkills(skills.filter(record => record.id !== id));
    
    // Clear validation errors
    if (skillValidationErrors[id]) {
      setSkillValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  }
};

const deleteLanguage = async (id: number) => {
  const recordToDelete = languages.find(record => record.id === id);
  
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this language record? This action cannot be undone."
  );
  
  if (!confirmDelete) {
    return;
  }

  try {
    // If the record has a language_id (exists in database), delete from backend
    if (recordToDelete?.language_id) {
      const token = localStorage.getItem("token");
      
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/delete-languages`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { language_id: recordToDelete.language_id }
        }
      );

      if (response.data.success) {
        console.log("Language record deleted from database successfully");
      }
    }
    
    // Remove from frontend state
    setLanguages(languages.filter(record => record.id !== id));
    
    // Clear any validation errors for this record
    if (languageValidationErrors[id]) {
      setLanguageValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
    
  } catch (error) {
    console.error("Failed to delete language record:", error);
    alert("Failed to delete record from database, but removed from form.");
    
    // Still remove from frontend even if backend delete fails
    setLanguages(languages.filter(record => record.id !== id));
    
    // Clear validation errors
    if (languageValidationErrors[id]) {
      setLanguageValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  }
};

  const updateWorkExperience = (id: number, field: string, value: string) => {
    setWorkExperiences(workExperiences.map(record =>
      record.id === id ? { ...record, [field]: value } : record
    ));

    // Clear validation error when user starts typing
    if (workValidationErrors[id]?.[field] && value.trim() !== "") {
      setWorkValidationErrors((prev) => {
        const updated = { ...prev };
        if (updated[id]) {
          delete updated[id][field];
          // If no more errors for this record, remove the record key entirely
          if (Object.keys(updated[id]).length === 0) {
            delete updated[id];
          }
        }
        return updated;
      });
    }
  };

  const updateTeachingExperience = (id: number, field: string, value: string) => {
    setTeachingExperiences(teachingExperiences.map(record =>
      record.id === id ? { ...record, [field]: value } : record
    ));

    // Clear validation error when user starts typing
    if (teachingValidationErrors[id]?.[field] && value.trim() !== "") {
      setTeachingValidationErrors((prev) => {
        const updated = { ...prev };
        if (updated[id]) {
          delete updated[id][field];
          // If no more errors for this record, remove the record key entirely
          if (Object.keys(updated[id]).length === 0) {
            delete updated[id];
          }
        }
        return updated;
      });
    }
  };

  const updateSkill = (id: number, field: string, value: string) => {
    setSkills(skills.map(record =>
      record.id === id ? { ...record, [field]: value } : record
    ));

    // Clear validation error when user starts typing
    if (skillValidationErrors[id]?.[field] && value.trim() !== "") {
      setSkillValidationErrors((prev) => {
        const updated = { ...prev };
        if (updated[id]) {
          delete updated[id][field];
          // If no more errors for this record, remove the record key entirely
          if (Object.keys(updated[id]).length === 0) {
            delete updated[id];
          }
        }
        return updated;
      });
    }
  };

  const updateLanguage = (id: number, field: string, value: string) => {
    setLanguages(languages.map(record =>
      record.id === id ? { ...record, [field]: value } : record
    ));

    // Clear validation error when user starts typing
    if (languageValidationErrors[id]?.[field] && value.trim() !== "") {
      setLanguageValidationErrors((prev) => {
        const updated = { ...prev };
        if (updated[id]) {
          delete updated[id][field];
          // If no more errors for this record, remove the record key entirely
          if (Object.keys(updated[id]).length === 0) {
            delete updated[id];
          }
        }
        return updated;
      });
    }
  };
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

  // Add these handler functions
const handleSaveDraft = async (e?: React.MouseEvent) => {
  if (e) e.preventDefault();
  try {
    const token = localStorage.getItem("token");
    
    // Create promises array - only include sections that have records
    const promises = [];

    // Only save work experience if there are records
    if (workExperiences.length > 0) {
      promises.push(
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-work-experience`,
          { workRecords: workExperiences.map(mapWorkToBackend), is_draft: "Y" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
    }

    // Only save teaching experience if there are records
    if (teachingExperiences.length > 0) {
      promises.push(
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-teaching-experience`,
          { teachingRecords: teachingExperiences.map(mapTeachingToBackend), is_draft: "Y" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
    }

    // Always save skills (required section)
    promises.push(
      axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/save-skills`,
        { skillRecords: skills.map(mapSkillToBackend), is_draft: "Y" },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );

    // Always save languages (required section)
    promises.push(
      axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/save-languages`,
        { languageRecords: languages.map(mapLanguageToBackend), is_draft: "Y" },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );

    const responses = await Promise.all(promises);
    
    // Update records with backend IDs - handle dynamic response order
    let responseIndex = 0;
    
    // Update work experience if it was saved
    if (workExperiences.length > 0 && responses[responseIndex] && responses[responseIndex].data.success) {
      const updatedRecords = workExperiences.map((frontendRecord, index) => ({
        ...frontendRecord,
        work_id: responses[responseIndex].data.data[index].work_id
      }));
      setWorkExperiences(updatedRecords);
      responseIndex++;
    }

    // Update teaching experience if it was saved
    if (teachingExperiences.length > 0 && responses[responseIndex] && responses[responseIndex].data.success) {
      const updatedTeaching = teachingExperiences.map((frontendRecord, index) => ({
        ...frontendRecord,
        teaching_id: responses[responseIndex].data.data[index].teaching_id
      }));
      setTeachingExperiences(updatedTeaching);
      responseIndex++;
    }

    // Update skills (always present)
    if (responses[responseIndex] && responses[responseIndex].data.success) {
      const updatedSkills = skills.map((frontendRecord, index) => ({
        ...frontendRecord,
        skill_id: responses[responseIndex].data.data[index].skill_id
      }));
      setSkills(updatedSkills);
      responseIndex++;
    }

    // Update languages (always present)
    if (responses[responseIndex] && responses[responseIndex].data.success) {
      const updatedLanguages = languages.map((frontendRecord, index) => ({
        ...frontendRecord,
        language_id: responses[responseIndex].data.data[index].language_id
      }));
      setLanguages(updatedLanguages);
    }
    window.dispatchEvent(new Event("profile-completeness-updated"));
    alert("Draft saved!");
  } catch (error) {
    console.error("Save draft error:", error);
    alert("Failed to save draft.");
  }
};

const handleUpdate = async (e?: React.MouseEvent) => {
  if (e) e.preventDefault();
  
  // **ALWAYS validate all records first (like Education.tsx)**
  const isValid = validateRecords();
  if (!isValid) {
    alert("Please fill in all required fields before updating.");
    return;
  }
  
  try {
    const token = localStorage.getItem("token");
    
    // Create promises array - only include sections that have records
    const promises = [];

    // Only save work experience if there are records
    if (workExperiences.length > 0) {
      promises.push(
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-work-experience`,
          { workRecords: workExperiences.map(mapWorkToBackend), is_draft: "N" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
    }

    // Only save teaching experience if there are records
    if (teachingExperiences.length > 0) {
      promises.push(
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-teaching-experience`,
          { teachingRecords: teachingExperiences.map(mapTeachingToBackend), is_draft: "N" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
    }

    // Always save skills (required section)
    promises.push(
      axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/save-skills`,
        { skillRecords: skills.map(mapSkillToBackend), is_draft: "N" },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );

    // Always save languages (required section)
    promises.push(
      axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/save-languages`,
        { languageRecords: languages.map(mapLanguageToBackend), is_draft: "N" },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );

    const responses = await Promise.all(promises);
    
    // Update records with backend IDs
    let responseIndex = 0;
    
    // Update work experience if it was saved
    if (workExperiences.length > 0 && responses[responseIndex] && responses[responseIndex].data.success) {
      const updatedRecords = workExperiences.map((frontendRecord, index) => ({
        ...frontendRecord,
        work_id: responses[responseIndex].data.data[index].work_id
      }));
      setWorkExperiences(updatedRecords);
      responseIndex++;
    }

    // Update teaching experience if it was saved
    if (teachingExperiences.length > 0 && responses[responseIndex] && responses[responseIndex].data.success) {
      const updatedTeaching = teachingExperiences.map((frontendRecord, index) => ({
        ...frontendRecord,
        teaching_id: responses[responseIndex].data.data[index].teaching_id
      }));
      setTeachingExperiences(updatedTeaching);
      responseIndex++;
    }

    // Update skills (always present)
    if (responses[responseIndex] && responses[responseIndex].data.success) {
      const updatedSkills = skills.map((frontendRecord, index) => ({
        ...frontendRecord,
        skill_id: responses[responseIndex].data.data[index].skill_id
      }));
      setSkills(updatedSkills);
      responseIndex++;
    }

    // Update languages (always present)
    if (responses[responseIndex] && responses[responseIndex].data.success) {
      const updatedLanguages = languages.map((frontendRecord, index) => ({
        ...frontendRecord,
        language_id: responses[responseIndex].data.data[index].language_id
      }));
      setLanguages(updatedLanguages);
    }
    
    window.dispatchEvent(new Event("profile-completeness-updated"));
    alert("Work experience updated!");
  } catch (error) {
    console.error("Update error:", error);
    alert("Failed to update work experience.");
  }
};
  
  // Add this type definition near the top with other types
  type ValidationErrors = {
    [recordId: number]: {
      [field: string]: string; // error message
    };
  };

  // Add validation state
  const [workValidationErrors, setWorkValidationErrors] = useState<ValidationErrors>({});
  const [teachingValidationErrors, setTeachingValidationErrors] = useState<ValidationErrors>({});
  const [skillValidationErrors, setSkillValidationErrors] = useState<ValidationErrors>({});
  const [languageValidationErrors, setLanguageValidationErrors] = useState<ValidationErrors>({});

  const validateRecords = (): boolean => {
    const workErrors: ValidationErrors = {};
    const teachingErrors: ValidationErrors = {};
    const skillErrors: ValidationErrors = {};
    const languageErrors: ValidationErrors = {};

    // Validate Work Experience - only if records exist
    if (workExperiences.length > 0) {
      workExperiences.forEach((record) => {
        const recordErrors: { [field: string]: string } = {};

        if (!record.company.trim()) {
          recordErrors.company = "Required";
        }
        if (!record.role.trim()) {
          recordErrors.role = "Required";
        }
        if (!record.salary || record.salary.toString().trim() === "") {
          recordErrors.salary = "Required";
        }
        if (!record.description.trim()) {
          recordErrors.description = "Required";
        }
        if (!record.reason.trim()) {
          recordErrors.reason = "Required";
        }
        if (!record.fromMonth) {
          recordErrors.fromMonth = "Required";
        }
        if (!record.fromYear || isNaN(Number(record.fromYear))) {
          recordErrors.fromYear = "Required and must be a valid year";
        }
        if (!record.toMonth) {
          recordErrors.toMonth = "Required";
        }
        if (!record.toYear || isNaN(Number(record.toYear))) {
          recordErrors.toYear = "Required and must be a valid year";
        }

        if (Object.keys(recordErrors).length > 0) {
          workErrors[record.id] = recordErrors;
        }
      });
    }

    // Validate Teaching Experience - only if records exist
    if (teachingExperiences.length > 0) {
      teachingExperiences.forEach((record) => {
        const recordErrors: { [field: string]: string } = {};

        if (!record.institution.trim()) {
          recordErrors.institution = "Required";
        }
        if (!record.position.trim()) {
          recordErrors.position = "Required";
        }
        if (!record.salary || record.salary.toString().trim() === "") {
          recordErrors.salary = "Required";
        }
        if (!record.subject.trim()) {
          recordErrors.subject = "Required";
        }
        if (!record.reason.trim()) {
          recordErrors.reason = "Required";
        }
        if (!record.fromMonth) {
          recordErrors.fromMonth = "Required";
        }
        if (!record.fromYear || isNaN(Number(record.fromYear))) {
          recordErrors.fromYear = "Required and must be a valid year";
        }
        if (!record.toMonth) {
          recordErrors.toMonth = "Required";
        }
        if (!record.toYear || isNaN(Number(record.toYear))) {
          recordErrors.toYear = "Required and must be a valid year";
        }

        if (Object.keys(recordErrors).length > 0) {
          teachingErrors[record.id] = recordErrors;
        }
      });
    }

    // Validate Skills - first record is required (always has at least one)
    skills.forEach((skill) => {
      const recordErrors: { [field: string]: string } = {};

      if (!skill.name.trim()) {
        recordErrors.name = "Required";
      }
      if (!skill.level.trim()) {
        recordErrors.level = "Required";
      }

      if (Object.keys(recordErrors).length > 0) {
        skillErrors[skill.id] = recordErrors;
      }
    });

    // Validate Languages - first record is required (always has at least one)
    languages.forEach((lang) => {
      const langErrors: { [field: string]: string } = {};

      if (!lang.name.trim()) {
        langErrors.name = "Required";
      }
      if (!lang.spoken.trim()) {
        langErrors.spoken = "Required";
      }
      if (!lang.written.trim()) {
        langErrors.written = "Required";
      }
      if (!lang.reading.trim()) {
        langErrors.reading = "Required";
      }

      if (Object.keys(langErrors).length > 0) {
        languageErrors[lang.id] = langErrors;
      }
    });

    setWorkValidationErrors(workErrors);
    setTeachingValidationErrors(teachingErrors);
    setSkillValidationErrors(skillErrors);
    setLanguageValidationErrors(languageErrors);
    return Object.keys(workErrors).length === 0 && 
        Object.keys(teachingErrors).length === 0 && 
        Object.keys(skillErrors).length === 0 && 
        Object.keys(languageErrors).length === 0;
  };

  const mapWorkToBackend = (record: WorkExperienceRecord) => ({
    work_id: record.work_id,
    company: record.company,
    role: record.role,
    salary: record.salary,
    description: record.description,
    reason: record.reason,
    from_month: record.fromMonth,
    from_year: record.fromYear,
    to_month: record.toMonth,
    to_year: record.toYear,
  });

  const mapTeachingToBackend = (record: TeachingExperienceRecord) => ({
    teaching_id: record.teaching_id,
    institution: record.institution,
    position: record.position,
    salary: record.salary,
    subject: record.subject,
    reason: record.reason,
    from_month: record.fromMonth,
    from_year: record.fromYear,
    to_month: record.toMonth,
    to_year: record.toYear,
  });

  const mapSkillToBackend = (record: SkillRecord) => ({
    skill_id: record.skill_id,
    name: record.name,
    level: record.level,
  });

  const mapLanguageToBackend = (record: LanguageRecord) => ({
    language_id: record.language_id,
    name: record.name,
    spoken: record.spoken,
    written: record.written,
    reading: record.reading,
  });

  const fetchWorkExperience = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-work-experience`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const records = res.data.data.map((rec: any) => ({
          id: 1 + rec.work_id,
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
        setWorkExperiences(records);
      }
    } catch (error) {
      console.error("Failed to fetch work experience", error);
    }
  };

  const fetchTeachingExperience = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-teaching-experience`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const records = res.data.data.map((rec: any) => ({
          id: rec.teaching_id,
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
        setTeachingExperiences(records);
      }
    } catch (error) {
      console.error("Failed to fetch teaching experience", error);
    }
  };

  const fetchSkills = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-skills`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const records = res.data.data.map((rec: any) => ({
          id: rec.skill_id,
          skill_id: rec.skill_id,
          name: rec.name || "",
          level: rec.level || "",
        }));
        setSkills(records);
      }
    } catch (error) {
      console.error("Failed to fetch skills", error);
    }
  };

  const fetchLanguages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-languages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const records = res.data.data.map((rec: any) => ({
          id: rec.language_id,
          language_id: rec.language_id,
          name: rec.name || "",
          spoken: rec.spoken || "",
          written: rec.written || "",
          reading: rec.reading || "",
        }));
        setLanguages(records);
      }
    } catch (error) {
      console.error("Failed to fetch languages", error);
    }
  };

  useEffect(() => {
    fetchWorkExperience();
    fetchTeachingExperience();
    fetchSkills();
    fetchLanguages();
  }, []);
    
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
                  No work experience records added yet. Click "Add Work Experience" to get started.
                </div>
              )}

              {workExperiences.map((record) => (
                <div key={record.id} className={`${styles.formSection} ${styles.record}`}>
                  <div className={styles.deleteBtn} onClick={() => deleteWorkExperience(record.id)}>
                    <Trash2 size={16} />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Company Name<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      className={styles.input}
                      value={record.company} 
                      onChange={e => updateWorkExperience(record.id, "company", e.target.value)}
                      style={{
                        borderColor: workValidationErrors[record.id]?.company ? "red" : undefined,
                      }}
                    />
                    {workValidationErrors[record.id]?.company && (
                      <div className={styles.errorMessage}>
                        {workValidationErrors[record.id].company}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Position<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      className={styles.input}
                      value={record.role} 
                      onChange={e => updateWorkExperience(record.id, "role", e.target.value)}
                      style={{
                        borderColor: workValidationErrors[record.id]?.role ? "red" : undefined,
                      }}
                    />
                    {workValidationErrors[record.id]?.role && (
                      <div className={styles.errorMessage}>
                        {workValidationErrors[record.id].role}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Monthly Salary ($)<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      className={styles.input}
                      value={record.salary} 
                      onChange={e => updateWorkExperience(record.id, "salary", e.target.value)}
                      style={{
                        borderColor: workValidationErrors[record.id]?.salary ? "red" : undefined,
                      }}
                    />
                    {workValidationErrors[record.id]?.salary && (
                      <div className={styles.errorMessage}>
                        {workValidationErrors[record.id].salary}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Job Description<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <textarea 
                      className={styles.input}
                      value={record.description} 
                      onChange={e => updateWorkExperience(record.id, "description", e.target.value)}
                      style={{
                        borderColor: workValidationErrors[record.id]?.description ? "red" : undefined,
                      }}
                    />
                    {workValidationErrors[record.id]?.description && (
                      <div className={styles.errorMessage}>
                        {workValidationErrors[record.id].description}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Reasons for Leaving<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      className={styles.input}
                      value={record.reason} 
                      onChange={e => updateWorkExperience(record.id, "reason", e.target.value)}
                      style={{
                        borderColor: workValidationErrors[record.id]?.reason ? "red" : undefined,
                      }}
                    />
                    {workValidationErrors[record.id]?.reason && (
                      <div className={styles.errorMessage}>
                        {workValidationErrors[record.id].reason}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      From<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <div className={styles.inputPair}>
                      <select 
                        className={styles.input}
                        value={record.fromMonth} 
                        onChange={e => updateWorkExperience(record.id, "fromMonth", e.target.value)}
                        style={{
                          borderColor: workValidationErrors[record.id]?.fromMonth ? "red" : undefined,
                        }}
                      >
                        <option value="">Month</option>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <input 
                        className={styles.input}
                        placeholder="Year" 
                        value={record.fromYear} 
                        onChange={e => updateWorkExperience(record.id, "fromYear", e.target.value)}
                        style={{
                          borderColor: workValidationErrors[record.id]?.fromYear ? "red" : undefined,
                        }}
                      />
                    </div>
                    {(workValidationErrors[record.id]?.fromMonth || workValidationErrors[record.id]?.fromYear) && (
                      <div className={styles.errorMessage}>
                        {workValidationErrors[record.id]?.fromMonth || workValidationErrors[record.id]?.fromYear}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      To<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <div className={styles.inputPair}>
                      <select 
                        className={styles.input}
                        value={record.toMonth} 
                        onChange={e => updateWorkExperience(record.id, "toMonth", e.target.value)}
                        style={{
                          borderColor: workValidationErrors[record.id]?.toMonth ? "red" : undefined,
                        }}
                      >
                        <option value="">Month</option>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <input 
                        className={styles.input}
                        placeholder="Year" 
                        value={record.toYear} 
                        onChange={e => updateWorkExperience(record.id, "toYear", e.target.value)}
                        style={{
                          borderColor: workValidationErrors[record.id]?.toYear ? "red" : undefined,
                        }}
                      />
                    </div>
                    {(workValidationErrors[record.id]?.toMonth || workValidationErrors[record.id]?.toYear) && (
                      <div className={styles.errorMessage}>
                        {workValidationErrors[record.id]?.toMonth || workValidationErrors[record.id]?.toYear}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className={styles.addRecordContainer}>
                <button className={styles.addRecordBtn} onClick={addWorkExperience}>
                  Add Work Experience
                </button>
              </div>
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
                  No teaching experience records added yet. Click "Add Teaching Experience" to get started.
                </div>
              )}

              {teachingExperiences.map((record) => (
                <div key={record.id} className={`${styles.formSection} ${styles.record}`}>
                  <div className={styles.deleteBtn} onClick={() => deleteTeachingExperience(record.id)}>
                    <Trash2 size={16} />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Institution Name<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      className={styles.input}
                      value={record.institution} 
                      onChange={e => updateTeachingExperience(record.id, "institution", e.target.value)}
                      style={{
                        borderColor: teachingValidationErrors[record.id]?.institution ? "red" : undefined,
                      }}
                    />
                    {teachingValidationErrors[record.id]?.institution && (
                      <div className={styles.errorMessage}>
                        {teachingValidationErrors[record.id].institution}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Position<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      className={styles.input}
                      value={record.position} 
                      onChange={e => updateTeachingExperience(record.id, "position", e.target.value)}
                      style={{
                        borderColor: teachingValidationErrors[record.id]?.position ? "red" : undefined,
                      }}
                    />
                    {teachingValidationErrors[record.id]?.position && (
                      <div className={styles.errorMessage}>
                        {teachingValidationErrors[record.id].position}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Monthly Salary ($)<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      className={styles.input}
                      value={record.salary} 
                      onChange={e => updateTeachingExperience(record.id, "salary", e.target.value)}
                      style={{
                        borderColor: teachingValidationErrors[record.id]?.salary ? "red" : undefined,
                      }}
                    />
                    {teachingValidationErrors[record.id]?.salary && (
                      <div className={styles.errorMessage}>
                        {teachingValidationErrors[record.id].salary}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Subject / Modules Taught<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      className={styles.input}
                      value={record.subject} 
                      onChange={e => updateTeachingExperience(record.id, "subject", e.target.value)}
                      style={{
                        borderColor: teachingValidationErrors[record.id]?.subject ? "red" : undefined,
                      }}
                    />
                    {teachingValidationErrors[record.id]?.subject && (
                      <div className={styles.errorMessage}>
                        {teachingValidationErrors[record.id].subject}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Reasons for Leaving<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      className={styles.input}
                      value={record.reason} 
                      onChange={e => updateTeachingExperience(record.id, "reason", e.target.value)}
                      style={{
                        borderColor: teachingValidationErrors[record.id]?.reason ? "red" : undefined,
                      }}
                    />
                    {teachingValidationErrors[record.id]?.reason && (
                      <div className={styles.errorMessage}>
                        {teachingValidationErrors[record.id].reason}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      From<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <div className={styles.inputPair}>
                      <select 
                        className={styles.input}
                        value={record.fromMonth} 
                        onChange={e => updateTeachingExperience(record.id, "fromMonth", e.target.value)}
                        style={{
                          borderColor: teachingValidationErrors[record.id]?.fromMonth ? "red" : undefined,
                        }}
                      >
                        <option value="">Month</option>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <input 
                        className={styles.input}
                        placeholder="Year" 
                        value={record.fromYear} 
                        onChange={e => updateTeachingExperience(record.id, "fromYear", e.target.value)}
                        style={{
                          borderColor: teachingValidationErrors[record.id]?.fromYear ? "red" : undefined,
                        }}
                      />
                    </div>
                    {(teachingValidationErrors[record.id]?.fromMonth || teachingValidationErrors[record.id]?.fromYear) && (
                      <div className={styles.errorMessage}>
                        {teachingValidationErrors[record.id]?.fromMonth || teachingValidationErrors[record.id]?.fromYear}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      To<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <div className={styles.inputPair}>
                      <select 
                        className={styles.input}
                        value={record.toMonth} 
                        onChange={e => updateTeachingExperience(record.id, "toMonth", e.target.value)}
                        style={{
                          borderColor: teachingValidationErrors[record.id]?.toMonth ? "red" : undefined,
                        }}
                      >
                        <option value="">Month</option>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <input 
                        className={styles.input}
                        placeholder="Year" 
                        value={record.toYear} 
                        onChange={e => updateTeachingExperience(record.id, "toYear", e.target.value)}
                        style={{
                          borderColor: teachingValidationErrors[record.id]?.toYear ? "red" : undefined,
                        }}
                      />
                    </div>
                    {(teachingValidationErrors[record.id]?.toMonth || teachingValidationErrors[record.id]?.toYear) && (
                      <div className={styles.errorMessage}>
                        {teachingValidationErrors[record.id]?.toMonth || teachingValidationErrors[record.id]?.toYear}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className={styles.addRecordContainer}>
                <button className={styles.addRecordBtn} onClick={addTeachingExperience}>
                  Add Teaching Experience
                </button>
              </div>
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
                  {index > 0 && (
                    <div className={styles.deleteBtn} onClick={() => deleteSkill(skill.id)}>
                      <Trash2 size={16} />
                    </div>
                  )}
                  
                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Skill (Software & OS)<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select
                      className={styles.input}
                      value={skill.name}
                      onChange={e => updateSkill(skill.id, "name", e.target.value)}
                      style={{
                        borderColor: skillValidationErrors[skill.id]?.name ? "red" : undefined,
                      }}
                    >
                      <option value="">Select Skill</option>
                      {skillOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    {skillValidationErrors[skill.id]?.name && (
                      <div className={styles.errorMessage}>
                        {skillValidationErrors[skill.id].name}
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Proficiency<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select
                      className={styles.input}
                      value={skill.level}
                      onChange={e => updateSkill(skill.id, "level", e.target.value)}
                      style={{
                        borderColor: skillValidationErrors[skill.id]?.level ? "red" : undefined,
                      }}
                    >
                      <option value="">Select</option>
                      {proficiencyLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                    {skillValidationErrors[skill.id]?.level && (
                      <div className={styles.errorMessage}>
                        {skillValidationErrors[skill.id].level}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className={styles.addRecordContainer}>
                <button className={styles.addRecordBtn} onClick={addSkill}>
                  Add Skill
                </button>
              </div>
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
                  {index > 0 && (
                    <div className={styles.deleteBtn} onClick={() => deleteLanguage(lang.id)}>
                      <Trash2 size={16} />
                    </div>
                  )}
                  
                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Language<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select 
                      className={styles.input}
                      value={lang.name} 
                      onChange={e => updateLanguage(lang.id, "name", e.target.value)}
                      style={{
                        borderColor: languageValidationErrors[lang.id]?.name ? "red" : undefined,
                      }}
                    >
                      <option value="">Select</option>
                      {languageOptions.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    {languageValidationErrors[lang.id]?.name && (
                      <div className={styles.errorMessage}>
                        {languageValidationErrors[lang.id].name}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Spoken<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select 
                      className={styles.input}
                      value={lang.spoken} 
                      onChange={e => updateLanguage(lang.id, "spoken", e.target.value)}
                      style={{
                        borderColor: languageValidationErrors[lang.id]?.spoken ? "red" : undefined,
                      }}
                    >
                      <option value="">Select</option>
                      {languageProficiencies.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    {languageValidationErrors[lang.id]?.spoken && (
                      <div className={styles.errorMessage}>
                        {languageValidationErrors[lang.id].spoken}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Written<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select 
                      className={styles.input}
                      value={lang.written} 
                      onChange={e => updateLanguage(lang.id, "written", e.target.value)}
                      style={{
                        borderColor: languageValidationErrors[lang.id]?.written ? "red" : undefined,
                      }}
                    >
                      <option value="">Select</option>
                      {languageProficiencies.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    {languageValidationErrors[lang.id]?.written && (
                      <div className={styles.errorMessage}>
                        {languageValidationErrors[lang.id].written}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Reading<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select 
                      className={styles.input}
                      value={lang.reading} 
                      onChange={e => updateLanguage(lang.id, "reading", e.target.value)}
                      style={{
                        borderColor: languageValidationErrors[lang.id]?.reading ? "red" : undefined,
                      }}
                    >
                      <option value="">Select</option>
                      {languageProficiencies.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    {languageValidationErrors[lang.id]?.reading && (
                      <div className={styles.errorMessage}>
                        {languageValidationErrors[lang.id].reading}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className={styles.addRecordContainer}>
                <button className={styles.addRecordBtn} onClick={addLanguage}>
                  Add Language
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.formButtons}>
          <button className={`${styles.btn} ${styles.save}`} onClick={handleSaveDraft}>Save as draft</button>
          <button className={`${styles.btn} ${styles.save}`} onClick={handleUpdate}>Update</button>
          <button className={`${styles.btn} ${styles.submit}`} onClick={() => navigate("/profile/family")}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default Experience;
