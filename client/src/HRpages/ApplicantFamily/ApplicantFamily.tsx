import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";

const ApplicantFamily: React.FC = () => {
  const [showFamilyBackground, setShowFamilyBackground] = useState(true);
  const [showEmergencyContact, setShowEmergencyContact] = useState(true);
  const navigate = useNavigate();

  const [familyRecords, setFamilyRecords] = useState([
    { id: 1, name: "", relationship: "", age: "", occupation: "", contactNo: "" }
  ]);

  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: 1, name: "", contactNo: "", relationship: "" }
  ]);

  const deleteFamilyRecord = (id: number) => {
    if (familyRecords.length > 1 && id !== 1) {
      setFamilyRecords(familyRecords.filter(record => record.id !== id));
    }
  };

  const updateFamilyRecord = (id: number, field: string, value: string) => {
    setFamilyRecords(familyRecords.map(record =>
      record.id === id ? { ...record, [field]: value } : record
    ));
  };

  const deleteEmergencyContact = (id: number) => {
    if (emergencyContacts.length > 1 && id !== 1) {
      setEmergencyContacts(emergencyContacts.filter(contact => contact.id !== id));
    }
  };

  const updateEmergencyContact = (id: number, field: string, value: string) => {
    setEmergencyContacts(emergencyContacts.map(contact =>
      contact.id === id ? { ...contact, [field]: value } : contact
    ));
  };

  return (
    <div className="main-panel">
      <div className="form-wrapper">

        {/* Family Background */}
        <div className="form-container">
          <h2
            className="section-title"
            onClick={() => setShowFamilyBackground(prev => !prev)}
          >
            Family Background
          </h2>
          {showFamilyBackground && (
            <div>
              {familyRecords.map((record, index) => (
                <div key={record.id} className={`form-section ${index > 0 ? 'record' : ''}`}>
                  {index > 0 && (
                    <div className="delete-btn" onClick={() => deleteFamilyRecord(record.id)}>
                      <Trash2 size={16} />
                    </div>
                  )}

                  <div>
                    <span className="label-text">Name<span className="required-asterisk">*</span></span>
                    <input
                      type="text"
                      className="input"
                      value={record.name}
                      onChange={(e) => updateFamilyRecord(record.id, 'name', e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="label-text">Relationship<span className="required-asterisk">*</span></span>
                    <input
                      type="text"
                      className="input"
                      value={record.relationship}
                      onChange={(e) => updateFamilyRecord(record.id, 'relationship', e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="label-text">Age<span className="required-asterisk">*</span></span>
                    <input
                      type="number"
                      className="input no-spinner"
                      min="0"
                      value={record.age}
                      onChange={(e) => updateFamilyRecord(record.id, 'age', e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="label-text">Occupation<span className="required-asterisk">*</span></span>
                    <input
                      type="text"
                      className="input"
                      value={record.occupation}
                      onChange={(e) => updateFamilyRecord(record.id, 'occupation', e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="label-text">Contact No.<span className="required-asterisk">*</span></span>
                    <input
                      type="text"
                      className="input"
                      value={record.contactNo}
                      onChange={(e) => updateFamilyRecord(record.id, 'contactNo', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Contact */}
        <div className="form-container">
          <h2
            className="section-title"
            onClick={() => setShowEmergencyContact(prev => !prev)}
          >
            Emergency Contact
          </h2>
          {showEmergencyContact && (
            <div>
              {emergencyContacts.map((contact, index) => (
                <div key={contact.id} className={`form-section ${index > 0 ? 'record' : ''}`}>
                  {index > 0 && (
                    <div className="delete-btn" onClick={() => deleteEmergencyContact(contact.id)}>
                      <Trash2 size={16} />
                    </div>
                  )}

                  <div>
                    <span className="label-text">Name<span className="required-asterisk">*</span></span>
                    <input
                      type="text"
                      className="input"
                      value={contact.name}
                      onChange={(e) => updateEmergencyContact(contact.id, 'name', e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="label-text">Contact No.<span className="required-asterisk">*</span></span>
                    <input
                      type="text"
                      className="input"
                      value={contact.contactNo}
                      onChange={(e) => updateEmergencyContact(contact.id, 'contactNo', e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="label-text">Relationship<span className="required-asterisk">*</span></span>
                    <input
                      type="text"
                      className="input"
                      value={contact.relationship}
                      onChange={(e) => updateEmergencyContact(contact.id, 'relationship', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-buttons">
          <button className="btn submit" onClick={() => navigate("/hr/applicant-details/support")}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default ApplicantFamily;
