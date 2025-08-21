/**
 * ApplicantEducation Page
 *
 * This component displays the applicant's education background, scholarships/awards,
 * and other professional qualifications for HR review in a read-only format.
 *
 * Features:
 * - Fetches and displays education, scholarship/award, and other qualification records from the backend
 *   using the applicationId from the URL.
 * - Parses JSON fields from the backend response.
 * - Displays all records in collapsible sections, with all fields disabled (read-only).
 * - Handles empty states for each section.
 * - Provides navigation to previous and next sections of the applicant's details.
 *
 * Usage:
 * - Used as a route page: `/hr/applicant-details/education?applicationId=...`
 *
 * State:
 * - educationRecords: List of education background records.
 * - scholarshipAwards: List of scholarship/award records.
 * - otherQualifications: List of other professional qualification records.
 * - Collapsed/expanded state for each section.
 *
 * Dependencies:
 * - axios for HTTP requests.
 * - react-router-dom for navigation and query params.
 * - lucide-react for icons.
 * - Education.module.css for styling.
 *
 * @component
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "../../pages/Education/Education.module.css";
import { ChevronUp, ChevronDown } from "lucide-react";
import axios from "axios";

type EducationRecord = {
  id: number;
  education_id?: number;
  isHighestQualification: string;
  levelOfQualification: string;
  institute: string;
  qualificationAttained: string;
  yearFrom: string;
  yearTo: string;
};

type ScholarshipRecord = {
  id: number;
  scholarship_id?: number;
  organization: string;
  description: string;
  certificate: string;
  fromMonth: string;
  fromYear: string;
  toMonth: string;
  toYear: string;
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

const ApplicantEducation: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId');

  const [showEducationBackground, setShowEducationBackground] = useState(true);
  const [showScholarshipAwards, setShowScholarshipAwards] = useState(true);
  const [showOtherQualifications, setShowOtherQualifications] = useState(true);

  const currentYear = new Date().getFullYear();

  // Generate year options from current year down to 1960
  const generateYearOptions = () => {
    const years = [];
    for (let year = currentYear; year >= 1960; year--) {
      years.push(year);
    }
    return years;
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

  const [scholarshipAwards, setScholarshipAwards] = useState<ScholarshipRecord[]>([]);
  const [otherQualifications, setOtherQualifications] = useState<OtherQualificationRecord[]>([]);

  /**
   * Fetches applicant's education, scholarship/award, and other qualification data from the backend
   * using the applicationId. Parses JSON fields and updates state.
   */
  useEffect(() => {
    const fetchApplicantEducationData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!applicationId) {
          console.error("No application ID provided");
          return;
        }

        // Fetch applicant education data based on application ID
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/application-full-details?applicationId=${applicationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data && response.data.success) {
          const responseData = response.data.data;

          // Parse education_background JSON
          let data: any = {};
          if (responseData.education_background) {
            try {
              data = JSON.parse(responseData.education_background);
            } catch {
              data = {};
            }
          }

          if (Array.isArray(data)) {
            data = { education: data };
          }
          
          // Set education records
          if (data.education && Array.isArray(data.education) && data.education.length > 0) {
            const records = data.education.map((rec: any) => ({
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
          } else {
            // Set default empty record if no data
            setEducationRecords([{
              id: 1,
              isHighestQualification: "",
              levelOfQualification: "",
              institute: "",
              qualificationAttained: "",
              yearFrom: "",
              yearTo: "",
            }]);
          }

          // Parse scholarship_awards JSON
          let scholarships: any[] = [];
          if (responseData.scholarship_awards) {
            try {
              scholarships = JSON.parse(responseData.scholarship_awards);
            } catch {
              scholarships = [];
            }
          }
          if (Array.isArray(scholarships) && scholarships.length > 0) {
            setScholarshipAwards(
              scholarships.map((rec: any, idx: number) => ({
                id: rec.scholarship_id ?? idx + 1,
                scholarship_id: rec.scholarship_id,
                organization: rec.organization || "",
                description: rec.description || "",
                certificate: rec.certificate || "",
                fromMonth: rec.from_month || "",
                fromYear: rec.from_year || "",
                toMonth: rec.to_month || "",
                toYear: rec.to_year || "",
              }))
            );
          } else {
            setScholarshipAwards([]);
          }

          // Set other qualifications
          let qualifications: any[] = [];
          if (responseData.other_qualifications) {
            try {
              qualifications = JSON.parse(responseData.other_qualifications);
            } catch {
              qualifications = [];
            }
          }
          if (Array.isArray(qualifications) && qualifications.length > 0) {
            setOtherQualifications(
              qualifications.map((rec: any, idx: number) => ({
                id: rec.qualification_id ?? idx + 1,
                qualification_id: rec.qualification_id,
                organization: rec.organization || "",
                course: rec.course || "",
                certificate: rec.certificate || "",
                fromMonth: rec.from_month || "",
                fromYear: rec.from_year || "",
                toMonth: rec.to_month || "",
                toYear: rec.to_year || "",
              }))
            );
          } else {
            setOtherQualifications([]);
          }
        }
      } catch (error: any) {
        console.error("Failed to fetch applicant education data", error);
      }
    };

    fetchApplicantEducationData();
  }, [applicationId]);

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
                  
                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Highest Qualification?<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select
                      className={styles.input}
                      value={record.isHighestQualification}
                      disabled
                    >
                      <option value="" disabled>Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Level of Qualification<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select 
                      className={styles.input} 
                      value={record.levelOfQualification}
                      disabled
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

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Institute / University<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input 
                      type="text" 
                      className={styles.input} 
                      placeholder="e.g. NUS, ITE College West"
                      value={record.institute}
                      disabled
                    />
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
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Year From<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select 
                      className={styles.input} 
                      value={record.yearFrom}
                      disabled
                    >
                      <option value="">Select Year</option>
                      {generateYearOptions().map(year => (
                        <option key={year} value={year.toString()}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Year To<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select 
                      className={styles.input} 
                      value={record.yearTo}
                      disabled
                    >
                      <option value="">Select Year</option>
                      {generateYearOptions().map(year => (
                        <option key={year} value={year.toString()}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
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
                  No scholarship/award records found.
                </div>
              )}

              {scholarshipAwards.map((record) => (
                <div key={record.id} className={`${styles.formSection} ${styles.record}`}>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Institute / Organization Name<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={record.organization}
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Description of Award<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={record.description}
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Certificate Awarded<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={record.certificate}
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Period From<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <div className={styles.inputPair}>
                      <select
                        className={styles.input}
                        value={record.fromMonth}
                        disabled
                      >
                        <option value="">Month</option>
                        {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>

                      <select
                        className={styles.input}
                        value={record.fromYear}
                        disabled
                      >
                        <option value="">Year</option>
                        {generateYearOptions().map(year => (
                          <option key={year} value={year.toString()}>{year}</option>
                        ))}
                      </select>
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
                        {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        className={styles.input}
                        value={record.toYear}
                        disabled
                      >
                        <option value="">Year</option>
                        {generateYearOptions().map(year => (
                          <option key={year} value={year.toString()}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
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
                  No qualification records found.
                </div>
              )}

              {otherQualifications.map((record) => (
                <div key={record.id} className={`${styles.formSection} ${styles.record}`}>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Institute / Organization Name<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={record.organization}
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Course Attended<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={record.course}
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Certificate Awarded<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={record.certificate}
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Period From<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <div className={styles.inputPair}>
                      <select
                        className={styles.input}
                        value={record.fromMonth}
                        disabled
                      >
                        <option value="">Month</option>
                        {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        className={styles.input}
                        value={record.fromYear}
                        disabled
                      >
                        <option value="">Year</option>
                        {generateYearOptions().map(year => (
                          <option key={year} value={year.toString()}>{year}</option>
                        ))}
                      </select>
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
                        {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        className={styles.input}
                        value={record.toYear}
                        disabled
                      >
                        <option value="">Year</option>
                        {generateYearOptions().map(year => (
                          <option key={year} value={year.toString()}>{year}</option>
                        ))}
                      </select>
                    </div>
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
            onClick={() => navigate(`/hr/applicant-details/personal-particulars?applicationId=${applicationId}`)}
          >
            ← Previous
          </button>
          <button 
            className={`${styles.btn} ${styles.submit}`} 
            onClick={() => navigate(`/hr/applicant-details/work?applicationId=${applicationId}`)}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicantEducation;