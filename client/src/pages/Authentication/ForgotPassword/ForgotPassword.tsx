/**
 * ForgotPassword Page
 * 
 * This component renders the "Forgot Password" page for the EAIM portal.
 * 
 * Features:
 * - Allows users to request a password reset by entering their email address.
 * - Validates the email input for required and proper email format.
 * - Sends a POST request to the backend to trigger the password reset process.
 * - Displays a generic success message regardless of whether the email exists, for security.
 * - Shows loading spinner and disables the submit button during the request.
 * - Provides links to the login and registration pages.
 * - Supports dark mode toggle.
 * 
 * Usage:
 * - Used as a route page: `/forgot-password`
 * - On successful request, redirects to the login page after a short delay.
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
 * - react-router-dom for navigation and links.
 * - lucide-react for icons.
 * - AuthStyles.module.css for styling.
 * 
 * @component
 */

import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import authStyles from "../AuthStyles.module.css";
import EAIM from "../../../assets/EAIM.png";
import background from "../../../assets/background4.jpg";
import axios from "axios";
import { Mail, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../../../hooks/useTheme";

// Define the type for form inputs
type ForgotPasswordInputs = {
  email: string;
};

const ForgotPassword: React.FC = () => {
  // Initialize react-hook-form for form validation and handling
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInputs>();
  const navigate = useNavigate();

  // State for loading spinner during request
  const [isLoading, setIsLoading] = useState(false);
  // State for server response message
  const [serverMessage, setServerMessage] = useState("");
  // State for message type (success or error)
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const { isDark: darkMode, toggleTheme: toggleDarkMode } = useTheme();

  // Handle form submission
  const onSubmit = async (data: ForgotPasswordInputs) => {
    setIsLoading(true);
    setServerMessage("");
    try {
      // Send POST request to backend to trigger password reset
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/forgot-password`, {
        email: data.email,
      });
      // Always show generic message for security
      setServerMessage("If this email exists, a reset link has been sent.");
      setMessageType('success');
      // Redirect to login after a short delay
      setTimeout(() => navigate("/login"), 4000);
    } catch (error: any) {
      setServerMessage("Server error. Please try again.");
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className={authStyles.title}>Reset Password</h1>
          <p className={authStyles.subtitle}>Enter your email address and we'll send you a link to reset your password</p>
        </div>

        {/* Forgot Password Form */}
        <form onSubmit={handleSubmit(onSubmit)} className={authStyles.authForm}>
          <div className={authStyles.formGroup}>
            <label htmlFor="email" className={authStyles.label}>
              <Mail size={18} />
              Email Address
            </label>
            <div className={authStyles.inputWrapper}>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                // Register input with validation rules
                {...register("email", { 
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Please enter a valid email address"
                  }
                })}
                className={`${authStyles.input} ${errors.email ? authStyles.inputError : ''}`}
              />
            </div>
            {/* Show validation error if present */}
            {errors.email && <p className={authStyles.errorMessage}>{errors.email.message}</p>}
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
              'Send Reset Link'
            )}
          </button>

          {/* Server Response Message */}
          {serverMessage && (
            <p className={`${authStyles.serverMessage} ${authStyles[messageType]}`}>
              {serverMessage}
            </p>
          )}

          {/* Links to Login and Register */}
          <div className={authStyles.linksSection}>
            <Link to="/login" className={authStyles.link}>
              Remember your password? <span>Sign in</span>
            </Link>
            <Link to="/register" className={authStyles.link}>
              Don't have an account? <span>Create one</span>
            </Link>
          </div>
        </form>

        {/* Footer */}
        <div className={authStyles.footer}>
          <p>&copy; 2025 EAIM. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;