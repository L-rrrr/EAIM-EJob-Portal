/**
 * Register Page
 * 
 * This component renders the registration page for the EAIM portal.
 * 
 * Features:
 * - Multi-step registration: email verification and user details.
 * - Sends a verification code to the user's email and verifies it before allowing registration.
 * - Validates all fields, including strong password requirements.
 * - Shows loading spinner and disables buttons during requests.
 * - Displays server messages for success or error.
 * - Provides links to login and forgot password pages.
 * - Supports dark mode toggle.
 * 
 * Usage:
 * - Used as a route page: `/register`
 * - On successful registration, redirects to the login page.
 * 
 * State:
 * - showPassword: Toggles password visibility.
 * - isLoading: Indicates if a request is in progress.
 * - serverMessage: Message to display after submitting the form.
 * - messageType: Type of server message ('success' or 'error').
 * - step: Current registration step ('email', 'verify', or 'register').
 * - email: Email address entered by the user.
 * - code: Verification code entered by the user.
 * - codeSent: Whether the verification code has been sent.
 * - darkMode: Tracks the current theme mode.
 * 
 * Dependencies:
 * - react-hook-form for form handling and validation.
 * - axios for HTTP requests.
 * - react-router-dom for navigation and links.
 * - lucide-react for icons.
 * - AuthStyles.module.css and Register.module.css for styling.
 * - Countries utility for nationality dropdown.
 * 
 * @component
 */

import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import authStyles from "../AuthStyles.module.css";
import styles from "./Register.module.css";
import EAIM from "../../../assets/EAIM.png";
import background from "../../../assets/background4.jpg";
import axios from "axios";
import { User, Mail, Lock, Globe, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { useState } from "react";
import countries from "../../../utils/Countries"; 
import { useTheme } from "../../../hooks/useTheme";

// Define the type for registration form inputs
type RegisterFormInputs = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  nationality: string;
};

const Register: React.FC = () => {
  // Initialize react-hook-form for validation and form handling
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormInputs>();
  const navigate = useNavigate();

  // State for showing/hiding password
  const [showPassword, setShowPassword] = useState(false);
  // State for loading spinner during requests
  const [isLoading, setIsLoading] = useState(false);
  // State for server response message
  const [serverMessage, setServerMessage] = useState("");
  // State for message type (success or error)
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  // Registration step: "email", "verify", or "register"
  const [step, setStep] = useState<"email" | "verify" | "register">("email");
  // Email address entered by the user
  const [email, setEmail] = useState("");
  // Verification code entered by the user
  const [code, setCode] = useState("");
  // Whether the verification code has been sent
  const [codeSent, setCodeSent] = useState(false);

  const { isDark: darkMode, toggleTheme: toggleDarkMode } = useTheme();

  /**
   * Handles sending the verification code and verifying it.
   * If code has not been sent, sends the code to the entered email.
   * If code has been sent, verifies the code.
   */
  const handleEmailAndCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setServerMessage("");
    try {
      if (!codeSent) {
        // Send code
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/request-register-code`,
          { email }
        );
        setServerMessage(res.data.message);
        setMessageType("success");
        setCodeSent(true);
      } else {
        // Verify code
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/verify-register-code`,
          { email, code }
        );
        if (res.data.success) {
          setStep("register");
          setServerMessage("Email verified! Please complete your registration.");
          setMessageType("success");
        } else {
          setServerMessage(res.data.message);
          setMessageType("error");
        }
      }
    } catch (error: any) {
      setServerMessage(error.response?.data?.message || "Failed to send or verify code.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={authStyles.authBackground} style={{ backgroundImage: `url(${background})` }}>
      <div className={authStyles.authContainer}>
        {/* Logo and Title Section */}
        <div className={authStyles.logoSection}>
          <img src={EAIM} className={authStyles.logo} alt="EAIM Logo" />
          <h1 className={authStyles.title}>Create Account</h1>
          <p className={authStyles.subtitle}>Join EAIM to start your career journey</p>
        </div>

        {/* Theme Toggle Button */}
        <button 
          className={authStyles.themeToggle}
          onClick={toggleDarkMode}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Step 1: Enter Email and verification code */}
        {step === "email" && (
          <form onSubmit={handleEmailAndCode} className={authStyles.authForm}>
            {/* Email Input */}
            <div className={authStyles.formGroup}>
              <label htmlFor="email" className={authStyles.label}>
                <Mail size={18} />
                Email Address
              </label>
              <div className={authStyles.inputWrapper}>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={authStyles.input}
                />
              </div>
            </div>
            {/* Send Verification Code Button */}
            <button
              type="button"
              className={authStyles.submitButton}
              disabled={isLoading || !email}
              onClick={async () => {
                setIsLoading(true);
                setServerMessage("");
                try {
                  const res = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/request-register-code`,
                    { email }
                  );
                  setServerMessage(res.data.message);
                  setMessageType("success");
                  setCodeSent(true);
                } catch (error: any) {
                  setServerMessage(error.response?.data?.message || "Failed to send code.");
                  setMessageType("error");
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              {isLoading ? <div className={authStyles.spinner}></div> : "Send Verification Code"}
            </button>
            {/* Verification Code Field */}
            <div className={authStyles.formGroup}>
              <label htmlFor="code" className={authStyles.label}>
                <Mail size={18} />
                Verification Code
              </label>
              <div className={authStyles.inputWrapper}>
                <input
                  id="code"
                  type="text"
                  placeholder="Enter verification code"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                  className={authStyles.input}
                />
              </div>
            </div>
            {/* Verify Code Button */}
            <button
                type="button"
                className={authStyles.submitButton}
                disabled={isLoading || !email || !code}
                onClick={async () => {
                  setIsLoading(true);
                  setServerMessage("");
                  try {
                    const res = await axios.post(
                      `${import.meta.env.VITE_BACKEND_URL}/verify-register-code`,
                      { email, code }
                    );
                    if (res.data.success) {
                      setStep("register");
                      setServerMessage("Email verified! Please complete your registration.");
                      setMessageType("success");
                    } else {
                      setServerMessage(res.data.message);
                      setMessageType("error");
                    }
                  } catch (error: any) {
                    setServerMessage(error.response?.data?.message || "Failed to verify code.");
                    setMessageType("error");
                  } finally {
                    setIsLoading(false);
                  }
                }}
                style={{ marginLeft: 8 }}
              >
                {isLoading ? <div className={authStyles.spinner}></div> : "Verify Code"}
              </button>
            {/* Server Message */}
            {serverMessage && (
              <p className={`${authStyles.serverMessage} ${messageType === 'success' ? authStyles.success : authStyles.error}`}>
                {serverMessage}
              </p>
            )}
            {/* Links to Login and Forgot Password */}
            <div className={authStyles.linksSection}>
              <Link to="/login" className={authStyles.link}>
                Already have an account? <span>Sign in</span>
              </Link>
              <Link to="/forgot-password" className={authStyles.link}>
                Forgot your password?
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: Registration Form */}
        {step === "register" && (
          <form
            onSubmit={handleSubmit(async (data) => {
              setIsLoading(true);
              setServerMessage("");
              try {
                // Send registration data to backend
                const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/register`, {
                  email,
                  password: data.password,
                  first_name: data.firstName,
                  last_name: data.lastName,
                  nationality: data.nationality,
                  code,
                });
                if (response.data.success) {
                  setServerMessage("Registration successful! You can now login.");
                  setMessageType('success');
                  setTimeout(() => navigate("/login"), 2000);
                } else {
                  setServerMessage(response.data.message);
                  setMessageType('error');
                }
              } catch (error: any) {
                setServerMessage(
                  error.response?.data?.message || "Registration failed. Please try again."
                );
                setMessageType('error');
              } finally {
                setIsLoading(false);
              }
            })}
            className={authStyles.authForm}
          >
            {/* Name Fields Grid */}
            <div className={styles.formGrid}>
              {/* First Name */}
              <div className={authStyles.formGroup}>
                <label htmlFor="firstName" className={authStyles.label}>
                  <User size={18} />
                  First Name
                </label>
                <div className={authStyles.inputWrapper}>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    {...register("firstName", { 
                      required: "First name is required",
                      minLength: {
                        value: 2,
                        message: "First name must be at least 2 characters"
                      }
                    })}
                    className={`${authStyles.input} ${errors.firstName ? authStyles.inputError : ''}`}
                  />
                </div>
                {errors.firstName && <p className={authStyles.errorMessage}>{errors.firstName.message}</p>}
              </div>
              {/* Last Name */}
              <div className={authStyles.formGroup}>
                <label htmlFor="lastName" className={authStyles.label}>
                  <User size={18} />
                  Last Name
                </label>
                <div className={authStyles.inputWrapper}>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    {...register("lastName", { 
                      required: "Last name is required",
                      minLength: {
                        value: 2,
                        message: "Last name must be at least 2 characters"
                      }
                    })}
                    className={`${authStyles.input} ${errors.lastName ? authStyles.inputError : ''}`}
                  />
                </div>
                {errors.lastName && <p className={authStyles.errorMessage}>{errors.lastName.message}</p>}
              </div>
            </div>
            {/* Email Field (read-only) */}
            <div className={authStyles.formGroup}>
              <label htmlFor="username" className={authStyles.label}>
                <Mail size={18} />
                Email Address
              </label>
              <div className={authStyles.inputWrapper}>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className={authStyles.input}
                />
              </div>
              {errors.username && <p className={authStyles.errorMessage}>{errors.username.message}</p>}
            </div>
            {/* Password Field */}
            <div className={authStyles.formGroup}>
              <label htmlFor="password" className={authStyles.label}>
                <Lock size={18} />
                Password
              </label>
              <div className={authStyles.inputWrapper}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  {...register("password", { 
                    required: "Password is required",
                    validate: {
                      requirements: value => {
                        const hasMinLength = value.length >= 8;
                        const hasLetter = /[a-zA-Z]/.test(value);
                        const hasNumber = /\d/.test(value);
                        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
                        if (!hasMinLength || !hasLetter || !hasNumber || !hasSpecialChar) {
                          return "Password must be at least 8 characters long and contain at least one letter, one number, and one special character (!@#$%^&*(),.?\":{}|<>)";
                        }
                        return true;
                      }
                    }
                  })}
                  className={`${authStyles.input} ${errors.password ? authStyles.inputError : ''}`}
                  style={{ paddingRight: '3rem' }}
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
              {errors.password && <p className={authStyles.errorMessage}>{errors.password.message}</p>}
            </div>
            {/* Nationality Field */}
            <div className={authStyles.formGroup}>
              <label htmlFor="nationality" className={authStyles.label}>
                <Globe size={18} />
                Nationality
              </label>
              <div className={authStyles.inputWrapper}>
                <select
                  id="nationality"
                  {...register("nationality", { 
                    required: "Nationality is required"
                  })}
                  className={`${authStyles.input} ${errors.nationality ? authStyles.inputError : ''}`}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select your nationality
                  </option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              {errors.nationality && <p className={authStyles.errorMessage}>{errors.nationality.message}</p>}
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
                'Create Account'
              )}
            </button>
            {/* Server Message */}
            {serverMessage && (
              <p className={`${authStyles.serverMessage} ${messageType === 'success' ? authStyles.success : authStyles.error}`}>
                {serverMessage}
              </p>
            )}
            {/* Links */}
            <div className={authStyles.linksSection}>
              <Link to="/login" className={authStyles.link}>
                Already have an account? <span>Sign in</span>
              </Link>
              <Link to="/forgot-password" className={authStyles.link}>
                Forgot your password?
              </Link>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className={authStyles.footer}>
          <p>&copy; 2025 EAIM. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Register;