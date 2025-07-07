import { useState, useContext } from "react";
import "./Apply.css";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { CssBaseline } from "@mui/material";
import { ColorModeContext } from "../../ThemeContext"; // Adjust the path as necessary

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import "react-datepicker/dist/react-datepicker.css";



const Apply: React.FC = () => {
  const { darkMode } = useContext(ColorModeContext);
  const navigate = useNavigate();
  const [startingDate, setStartingDate] = useState<Date | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setDocumentFile(e.target.files[0]);
    }
  };

  return (
    <div className="main-panel">
      <div className="form-wrapper">
        <div className="form-container">
          <h2 className="section-title">Job Info</h2>
          <div className="form-section">
            <label>
              <span className="label-text">Position Type:
                <span className="job-info"> Full Time</span>
              </span>
            </label>
            <label>
              <span className="label-text">Position:
                <span className="job-info"> Executive Exam</span>
              </span>
            </label>
          </div>
        </div>

        <div className="form-container">
          <h2 className="section-title">Attachment</h2>
          <div className="form-section">
            <label>
              <span className="label-text">Document Type</span>
              <input type="text" className="input" placeholder="e.g., Resume" />
            </label>
            <label>
              <span className="label-text">Document Name</span>
              <input type="text" className="input" placeholder="e.g., resume.pdf" />
            </label>
            <label>
              <span className="label-text">Upload File</span>
              <input type="file" onChange={handleFileChange} className="file-input" />
            </label>
          </div>
        </div>

        <div className="form-container">
          <h2 className="section-title">Position Details</h2>
          <div className="form-section">
            <label>
              <span className="label-text">Current Salary (S$)</span>
              <input type="text" className="input" />
            </label>
            <label>
              <span className="label-text">Expected Salary (S$)</span>
              <input type="text" className="input" />
            </label>
            <label>
              <span className="label-text">Earliest Starting Date</span>
              
              
              
              <div className="date-input-wrapper">
                <CssBaseline />
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    value={startingDate}
                    onChange={(newValue) => setStartingDate(newValue)}
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

            </label>
            <label>
              <span className="label-text">Source Obtained From</span>
              <select className="input" defaultValue="">
                <option value="" disabled>Select</option>
                {[
                  "Agency", "Career Fair", "EASB website", "EASB Staff", "EASB Student",
                  "JobsDB", "JobsCentral", "JobStreet", "ST Jobs", "Jobs Bank", "Others"
                ].map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="label-text">Total Work Experience</span>
              <input type="text" className="input" />
            </label>
            <label>
              <span className="label-text">Relevant Work Experience (Years)</span>
              <input type="text" className="input" />
            </label>
          </div>
        </div>

        <div className="form-container">
          <div className="form-section">
            <div className="profile-completeness">
              <span className="label-text">Profile Completeness: <strong>50%</strong></span>
              <button className="btn profile-btn" onClick={() => navigate("/profile/personal-particulars")}>Go to Profile </button>
            </div>
          </div>
        </div>

        <div className="form-buttons">
          <button className="btn submit">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default Apply;
