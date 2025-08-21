/**
 * ApplicantPersonalParticulars Page
 *
 * This component displays the applicant's personal particulars, Singapore address,
 * overseas address, and military service details for HR review in a read-only format.
 *
 * Features:
 * - Fetches and displays all personal, address, and military service data from the backend
 *   using the applicationId from the URL.
 * - Parses JSON fields from the backend response.
 * - Displays all fields in collapsible sections, with all fields disabled (read-only).
 * - Handles empty and default states for each section.
 * - Provides navigation to previous and next sections of the applicant's details.
 *
 * Usage:
 * - Used as a route page: `/hr/applicant-details/personal-particulars?applicationId=...`
 *
 * State:
 * - personalParticulars: Applicant's personal details.
 * - sgAddress: Singapore address fields.
 * - overseasAddress: Overseas address fields.
 * - militaryService: Military service fields.
 * - Collapsed/expanded state for each section.
 *
 * Dependencies:
 * - axios for HTTP requests.
 * - react-router-dom for navigation and query params.
 * - lucide-react for icons.
 * - PersonalParticulars.module.css for styling.
 *
 * @component
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import styles from "../../pages/PersonalParticulars/PersonalParticulars.module.css";
import axios from "axios";

type PersonalParticularsKeys =
| "salutation"
| "full_name"
| "nric"
| "alias"
| "email"
| "date_of_birth"
| "marital_status"
| "gender"
| "nationality"
| "status_in_sg"
| "race"
| "dialect"
| "religion"
| "country_of_birth"
| "passport_no"
| "passport_expiry";

type SgAddressKeys = "blk_no" | "street_name" | "unit_no" | "postal_code" | "mobile_no" | "home_no";

type OverseasAddressKeys =
| "has_overseas_address"
| "blk_or_house_no"
| "street_name"
| "building_name"
| "city"
| "state_or_province"
| "country"
| "postal_code"
| "mobile_country_code"
| "mobile_number"
| "home_country_code"
| "home_number";

type MilitaryServiceKeys =
| "ns_status"
| "service_from_year"
| "service_from_month"
| "service_to_year"
| "service_to_month"
| "rank"
| "unit"
| "vocation"
| "next_camp_date"
| "is_operationally_ready"
| "nsman_unit"
| "nsman_vocation"
| "ns_exemption_reason";

type SelectField = {
  label: string;
  required: boolean;
  name: PersonalParticularsKeys;
  type: "select" | "text" | "email" | "tel" | "date";
  options?: string[];
};

const ApplicantPersonalParticulars: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId'); 
  const [showPersonalParticulars, setShowPersonalParticulars] = useState(true);
  const [showSingaporeAddress, setShowSingaporeAddress] = useState(true);
  const [showOverseasAddress, setShowOverseasAddress] = useState(true);
  const [showMilitaryService, setShowMilitaryService] = useState(true);
  
  const currentYear = new Date().getFullYear();

  // Generate year options from current year down to 1960
  const generateYearOptions = () => {
    const years = [];
    for (let year = currentYear; year >= 1960; year--) {
      years.push(year);
    }
    return years;
  };

  // Replace the existing useEffect with this:
  useEffect(() => {
    const fetchApplicantData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (!applicationId) {
          console.error("No application ID provided");
          return;
        }

        // Fetch applicant data based on application ID
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/application-full-details?applicationId=${applicationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data && response.data.success) {
          const data = response.data.data;
          
          // Set personal particulars
          if (data.personal_particulars) {
            let personalData: any = {};
            try {
              personalData = JSON.parse(data.personal_particulars);
            } catch {
              personalData = {};
            }
            setPersonalParticulars({
              salutation: personalData.salutation || "",
              full_name: personalData.full_name || "",
              nric: personalData.nric || "",
              alias: personalData.alias || "",
              email: personalData.email || "",
              date_of_birth: personalData.date_of_birth ? new Date(personalData.date_of_birth) : null,
              marital_status: personalData.marital_status || "",
              gender: personalData.gender || "",
              nationality: personalData.nationality || "",
              status_in_sg: personalData.status_in_sg || "",
              race: personalData.race || "",
              dialect: personalData.dialect || "",
              religion: personalData.religion || "",
              country_of_birth: personalData.country_of_birth || "",
              passport_no: personalData.passport_no || "",
              passport_expiry: personalData.passport_expiry ? new Date(personalData.passport_expiry) : null,
            });
          }

          // Parse and set Singapore address
          if (data.singapore_address) {
            let sgAddr: any = {};
            try {
              sgAddr = JSON.parse(data.singapore_address);
            } catch {
              sgAddr = {};
            }
            setSgAddress({
              blk_no: sgAddr.blk_no || "",
              street_name: sgAddr.street_name || "",
              unit_no: sgAddr.unit_no || "",
              postal_code: sgAddr.postal_code || "",
              mobile_no: sgAddr.mobile_no || "",
              home_no: sgAddr.home_no || "",
            });
          }

          // Parse and set overseas address
          if (data.overseas_address) {
            let overseasAddr: any = {};
            try {
              overseasAddr = JSON.parse(data.overseas_address);
            } catch {
              overseasAddr = {};
            }
            setOverseasAddress({
              has_overseas_address: overseasAddr.has_overseas_address || "N",
              blk_or_house_no: overseasAddr.blk_or_house_no || "",
              street_name: overseasAddr.street_name || "",
              building_name: overseasAddr.building_name || "",
              city: overseasAddr.city || "",
              state_or_province: overseasAddr.state_or_province || "",
              country: overseasAddr.country || "",
              postal_code: overseasAddr.postal_code || "",
              mobile_country_code: overseasAddr.mobile_country_code || "+65",
              mobile_number: overseasAddr.mobile_number || "",
              home_country_code: overseasAddr.home_country_code || "+65",
              home_number: overseasAddr.home_number || "",
            });
          }

          // Set military service
          if (data.military_service) {
            let militaryData: any = {};
            try {
              militaryData = JSON.parse(data.military_service);
            } catch {
              militaryData = {};
            }
            setMilitaryService({
              ns_status: militaryData.ns_status || "",
              service_from_year: militaryData.service_from_year || "",
              service_from_month: militaryData.service_from_month || "",
              service_to_year: militaryData.service_to_year || "",
              service_to_month: militaryData.service_to_month || "",
              rank: militaryData.rank || "",
              unit: militaryData.unit || "",
              vocation: militaryData.vocation || "",
              next_camp_date: militaryData.next_camp_date || "",
              is_operationally_ready: militaryData.is_operationally_ready || "",
              nsman_unit: militaryData.nsman_unit || "",
              nsman_vocation: militaryData.nsman_vocation || "",
              ns_exemption_reason: militaryData.ns_exemption_reason || "",
            });
          }
        }
      } catch (error: any) {
        console.error("Failed to fetch applicant data", error);
      } 
    };

    fetchApplicantData();
  }, [applicationId]);

  const [personalParticulars, setPersonalParticulars] = useState<Record<PersonalParticularsKeys, string | Date | null>>({
    salutation: "",
    full_name: "",
    nric: "",
    alias: "",
    email: "",
    date_of_birth: null as Date | null,
    marital_status: "",
    gender: "",
    nationality: "",
    status_in_sg: "",
    race: "",
    dialect: "",
    religion: "",
    country_of_birth: "",
    passport_no: "",
    passport_expiry: null,
  });

  const personalParticularsFields: SelectField[] = [
    { label: "Salutation", required: true, name: "salutation", type: "select", options: ["Mr.", "Ms.", "Mrs.", "Miss", "Dr."] },
    { label: "Full Name (as in NRIC/ Passport)", required: true, name: "full_name", type: "text" },
    { label: "NRIC", required: true, name: "nric", type: "text" },
    { label: "Alias", required: false, name: "alias", type: "text" },
    { label: "Email Address", required: true, name: "email", type: "email" },
    { label: "Date of Birth", required: true, name: "date_of_birth", type: "date" },
    { label: "Marital Status", required: true, name: "marital_status", type: "select", options: ["Single", "Married", "Divorced", "Widowed", "Separated"] },
    { label: "Gender", required: true, name: "gender", type: "select", options: ["Male", "Female"] },
    { label: "Nationality", required: true, name: "nationality", type: "select", options: [
      "Singapore", "Malaysia", "Indonesia", "China", "India", "United States", "United Kingdom", "Australia", "Canada",
    ]},
    { label: "Status in Singapore", required: true, name: "status_in_sg", type: "select", options: ["Citizen", "PR", "Foreigner"] },
    { label: "Race", required: true, name: "race", type: "select", options: ["Chinese", "Malay", "Indian", "Others"] },
    { label: "Dialect", required: false, name: "dialect", type: "text" },
    { label: "Religion", required: true, name: "religion", type: "select", options: ["Buddhism", "Christianity", "Hinduism", "Islam", "Others"] },
    { label: "Country of Birth", required: true, name: "country_of_birth", type: "select", options: [
      "Singapore", "Malaysia", "Indonesia", "China", "India", "United States", "United Kingdom", "Australia", "Canada",
    ]},
    { label: "Passport No.", required: true, name: "passport_no", type: "text" },
    { label: "Passport Expiry Date", required: true, name: "passport_expiry", type: "date" },
  ];

  const [sgAddress, setSgAddress] = useState<Record<SgAddressKeys, string>>({
    blk_no: "",
    street_name: "",
    unit_no: "",
    postal_code: "",
    mobile_no: "",
    home_no: "",
  });

  const sgAddressfields: { label: string; required: boolean; name: SgAddressKeys; type: string }[] = [
    { label: "Blk/House No.", required: true, name: "blk_no", type: "text" },
    { label: "Street Name", required: true, name: "street_name", type: "text" },
    { label: "Unit No. (e.g. 01-23)", required: true, name: "unit_no", type: "text" },
    { label: "Postal Code", required: true, name: "postal_code", type: "text" },
    { label: "Mobile No.", required: true, name: "mobile_no", type: "tel" },
    { label: "Home Telephone No.", required: false, name: "home_no", type: "tel" },
  ];

  const [overseasAddress, setOverseasAddress] = useState<Record<OverseasAddressKeys, string>>({
    has_overseas_address: "N",
    blk_or_house_no: "",
    street_name: "",
    building_name: "",
    city: "",
    state_or_province: "",
    country: "",
    postal_code: "",
    mobile_country_code: "",
    mobile_number: "",
    home_country_code: "",
    home_number: "",
  });

  const overseasAddressFields: {
    label: string;
    required: boolean;
    name: OverseasAddressKeys;
    type: string;
  }[] = [
    { label: "Blk/House No.", required: true, name: "blk_or_house_no", type: "text" },
    { label: "Street Name", required: true, name: "street_name", type: "text" },
    { label: "Building Name", required: false, name: "building_name", type: "text" },
    { label: "City", required: true, name: "city", type: "text" },
    { label: "State/Province", required: true, name: "state_or_province", type: "text" },
    { label: "Country", required: true, name: "country", type: "text" },
    { label: "Postal Code", required: true, name: "postal_code", type: "text" },
    { label: "Mobile No.", required: true, name: "mobile_number", type: "tel" },
    { label: "Home Telephone No.", required: false, name: "home_number", type: "tel" },
  ];

  const [militaryService, setMilitaryService] = useState<Record<MilitaryServiceKeys, string>>({
    ns_status: "",
    service_from_year: "",
    service_from_month: "",
    service_to_year: "",
    service_to_month: "",
    rank: "",
    unit: "",
    vocation: "",
    next_camp_date: "",
    is_operationally_ready: "",
    nsman_unit: "",
    nsman_vocation: "",
    ns_exemption_reason: "",
  });

  return (
    <div className={styles.mainPanel}>
      <div className={styles.formWrapper}>
        <div className={styles.applicantHeader}>
        </div>
        <div className={styles.formContainer}>
          <h2
            className={styles.sectionTitle}
            onClick={() => setShowPersonalParticulars((prev) => !prev)}
            style={{ cursor: "pointer" }}
          >
            <span className={styles.sectionTitleText}>
              Personal Particulars
            </span>
            <div className={styles.sectionArrow}>
              {showPersonalParticulars ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>

          {showPersonalParticulars && (
            <div className={styles.formSection}>
              {personalParticularsFields.map(({ label, required, name, type, options }, i) => (
                <div key={i} className={styles.inputGroup}>
                  <span className={styles.labelText}>
                    {label}
                    {required && <span className={styles.requiredAsterisk}>*</span>}
                  </span>

                  {type === "select" ? (
                    <select
                      className={styles.input}
                      name={name}
                      value={personalParticulars[name] as string}
                      disabled
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      {options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : type === "date" ? (
                    <input
                      type="date"
                      className={styles.input}
                      name={name}
                      value={personalParticulars[name] 
                        ? personalParticulars[name] instanceof Date 
                          ? personalParticulars[name].toISOString().split('T')[0]
                          : personalParticulars[name].toString().split('T')[0]
                        : ""
                      }
                      disabled
                    />
                  ) : (
                    <input
                      type={type}
                      className={styles.input}
                      name={name}
                      value={(personalParticulars[name] as string) ?? ""}
                      disabled
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.formContainer}>
          <h2
            className={styles.sectionTitle}
            onClick={() => setShowSingaporeAddress((prev) => !prev)}
            style={{ cursor: "pointer" }}
          >
            <span className={styles.sectionTitleText}>
              Singapore Address
            </span>
            <div className={styles.sectionArrow}>
              {showSingaporeAddress ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>

          {showSingaporeAddress && (
            <div className={styles.formSection}>
              {sgAddressfields.map(({ label, required, name, type }, i) => (
                <div key={i} className={styles.inputGroup}>
                  <span className={styles.labelText}>
                    {label}
                    {required && <span className={styles.requiredAsterisk}>*</span>}
                  </span>
                  <input
                    type={type}
                    className={styles.input}
                    name={name}
                    value={sgAddress[name]}
                    disabled
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.formContainer}>
          <h2
            className={styles.sectionTitle}
            onClick={() => setShowOverseasAddress((prev) => !prev)}
            style={{ cursor: "pointer" }}
          >
            <span className={styles.sectionTitleText}>
              Overseas Address
            </span>
            <div className={styles.sectionArrow}>
              {showOverseasAddress ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>
          
          {showOverseasAddress && (
            <div className={styles.formSection}>
              <div className={styles.inputGroup}>
                <span className={styles.labelText}>
                  Do you have an address overseas?
                  <span className={styles.requiredAsterisk}>*</span>
                </span>
                <select
                  className={styles.input}
                  value={overseasAddress.has_overseas_address}
                  disabled
                >
                  <option value="" disabled>-- Select --</option>
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
            
              {overseasAddress.has_overseas_address === "Y" && (
                <>
                  {overseasAddressFields.map(({ label, required, name, type }, i) => (
                    <div key={i} className={styles.inputGroup}>
                      <span className={styles.labelText}>
                        {label}
                        {required && <span className={styles.requiredAsterisk}>*</span>}
                      </span>

                      {(name === "mobile_number" || name === "home_number") ? (
                        <div className={styles.phoneInputGroup}>
                          <select
                            className={styles.countryInput}
                            value={overseasAddress[name === "mobile_number" ? "mobile_country_code" : "home_country_code"]}
                            disabled
                          >
                            <option value="+65">+65 (SG)</option>
                            <option value="+60">+60 (MY)</option>
                            <option value="+91">+91 (IN)</option>
                            <option value="+1">+1 (US)</option>
                            <option value="+44">+44 (UK)</option>
                            <option value="+61">+61 (AU)</option>
                            <option value="+81">+81 (JP)</option>
                            <option value="+86">+86 (CN)</option>
                          </select>

                          <input
                            type={type}
                            placeholder="Contact Number"
                            className={styles.input}
                            name={name}
                            value={overseasAddress[name]}
                            disabled
                          />
                        </div>
                      ) : (
                        <input
                          type={type}
                          className={styles.input}
                          name={name}
                          value={overseasAddress[name]}
                          disabled
                        />
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div className={styles.formContainer}>
          <h2
            className={styles.sectionTitle}
            onClick={() => setShowMilitaryService((prev) => !prev)}
            style={{ cursor: "pointer" }}
          >
            <span className={styles.sectionTitleText}>
              Military Service
            </span>
            <div className={styles.sectionArrow}>
              {showMilitaryService ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>

          {showMilitaryService && (
            <div className={styles.formSection}>
              <div className={styles.inputGroup}>
                <span className={styles.labelText}>
                  NS Status<span className={styles.requiredAsterisk}>*</span>
                </span>
                <select
                  className={styles.input}
                  name="ns_status"
                  value={militaryService.ns_status}
                  disabled
                >
                  <option value="" disabled>Select</option>
                  <option value="Completed">Completed</option>
                  <option value="Not Completed">Not Completed</option>
                  <option value="Exempted">Exempted</option>
                  <option value="Not Applicable">Not Applicable</option>
                </select>
              </div>
              
              {militaryService.ns_status === "Completed" && (
                <>
                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Service Period From<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <div className={styles.periodInputs}>
                      <select
                        className={styles.input}
                        name="service_from_year"
                        value={militaryService.service_from_year}
                        disabled
                      >
                        <option value="" disabled>Select Year</option>
                        {generateYearOptions().map(year => (
                          <option key={year} value={year.toString()}>{year}</option>
                        ))}
                      </select>

                      <select
                        className={styles.input}
                        name="service_from_month"
                        value={militaryService.service_from_month}
                        disabled
                      >
                        <option value="" disabled>Month</option>
                        {[
                          "January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December",
                        ].map((month) => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      To<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <div className={styles.periodInputs}>
                      <select
                        className={styles.input}
                        name="service_to_year"
                        value={militaryService.service_to_year}
                        disabled
                      >
                        <option value="" disabled>Select Year</option>
                        {generateYearOptions().map(year => (
                          <option key={year} value={year.toString()}>{year}</option>
                        ))}
                      </select>

                      <select
                        className={styles.input}
                        name="service_to_month"
                        value={militaryService.service_to_month}
                        disabled
                      >
                        <option value="" disabled>Month</option>
                        {[
                          "January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December",
                        ].map((month) => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {[
                    { label: "Rank", type: "text", name: "rank", placeholder: "e.g., 3SG" },
                    { label: "Unit", type: "text", name: "unit", placeholder: "e.g., 3rd Infantry Battalion" },
                    { label: "Vocation", type: "text", name: "vocation", placeholder: "e.g., Combat Engineer" },
                  ].map((field, i) => (
                    <div key={i} className={styles.inputGroup}>
                      <span className={styles.labelText}>
                        {field.label}
                        <span className={styles.requiredAsterisk}>*</span>
                      </span>
                      <input
                        type={field.type}
                        className={styles.input}
                        name={field.name}
                        value={militaryService[field.name as MilitaryServiceKeys] ?? ""}
                        placeholder={field.placeholder}
                        disabled
                      />
                    </div>
                  ))}

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Date of Next Camp
                    </span>
                    <input
                      type="date"
                      className={styles.input}
                      name="next_camp_date"
                      value={militaryService.next_camp_date 
                        ? new Date(militaryService.next_camp_date).toISOString().split('T')[0]
                        : ""
                      }
                      disabled
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Operationally Ready?<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select
                      className={styles.input}
                      name="is_operationally_ready"
                      value={militaryService.is_operationally_ready}
                      disabled
                    >
                      <option value="" disabled>Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  {militaryService.is_operationally_ready === "Yes" && (
                    <>
                      <div className={styles.inputGroup}>
                        <span className={styles.labelText}>Unit (NSman)</span>
                        <input 
                          type="text" 
                          className={styles.input} 
                          placeholder="e.g., 3rd Infantry Battalion"
                          name="nsman_unit"
                          value={militaryService.nsman_unit}
                          disabled
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <span className={styles.labelText}>Vocation (NSman)</span>
                        <input 
                          type="text" 
                          className={styles.input} 
                          placeholder="e.g., Combat Engineer"
                          name="nsman_vocation"
                          value={militaryService.nsman_vocation}
                          disabled
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {(militaryService.ns_status !== "Completed") && (
                <div className={styles.inputGroup}>
                  <span className={styles.labelText}>
                    Please state your reason <span className={styles.requiredAsterisk}>*</span>
                  </span>
                  <textarea
                    className={styles.input}
                    rows={3}
                    placeholder="Please elaborate. If you do not know the date for enrollment yet, you can write yet to enroll. Otherwise please provide the date of enrollment or the reason you are exempted."
                    name="ns_exemption_reason"
                    value={militaryService.ns_exemption_reason}
                    disabled
                  />
                </div>
              )}
            </div>
          )}
        </div>
      
        <div className={styles.formButtons}>
          <button 
            className={`${styles.btn} ${styles.btnSave}`} 
            onClick={() => navigate("/hr/applicants")}
          >
            Back to All Applicants
          </button>
          <button 
            className={`${styles.btn} ${styles.submit}`} 
            onClick={() => navigate(`/hr/applicant-details/overview?applicationId=${applicationId}`)}
          >
            ← Previous
          </button>
          <button 
            className={`${styles.btnSubmit} ${styles.submit}`} 
            onClick={() => navigate(`/hr/applicant-details/education?applicationId=${applicationId}`)}
          >
            Next →
          </button>
        </div>
      </div>
    </div>   
  );
};

export default ApplicantPersonalParticulars;