import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./ApplicantPersonalParticulars.css";

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { CssBaseline } from "@mui/material";
import { ColorModeContext } from "../../ThemeContext"; // Adjust the path as necessary

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import "react-datepicker/dist/react-datepicker.css";

const ApplicantPersonalParticulars: React.FC = () => {
  const navigate = useNavigate();
  const [dob, setDob] = useState<Date | null>();
  const [passportExpiry, setPassportExpiry] = useState<Date | null>(null);
  const [showPersonalParticulars, setShowPersonalParticulars] = useState(true);
  const [showSingaporeAddress, setShowSingaporeAddress] = useState(true);
  const [showOverseasAddress, setShowOverseasAddress] = useState(true);
  const [showMilitaryService, setShowMilitaryService] = useState(true);
  const [nsStatus, setNsStatus] = useState<string>("");
  const [isOperationallyReady, setIsOperationallyReady] = useState("");
  const [dateOfNextCamp, setDateOfNextCamp] = useState<Date | null>(null);
  const { darkMode } = useContext(ColorModeContext);


  return (
    <div className="main-panel">
      <div className="form-wrapper">
        <div className="form-container">
          <h2
            className="section-title"
            onClick={() => setShowPersonalParticulars((prev) => !prev)}
            style={{ cursor: "pointer" }}
          >
            Personal Particulars
          </h2>
          {showPersonalParticulars && (
            <div className="form-section">
              {[
                {
                  label: "Salutation",
                  required: true,
                  type: "select",
                  options: ["Mr.", "Ms.", "Mrs.", "Dr."],
                },
                {
                  label: "Full Name (as in NRIC/ Passport)",
                  required: true,
                  type: "text",
                },
                 {
                  label: "NRIC",
                  required: true,
                  type: "text",
                },
                { label: "Alias", type: "text" },
                { label: "Email Address", required: true, type: "email" },
              ].map((field, i) => (
                <div key={i}>
                  <span className="label-text">
                    {field.label}
                    {field.required && <span className="required-asterisk">*</span>}
                  </span>
                  {field.type === "select" ? (
                    <select className="input" defaultValue="">
                      <option value="" disabled>
                        Select
                      </option>
                      {field.options?.map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input type={field.type} className="input" />
                  )}
                </div>
              ))}

              <div className="date-input-wrapper">
                <span className="label-text">
                  Date of Birth<span className="required-asterisk">*</span>
                </span>
                <CssBaseline />
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    value={dob}
                    onChange={(newValue) => setDob(newValue)}
                    format="dd/MM/yyyy"
                    slotProps={{
                      textField: {
                        variant: "outlined",
                        size: "small",
                        fullWidth: true,
                        InputProps: {
                          sx: {
                            backgroundColor: darkMode ? "#3a3a3a" : "#fff",
                            color: darkMode ? "#fff" : "#000",
                            borderColor: darkMode ? "#555" : "#ccc",
                            '& .MuiInputBase-input': {
                              color: darkMode ? "#fff" : "#000",
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: darkMode ? "#777" : "#ccc",
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: darkMode ? "#aaa" : "#666",
                            },
                          },
                        },
                      },
                    }}
                    sx={{
                      '& .MuiPickersPopper-root': {
                        backgroundColor: darkMode ? '#2c2c2c' : '#fff',
                        color: darkMode ? '#fff' : '#000',
                      },
                    }}
                  />
                </LocalizationProvider>
              </div>


              {[
                {
                  label: "Marital Status",
                  required: true,
                  options: ["Single", "Married", "Divorced", "Widowed"],
                },
                { label: "Gender", required: true, options: ["Male", "Female"] },
                {
                  label: "Nationality",
                  required: true,
                  options: ["Singaporean", "Malaysian", "Indonesian", "Others"],
                },
                {
                  label: "Status in Singapore",
                  required: true,
                  options: ["Citizen", "PR", "Foreigner"],
                },
                {
                  label: "Race",
                  required: true,
                  options: ["Chinese", "Malay", "Indian", "Others"],
                },
                { label: "Dialect", type: "text" },
                {
                  label: "Religion",
                  required: true,
                  options: ["Buddhism", "Christianity", "Hinduism", "Islam", "Others"],
                },
                {
                  label: "Country of Birth",
                  required: true,
                  options: ["Singapore", "Malaysia", "India", "Others"],
                },
                { label: "Passport No.", required: true, type: "text" },
              ].map((field, i) => (
                <div key={i}>
                  <span className="label-text">
                    {field.label}
                    {field.required && <span className="required-asterisk">*</span>}
                  </span>
                  {field.type === "text" || !field.options ? (
                    <input type="text" className="input" />
                  ) : (
                    <select className="input" defaultValue="">
                      <option value="" disabled>
                        Select
                      </option>
                      {field.options.map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}

              <div className="date-input-wrapper">
                  <span className="label-text">
                    Passport Expiry Date<span className="required-asterisk">*</span>
                  </span>

                  <div className="date-picker-container">
                    <CssBaseline />
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        value={passportExpiry}
                        onChange={(newValue) => setPassportExpiry(newValue)}
                        format="dd/MM/yyyy"
                        slotProps={{
                          textField: {
                            variant: "outlined",
                            size: "small",
                            fullWidth: true,
                            InputProps: {
                              sx: {
                                backgroundColor: darkMode ? "#3a3a3a" : "#fff",
                                color: darkMode ? "#fff" : "#000",
                                borderColor: darkMode ? "#555" : "#ccc",
                                '& .MuiInputBase-input': {
                                  color: darkMode ? "#fff" : "#000",
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: darkMode ? "#777" : "#ccc",
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: darkMode ? "#aaa" : "#666",
                                },
                              },
                            },
                          },
                        }}
                        sx={{
                          '& .MuiPickersPopper-root': {
                            backgroundColor: darkMode ? '#2c2c2c' : '#fff',
                            color: darkMode ? '#fff' : '#000',
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </div>
                </div>
              </div>
          )}
        </div>

        <div className="form-container">
          <h2
            className="section-title"
            onClick={() => setShowSingaporeAddress((prev) => !prev)}
            style={{ cursor: "pointer" }}
          >
            Singapore Address
          </h2>
          {showSingaporeAddress && (
            <div className="form-section">
              {[
                {
                  label: "Blk/House No.",
                  required: true,
                  type: "text",
                },
                {
                  label: "Street Name",
                  required: true,
                  type: "text",
                },
                {
                  label: "Unit",
                  required: true,
                  type: "text",
                },
                {
                  label: "No.",
                  required: true,
                  type: "text",
                },
                {
                  label: "Postal Code",
                  required: true,
                  type: "text",
                },
                {
                  label: "Mobile No.",
                  required: true,
                  type: "tel",
                },
                {
                  label: "Home Telephone No.",
                  required: false,
                  type: "tel",
                },
              ].map((field, i) => (
                <div key={i}>
                  <span className="label-text">
                    {field.label}
                    {field.required && <span className="required-asterisk">*</span>}
                  </span>
                  {<input type={field.type} className="input" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-container">
          <h2
            className="section-title"
            onClick={() => setShowOverseasAddress((prev) => !prev)}
            style={{ cursor: "pointer" }}
          >
            Overseas Address
          </h2>
          {showOverseasAddress && (
            <div className="form-section">
              {[
                {
                  label: "Blk/House No.",
                  required: true,
                  type: "text",
                },
                {
                  label: "Street Name",
                  required: true,
                  type: "text",
                },
                {
                  label: "Building Name",
                  required: false,
                  type: "text",
                },
                {
                  label: "City",
                  required: true,
                  type: "text",
                },
                {
                  label: "State/Province",
                  required: true,
                  type: "text",
                },
                {
                  label: "Country",
                  required: true,
                  type: "text",
                },
                {
                  label: "Postal Code",
                  required: true,
                  type: "text",
                },
                {
                  label: "Mobile No.",
                  required: true,
                  type: "tel",
                },
                {
                  label: "Home Telephone No.",
                  required: false,
                  type: "tel",
                }
              ].map((field, i) => (
                <div key={i}>
                  <span className="label-text">
                    {field.label}
                    {field.required && <span className="required-asterisk">*</span>}
                  </span>
                  {(field.label === "Mobile No." || field.label === "Home Telephone No.") ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select className="country-input" style={{ flex: "1 1 35%" }}>
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
                        type="tel"
                        placeholder="Contact Number"
                        className="input"
                        style={{ flex: "1 1 65%" }}
                      />
                    </div>
                    ) : (
                      <input type={field.type} className="input" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-container">
            <h2
              className="section-title"
              onClick={() => setShowMilitaryService((prev) => !prev)}
              style={{ cursor: "pointer" }}
            >
              Military Service
            </h2>

            {showMilitaryService && (
              <div className="form-section">
                <div>
                  <span className="label-text">
                    Finished National Service?<span className="required-asterisk">*</span>
                  </span>
                  <select
                    className="input"
                    defaultValue=""
                    onChange={(e) => setNsStatus(e.target.value)}
                  >
                    <option value="" disabled>Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </div>

                {nsStatus === "Yes" && (
                  <>
                    
                    <div className="military-period-group">
                      <span className="label-text">
                        Service Period From<span className="required-asterisk">*</span>
                      </span>
                      <div className="period-inputs">
                        <input
                          type="number"
                          className="input no-spinner"
                          placeholder="Year"
                          min="1960"
                          max="2100"
                        />
                        <select className="input">
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

                    <div className="military-period-group">
                      <span className="label-text">
                        To<span className="required-asterisk">*</span>
                      </span>
                      <div className="period-inputs">
                        <input
                          type="number"
                          className="input no-spinner"
                          placeholder="Year"
                          min="1960"
                          max="2100"
                        />
                        <select className="input">
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
                    

                    {/* Next line: Rank, Unit, etc. */}
                    {[
                      { label: "Rank", type: "text" },
                      { label: "Unit", type: "text" },
                      { label: "Vocation", type: "text" },
                    ].map((field, i) => (
                      <div key={i}>
                        <span className="label-text">
                          {field.label}<span className="required-asterisk">*</span>
                        </span>
                        <input type={field.type} className="input" />
                      </div>
                    ))}

                    <div className="date-input-wrapper">
                      <span className="label-text">
                        Date of Next Camp<span className="required-asterisk">*</span>
                      </span>
                      <CssBaseline />
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          value={dateOfNextCamp}
                          onChange={(newValue) => setDateOfNextCamp(newValue)}
                          format="dd/MM/yyyy"
                          slotProps={{
                            textField: {
                              variant: "outlined",
                              size: "small",
                              fullWidth: true,
                              InputProps: {
                                sx: {
                                  backgroundColor: darkMode ? "#3a3a3a" : "#fff",
                                  color: darkMode ? "#fff" : "#000",
                                  borderColor: darkMode ? "#555" : "#ccc",
                                  '& .MuiInputBase-input': {
                                    color: darkMode ? "#fff" : "#000",
                                  },
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: darkMode ? "#777" : "#ccc",
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: darkMode ? "#aaa" : "#666",
                                  },
                                },
                              },
                            },
                          }}
                          sx={{
                            '& .MuiPickersPopper-root': {
                              backgroundColor: darkMode ? '#2c2c2c' : '#fff',
                              color: darkMode ? '#fff' : '#000',
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </div>




                    
                    <div>
                      <span className="label-text">
                        Operationally Ready?<span className="required-asterisk">*</span>
                      </span>
                      <select
                        className="input"
                        value={isOperationallyReady}
                        onChange={(e) => setIsOperationallyReady(e.target.value)}
                      >
                        <option value="" disabled>Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    {isOperationallyReady === "Yes" && (
                      <>
                        <div>
                          <span className="label-text">Unit (NSman) </span>
                          <input type="text" className="input" placeholder="e.g., 3rd Infantry Battalion" />
                        </div>

                        <div>
                          <span className="label-text">Vocation (NSman) </span>
                          <input type="text" className="input" placeholder="e.g., Combat Engineer" />
                        </div>
                      </>
                    )}
                  </>
                )}

                {(nsStatus === "No" || nsStatus === "Not Applicable") && (
                  <div>
                    <span className="label-text">
                      Please state your reason <span className="required-asterisk">*</span>
                    </span>
                    <textarea className="input" rows={3} placeholder="Your reason here..." />
                  </div>
                )}
              </div>
            )}
        </div>
      
        <div className="form-buttons">
            <button className="btn submit" onClick={() => navigate("/hr/applicant-details/education")}>Next</button>
        </div>
      </div>
    </div>
      
    
  );
};

export default ApplicantPersonalParticulars;
