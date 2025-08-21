/**
 * Login Page
 * 
 * This component renders the login page for the EAIM portal.
 * 
 * Features:
 * - Allows users to log in using email or username and password.
 * - Validates required fields using react-hook-form.
 * - Shows/hides password with a toggle button.
 * - Displays loading spinner and disables the submit button during login.
 * - Shows server messages for success or error.
 * - Provides links to registration and forgot password pages.
 * - Supports dark mode toggle.
 * 
 * Usage:
 * - Used as a route page: `/login`
 * - On successful login, redirects users based on their role:
 *   - Applicant: `/home`
 *   - HR: `/hr/dashboard`
 *   - Manager: `/manager/available-jobs`
 * 
 * State:
 * - showPassword: Toggles password visibility.
 * - isLoading: Indicates if the login request is in progress.
 * - serverMessage: Message to display after submitting the form.
 * - messageType: Type of server message ('success' or 'error').
 * - darkMode: Tracks the current theme mode.
 * 
 * Dependencies:
 * - react-hook-form for form handling and validation.
 * - axios for HTTP requests.
 * - react-router-dom for navigation and links.
 * - lucide-react for icons.
 * - AuthStyles.module.css and Login.module.css for styling.
 * 
 * @component
 */

import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import authStyles from "../AuthStyles.module.css";
import styles from "./Login.module.css";
import EAIM from "../../../assets/EAIM.png";
import background from "../../../assets/background4.jpg";
import axios from "axios";
import { Eye, EyeOff, Mail, Lock, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

// Define the type for login form inputs
type LoginFormInputs = {
  emailOrUsername: string;
  password: string;
};

const Login = () => {
  // Initialize react-hook-form for validation and form handling
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  const navigate = useNavigate();

  // State for showing/hiding password
  const [showPassword, setShowPassword] = useState(false);
  // State for loading spinner during login request
  const [isLoading, setIsLoading] = useState(false);
  // State for server response message
  const [serverMessage, setServerMessage] = useState("");
  // State for message type (success or error)
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  // State for dark mode toggle
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  // Sync dark mode state with document class on mount
  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  // Toggle dark mode and persist preference in localStorage
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  // Handle form submission
  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true);
    setServerMessage("");
    try {
      // Send login request to backend
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/login`, {
        emailOrUsername: data.emailOrUsername,
        password: data.password,
      });

      if (response.data.success) {
        // Store JWT token in localStorage
        localStorage.setItem("token", response.data.token);
        setServerMessage("Login successful! Redirecting...");
        setMessageType('success');
        // Redirect user based on role after a short delay
        setTimeout(() => {
          const role = response.data.role;
          if (role === "Applicant") {
            navigate("/home");
          } else if (role === "HR") {
            navigate("/hr/dashboard");
          } else if (role === "Manager") {
            navigate("/manager/available-jobs");
          }
        }, 1000);
      } else {
        setServerMessage("Login failed: " + response.data.message);
        setMessageType('error');
      }
    } catch (error: any) {
      if (error.response && error.response.data) {
        setServerMessage("Login failed: " + error.response.data.message);
      } else {
        setServerMessage("Server error. Please try again.");
      }
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={authStyles.authBackground} style={{ backgroundImage: `url(${background})`}}>
      <div className={authStyles.authContainer}>
        {/* Logo and Title Section */}
        <div className={authStyles.logoSection}>
          <img src={EAIM} className={authStyles.logo} alt="EAIM Logo" />
          <h1 className={authStyles.title}>Welcome Back</h1>
          <p className={authStyles.subtitle}>Sign in to your account to continue</p>
        </div>
        {/* Theme Toggle Button */}
        <button 
          className={authStyles.themeToggle}
          onClick={toggleDarkMode}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className={authStyles.authForm}>
          {/* Email or Username Input */}
          <div className={authStyles.formGroup}>
            <label htmlFor="emailOrUsername" className={authStyles.label}>
              <Mail size={18} />
              Email / Username
            </label>
            <div className={authStyles.inputWrapper}>
              <input
                id="emailOrUsername"
                type="text"
                placeholder="Enter your email or username"
                {...register("emailOrUsername", { required: "Email or username is required" })}
                className={`${authStyles.input} ${errors.emailOrUsername ? authStyles.inputError : ''}`}
              />
            </div>
            {/* Show validation error if present */}
            {errors.emailOrUsername && <p className={authStyles.errorMessage}>{errors.emailOrUsername.message}</p>}
          </div>
          {/* Password Input */}
          <div className={authStyles.formGroup}>
            <label htmlFor="password" className={authStyles.label}>
              <Lock size={18} />
              Password
            </label>
            <div className={authStyles.inputWrapper}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...register("password", { 
                  required: "Password is required",
                })}
                className={`${authStyles.input} ${styles.passwordInput} ${errors.password ? authStyles.inputError : ''}`}
              />
              {/* Password visibility toggle */}
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {/* Show validation error if present */}
            {errors.password && <p className={authStyles.errorMessage}>{errors.password.message}</p>}
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
              'Sign In'
            )}
          </button>
          {/* Server Message */}
          {serverMessage && (
            <p className={`${authStyles.serverMessage} ${authStyles[messageType]}`}>
              {serverMessage}
            </p>
          )}
          {/* Links to Register and Forgot Password */}
          <div className={authStyles.linksSection}>
            <Link to="/register" className={authStyles.link}>
              Don't have an account? <span>Create one</span>
            </Link>
            <Link to="/forgot-password" className={authStyles.link}>
              Forgot your password?
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

export default Login;