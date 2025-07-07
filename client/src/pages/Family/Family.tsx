import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import axios from "axios";
import styles from "../Education/Education.module.css"; 
import familyStyles from "./Family.module.css"; // Assuming you want to use the same styles as Education

const Family: React.FC = () => {
  const [showFamilyBackground, setShowFamilyBackground] = useState(true);
  const [showEmergencyContact, setShowEmergencyContact] = useState(true);
  const navigate = useNavigate();
  const relationshipOptions = [
    "Father",
    "Mother",
    "Brother",
    "Sister",
    "Husband",
    "Wife",
    "Son",
    "Daughter"
  ];

  // Type definitions
  type FamilyRecord = {
    id: number;
    record_id?: number; // if existing record from backend
    name: string;
    relationship: string;
    age: string;
    occupation: string;
    contactNo: string;
  };

  type ValidationErrors = {
    [recordId: number]: {
      [field: string]: string; // error message
    };
  };

  // Add type definition for Emergency Contact
  type EmergencyContactRecord = {
    id: number;
    contact_id?: number; // if existing record from backend
    name: string;
    contactNo: string;
    relationship: string;
  };

  // State with first record being compulsory
  const [familyRecords, setFamilyRecords] = useState<FamilyRecord[]>([
    { 
      id: 1, 
      record_id: undefined,
      name: "", 
      relationship: "", 
      age: "", 
      occupation: "", 
      contactNo: "" 
    }
  ]);

  // Update the state with proper typing and first record as compulsory
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactRecord[]>([
    { 
      id: 1,
      contact_id: undefined,
      name: "", 
      contactNo: "", 
      relationship: "" 
    }
  ]);

  const [familyValidationErrors, setFamilyValidationErrors] = useState<ValidationErrors>({});
  const [emergencyValidationErrors, setEmergencyValidationErrors] = useState<ValidationErrors>({});

  // Mapping function for backend
  const mapFamilyToBackend = (record: FamilyRecord) => ({
    record_id: record.record_id,
    name: record.name,
    relationship: record.relationship,
    age: parseInt(record.age) || null,
    occupation: record.occupation,
    contact_no: record.contactNo,
  });

  // Add mapping function for Emergency Contact backend
  const mapEmergencyToBackend = (record: EmergencyContactRecord) => ({
    contact_id: record.contact_id,
    name: record.name,
    contact_no: record.contactNo,
    relationship: record.relationship,
  });

  // Fetch family records from backend
  const fetchFamilyRecords = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-family-background`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const records = res.data.data.map((rec: any, index: number) => ({
          id: index + 1, // Use sequential IDs for frontend
          record_id: rec.record_id,
          name: rec.name || "",
          relationship: rec.relationship || "",
          age: rec.age ? rec.age.toString() : "",
          occupation: rec.occupation || "",
          contactNo: rec.contact_no || "",
        }));
        setFamilyRecords(records);
      }
    } catch (error) {
      console.error("Failed to fetch family records", error);
    }
  };

  // Add fetch function for Emergency Contact
  const fetchEmergencyContacts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-emergency-contact`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const records = res.data.data.map((rec: any, index: number) => ({
          id: index + 1, // Use sequential IDs for frontend
          contact_id: rec.contact_id,
          name: rec.name || "",
          contactNo: rec.contact_no || "",
          relationship: rec.relationship || "",
        }));
        setEmergencyContacts(records);
      }
    } catch (error) {
      console.error("Failed to fetch emergency contacts", error);
    }
  };

  useEffect(() => {
    fetchFamilyRecords();
    fetchEmergencyContacts();
  }, []);

  // Validation function
  const validateRecords = (): boolean => {
    const familyErrors: ValidationErrors = {};
    const emergencyErrors: ValidationErrors = {};

    // Validate ALL Family Records (first record is compulsory, others are optional but if added must be complete)
    familyRecords.forEach((record) => {
      const recordErrors: { [field: string]: string } = {};

      if (!record.name || !record.name.trim()) {
        recordErrors.name = "Required";
      }
      if (!record.relationship || !record.relationship.trim()) {
        recordErrors.relationship = "Required";
      }
      if (!record.age || !record.age.trim() || isNaN(Number(record.age))) {
        recordErrors.age = "Required and must be a valid number";
      }
      if (!record.occupation || !record.occupation.trim()) {
        recordErrors.occupation = "Required";
      }
      if (!record.contactNo || !record.contactNo.trim()) {
        recordErrors.contactNo = "Required";
      }

      if (Object.keys(recordErrors).length > 0) {
        familyErrors[record.id] = recordErrors;
      }
    });

    // Validate ALL Emergency Contact Records (first record is compulsory, others are optional but if added must be complete)
    emergencyContacts.forEach((contact) => {
      const contactErrors: { [field: string]: string } = {};

      if (!contact.name || !contact.name.trim()) {
        contactErrors.name = "Required";
      }
      if (!contact.contactNo || !contact.contactNo.trim()) {
        contactErrors.contactNo = "Required";
      }
      if (!contact.relationship || !contact.relationship.trim()) {
        contactErrors.relationship = "Required";
      }

      if (Object.keys(contactErrors).length > 0) {
        emergencyErrors[contact.id] = contactErrors;
      }
    });
      setFamilyValidationErrors(familyErrors);
      setEmergencyValidationErrors(emergencyErrors);

        // Return true if ALL sections have no errors
    return Object.keys(familyErrors).length === 0 && 
          Object.keys(emergencyErrors).length === 0;
  };

  // Save as Draft function (like Education.tsx)
  const handleSaveDraft = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      
      console.log("Before save - family records:", familyRecords);
      console.log("Before save - emergency contacts:", emergencyContacts);
      
      // Save both Family Background and Emergency Contact
      const promises = [];
      
      promises.push(
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-family-background`,
          { familyRecords: familyRecords.map(mapFamilyToBackend), is_draft: "Y" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      promises.push(
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-emergency-contact`,
          { emergencyRecords: emergencyContacts.map(mapEmergencyToBackend), is_draft: "Y" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      const responses = await Promise.all(promises);

      // Update family records with backend IDs
      if (responses[0].data.success && responses[0].data.data) {
        const updatedRecords = familyRecords.map((frontendRecord, index) => ({
          ...frontendRecord,
          record_id: responses[0].data.data[index].record_id
        }));
        setFamilyRecords(updatedRecords);
      }

      // Update emergency contacts with backend IDs
      if (responses[1].data.success && responses[1].data.data) {
        const updatedContacts = emergencyContacts.map((frontendRecord, index) => ({
          ...frontendRecord,
          contact_id: responses[1].data.data[index].contact_id
        }));
        setEmergencyContacts(updatedContacts);
      }

      alert("Draft saved!");
    } catch (error) {
      console.error("Save draft error:", error);
      alert("Failed to save draft.");
    }
  };

  // Update function (like Education.tsx)
  const handleUpdate = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    const isValid = validateRecords();
    if (!isValid) {
      alert("Please fill in all required fields before updating.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      console.log("Before update - family records:", familyRecords);
      console.log("Before update - emergency contacts:", emergencyContacts);
      
      // Update both Family Background and Emergency Contact
      const promises = [];
      
      promises.push(
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-family-background`,
          { familyRecords: familyRecords.map(mapFamilyToBackend), is_draft: "N" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      promises.push(
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-emergency-contact`,
          { emergencyRecords: emergencyContacts.map(mapEmergencyToBackend), is_draft: "N" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      const responses = await Promise.all(promises);
      
      // Update family records with backend IDs
      if (responses[0].data.success && responses[0].data.data) {
        const updatedRecords = familyRecords.map((frontendRecord, index) => ({
          ...frontendRecord,
          record_id: responses[0].data.data[index].record_id
        }));
        setFamilyRecords(updatedRecords);
      }

      // Update emergency contacts with backend IDs
      if (responses[1].data.success && responses[1].data.data) {
        const updatedContacts = emergencyContacts.map((frontendRecord, index) => ({
          ...frontendRecord,
          contact_id: responses[1].data.data[index].contact_id
        }));
        setEmergencyContacts(updatedContacts);
      }
      
      alert("Family information updated!");
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update family information.");
    }
  };

  // Add family record function (like Education.tsx addScholarshipAward)
  const addFamilyRecord = () => {
    // Generate ID based on existing records or start from 1
    const newId = familyRecords.length > 0 ? Math.max(...familyRecords.map(r => r.id)) + 1 : 1;
    setFamilyRecords([
      ...familyRecords,
      {
        id: newId,
        record_id: undefined,
        name: "",
        relationship: "",
        age: "",
        occupation: "",
        contactNo: "",
      }
    ]);
  };

  // Update addEmergencyContact function (like addFamilyRecord)
  const addEmergencyContact = () => {
    // Generate ID based on existing records or start from 1
    const newId = emergencyContacts.length > 0 ? Math.max(...emergencyContacts.map(r => r.id)) + 1 : 1;
    setEmergencyContacts([
      ...emergencyContacts,
      {
        id: newId,
        contact_id: undefined,
        name: "",
        contactNo: "",
        relationship: "",
      }
    ]);
  };

  // Delete family record function (like Education.tsx deleteScholarshipAward)
  const deleteFamilyRecord = async (id: number) => {
    const recordToDelete = familyRecords.find(record => record.id === id);
    
    // Don't allow deletion of first record
    if (id === 1) {
      alert("The first family record cannot be deleted as it is required.");
      return;
    }
    
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this family record? This action cannot be undone."
    );
    
    if (!confirmDelete) {
      return;
    }

    try {
      // If the record has a record_id (exists in database), delete from backend
      if (recordToDelete?.record_id) {
        const token = localStorage.getItem("token");
        
        const response = await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/delete-family-background`,
          {
            headers: { Authorization: `Bearer ${token}` },
            data: { record_id: recordToDelete.record_id }
          }
        );

        if (response.data.success) {
          console.log("Family record deleted from database successfully");
        }
      }
      
      // Remove from frontend state
      setFamilyRecords(familyRecords.filter(record => record.id !== id));
      
      // Clear any validation errors for this record
      if (familyValidationErrors[id]) {
        setFamilyValidationErrors((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      }
            
    } catch (error) {
      console.error("Failed to delete family record:", error);
      alert("Failed to delete record from database, but removed from form.");
      
      // Still remove from frontend even if backend delete fails
      setFamilyRecords(familyRecords.filter(record => record.id !== id));
      
      // Clear validation errors
      if (familyValidationErrors[id]) {
        setFamilyValidationErrors((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      }
    }
  };

  // Update function (like Education.tsx updateScholarshipAward)
  const updateFamilyRecord = (id: number, field: string, value: string) => {
    setFamilyRecords(familyRecords.map(record =>
      record.id === id ? { ...record, [field]: value } : record
    ));

    // Clear validation error when user starts typing
    if (familyValidationErrors[id]?.[field] && value.trim() !== "") {
      setFamilyValidationErrors((prev) => {
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

  // Update updateEmergencyContact function (like updateFamilyRecord)
  const updateEmergencyContact = (id: number, field: string, value: string) => {
    setEmergencyContacts(emergencyContacts.map(contact =>
      contact.id === id ? { ...contact, [field]: value } : contact
    ));

    // Clear validation error when user starts typing (using unique ID range)
    const validationId = id;
    if (emergencyValidationErrors[validationId]?.[field] && value.trim() !== "") {
      setEmergencyValidationErrors((prev) => {
        const updated = { ...prev };
        if (updated[validationId]) {
          delete updated[validationId][field];
          // If no more errors for this record, remove the record key entirely
          if (Object.keys(updated[validationId]).length === 0) {
            delete updated[validationId];
          }
        }
        return updated;
      });
    }
  };

  // Keep existing emergency contact functions unchanged
  const deleteEmergencyContact = async (id: number) => {
    const contactToDelete = emergencyContacts.find(contact => contact.id === id);
    
    // Don't allow deletion of first record
    if (id === 1) {
      alert("The first emergency contact cannot be deleted as it is required.");
      return;
    }
    
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this emergency contact? This action cannot be undone."
    );
    
    if (!confirmDelete) {
      return;
    }

    try {
      // If the contact has a contact_id (exists in database), delete from backend
      if (contactToDelete?.contact_id) {
        const token = localStorage.getItem("token");
        
        const response = await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/delete-emergency-contact`,
          {
            headers: { Authorization: `Bearer ${token}` },
            data: { contact_id: contactToDelete.contact_id }
          }
        );

        if (response.data.success) {
          console.log("Emergency contact deleted from database successfully");
        }
      }
      
      // Remove from frontend state
      setEmergencyContacts(emergencyContacts.filter(contact => contact.id !== id));
      
      // Clear any validation errors for this record (using unique ID range)
      const validationId = id;
      if (emergencyValidationErrors[validationId]) {
        setEmergencyValidationErrors((prev) => {
          const updated = { ...prev };
          delete updated[validationId];
          return updated;
        });
      }
            
    } catch (error) {
      console.error("Failed to delete emergency contact:", error);
      alert("Failed to delete contact from database, but removed from form.");
      
      // Still remove from frontend even if backend delete fails
      setEmergencyContacts(emergencyContacts.filter(contact => contact.id !== id));
      
      // Clear validation errors
      const validationId = id;
      if (emergencyValidationErrors[validationId]) {
        setEmergencyValidationErrors((prev) => {
          const updated = { ...prev };
          delete updated[validationId];
          return updated;
        });
      }
    }
  };

  return (
    <div className={styles.mainPanel}>
      <div className={styles.formWrapper}>

        {/* Family Background */}
        <div className={styles.formContainer}>
          <h2
            className={familyStyles.sectionTitle}
            onClick={() => setShowFamilyBackground(prev => !prev)}
          >
            <span className={styles.sectionTitleText}>
              Family Background
            </span>
            <div className={styles.sectionArrow}>
              {showFamilyBackground ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>
          {showFamilyBackground && (
            <div>
              {familyRecords.map((record, index) => (
                <div key={record.id} className={`${styles.formSection} ${index > 0 ? styles.record : ''}`}>
                  {index > 0 && (
                    <div className={styles.deleteBtn} onClick={() => deleteFamilyRecord(record.id)}>
                      <Trash2 size={16} />
                    </div>
                  )}

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Name<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={record.name}
                      onChange={(e) => updateFamilyRecord(record.id, 'name', e.target.value)}
                      style={{
                        borderColor: familyValidationErrors[record.id]?.name ? "red" : undefined,
                      }}
                    />
                    {familyValidationErrors[record.id]?.name && (
                      <div className={styles.errorMessage}>
                        {familyValidationErrors[record.id].name}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Relationship<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select
                      className={styles.input}
                      value={record.relationship}
                      onChange={(e) => updateFamilyRecord(record.id, 'relationship', e.target.value)}
                      style={{
                        borderColor: familyValidationErrors[record.id]?.relationship ? "red" : undefined,
                      }}
                    >
                      <option value="">Select</option>
                      {relationshipOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    {familyValidationErrors[record.id]?.relationship && (
                      <div className={styles.errorMessage}>
                        {familyValidationErrors[record.id].relationship}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Age<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="number"
                      className={styles.input}
                      min="0"
                      value={record.age}
                      onChange={(e) => updateFamilyRecord(record.id, 'age', e.target.value)}
                      style={{
                        borderColor: familyValidationErrors[record.id]?.age ? "red" : undefined,
                      }}
                    />
                    {familyValidationErrors[record.id]?.age && (
                      <div className={styles.errorMessage}>
                        {familyValidationErrors[record.id].age}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Occupation<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={record.occupation}
                      onChange={(e) => updateFamilyRecord(record.id, 'occupation', e.target.value)}
                      style={{
                        borderColor: familyValidationErrors[record.id]?.occupation ? "red" : undefined,
                      }}
                    />
                    {familyValidationErrors[record.id]?.occupation && (
                      <div className={styles.errorMessage}>
                        {familyValidationErrors[record.id].occupation}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Contact No.<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={record.contactNo}
                      onChange={(e) => updateFamilyRecord(record.id, 'contactNo', e.target.value)}
                      style={{
                        borderColor: familyValidationErrors[record.id]?.contactNo ? "red" : undefined,
                      }}
                    />
                    {familyValidationErrors[record.id]?.contactNo && (
                      <div className={styles.errorMessage}>
                        {familyValidationErrors[record.id].contactNo}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className={styles.addRecordContainer}>
                <button onClick={addFamilyRecord} className={styles.addRecordBtn}>
                  Add Family Member
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Emergency Contact */}
        <div className={styles.formContainer}>
          <h2
            className={familyStyles.sectionTitle}
            onClick={() => setShowEmergencyContact(prev => !prev)}
          >
            <span className={styles.sectionTitleText}>
              Emergency Contact
            </span>
            <div className={styles.sectionArrow}>
              {showEmergencyContact ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>
          {showEmergencyContact && (
            <div>
              {emergencyContacts.map((contact, index) => (
                <div key={contact.id} className={`${styles.formSection} ${index > 0 ? styles.record : ''}`}>
                  {index > 0 && (
                    <div className={styles.deleteBtn} onClick={() => deleteEmergencyContact(contact.id)}>
                      <Trash2 size={16} />
                    </div>
                  )}

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Name<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={contact.name}
                      onChange={(e) => updateEmergencyContact(contact.id, 'name', e.target.value)}
                      style={{
                        borderColor: emergencyValidationErrors[contact.id]?.name ? "red" : undefined,
                      }}
                    />
                    {emergencyValidationErrors[contact.id]?.name && (
                      <div className={styles.errorMessage}>
                        {emergencyValidationErrors[contact.id].name}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Contact No.<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={contact.contactNo}
                      onChange={(e) => updateEmergencyContact(contact.id, 'contactNo', e.target.value)}
                      style={{
                        borderColor: emergencyValidationErrors[contact.id]?.contactNo ? "red" : undefined,
                      }}
                    />
                    {emergencyValidationErrors[contact.id]?.contactNo && (
                      <div className={styles.errorMessage}>
                        {emergencyValidationErrors[contact.id].contactNo}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Relationship<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select
                      className={styles.input}
                      value={contact.relationship}
                      onChange={(e) => updateEmergencyContact(contact.id, 'relationship', e.target.value)}
                      style={{
                        borderColor: emergencyValidationErrors[contact.id]?.relationship ? "red" : undefined,
                      }}
                    >
                      <option value="">Select</option>
                      {relationshipOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    {emergencyValidationErrors[contact.id]?.relationship && (
                      <div className={styles.errorMessage}>
                        {emergencyValidationErrors[contact.id].relationship}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className={styles.addRecordContainer}>
                <button onClick={addEmergencyContact} className={styles.addRecordBtn}>
                  Add Contact
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.formButtons}>
          <button className={`${styles.btn} ${styles.save}`} onClick={handleSaveDraft}>Save as draft</button>
          <button className={`${styles.btn} ${styles.save}`} onClick={handleUpdate}>Update</button>
          <button className={`${styles.btn} ${styles.submit}`} onClick={() => navigate("/profile/support")}>Next</button>
        </div>
      </div>
    </div>
  );
}

export default Family;
