import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import styles from "./PersonalParticulars.module.css";


import axios from "axios";

const PersonalParticulars: React.FC = () => {
  const navigate = useNavigate();
  const [showPersonalParticulars, setShowPersonalParticulars] = useState(true);
  const [showSingaporeAddress, setShowSingaporeAddress] = useState(true);
  const [showOverseasAddress, setShowOverseasAddress] = useState(true);
  const [showMilitaryService, setShowMilitaryService] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const currentYear = new Date().getFullYear();

  
  // Generate year options from current year down to 1960
  const generateYearOptions = () => {
    const years = [];
    for (let year = currentYear; year >= 1960; year--) {
      years.push(year);
    }
    return years;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch Singapore address
        const addressResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/get-sg-address`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (addressResponse.data && addressResponse.data.data) {
          setSgAddress(addressResponse.data.data);
        }
        
        const overseasAddressResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/get-overseas-address`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (overseasAddressResponse.data && overseasAddressResponse.data.data) {
          setOverseasAddress(overseasAddressResponse.data.data);
        }


        // Fetch personal particulars
        const particularsResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/get-personal-particulars`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (particularsResponse.data && particularsResponse.data.data) {
          const data = particularsResponse.data.data;
          setPersonalParticulars({
            ...data,
            date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
            passport_expiry: data.passport_expiry ? new Date(data.passport_expiry) : null,
          });
        }

        // Fetch military service details
        const militaryServiceResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/get-military-service`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (militaryServiceResponse.data && militaryServiceResponse.data.data) {
          setMilitaryService(militaryServiceResponse.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
        // It's okay if no data exists yet; user might be filling for the first time
      }
    };

    fetchData();
  }, []);

  const handleUpdate = async () => {
    const isValid = validateAllFields();
    
    if (!isValid) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Authentication token not found. Please log in again.");
        return;
      }

      // Save all data with is_draft: "N"
      await Promise.all([
        // Save Personal Particulars
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-personal-particulars`,
          {
            ...personalParticulars,
            is_draft: "N", // Set as final submission
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        // Save Singapore Address
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-sg-address`,
          {
            ...sgAddress,
            is_draft: "N", // Set as final submission
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        // Save Overseas Address
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-overseas-address`,
          {
            ...overseasAddress,
            is_draft: "N", // Set as final submission
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        // Save Military Service
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-military-service`,
          {
            ...militaryService,
            is_draft: "N", // Set as final submission
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
      ]);
      
      // Optional: Clear validation errors after successful save
      setValidationErrors({});
      
    } catch (error: any) {
      console.error("Update error:", error);
      
      if (error.response) {
        alert(`Failed to update: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        alert("Network error: Could not reach server");
      } else {
        alert("Error: " + error.message);
      }
    }
  };

// Replace the validateAllFields function with:
  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate Singapore Address fields
    sgAddressfields.forEach(({ label, required, name }) => {
      if (required && !sgAddress[name]?.trim()) {
        errors[name] = `${label} is required`;
      }
    });

    // Validate Overseas Address fields
    overseasAddressFields.forEach(({ label, required, name }) => {
      if (required && !overseasAddress[name]?.trim()) {
        errors[name] = `${label} is required`;
      }
    });

    // Validate Personal Particulars fields (including date fields)
    personalParticularsFields.forEach(({ label, required, name, type }) => {
      const value = personalParticulars[name];

      if (type === "date") {
        // Special handling for date fields
        if (required && (value === null || value === undefined)) {
          errors[name] = `${label} is required`;
        } else if (value instanceof Date && isNaN(value.getTime())) {
          errors[name] = `${label} is invalid`;
        }
      } else {
        // Handle other field types (text, email, select, etc.)
        const isEmpty =
          value === null ||
          value === undefined ||
          (typeof value === "string" && value.trim() === "");

        if (required && isEmpty) {
          errors[name] = `${label} is required`;
        }
      }
    });

    // Validate Military Service fields
    militaryServiceFields.forEach(({ label, required, name }) => {
      if (required && (!militaryService[name] || !militaryService[name].toString().trim())) {
        errors[name] = `${label} is required`;
      }
    });

    setValidationErrors(errors);

    // Global error alert
    if (Object.keys(errors).length > 0) {
      alert("Please fill in all required fields before proceeding.");
      return false;
    }

    if (Object.keys(errors).length === 0) {
      // No errors, proceed with update
      alert("All required fields are filled. This page is updated successfully.");
    }

    return true;
  };

  const handleSaveDraft = async () => {
    try {
      const token = localStorage.getItem("token"); // Retrieve JWT token

      
      // 1. Save Personal Particulars
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/save-personal-particulars`,
        {
          ...personalParticulars,
          is_draft: "Y",
          // Add other necessary fields if needed, e.g., user_id if not included in personalParticulars
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 2. Save Singapore Address
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/save-sg-address`,
        {
          ...sgAddress,
          is_draft: "Y",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 3. Save Overseas Address
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/save-overseas-address`,
        {
          ...overseasAddress,
          is_draft: "Y",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 4. Save Military Service Details
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/save-military-service`,
        {
          ...militaryService,
          is_draft: "Y",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Draft saved successfully!");
    } catch (error) {
      console.error("Failed to save draft", error);
      alert("Failed to save draft");
    }
  };

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

const [personalParticulars, setPersonalParticulars] = useState<Record<PersonalParticularsKeys, string | Date | null>>({
  salutation: "",
  full_name: "",
  nric: "",
  alias: "",
  email: "",
  date_of_birth: null as Date | null,      // Date type for date picker
  marital_status: "",
  gender: "",
  nationality: "",
  status_in_sg: "",
  race: "",
  dialect: "",
  religion: "",
  country_of_birth: "",
  passport_no: "",
  passport_expiry: null,    // Date type for date picker
});

type SelectField = {
  label: string;
  required: boolean;
  name: PersonalParticularsKeys;
  type: "select" | "text" | "email" | "tel" | "date";
  options?: string[];
};

const personalParticularsFieldA: SelectField[] = [
  { label: "Salutation", required: true, name: "salutation", type: "select", options: ["Mr.", "Ms.", "Mrs.", "Miss", "Dr."] },
  { label: "Full Name (as in NRIC/ Passport)", required: true, name: "full_name", type: "text" },
  { label: "NRIC", required: true, name: "nric", type: "text" },
  { label: "Alias", required: false, name: "alias", type: "text" },
  { label: "Email Address", required: true, name: "email", type: "email" }
]

 const personalParticularFieldB: SelectField[] = [
  { label: "Marital Status", required: true, name: "marital_status", type: "select", options: ["Single", "Married", "Divorced", "Widowed", "Separated"] },
  { label: "Gender", required: true, name: "gender", type: "select", options: ["Male", "Female"] },
  { label: "Nationality", required: true, name: "nationality", type: "select", options: [
    "Singapore", "Malaysia", "Indonesia", "China", "India", "United States", "United Kingdom", "Australia", "Canada",
    // ... add all countries here or import separately
  ]},
  { label: "Status in Singapore", required: true, name: "status_in_sg", type: "select", options: ["Citizen", "PR", "Foreigner"] },
  { label: "Race", required: true, name: "race", type: "select", options: ["Chinese", "Malay", "Indian", "Others"] },
  { label: "Dialect", required: false, name: "dialect", type: "text" },
  { label: "Religion", required: true, name: "religion", type: "select", options: ["Buddhism", "Christianity", "Hinduism", "Islam", "Others"] },
  { label: "Country of Birth", required: true, name: "country_of_birth", type: "select", options: [
    "Singapore", "Malaysia", "Indonesia", "China", "India", "United States", "United Kingdom", "Australia", "Canada",
    // ... add all countries here or import separately
  ]},
  { label: "Passport No.", required: true, name: "passport_no", type: "text" },
];

// Replace the personalParticularsFieldA and personalParticularFieldB arrays with this combined array:

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
  

  type SgAddressKeys = "blk_no" | "street_name" | "unit_no" | "postal_code" | "mobile_no" | "home_no";

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



type OverseasAddressKeys =
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


const [overseasAddress, setOverseasAddress] = useState<Record<OverseasAddressKeys, string>>({
  blk_or_house_no: "",
  street_name: "",
  building_name: "",
  city: "",
  state_or_province: "",
  country: "",
  postal_code: "",
  mobile_country_code: "+65",
  mobile_number: "",
  home_country_code: "+65",
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

  const militaryServiceFields: {
    label: string;
    required: boolean;
    name: MilitaryServiceKeys;
    type: string;
    options?: string[];
    placeholder?: string;
  }[] = [
    {
      label: "NS Status",
      required: true,
      name: "ns_status",
      type: "select",
      options: ["Completed", "Not Completed", "Exempted", "Not Applicable"],
    },
    { label: "Service From Year", required: militaryService.ns_status === "Completed", name: "service_from_year", type: "number" },
    { label: "Service From Month", required: militaryService.ns_status === "Completed", name: "service_from_month", type: "text" },
    { label: "Service To Year", required: militaryService.ns_status === "Completed", name: "service_to_year", type: "number" },
    { label: "Service To Month", required: militaryService.ns_status === "Completed", name: "service_to_month", type: "text" },
    { label: "Rank", required: militaryService.ns_status === "Completed", name: "rank", type: "text", placeholder: "e.g., 3SG" },
    { label: "Unit", required: militaryService.ns_status === "Completed", name: "unit", type: "text", placeholder: "e.g., 3rd Infantry Battalion" },
    { label: "Vocation", required: militaryService.ns_status === "Completed", name: "vocation", type: "text", placeholder: "e.g., Combat Engineer" },
    { label: "Next Camp Date", required: false, name: "next_camp_date", type: "date" },
    {
      label: "Operationally Ready",
      required: militaryService.ns_status === "Completed",
      name: "is_operationally_ready",
      type: "select",
      options: ["Yes", "No"],
    },
    { label: "NSman Unit", required: false, name: "nsman_unit", type: "text" },
    { label: "NSman Vocation", required: false, name: "nsman_vocation", type: "text" },
    { label: "Exemption Reason", required: militaryService.ns_status !== "Completed", name: "ns_exemption_reason", type: "textarea" },
  ];



  return (
    <div className={styles.mainPanel}>
      <div className={styles.formWrapper}>
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
                      onChange={(e) => {
                        const value = e.target.value;
                        setPersonalParticulars((prev) => ({ ...prev, [name]: value }));

                        if (validationErrors[name]) {
                          setValidationErrors((prev) => {
                            const updated = { ...prev };
                            delete updated[name];
                            return updated;
                          });
                        }
                      }}
                      style={{
                        borderColor: validationErrors[name] ? "red" : undefined,
                      }}
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
                      onChange={(e) => {
                        const value = e.target.value;
                        setPersonalParticulars((prev) => ({
                          ...prev,
                          [name]: value ? new Date(value) : null,
                        }));

                        if (validationErrors[name] && value) {
                          setValidationErrors((prev) => {
                            const updated = { ...prev };
                            delete updated[name];
                            return updated;
                          });
                        }
                      }}
                      style={{
                        borderColor: validationErrors[name] ? "red" : undefined,
                      }}
                    />
                  ) : (
                    <input
                      type={type}
                      className={styles.input}
                      name={name}
                      value={(personalParticulars[name] as string) ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPersonalParticulars((prev) => ({ ...prev, [name]: value }));

                        if (validationErrors[name]) {
                          setValidationErrors((prev) => {
                            const updated = { ...prev };
                            delete updated[name];
                            return updated;
                          });
                        }
                      }}
                      style={{
                        borderColor: validationErrors[name] ? "red" : undefined,
                      }}
                    />
                  )}

                  {validationErrors[name] && (
                    <div className={styles.errorMessage}>
                      {validationErrors[name]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
          {/* {showPersonalParticulars && (
          <div className={styles.formSection}>
            {personalParticularsFieldA.map(({ label, required, name, type, options }, i) => (
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
                    onChange={(e) => {
                      const value = e.target.value;
                      setPersonalParticulars((prev) => ({ ...prev, [name]: value }));

                      if (validationErrors[name]) {
                        setValidationErrors((prev) => {
                          const updated = { ...prev };
                          delete updated[name];
                          return updated;
                        });
                      }
                    }}
                    style={{
                      borderColor: validationErrors[name] ? "red" : undefined,
                    }}
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
                ) : (
                  <input
                    type={type}
                    className={styles.input}
                    name={name}
                    value={(personalParticulars[name] as string) ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPersonalParticulars((prev) => ({ ...prev, [name]: value }));

                      if (validationErrors[name]) {
                        setValidationErrors((prev) => {
                          const updated = { ...prev };
                          delete updated[name];
                          return updated;
                        });
                      }
                    }}
                    style={{
                      borderColor: validationErrors[name] ? "red" : undefined,
                    }}
                  />
                )}

                {validationErrors[name] && (
                  <div className={styles.errorMessage}>
                    {validationErrors[name]}
                  </div>
                )}
              </div>
            ))} */}

              {/* <div className={styles.dateInputWrapper}>
                <span className={styles.labelText}>
                  Date of Birth<span className={styles.requiredAsterisk}>*</span>
                </span>
                <div className={styles.datePickerContainer}>
                  <CssBaseline />
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      value={personalParticulars.date_of_birth as Date | null}
                      onChange={(newValue) => {
                        setPersonalParticulars((prev) => ({
                          ...prev,
                          date_of_birth: newValue,
                        }));

                        if (validationErrors.date_of_birth && newValue) {
                          setValidationErrors((prev) => {
                            const updated = { ...prev };
                            delete updated.date_of_birth;
                            return updated;
                          });
                        }
                      }}
                      format="dd/MM/yyyy"
                      slotProps={{
                        textField: {
                          variant: "outlined",
                          size: "small",
                          fullWidth: true,
                          error: Boolean(validationErrors.date_of_birth),
                          helperText: validationErrors.date_of_birth,
                          InputProps: {
                            sx: {
                              backgroundColor: darkMode ? "#3a3a3a" : "#fff",
                              color: darkMode ? "#fff" : "#000",
                              borderColor: darkMode ? "#555" : "#ccc",
                              "& .MuiInputBase-input": {
                                color: darkMode ? "#fff" : "#000",
                              },
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: darkMode ? "#777" : "#ccc",
                              },
                              "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: darkMode ? "#aaa" : "#666",
                              },
                            },
                          },
                        },
                      }}
                      sx={{
                        "& .MuiPickersPopper-root": {
                          backgroundColor: darkMode ? "#2c2c2c" : "#fff",
                          color: darkMode ? "#fff" : "#000",
                        },
                      }}
                    />
                  </LocalizationProvider>
                </div>
              </div> */}

              {/* <div className={styles.inputGroup}>
                <span className={styles.labelText}>
                  Date of Birth<span className={styles.requiredAsterisk}>*</span>
                </span>
                <input
                  type="date"
                  className={styles.input}
                  name="date_of_birth"
                  value={personalParticulars.date_of_birth 
                    ? personalParticulars.date_of_birth instanceof Date 
                      ? personalParticulars.date_of_birth.toISOString().split('T')[0]
                      : personalParticulars.date_of_birth.toString().split('T')[0]
                    : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    setPersonalParticulars((prev) => ({
                      ...prev,
                      date_of_birth: value ? new Date(value) : null,
                    }));

                    if (validationErrors.date_of_birth && value) {
                      setValidationErrors((prev) => {
                        const updated = { ...prev };
                        delete updated.date_of_birth;
                        return updated;
                      });
                    }
                  }}
                  style={{
                    borderColor: validationErrors.date_of_birth ? "red" : undefined,
                  }}
                />
                {validationErrors.date_of_birth && (
                  <div className={styles.errorMessage}>
                    {validationErrors.date_of_birth}
                  </div>
                )}
              </div> */}

              {/* {personalParticularFieldB.map(({ label, required, name, type, options }, i) => (
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
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setPersonalParticulars((prev) => ({ ...prev, [name]: newValue }));

                        if (validationErrors[name] && newValue) {
                          setValidationErrors((prev) => {
                            const updated = { ...prev };
                            delete updated[name];
                            return updated;
                          });
                        }
                      }}
                      style={{
                        borderColor: validationErrors[name] ? "red" : undefined,
                      }}
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
                  ) : (
                    <input
                      type="text"
                      className={styles.input}
                      name={name}
                      value={(personalParticulars[name] as string) ?? ""}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setPersonalParticulars((prev) => ({ ...prev, [name]: newValue }));

                        if (validationErrors[name] && newValue.trim()) {
                          setValidationErrors((prev) => {
                            const updated = { ...prev };
                            delete updated[name];
                            return updated;
                          });
                        }
                      }}
                      style={{
                        borderColor: validationErrors[name] ? "red" : undefined,
                      }}
                    />
                  )}

                  {validationErrors[name] && (
                    <div className={styles.errorMessage}>
                      {validationErrors[name]}
                    </div>
                  )}
                </div>
              ))} */}

              {/* <div className={styles.dateInputWrapper}>
                <span className={styles.labelText}>
                  Passport Expiry Date<span className={styles.requiredAsterisk}>*</span>
                </span>

                <div className={styles.datePickerContainer}>
                  <CssBaseline />
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      value={personalParticulars.passport_expiry as Date | null}
                      onChange={(newValue) => {
                        setPersonalParticulars((prev) => ({
                          ...prev,
                          passport_expiry: newValue,
                        }));

                        if (validationErrors.passport_expiry && newValue) {
                          setValidationErrors((prev) => {
                            const updated = { ...prev };
                            delete updated.passport_expiry;
                            return updated;
                          });
                        }
                      }}
                      format="dd/MM/yyyy"
                      slotProps={{
                        textField: {
                          variant: "outlined",
                          size: "small",
                          fullWidth: true,
                          error: Boolean(validationErrors.passport_expiry),
                          helperText: validationErrors.passport_expiry,
                          InputProps: {
                            sx: {
                              backgroundColor: darkMode ? "#3a3a3a" : "#fff",
                              color: darkMode ? "#fff" : "#000",
                              borderColor: darkMode ? "#555" : "#ccc",
                              "& .MuiInputBase-input": {
                                color: darkMode ? "#fff" : "#000",
                              },
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: darkMode ? "#777" : "#ccc",
                              },
                              "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: darkMode ? "#aaa" : "#666",
                              },
                            },
                          },
                        },
                      }}
                      sx={{
                        "& .MuiPickersPopper-root": {
                          backgroundColor: darkMode ? "#2c2c2c" : "#fff",
                          color: darkMode ? "#fff" : "#000",
                        },
                      }}
                    />
                  </LocalizationProvider>
                </div>
              </div> */}
            {/* </div>
          )}
        </div> */}

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
                    onChange={(e) => {
                      const value = e.target.value;

                      setSgAddress((prev) => ({ ...prev, [name]: value }));

                      // Remove validation error if user has fixed the field
                      if (validationErrors[name] && value.trim() !== "") {
                        setValidationErrors((prev) => {
                          const updated = { ...prev };
                          delete updated[name];
                          return updated;
                        });
                      }
                    }}
                    style={{
                      borderColor: validationErrors[name] ? "red" : undefined,
                    }}
                  />
                  {validationErrors[name] && (
                    <div className={styles.errorMessage}>
                      {validationErrors[name]}
                    </div>
                  )}
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
              {overseasAddressFields.map(({ label, required, name, type }, i) => (
                <div key={i} className={styles.inputGroup}>
                  <span className={styles.labelText}>
                    {label}
                    {required && <span className={styles.requiredAsterisk}>*</span>}
                  </span>

                  {/* Phone fields with country code */}
                  {(name === "mobile_number" || name === "home_number") ? (
                    <div className={styles.phoneInputGroup}>
                      <select
                        className={styles.countryInput}
                        value={overseasAddress[name === "mobile_number" ? "mobile_country_code" : "home_country_code"]}
                        onChange={(e) => {
                          const codeKey = name === "mobile_number" ? "mobile_country_code" : "home_country_code";
                          setOverseasAddress((prev) => ({ ...prev, [codeKey]: e.target.value }));
                          // Clear error for country code if needed
                          if (validationErrors[codeKey]) {
                            setValidationErrors((prev) => {
                              const updated = { ...prev };
                              delete updated[codeKey];
                              return updated;
                            });
                          }
                        }}
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
                        onChange={(e) => {
                          const value = e.target.value;
                          setOverseasAddress((prev) => ({ ...prev, [name]: value }));
                          if (validationErrors[name]) {
                            setValidationErrors((prev) => {
                              const updated = { ...prev };
                              delete updated[name];
                              return updated;
                            });
                          }
                        }}
                        style={{
                          borderColor: validationErrors[name] ? "red" : undefined,
                        }}
                      />
                    </div>
                  ) : (
                    <input
                      type={type}
                      className={styles.input}
                      name={name}
                      value={overseasAddress[name]}
                      onChange={(e) => {
                        const value = e.target.value;
                        setOverseasAddress((prev) => ({ ...prev, [name]: value }));
                        if (validationErrors[name]) {
                          setValidationErrors((prev) => {
                            const updated = { ...prev };
                            delete updated[name];
                            return updated;
                          });
                        }
                      }}
                      style={{
                        borderColor: validationErrors[name] ? "red" : undefined,
                      }}
                    />
                  )}

                  {validationErrors[name] && (
                    <div className={styles.errorMessage}>
                      {validationErrors[name]}
                    </div>
                  )}
                </div>
              ))}
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
                  onChange={(e) => {
                    const value = e.target.value;
                    setMilitaryService((prev) => ({ ...prev, ns_status: value }));

                    if (validationErrors.ns_status) {
                      setValidationErrors((prev) => {
                        const updated = { ...prev };
                        delete updated.ns_status;
                        return updated;
                      });
                    }
                  }}
                  style={{
                    borderColor: validationErrors.ns_status ? "red" : undefined,
                  }}
                >
                  <option value="" disabled>Select</option>
                  <option value="Completed">Completed</option>
                  <option value="Not Completed">Not Completed</option>
                  <option value="Exempted">Exempted</option>
                  <option value="Not Applicable">Not Applicable</option>
                </select>

                {validationErrors.ns_status && (
                  <div className={styles.errorMessage}>
                    {validationErrors.ns_status}
                  </div>
                )}
              </div>
              
              {militaryService.ns_status === "Completed" && (
                <>
                  <div className={styles.militaryPeriodGroup}>
                    <span className={styles.labelText}>
                      Service Period From<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <div className={styles.periodInputs}>
                      <select
                        className={styles.input}
                        name="service_from_year"
                        value={militaryService.service_from_year}
                        onChange={(e) => {
                          const value = e.target.value;
                          setMilitaryService((prev) => ({ ...prev, service_from_year: value }));

                          if (validationErrors.service_from_year && value) {
                            setValidationErrors((prev) => {
                              const updated = { ...prev };
                              delete updated.service_from_year;
                              return updated;
                            });
                          }
                        }}
                        style={{
                          borderColor: validationErrors.service_from_year ? "red" : undefined,
                        }}
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
                        onChange={(e) => {
                          const value = e.target.value;
                          setMilitaryService((prev) => ({ ...prev, service_from_month: value }));

                          if (validationErrors.service_from_month && value) {
                            setValidationErrors((prev) => {
                              const updated = { ...prev };
                              delete updated.service_from_month;
                              return updated;
                            });
                          }
                        }}
                        style={{
                          borderColor: validationErrors.service_from_month ? "red" : undefined,
                        }}
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

                    {(validationErrors.service_from_year || validationErrors.service_from_month) && (
                      <div className={styles.errorMessage}>
                        {validationErrors.service_from_year || validationErrors.service_from_month}
                      </div>
                    )}
                  </div>

                  <div className={styles.militaryPeriodGroup}>
                    <span className={styles.labelText}>
                      To<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <div className={styles.periodInputs}>
                      <select
                        className={styles.input}
                        name="service_to_year"
                        value={militaryService.service_to_year}
                        onChange={(e) => {
                          const value = e.target.value;
                          setMilitaryService((prev) => ({ ...prev, service_to_year: value }));

                          if (validationErrors.service_to_year && value) {
                            setValidationErrors((prev) => {
                              const updated = { ...prev };
                              delete updated.service_to_year;
                              return updated;
                            });
                          }
                        }}
                        style={{
                          borderColor: validationErrors.service_to_year ? "red" : undefined,
                        }}
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
                        onChange={(e) => {
                          const value = e.target.value;
                          setMilitaryService((prev) => ({ ...prev, service_to_month: value }));

                          if (validationErrors.service_to_month && value) {
                            setValidationErrors((prev) => {
                              const updated = { ...prev };
                              delete updated.service_to_month;
                              return updated;
                            });
                          }
                        }}
                        style={{
                          borderColor: validationErrors.service_to_month ? "red" : undefined,
                        }}
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

                    {(validationErrors.service_to_year || validationErrors.service_to_month) && (
                      <div className={styles.errorMessage}>
                        {validationErrors.service_to_year || validationErrors.service_to_month}
                      </div>
                    )}
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
                        onChange={(e) => {
                          const value = e.target.value;
                          setMilitaryService((prev) => ({ ...prev, [field.name]: value }));

                          if (validationErrors[field.name]) {
                            setValidationErrors((prev) => {
                              const updated = { ...prev };
                              delete updated[field.name];
                              return updated;
                            });
                          }
                        }}
                        style={{
                          borderColor: validationErrors[field.name] ? "red" : undefined,
                        }}
                      />
                      {validationErrors[field.name] && (
                        <div className={styles.errorMessage}>
                          {validationErrors[field.name]}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* <div className={styles.dateInputWrapper}>
                    <span className={styles.labelText}>
                      Date of Next Camp
                    </span>
                    <div className={styles.datePickerContainer}>
                      <CssBaseline />
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          value={
                            militaryService.next_camp_date
                              ? new Date(militaryService.next_camp_date)
                              : null
                          }
                          onChange={(newValue) => {
                            setMilitaryService((prev) => ({
                              ...prev,
                              next_camp_date:
                                newValue instanceof Date && !isNaN(newValue.getTime())
                                  ? newValue.toISOString()
                                  : "",
                            }));

                            if (validationErrors.date_of_next_camp && newValue) {
                              setValidationErrors((prev) => {
                                const updated = { ...prev };
                                delete updated.date_of_next_camp;
                                return updated;
                              });
                            }
                          }}
                          format="dd/MM/yyyy"
                          slotProps={{
                            textField: {
                              variant: "outlined",
                              size: "small",
                              fullWidth: true,
                              error: Boolean(validationErrors.date_of_next_camp),
                              helperText: validationErrors.date_of_next_camp,
                              InputProps: {
                                sx: {
                                  backgroundColor: darkMode ? "#3a3a3a" : "#fff",
                                  color: darkMode ? "#fff" : "#000",
                                  borderColor: darkMode ? "#555" : "#ccc",
                                  "& .MuiInputBase-input": {
                                    color: darkMode ? "#fff" : "#000",
                                  },
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: darkMode ? "#777" : "#ccc",
                                  },
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: darkMode ? "#aaa" : "#666",
                                  },
                                },
                              },
                            },
                          }}
                          sx={{
                            "& .MuiPickersPopper-root": {
                              backgroundColor: darkMode ? "#2c2c2c" : "#fff",
                              color: darkMode ? "#fff" : "#000",
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </div>
                  </div> */}

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
                      onChange={(e) => {
                        const value = e.target.value;
                        setMilitaryService((prev) => ({
                          ...prev,
                          next_camp_date: value ? new Date(value).toISOString() : "",
                        }));

                        if (validationErrors.date_of_next_camp && value) {
                          setValidationErrors((prev) => {
                            const updated = { ...prev };
                            delete updated.date_of_next_camp;
                            return updated;
                          });
                        }
                      }}
                      style={{
                        borderColor: validationErrors.date_of_next_camp ? "red" : undefined,
                      }}
                    />
                    {validationErrors.date_of_next_camp && (
                      <div className={styles.errorMessage}>
                        {validationErrors.date_of_next_camp}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Operationally Ready?<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <select
                      className={styles.input}
                      name="is_operationally_ready"
                      value={militaryService.is_operationally_ready}
                      onChange={(e) => {
                        const value = e.target.value;
                        setMilitaryService((prev) => ({
                          ...prev,
                          is_operationally_ready: value,
                        }));

                        if (validationErrors.is_operationally_ready) {
                          setValidationErrors((prev) => {
                            const updated = { ...prev };
                            delete updated.is_operationally_ready;
                            return updated;
                          });
                        }
                      }}
                      style={{
                        borderColor: validationErrors.is_operationally_ready ? "red" : undefined,
                      }}
                    >
                      <option value="" disabled>Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>

                    {validationErrors.is_operationally_ready && (
                      <div className={styles.errorMessage}>
                        {validationErrors.is_operationally_ready}
                      </div>
                    )}
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
                          onChange={(e) => {
                            const value = e.target.value;
                            setMilitaryService((prev) => ({ ...prev, nsman_unit: value }));
                          }}
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
                          onChange={(e) => {
                            const value = e.target.value;
                            setMilitaryService((prev) => ({ ...prev, nsman_vocation: value }));
                          }}
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
                    onChange={(e) => {
                      const value = e.target.value;
                      setMilitaryService((prev) => ({
                        ...prev,
                        ns_exemption_reason: value,
                      }));

                      if (validationErrors.ns_exemption_reason) {
                        setValidationErrors((prev) => {
                          const updated = { ...prev };
                          delete updated.ns_exemption_reason;
                          return updated;
                        });
                      }
                    }}
                    style={{
                      borderColor: validationErrors.ns_exemption_reason ? "red" : undefined,
                    }}
                  />
                  {validationErrors.ns_exemption_reason && (
                    <div className={styles.errorMessage}>
                      {validationErrors.ns_exemption_reason}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      
        <div className={styles.formButtons}>
          <button className={`${styles.btnSave}`} onClick={handleSaveDraft}>
            Save as draft
          </button>
          <button className={`${styles.btnSave} ${styles.save}`} onClick={handleUpdate}>
            Update
          </button>
          <button className={`${styles.btnSubmit} ${styles.submit}`} onClick={() => navigate("/profile/education")}>
            Next
          </button>
        </div>
      </div>
    </div>   
  );
};

export default PersonalParticulars;
