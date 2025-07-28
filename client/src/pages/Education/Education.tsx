import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Education.module.css";
import {Trash2, ChevronUp, ChevronDown} from "lucide-react";
import axios from "axios";

const Education: React.FC = () => {
  const [showEducationBackground, setShowEducationBackground] = useState(true);
  const [showScholarshipAwards, setShowScholarshipAwards] = useState(true);
  const [showOtherQualifications, setShowOtherQualifications] = useState(true);
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  // Generate year options from current year down to 1960
  const generateYearOptions = () => {
    const years = [];
    for (let year = currentYear; year >= 1960; year--) {
      years.push(year);
    }
    return years;
  };
  
  type EducationRecord = {
  id: number;
  education_id?: number; // if existing record from backend
  isHighestQualification: string;
  levelOfQualification: string;
  institute: string;
  qualificationAttained: string;
  yearFrom: string;
  yearTo: string;
};

type ValidationErrors = {
  [recordId: number]: {
    [field: string]: string; // error message
  };
};

const [educationRecords, setEducationRecords] = useState<EducationRecord[]>([
  {
    id: 1,
    isHighestQualification: "",
    levelOfQualification: "",
    institute: "",
    qualificationAttained: "",
    yearFrom: "",
    yearTo: "",
  },
]);

const mapToBackend = (record: EducationRecord) => ({
  education_id: record.education_id,
  is_highest_qualification: record.isHighestQualification,
  level_of_qualification: record.levelOfQualification,
  institute: record.institute,
  qualification_attained: record.qualificationAttained,
  year_from: record.yearFrom,
  year_to: record.yearTo,
});

const [educationValidationErrors, setEducationValidationErrors] = useState<ValidationErrors>({});
const [scholarshipValidationErrors, setScholarshipValidationErrors] = useState<ValidationErrors>({});
const [qualificationValidationErrors, setQualificationValidationErrors] = useState<ValidationErrors>({});


const fetchEducationRecords = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-education`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      const records = res.data.data.map((rec: any) => ({
        id: rec.education_id,
        education_id: rec.education_id,
        isHighestQualification: rec.is_highest_qualification || "",
        levelOfQualification: rec.level_of_qualification || "",
        institute: rec.institute || "",
        qualificationAttained: rec.qualification_attained || "",
        yearFrom: rec.year_from ? String(rec.year_from) : "",
        yearTo: rec.year_to ? String(rec.year_to) : "",
      }));
      setEducationRecords(records);
    }
  } catch (error) {
    console.error("Failed to fetch education backgrounds", error);
  }
};

useEffect(() => {
  fetchEducationRecords();
  fetchScholarshipAwards();
  fetchOtherQualifications();
}, []);

const handleSaveDraft = async (e?: React.MouseEvent) => {
  if (e) e.preventDefault();
  try {
    const token = localStorage.getItem("token");
    
    console.log("Before save - education records:", educationRecords);
    console.log("Before save - scholarship awards:", scholarshipAwards);
    console.log("Before save - other qualifications:", otherQualifications);
    // Create promises array - only include scholarship awards if they exist
    const promises = [
      axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/save-education`,
        { educationRecords: educationRecords.map(mapToBackend), is_draft: "Y" },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    ];

    // Only save scholarship awards if there are records
    if (scholarshipAwards.length > 0) {
      promises.push(
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-scholarship-awards`,
          { scholarshipRecords: scholarshipAwards.map(mapScholarshipToBackend), is_draft: "Y" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
    }

    if (otherQualifications.length > 0) {
      promises.push(
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-other-qualifications`,
          { qualificationRecords: otherQualifications.map(mapOtherQualificationToBackend), is_draft: "Y" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
    }

    const responses = await Promise.all(promises);
    const educationResponse = responses[0];
    const scholarshipResponse = responses[1]; // Will be undefined if no scholarship records
    const qualificationResponse = otherQualifications.length > 0 ? responses[responses.length - 1] : undefined;

    // Update education records with backend IDs
    if (educationResponse.data.success && educationResponse.data.data) {
      const updatedRecords = educationRecords.map((frontendRecord, index) => ({
        ...frontendRecord,
        education_id: educationResponse.data.data[index].education_id
      }));
      setEducationRecords(updatedRecords);
    }

    // Update scholarship awards with backend IDs (only if response exists)
    if (scholarshipResponse && scholarshipResponse.data.success && scholarshipResponse.data.data) {
      const updatedScholarships = scholarshipAwards.map((frontendRecord, index) => ({
        ...frontendRecord,
        scholarship_id: scholarshipResponse.data.data[index].scholarship_id
      }));
      setScholarshipAwards(updatedScholarships);
    }

    // Update other qualifications with backend IDs (only if response exists)
    if (qualificationResponse && qualificationResponse.data.success && qualificationResponse.data.data) {
      const updatedQualifications = otherQualifications.map((frontendRecord, index) => ({
        ...frontendRecord,
        qualification_id: qualificationResponse.data.data[index].qualification_id
      }));
      setOtherQualifications(updatedQualifications);
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

  const isValid = validateRecords();
  if (!isValid) {
    alert("Please fill in all required fields before updating.");
    return;
  }
  try {
    const token = localStorage.getItem("token");
    
    console.log("Before update - education records:", educationRecords);
    console.log("Before update - scholarship awards:", scholarshipAwards);
    console.log("Before update - other qualifications:", otherQualifications);
    
    // Create promises array - only include scholarship awards if they exist
    const promises = [
      axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/save-education`,
        { educationRecords: educationRecords.map(mapToBackend), is_draft: "N" },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    ];

    // Only save scholarship awards if there are records
    if (scholarshipAwards.length > 0) {
      promises.push(
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-scholarship-awards`,
          { scholarshipRecords: scholarshipAwards.map(mapScholarshipToBackend), is_draft: "N" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
    }

    if (otherQualifications.length > 0) {
      promises.push(
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-other-qualifications`,
          { qualificationRecords: otherQualifications.map(mapOtherQualificationToBackend), is_draft: "N" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
    }

    const responses = await Promise.all(promises);
    const educationResponse = responses[0];
    const scholarshipResponse = responses[1]; // Will be undefined if no scholarship records
    const qualificationResponse = otherQualifications.length > 0 ? responses[responses.length - 1] : undefined;
    
    // Update education records with backend IDs
    if (educationResponse.data.success && educationResponse.data.data) {
      const updatedRecords = educationRecords.map((frontendRecord, index) => ({
        ...frontendRecord,
        education_id: educationResponse.data.data[index].education_id
      }));
      setEducationRecords(updatedRecords);
    }

    // Update scholarship awards with backend IDs (only if response exists)
    if (scholarshipResponse && scholarshipResponse.data.success && scholarshipResponse.data.data) {
      const updatedScholarships = scholarshipAwards.map((frontendRecord, index) => ({
        ...frontendRecord,
        scholarship_id: scholarshipResponse.data.data[index].scholarship_id
      }));
      setScholarshipAwards(updatedScholarships);
    }

    if (qualificationResponse && qualificationResponse.data.success && qualificationResponse.data.data) {
      const updatedQualifications = otherQualifications.map((frontendRecord, index) => ({
        ...frontendRecord,
        qualification_id: qualificationResponse.data.data[index].qualification_id
      }));
      setOtherQualifications(updatedQualifications);
    }
    window.dispatchEvent(new Event("profile-completeness-updated"));
    alert("Education background updated!");
  } catch (error) {
    console.error("Update error:", error);
    alert("Failed to update education background.");
  }
};

const validateRecords = (): boolean => {
  const educationErrors: ValidationErrors = {};
  const scholarshipErrors: ValidationErrors = {};
  const qualificationErrors: ValidationErrors = {};

  // Validate Education Records
  educationRecords.forEach((record) => {
    const recordErrors: { [field: string]: string } = {};

    if (!record.isHighestQualification) {
      recordErrors.isHighestQualification = "Required";
    }
    if (!record.levelOfQualification) {
      recordErrors.levelOfQualification = "Required";
    }
    if (!record.institute.trim()) {
      recordErrors.institute = "Required";
    }
    if (!record.qualificationAttained.trim()) {
      recordErrors.qualificationAttained = "Required";
    }
    if (!record.yearFrom || isNaN(Number(record.yearFrom))) {
      recordErrors.yearFrom = "Required and must be a valid year";
    }
    if (!record.yearTo || isNaN(Number(record.yearTo))) {
      recordErrors.yearTo = "Required and must be a valid year";
    }

    if (Object.keys(recordErrors).length > 0) {
      educationErrors[record.id] = recordErrors;
    }
  });

  // **ADD: Validate Scholarship Awards (only if records exist)**
  scholarshipAwards.forEach((record) => {
    const recordErrors: { [field: string]: string } = {};

    if (!record.organization.trim()) {
      recordErrors.organization = "Required";
    }
    if (!record.description.trim()) {
      recordErrors.description = "Required";
    }
    if (!record.certificate.trim()) {
      recordErrors.certificate = "Required";
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
      scholarshipErrors[record.id] = recordErrors;
    }
  });

    otherQualifications.forEach((record) => {
    const recordErrors: { [field: string]: string } = {};

    if (!record.organization.trim()) {
      recordErrors.organization = "Required";
    }
    if (!record.course.trim()) {
      recordErrors.course = "Required";
    }
    if (!record.certificate.trim()) {
      recordErrors.certificate = "Required";
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
      qualificationErrors[record.id] = recordErrors;
    }
  });

  setEducationValidationErrors(educationErrors);
  setScholarshipValidationErrors(scholarshipErrors);
  setQualificationValidationErrors(qualificationErrors);
  return Object.keys(educationErrors).length === 0 && 
         Object.keys(scholarshipErrors).length === 0 && 
         Object.keys(qualificationErrors).length === 0;
};


  const addEducationRecord = () => {
    const newId = Math.max(...educationRecords.map(r => r.id)) + 1;
    setEducationRecords([...educationRecords, {
      id: newId,
      education_id: undefined,
      isHighestQualification: "",
      levelOfQualification: "",
      institute: "",
      qualificationAttained: "",
      yearFrom: "",
      yearTo: ""
    }]);
  };

const deleteEducationRecord = async (id: number) => {
  // Find the record to get the education_id
  const recordToDelete = educationRecords.find(record => record.id === id);
  
  if (educationRecords.length > 1 && id !== 1) {
    // **ADD CONFIRMATION POPUP**
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this education record? This action cannot be undone."
    );
    
    if (!confirmDelete) {
      return; // User clicked "Cancel", so don't delete
    }

    try {
      // If the record has an education_id (exists in database), delete from backend
      if (recordToDelete?.education_id) {
        const token = localStorage.getItem("token");
        
        const response = await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/delete-education`,
          {
            headers: { Authorization: `Bearer ${token}` },
            data: { education_id: recordToDelete.education_id }
          }
        );

        if (response.data.success) {
          console.log("Record deleted from database successfully");
        }
      }
      
      // Remove from frontend state regardless
      setEducationRecords(educationRecords.filter(record => record.id !== id));
      
      // Also clear any validation errors for this record
      if (educationValidationErrors[id]) {
        setEducationValidationErrors((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      }
      
    } catch (error) {
      console.error("Failed to delete education record:", error);
      alert("Failed to delete record from database, but removed from form.");
      
      // Still remove from frontend even if backend delete fails
      setEducationRecords(educationRecords.filter(record => record.id !== id));
    }
  }
};

const updateEducationRecord = (id: number, field: string, value: string) => {
  if (field === 'isHighestQualification' && value === 'Yes') {
    const updatedRecords = educationRecords.map(record =>
      record.id === id
        ? { ...record, isHighestQualification: 'Yes' }
        : { ...record, isHighestQualification: 'No' }
    );
    setEducationRecords(updatedRecords);
  } else {
    setEducationRecords(educationRecords.map(record =>
      record.id === id ? { ...record, [field]: value } : record
    ));
  }

  if (educationValidationErrors[id]?.[field] && value.trim() !== "") {
    setEducationValidationErrors((prev) => {
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

// Add this type definition near the top with other types
type ScholarshipRecord = {
  id: number;
  scholarship_id?: number; // if existing record from backend
  organization: string;
  description: string;
  certificate: string;
  fromMonth: string;
  fromYear: string;
  toMonth: string;
  toYear: string;
};

// Update the existing scholarshipAwards state to include scholarship_id
const [scholarshipAwards, setScholarshipAwards] = useState<ScholarshipRecord[]>([]);

// Add this function near your existing mapToBackend function
const mapScholarshipToBackend = (record: ScholarshipRecord) => ({
  scholarship_id: record.scholarship_id,
  organization: record.organization,
  description: record.description,
  certificate: record.certificate,
  from_month: record.fromMonth,
  from_year: record.fromYear,
  to_month: record.toMonth,
  to_year: record.toYear,
});

// Add this function near your fetchEducationRecords function
const fetchScholarshipAwards = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-scholarship-awards`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      const records = res.data.data.map((rec: any) => ({
        id: rec.scholarship_id,
        scholarship_id: rec.scholarship_id,
        organization: rec.organization || "",
        description: rec.description || "",
        certificate: rec.certificate || "",
        fromMonth: rec.from_month || "",
        fromYear: rec.from_year || "",
        toMonth: rec.to_month || "",
        toYear: rec.to_year || "",
      }));
      setScholarshipAwards(records);
    }
  } catch (error) {
    console.error("Failed to fetch scholarship awards", error);
  }
};

const addScholarshipAward = () => {
  // Generate ID based on existing records or start from 1
  const newId = scholarshipAwards.length > 0 ? Math.max(...scholarshipAwards.map(r => r.id)) + 1 : 1;
  setScholarshipAwards([
    ...scholarshipAwards,
    {
      id: newId,
      scholarship_id: undefined,
      organization: "",
      description: "",
      certificate: "",
      fromMonth: "",
      fromYear: "",
      toMonth: "",
      toYear: "",
    }
  ]);
};

const deleteScholarshipAward = async (id: number) => {
  const recordToDelete = scholarshipAwards.find(record => record.id === id);
  
  // Remove the length check - allow deletion of any record
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this scholarship/award record? This action cannot be undone."
  );
  
  if (!confirmDelete) {
    return;
  }

  try {
    // If the record has a scholarship_id (exists in database), delete from backend
    if (recordToDelete?.scholarship_id) {
      const token = localStorage.getItem("token");
      
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/delete-scholarship-awards`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { scholarship_id: recordToDelete.scholarship_id }
        }
      );

      if (response.data.success) {
        console.log("Scholarship record deleted from database successfully");
      }
    }
    
    // Remove from frontend state
    setScholarshipAwards(scholarshipAwards.filter(record => record.id !== id));
    
  } catch (error) {
    console.error("Failed to delete scholarship record:", error);
    alert("Failed to delete record from database, but removed from form.");
    
    // Still remove from frontend even if backend delete fails
    setScholarshipAwards(scholarshipAwards.filter(record => record.id !== id));
  }
};

const updateScholarshipAward = (id: number, field: string, value: string) => {
  setScholarshipAwards(scholarshipAwards.map(record =>
    record.id === id ? { ...record, [field]: value } : record
  ));

  // **ADD: Clear validation error when user starts typing**
  if (scholarshipValidationErrors[id]?.[field] && value.trim() !== "") {
    setScholarshipValidationErrors((prev) => {
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

type OtherQualificationRecord = {
  id: number;
  qualification_id?: number;
  organization: string;
  course: string;
  certificate: string;
  fromMonth: string;
  fromYear: string;
  toMonth: string;
  toYear: string;
};

const [otherQualifications, setOtherQualifications] = useState<OtherQualificationRecord[]>([]);

const mapOtherQualificationToBackend = (record: OtherQualificationRecord) => ({
  qualification_id: record.qualification_id,
  organization: record.organization,
  course: record.course,
  certificate: record.certificate,
  from_month: record.fromMonth,
  from_year: record.fromYear,
  to_month: record.toMonth,
  to_year: record.toYear,
});


const fetchOtherQualifications = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-other-qualifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      const records = res.data.data.map((rec: any) => ({
        id: rec.qualification_id,
        qualification_id: rec.qualification_id,
        organization: rec.organization || "",
        course: rec.course || "",
        certificate: rec.certificate || "",
        fromMonth: rec.from_month || "",
        fromYear: rec.from_year || "",
        toMonth: rec.to_month || "",
        toYear: rec.to_year || "",
      }));
      setOtherQualifications(records);
    }
  } catch (error) {
    console.error("Failed to fetch other qualifications", error);
  }
};

const addOtherQualifications = () => {
  // Generate ID based on existing records or start from 1
  const newId = otherQualifications.length > 0 ? Math.max(...otherQualifications.map(r => r.id)) + 1 : 1;
  setOtherQualifications([
    ...otherQualifications,
    {
      id: newId,
      qualification_id: undefined,
      organization: "",
      course: "",
      certificate: "",
      fromMonth: "",
      fromYear: "",
      toMonth: "",
      toYear: "",
    }
  ]);
};

const deleteOtherQualifications = async (id: number) => {
  const recordToDelete = otherQualifications.find(record => record.id === id);
  
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this qualification record? This action cannot be undone."
  );
  
  if (!confirmDelete) {
    return;
  }

  try {
    // If the record has a qualification_id (exists in database), delete from backend
    if (recordToDelete?.qualification_id) {
      const token = localStorage.getItem("token");
      
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/delete-other-qualifications`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { qualification_id: recordToDelete.qualification_id }
        }
      );

      if (response.data.success) {
        console.log("Other qualification record deleted from database successfully");
      }
    }
    
    // Remove from frontend state
    setOtherQualifications(otherQualifications.filter(record => record.id !== id));
    
  } catch (error) {
    console.error("Failed to delete qualification record:", error);
    alert("Failed to delete record from database, but removed from form.");
    
    // Still remove from frontend even if backend delete fails
    setOtherQualifications(otherQualifications.filter(record => record.id !== id));
  }
};

const updateOtherQualifications = (id: number, field: string, value: string) => {
  setOtherQualifications(otherQualifications.map(record =>
    record.id === id ? { ...record, [field]: value } : record
  ));

  // Clear validation error when user starts typing
  if (qualificationValidationErrors[id]?.[field] && value.trim() !== "") {
    setQualificationValidationErrors((prev) => {
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


  return (
    <div className={styles.mainPanel}>
      <div className={styles.formWrapper}>

        {/* Education Background */}
        <div className={styles.formContainer}>
          <h2
            className={styles.sectionTitle}
            onClick={() => setShowEducationBackground(prev => !prev)}
          >
            <span className={styles.sectionTitleText}>
              Education Background
            </span>
            <div className={styles.sectionArrow}>
              {showEducationBackground ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>
          {showEducationBackground && (
            <div>
              <div className={styles.labelHint}>
                Please provide your most recent qualification for the first record.
              </div>
              
              {educationRecords.map((record, index) => (
                <div key={record.id} className={`${styles.formSection} ${index > 0 ? styles.record : ''}`}>
                  {index > 0 && (
                    <div className={styles.deleteBtn} onClick={() => deleteEducationRecord(record.id)}>
                      <Trash2 size={16}/>
                    </div>
                  )}
                  
                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Highest Qualification?<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select
                      className={styles.input}
                      value={record.isHighestQualification}
                      onChange={(e) => updateEducationRecord(record.id, 'isHighestQualification', e.target.value)}
                      style={{
                        borderColor: educationValidationErrors[record.id]?.isHighestQualification ? "red" : undefined,
                      }}
                    >
                      <option value="" disabled>Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                    {educationValidationErrors[record.id]?.isHighestQualification && (
                      <div className={styles.errorMessage}>
                        {educationValidationErrors[record.id].isHighestQualification}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Level of Qualification<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select 
                      className={styles.input} 
                      value={record.levelOfQualification}
                      onChange={(e) => updateEducationRecord(record.id, 'levelOfQualification', e.target.value)}
                      style={{
                        borderColor: educationValidationErrors[record.id]?.levelOfQualification ? "red" : undefined,
                      }}
                    >
                      <option value="" disabled>Select</option>
                      <option value="PSLE">PSLE</option>
                      <option value="N Level">N Level</option>
                      <option value="O Level">O Level</option>
                      <option value="A Level">A Level</option>
                      <option value="NITEC/Higher NITEC">NITEC/Higher NITEC</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Advanced Diploma">Advanced Diploma</option>
                      <option value="Degree">Degree</option>
                      <option value="Professional Qualification">Professional Qualification</option>
                      <option value="Masters">Masters</option>
                      <option value="Doctorate Degree">Doctorate Degree</option>
                      <option value="Certificate">Certificate</option>
                      <option value="Postgraduate Diploma">Postgraduate Diploma</option>
                      <option value="Others">Others</option>
                    </select>
                    {educationValidationErrors[record.id]?.levelOfQualification && (
                      <div className={styles.errorMessage}>
                        {educationValidationErrors[record.id].levelOfQualification}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Institute / University<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      type="text" 
                      className={styles.input} 
                      placeholder="e.g. NUS, ITE College West"
                      value={record.institute}
                      onChange={(e) => updateEducationRecord(record.id, 'institute', e.target.value)}
                      style={{
                        borderColor: educationValidationErrors[record.id]?.institute ? "red" : undefined,
                      }}
                    />
                    {educationValidationErrors[record.id]?.institute && (
                      <div className={styles.errorMessage}>
                        {educationValidationErrors[record.id].institute}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Qualification Attained<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      type="text" 
                      className={styles.input} 
                      placeholder="e.g. BSc in Computing"
                      value={record.qualificationAttained}
                      onChange={(e) => updateEducationRecord(record.id, 'qualificationAttained', e.target.value)}
                      style={{
                        borderColor: educationValidationErrors[record.id]?.qualificationAttained ? "red" : undefined,
                      }}
                    />
                    {educationValidationErrors[record.id]?.qualificationAttained && (
                      <div className={styles.errorMessage}>
                        {educationValidationErrors[record.id].qualificationAttained}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Year From<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select 
                      className={styles.input} 
                      value={record.yearFrom}
                      onChange={(e) => updateEducationRecord(record.id, 'yearFrom', e.target.value)}
                      style={{
                        borderColor: educationValidationErrors[record.id]?.yearFrom ? "red" : undefined,
                      }}
                    >
                      <option value="">Select Year</option>
                      {generateYearOptions().map(year => (
                        <option key={year} value={year.toString()}>{year}</option>
                      ))}
                    </select>
                    {educationValidationErrors[record.id]?.yearFrom && (
                      <div className={styles.errorMessage}>
                        {educationValidationErrors[record.id].yearFrom}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Year To<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select 
                      className={styles.input} 
                      value={record.yearTo}
                      onChange={(e) => updateEducationRecord(record.id, 'yearTo', e.target.value)}
                      style={{
                        borderColor: educationValidationErrors[record.id]?.yearTo ? "red" : undefined,
                      }}
                    >
                      <option value="">Select Year</option>
                      {generateYearOptions().map(year => (
                        <option key={year} value={year.toString()}>{year}</option>
                      ))}
                    </select>
                    {educationValidationErrors[record.id]?.yearTo && (
                      <div className={styles.errorMessage}>
                        {educationValidationErrors[record.id].yearTo}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className={styles.addRecordContainer}>
                <button
                  onClick={addEducationRecord}
                  className={styles.addRecordBtn}
                >
                  Add Education Record
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scholarship / Awards */}
        <div className={styles.formContainer}>
          <h2
            className={styles.sectionTitle}
            onClick={() => setShowScholarshipAwards(prev => !prev)}
          >
            <span className={styles.sectionTitleText}>
              Scholarship / Awards (Optional)
            </span>
            <div className={styles.sectionArrow}>
              {showScholarshipAwards ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>
          {showScholarshipAwards && (
            <div>
              {scholarshipAwards.length === 0 && (
                <div className={styles.noRecordsMessage}>
                  No scholarship/award records added yet. Click "Add Award Record" to get started.
                </div>
              )}

              {scholarshipAwards.map((record) => (
                <div key={record.id} className={`${styles.formSection} ${styles.record}`}>
                  <div className={styles.deleteBtn} onClick={() => deleteScholarshipAward(record.id)}>
                    <Trash2 size={16} />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Institute / Organization Name<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={record.organization}
                      onChange={(e) => updateScholarshipAward(record.id, 'organization', e.target.value)}
                      style={{
                        borderColor: scholarshipValidationErrors[record.id]?.organization ? "red" : undefined,
                      }}
                    />
                    {scholarshipValidationErrors[record.id]?.organization && (
                      <div className={styles.errorMessage}>
                        {scholarshipValidationErrors[record.id].organization}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Description of Award<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={record.description}
                      onChange={(e) => updateScholarshipAward(record.id, 'description', e.target.value)}
                      style={{
                        borderColor: scholarshipValidationErrors[record.id]?.description ? "red" : undefined,
                      }}
                    />
                    {scholarshipValidationErrors[record.id]?.description && (
                      <div className={styles.errorMessage}>
                        {scholarshipValidationErrors[record.id].description}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Certificate Awarded<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={record.certificate}
                      onChange={(e) => updateScholarshipAward(record.id, 'certificate', e.target.value)}
                      style={{
                        borderColor: scholarshipValidationErrors[record.id]?.certificate ? "red" : undefined,
                      }}
                    />
                    {scholarshipValidationErrors[record.id]?.certificate && (
                      <div className={styles.errorMessage}>
                        {scholarshipValidationErrors[record.id].certificate}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Period From<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <div className={styles.inputPair}>
                      <select
                        className={styles.input}
                        value={record.fromMonth}
                        onChange={(e) => updateScholarshipAward(record.id, 'fromMonth', e.target.value)}
                        style={{
                          borderColor: scholarshipValidationErrors[record.id]?.fromMonth ? "red" : undefined,
                        }}
                      >
                        <option value="">Month</option>
                        {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>

                      <select
                        className={styles.input}
                        value={record.fromYear}
                        onChange={(e) => updateScholarshipAward(record.id, 'fromYear', e.target.value)}
                        style={{
                          borderColor: scholarshipValidationErrors[record.id]?.fromYear ? "red" : undefined,
                        }}
                      >
                        <option value="">Year</option>
                        {generateYearOptions().map(year => (
                          <option key={year} value={year.toString()}>{year}</option>
                        ))}
                      </select>
                    </div>
                    {(scholarshipValidationErrors[record.id]?.fromMonth || scholarshipValidationErrors[record.id]?.fromYear) && (
                      <div className={styles.errorMessage}>
                        {scholarshipValidationErrors[record.id]?.fromMonth || scholarshipValidationErrors[record.id]?.fromYear}
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
                        onChange={(e) => updateScholarshipAward(record.id, 'toMonth', e.target.value)}
                        style={{
                          borderColor: scholarshipValidationErrors[record.id]?.toMonth ? "red" : undefined,
                        }}
                      >
                        <option value="">Month</option>
                        {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        className={styles.input}
                        value={record.toYear}
                        onChange={(e) => updateScholarshipAward(record.id, 'toYear', e.target.value)}
                        style={{
                          borderColor: scholarshipValidationErrors[record.id]?.toYear ? "red" : undefined,
                        }}
                      >
                        <option value="">Year</option>
                        {generateYearOptions().map(year => (
                          <option key={year} value={year.toString()}>{year}</option>
                        ))}
                      </select>
                    </div>
                    {(scholarshipValidationErrors[record.id]?.toMonth || scholarshipValidationErrors[record.id]?.toYear) && (
                      <div className={styles.errorMessage}>
                        {scholarshipValidationErrors[record.id]?.toMonth || scholarshipValidationErrors[record.id]?.toYear}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className={styles.addRecordContainer}>
                <button onClick={addScholarshipAward} className={styles.addRecordBtn}>
                  Add Award Record
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Other Qualifications */}
        <div className={styles.formContainer}>
          <h2
            className={styles.sectionTitle}
            onClick={() => setShowOtherQualifications(prev => !prev)}
          >
            <span className={styles.sectionTitleText}>
              Other Professional Qualifications (Optional)
            </span>
            <div className={styles.sectionArrow}>
              {showOtherQualifications ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>
          {showOtherQualifications && (
            <div>
              {otherQualifications.length === 0 && (
                <div className={styles.noRecordsMessage}>
                  No qualification records added yet. Click "Add Qualification Record" to get started.
                </div>
              )}

              {otherQualifications.map((record) => (
                <div key={record.id} className={`${styles.formSection} ${styles.record}`}>
                  <div className={styles.deleteBtn} onClick={() => deleteOtherQualifications(record.id)}>
                    <Trash2 size={16} />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Institute / Organization Name<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={record.organization}
                      onChange={(e) => updateOtherQualifications(record.id, 'organization', e.target.value)}
                      style={{
                        borderColor: qualificationValidationErrors[record.id]?.organization ? "red" : undefined,
                      }}
                    />
                    {qualificationValidationErrors[record.id]?.organization && (
                      <div className={styles.errorMessage}>
                        {qualificationValidationErrors[record.id].organization}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Course Attended<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={record.course}
                      onChange={(e) => updateOtherQualifications(record.id, 'course', e.target.value)}
                      style={{
                        borderColor: qualificationValidationErrors[record.id]?.course ? "red" : undefined,
                      }}
                    />
                    {qualificationValidationErrors[record.id]?.course && (
                      <div className={styles.errorMessage}>
                        {qualificationValidationErrors[record.id].course}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Certificate Awarded<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={record.certificate}
                      onChange={(e) => updateOtherQualifications(record.id, 'certificate', e.target.value)}
                      style={{
                        borderColor: qualificationValidationErrors[record.id]?.certificate ? "red" : undefined,
                      }}
                    />
                    {qualificationValidationErrors[record.id]?.certificate && (
                      <div className={styles.errorMessage}>
                        {qualificationValidationErrors[record.id].certificate}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Period From<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <div className={styles.inputPair}>
                      <select
                        className={styles.input}
                        value={record.fromMonth}
                        onChange={(e) => updateOtherQualifications(record.id, 'fromMonth', e.target.value)}
                        style={{
                          borderColor: qualificationValidationErrors[record.id]?.fromMonth ? "red" : undefined,
                        }}
                      >
                        <option value="">Month</option>
                        {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        className={styles.input}
                        value={record.fromYear}
                        onChange={(e) => updateOtherQualifications(record.id, 'fromYear', e.target.value)}
                        style={{
                          borderColor: qualificationValidationErrors[record.id]?.fromYear ? "red" : undefined,
                        }}
                      >
                        <option value="">Year</option>
                        {generateYearOptions().map(year => (
                          <option key={year} value={year.toString()}>{year}</option>
                        ))}
                      </select>
                    </div>
                    {(qualificationValidationErrors[record.id]?.fromMonth || qualificationValidationErrors[record.id]?.fromYear) && (
                      <div className={styles.errorMessage}>
                        {qualificationValidationErrors[record.id]?.fromMonth || qualificationValidationErrors[record.id]?.fromYear}
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
                        onChange={(e) => updateOtherQualifications(record.id, 'toMonth', e.target.value)}
                        style={{
                          borderColor: qualificationValidationErrors[record.id]?.toMonth ? "red" : undefined,
                        }}
                      >
                        <option value="">Month</option>
                        {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        className={styles.input}
                        value={record.toYear}
                        onChange={(e) => updateOtherQualifications(record.id, 'toYear', e.target.value)}
                        style={{
                          borderColor: qualificationValidationErrors[record.id]?.toYear ? "red" : undefined,
                        }}
                      >
                        <option value="">Year</option>
                        {generateYearOptions().map(year => (
                          <option key={year} value={year.toString()}>{year}</option>
                        ))}
                      </select>
                    </div>
                    {(qualificationValidationErrors[record.id]?.toMonth || qualificationValidationErrors[record.id]?.toYear) && (
                      <div className={styles.errorMessage}>
                        {qualificationValidationErrors[record.id]?.toMonth || qualificationValidationErrors[record.id]?.toYear}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className={styles.addRecordContainer}>
                <button onClick={addOtherQualifications} className={styles.addRecordBtn}>
                  Add Qualification Record
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.formButtons}>
          <button className={`${styles.btn} ${styles.save}`} onClick={handleSaveDraft}>Save as draft</button>
          <button className={`${styles.btn} ${styles.save}`} onClick={handleUpdate}>Update</button>
          <button className={`${styles.btn} ${styles.submit}`} onClick={() => navigate("/profile/work")}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default Education;