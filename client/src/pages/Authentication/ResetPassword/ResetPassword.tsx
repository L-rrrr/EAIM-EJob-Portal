/**
 * ResetPassword Page
 *
 * This component renders the "Reset Password" page for the EAIM portal.
 *
 * Features:
 * - Reads the reset token from the URL query string (?token=...).
 * - Validates the presence of the token and shows an error if missing.
 * - Allows the user to set a new password and confirm it.
 * - Validates password length and that both passwords match.
 * - Sends a POST request to the backend to reset the password.
 * - Shows loading spinner and disables the submit button during the request.
 * - Displays server messages for success or error.
 * - Redirects to the login page after a successful reset.
 * - Supports dark mode toggle.
 *
 * Usage:
 * - Used as a route page: `/reset-password?token=...`
 *
 * State:
 * - isLoading: Indicates if the request is in progress.
 * - serverMessage: Message to display after submitting the form.
 * - messageType: Type of server message ('success' or 'error').
 * - darkMode: Tracks the current theme mode.
 *
 * Dependencies:
 * - react-hook-form for form handling and validation.
 * - axios for HTTP requests.
 * - react-router-dom for navigation and reading query params.
 * - lucide-react for icons.
 * - AuthStyles.module.css for styling.
 *
 * @component
 */

import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import authStyles from "../AuthStyles.module.css";
import background from "../../../assets/background4.jpg";
import EAIM from "../../../assets/EAIM.png";
import { Lock, Sun, Moon } from "lucide-react";
import axios from "axios";

// Define the type for form inputs
type ResetInputs = {
  password: string;
  confirmPassword: string;
};

const ResetPassword: React.FC = () => {
  // Initialize react-hook-form for form validation and handling
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetInputs>();
  const navigate = useNavigate();
  const location = useLocation();

  // State for loading spinner during request
  const [isLoading, setIsLoading] = useState(false);
  // State for server response message
  const [serverMessage, setServerMessage] = useState("");
  // State for message type (success or error)
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  // State for dark mode toggle
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  // Get token from URL query string
  const params = new URLSearchParams(location.search);
  const token = params.get("token");

  // Toggle dark mode and persist preference in localStorage
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  // Handle form submission
  const onSubmit = async (data: ResetInputs) => {
    setIsLoading(true);
    setServerMessage("");
    try {
      // Send POST request to backend to reset password
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/reset-password`, {
        token,
        newPassword: data.password,
      });
      if (response.data.success) {
        setServerMessage("Password has been reset successfully! Redirecting to login...");
        setMessageType("success");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setServerMessage(response.data.message);
        setMessageType("error");
      }
    } catch (error: any) {
      setServerMessage(error.response?.data?.message || "Server error. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  // If token is missing, show error message and link to request a new reset link
  if (!token) {
    return (
      <div className={authStyles.authBackground} style={{ backgroundImage: `url(${background})` }}>
        <div className={authStyles.authContainer}>
          <div className={authStyles.logoSection}>
            <img src={EAIM} className={authStyles.logo} alt="EAIM Logo" />
            <h1 className={authStyles.title}>Reset Password</h1>
            <p className={authStyles.errorMessage}>Invalid or missing reset token.</p>
            <Link to="/forgot-password" className={authStyles.link}>Request a new reset link</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={authStyles.authBackground} style={{ backgroundImage: `url(${background})` }}>
      <div className={authStyles.authContainer}>
        {/* Theme Toggle Button */}
        <button 
          className={authStyles.themeToggle}
          onClick={toggleDarkMode}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {/* Logo and Title Section */}
        <div className={authStyles.logoSection}>
          <img src={EAIM} className={authStyles.logo} alt="EAIM Logo" />
          <h1 className={authStyles.title}>Set New Password</h1>
        </div>
        {/* Reset Password Form */}
        <form onSubmit={handleSubmit(onSubmit)} className={authStyles.authForm}>
          {/* New Password Field */}
          <div className={authStyles.formGroup}>
            <label htmlFor="password" className={authStyles.label}>
              <Lock size={18} />
              New Password
            </label>
            <div className={authStyles.inputWrapper}>
              <input
                id="password"
                type="password"
                placeholder="Enter new password"
                {...register("password", { 
                  required: "Password is required",
                  minLength: { value: 8, message: "Password must be at least 8 characters" }
                })}
                className={`${authStyles.input} ${errors.password ? authStyles.inputError : ''}`}
              />
            </div>
            {/* Show validation error if present */}
            {errors.password && <p className={authStyles.errorMessage}>{errors.password.message}</p>}
          </div>
          {/* Confirm Password Field */}
          <div className={authStyles.formGroup}>
            <label htmlFor="confirmPassword" className={authStyles.label}>
              <Lock size={18} />
              Confirm Password
            </label>
            <div className={authStyles.inputWrapper}>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                {...register("confirmPassword", { 
                  required: "Please confirm your password",
                  validate: value => value === watch("password") || "Passwords do not match"
                })}
                className={`${authStyles.input} ${errors.confirmPassword ? authStyles.inputError : ''}`}
              />
            </div>
            {/* Show validation error if present */}
            {errors.confirmPassword && <p className={authStyles.errorMessage}>{errors.confirmPassword.message}</p>}
          </div>
          {/* Submit Button */}
          <button 
            type="submit" 
            className={`${authStyles.submitButton} ${isLoading ? authStyles.loading : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className={authStyles.spinner}></div>
            ) : (
              'Reset Password'
            )}
          </button>
          {/* Server Response Message */}
          {serverMessage && (
            <p className={`${authStyles.serverMessage} ${authStyles[messageType]}`}>
              {serverMessage}
            </p>
          )}
        </form>
        {/* Footer */}
        <div className={authStyles.footer}>
          <p>&copy; 2025 EAIM. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;