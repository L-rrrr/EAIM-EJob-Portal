import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp} from "lucide-react";
import axios from "axios";
import styles from "../../pages/Education/Education.module.css"; 
import familyStyles from "../../pages/Family/Family.module.css";

const ApplicantFamily: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [showFamilyBackground, setShowFamilyBackground] = useState(true);
  const [showEmergencyContact, setShowEmergencyContact] = useState(true);
  
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
    record_id?: number;
    name: string;
    relationship: string;
    age: string;
    occupation: string;
    contactNo: string;
  };

  type EmergencyContactRecord = {
    id: number;
    contact_id?: number;
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

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactRecord[]>([
    { 
      id: 1,
      contact_id: undefined,
      name: "", 
      contactNo: "", 
      relationship: "" 
    }
  ]);


  useEffect(() => {
    const fetchApplicantFamilyData = async () => {
      try {
        setShowFamilyBackground(true);
        setShowEmergencyContact(true);
        const token = localStorage.getItem("token");

        if (!userId) {
          console.error("No user ID provided");
          return;
        }

        // Fetch both family and emergency contact in one API call
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/get-applicant-family/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data && response.data.success) {
          const { family, emergency } = response.data.data;

          // Set family records
          if (Array.isArray(family) && family.length > 0) {
            const records = family.map((rec: any, index: number) => ({
              id: index + 1,
              record_id: rec.record_id,
              name: rec.name || "",
              relationship: rec.relationship || "",
              age: rec.age ? rec.age.toString() : "",
              occupation: rec.occupation || "",
              contactNo: rec.contact_no || "",
            }));
            setFamilyRecords(records);
          }

          // Set emergency contacts
          if (Array.isArray(emergency) && emergency.length > 0) {
            const mappedContacts = emergency.map((rec: any, index: number) => ({
              id: index + 1,
              contact_id: rec.contact_id,
              name: rec.name || "",
              contactNo: rec.contact_no || "",
              relationship: rec.relationship || "",
            }));
            setEmergencyContacts(mappedContacts);
          }
        }
      } catch (error) {
        console.error("Failed to fetch applicant family data", error);
      }
    };

    fetchApplicantFamilyData();
  }, [userId]);


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

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Name<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={record.name}
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Relationship<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select
                      className={styles.input}
                      value={record.relationship}
                      disabled
                    >
                      <option value="">Select</option>
                      {relationshipOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
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
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Occupation<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={record.occupation}
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Contact No.<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={record.contactNo}
                      disabled
                    />
                  </div>
                </div>
              ))}
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

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Name<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={contact.name}
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Contact No.<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={contact.contactNo}
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Relationship<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select
                      className={styles.input}
                      value={contact.relationship}
                      disabled
                    >
                      <option value="">Select</option>
                      {relationshipOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
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
            onClick={() => navigate(`/hr/applicant-details/work?userId=${userId}`)}
          >
            ← Previous
          </button>
          <button 
            className={`${styles.btn} ${styles.submit}`} 
            onClick={() => navigate(`/hr/applicant-details/support?userId=${userId}`)}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicantFamily;