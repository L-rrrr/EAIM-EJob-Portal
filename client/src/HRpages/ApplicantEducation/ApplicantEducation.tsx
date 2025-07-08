import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ApplicantEducation.css";

const ApplicantEducation: React.FC = () => {
  const [showEducationBackground, setShowEducationBackground] = useState(true);
  const [showScholarshipAwards, setShowScholarshipAwards] = useState(true);
  const [showOtherQualifications, setShowOtherQualifications] = useState(true);
  const navigate = useNavigate();
  
  const [educationRecords, setEducationRecords] = useState([
    {
      id: 1,
      hasHighestQualification: "",
      levelOfQualification: "",
      institute: "",
      qualificationAttained: "",
      yearFrom: "",
      yearTo: ""
    }
  ]);

  const updateEducationRecord = (id: number, field: string, value: string) => {
  if (field === 'hasHighestQualification' && value === 'Yes') {
    const updatedRecords = educationRecords.map(record =>
      record.id === id
        ? { ...record, hasHighestQualification: 'Yes' }
        : { ...record, hasHighestQualification: 'No' }
    );
    setEducationRecords(updatedRecords);
  } else {
    setEducationRecords(educationRecords.map(record =>
      record.id === id ? { ...record, [field]: value } : record
    ));
  }
};

const [scholarshipAwards, setScholarshipAwards] = useState([
  {
    id: 1,
    organization: "",
    description: "",
    fromMonth: "",
    fromYear: "",
    toMonth: "",
    toYear: "",
    certificate: ""
  }
]);

const updateScholarshipAward = (id: number, field: string, value: string) => {
  setScholarshipAwards(scholarshipAwards.map(record =>
    record.id === id ? { ...record, [field]: value } : record
  ));
};


const [otherQualifications, setOtherQualifications] = useState([
  {
    id: 1,
    organization: "",
    course: "",
    fromMonth: "",
    fromYear: "",
    toMonth: "",
    toYear: "",
    certificate: ""
  }
]);

const updateOtherQualifications = (id: number, field: string, value: string) => {
  setOtherQualifications(otherQualifications.map(record =>
    record.id === id ? { ...record, [field]: value } : record
  ));
};


  return (
    <div className="main-panel">
      <div className="form-wrapper">

        {/* Education Background */}
        <div className="form-container">
          <h2
            className="section-title"
            onClick={() => setShowEducationBackground(prev => !prev)}
          >
            Education Background
          </h2>
          {showEducationBackground && (
            <div>
              {educationRecords.map((record, index) => (
                <div key={record.id} className={`form-section ${index > 0 ? 'record' : ''}`}>
                  {index > 0}
                  
                  <div>
                    <span className="label-text">
                      Highest Qualification?<span className="required-asterisk">*</span>
                    </span>
                    <select
                      className="input"
                      value={record.hasHighestQualification}
                      onChange={(e) => updateEducationRecord(record.id, 'hasHighestQualification', e.target.value)}
                    >
                      <option value="" disabled>Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div>
                    <span className="label-text">
                      Level of Qualification<span className="required-asterisk">*</span>
                    </span>
                    <select 
                      className="input" 
                      value={record.levelOfQualification}
                      onChange={(e) => updateEducationRecord(record.id, 'levelOfQualification', e.target.value)}
                    >
                      <option value="" disabled>Select</option>
                      <option value="PSLE">PSLE</option>
                      <option value="N Level">N Level</option>
                      <option value="O Level">O Level</option>
                      <option value="A Level">A Level</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Degree">Degree</option>
                    </select>
                  </div>

                  <div>
                    <span className="label-text">
                      Institute / University<span className="required-asterisk">*</span>
                    </span>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="e.g. NUS, ITE College West"
                      value={record.institute}
                      onChange={(e) => updateEducationRecord(record.id, 'institute', e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="label-text">
                      Qualification Attained<span className="required-asterisk">*</span>
                    </span>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="e.g. BSc in Computing"
                      value={record.qualificationAttained}
                      onChange={(e) => updateEducationRecord(record.id, 'qualificationAttained', e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="label-text">
                      Year From<span className="required-asterisk">*</span>
                    </span>
                    <input 
                      type="number" 
                      className="input no-spinner" 
                      min="1960" 
                      max="2100"
                      value={record.yearFrom}
                      onChange={(e) => updateEducationRecord(record.id, 'yearFrom', e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="label-text">
                      Year To<span className="required-asterisk">*</span>
                    </span>
                    <input 
                      type="number" 
                      className="input no-spinner" 
                      min="1960" 
                      max="2100"
                      value={record.yearTo}
                      onChange={(e) => updateEducationRecord(record.id, 'yearTo', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scholarship / Awards */}
        <div className="form-container">
          <h2
            className="section-title"
            onClick={() => setShowScholarshipAwards(prev => !prev)}
          >
            Scholarship / Awards
          </h2>
          {showScholarshipAwards && (
            <div>
              {scholarshipAwards.map((record, index) => (
                <div key={record.id} className={`form-section ${index > 0 ? 'record' : ''}`}>
                  {index > 0}

                  <div>
                    <span className="label-text">Institute / Organization Name</span>
                    <input
                      type="text"
                      className="input"
                      value={record.organization}
                      onChange={(e) => updateScholarshipAward(record.id, 'organization', e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="label-text">Description of Award</span>
                    <input
                      type="text"
                      className="input"
                      value={record.description}
                      onChange={(e) => updateScholarshipAward(record.id, 'description', e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="label-text">Certificate Awarded</span>
                    <input
                      type="text"
                      className="input"
                      value={record.certificate}
                      onChange={(e) => updateScholarshipAward(record.id, 'certificate', e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="label-text">Period From</span>
                    <div className="input-pair">
                      <select
                        className="input"
                        value={record.fromMonth}
                        onChange={(e) => updateScholarshipAward(record.id, 'fromMonth', e.target.value)}
                      >
                        <option value="">Month</option>
                        {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className="input"
                        placeholder="Year"
                        value={record.fromYear}
                        onChange={(e) => updateScholarshipAward(record.id, 'fromYear', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <span className="label-text">To</span>
                    <div className="input-pair">
                      <select
                        className="input"
                        value={record.toMonth}
                        onChange={(e) => updateScholarshipAward(record.id, 'toMonth', e.target.value)}
                      >
                        <option value="">Month</option>
                        {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className="input"
                        placeholder="Year"
                        value={record.toYear}
                        onChange={(e) => updateScholarshipAward(record.id, 'toYear', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                  
                
              ))}
            </div>
          )}
        </div>


        {/* Other Qualifications */}
        <div className="form-container">
          <h2
            className="section-title"
            onClick={() => setShowOtherQualifications(prev => !prev)}
          >
            Other Professional Qualifications
          </h2>
          {showOtherQualifications && (
            <div>
              {otherQualifications.map((record, index) => (
                <div key={record.id} className={`form-section ${index > 0 ? 'record' : ''}`}>
                  {index > 0}

                  <div>
                    <span className="label-text">Institute / Organization Name</span>
                    <input
                      type="text"
                      className="input"
                      value={record.organization}
                      onChange={(e) => updateOtherQualifications(record.id, 'organization', e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="label-text">Course Attended</span>
                    <input
                      type="text"
                      className="input"
                      value={record.course}
                      onChange={(e) => updateOtherQualifications(record.id, 'description', e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="label-text">Certificate Awarded</span>
                    <input
                      type="text"
                      className="input"
                      value={record.certificate}
                      onChange={(e) => updateOtherQualifications(record.id, 'certificate', e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="label-text">Period From</span>
                    <div className="input-pair">
                      <select
                        className="input"
                        value={record.fromMonth}
                        onChange={(e) => updateOtherQualifications(record.id, 'fromMonth', e.target.value)}
                      >
                        <option value="">Month</option>
                        {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className="input"
                        placeholder="Year"
                        value={record.fromYear}
                        onChange={(e) => updateOtherQualifications(record.id, 'fromYear', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <span className="label-text">To</span>
                    <div className="input-pair">
                      <select
                        className="input"
                        value={record.toMonth}
                        onChange={(e) => updateOtherQualifications(record.id, 'toMonth', e.target.value)}
                      >
                        <option value="">Month</option>
                        {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className="input"
                        placeholder="Year"
                        value={record.toYear}
                        onChange={(e) => updateOtherQualifications(record.id, 'toYear', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}

            </div>
          )}
        </div>

        <div className="form-buttons">
          <button className="btn submit" onClick={() => navigate("/hr/applicant-details/work")}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default ApplicantEducation;