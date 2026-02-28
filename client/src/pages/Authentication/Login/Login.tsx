/**
 * Login Page
 *
 * This component provides the login interface for all users (Applicants, HR, and Managers).
 * It supports both standard email/password login for applicants and a two-step verification
 * process for HR/Manager accounts, which requires a verification code sent to their email.
 *
 * Features:
 * - Applicant login with email and password.
 * - HR/Manager login with username and password, followed by email verification code.
 * - Dynamic form: shows verification code field only after initial HR/Manager credentials are validated.
 * - Handles dark and light mode themes.
 * - Displays server messages and loading states.
 * - Redirects users to their respective dashboards upon successful login.
 *
 * State:
 * - showPassword: Toggles password visibility.
 * - isLoading: Indicates loading state during authentication.
 * - serverMessage, messageType: For displaying feedback to the user.
 * - darkMode: Tracks current theme.
 * - showCodeField, isHRManager, codeSent: Manage two-step verification flow for HR/Manager.
 * - pendingLoginData: Stores credentials for HR/Manager before code verification.
 *
 * Dependencies:
 * - react-hook-form for form management.
 * - axios for HTTP requests.
 * - lucide-react for icons.
 * - React Router for navigation.
 * - Custom CSS modules for styling.
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
import { Eye, EyeOff, Mail, Lock, Sun, Moon, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../../../hooks/useTheme";

type LoginFormInputs = {
  emailOrUsername: string;
  password: string;
  code?: string;
};

const Login = () => {
  const { register, handleSubmit, formState: { errors }} = useForm<LoginFormInputs>();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const { isDark: darkMode, toggleTheme: toggleDarkMode } = useTheme();

  // New state for HR/Manager verification flow
  const [showCodeField, setShowCodeField] = useState(false);
  const [isHRManager, setIsHRManager] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState<{ emailOrUsername: string; password: string } | null>(null);

  // Step 1: Handle initial sign in attempt
  const handleInitialSignIn = async (data: LoginFormInputs) => {
    setIsLoading(true);
    setServerMessage("");
    setShowCodeField(false);
    setIsHRManager(false);

    try {
      // Try applicant login if input is email
      if (data.emailOrUsername.includes("@")) {
        // Try applicant login directly
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/login`, {
          emailOrUsername: data.emailOrUsername,
          password: data.password,
        });
        if (response.data.success) {
          localStorage.setItem("token", response.data.token);
          setServerMessage("Login successful! Redirecting...");
          setMessageType('success');
          setTimeout(() => {
            navigate("/home");
          }, 1000);
          return;
        } else {
          setServerMessage("Login failed: " + response.data.message);
          setMessageType('error');
          setIsLoading(false);
          return;
        }
      }

      // For HR/Manager (username without @) request a login code from backend
      try {
        const resp = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/request-login-code`, {
          emailOrUsername: data.emailOrUsername,
          password: data.password,
        });

        if (resp.data && resp.data.success) {
          setShowCodeField(true);
          setIsHRManager(true);
          setPendingLoginData({ emailOrUsername: data.emailOrUsername, password: data.password });
          setServerMessage(resp.data.message || 'Code sent!');
          setMessageType('success');
        } else {
          setServerMessage(resp.data?.message || 'Failed to request code');
          setMessageType('error');
        }
      } catch (err: any) {
        if (err.response && err.response.data && err.response.data.message) {
          setServerMessage('Login failed: ' + err.response.data.message);
        } else {
          setServerMessage('Server error. Please try again.');
        }
        setMessageType('error');
      } finally {
        setIsLoading(false);
      }
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        setServerMessage("Login failed: " + error.response.data.message);
      } else {
        setServerMessage("Server error. Please try again.");
      }
      setMessageType('error');
      setIsLoading(false);
    }
  };

  // Step 2: Handle verification code submit for HR/Manager
  const handleVerifyCode = async (data: LoginFormInputs) => {
    setIsLoading(true);
    setServerMessage("");
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/login`, {
        emailOrUsername: pendingLoginData?.emailOrUsername,
        password: pendingLoginData?.password,
        code: data.code,
      });
      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        setServerMessage("Login successful! Redirecting...");
        setMessageType('success');
        setTimeout(() => {
          const role = response.data.role;
          if (role === "HR") {
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
      if (error.response && error.response.data && error.response.data.message) {
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
        <form
          onSubmit={
            showCodeField && isHRManager
              ? handleSubmit(handleVerifyCode)
              : handleSubmit(handleInitialSignIn)
          }
          className={authStyles.authForm}
        >
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
                disabled={showCodeField && isHRManager}
              />
            </div>
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
                {...register("password", { required: "Password is required" })}
                className={`${authStyles.input} ${styles.passwordInput} ${errors.password ? authStyles.inputError : ''}`}
                disabled={showCodeField && isHRManager}
              />
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
          {/* Verification Code Input for HR/Manager */}
          {showCodeField && isHRManager && (
            <div className={authStyles.formGroup}>
              <label htmlFor="code" className={authStyles.label}>
                <CheckCircle2 size={18} />
                Verification Code
              </label>
              <div className={authStyles.inputWrapper}>
                <input
                  id="code"
                  type="text"
                  placeholder="Enter the 6-digit code"
                  {...register("code", { required: "Verification code is required" })}
                  className={`${authStyles.input} ${errors.code ? authStyles.inputError : ''}`}
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>
              {errors.code && <p className={authStyles.errorMessage}>{errors.code.message}</p>}
              {/* Server message will show confirmation; avoid duplicate client message. */}
            </div>
          )}
          {/* Submit Button */}
          <button 
            type="submit" 
            className={`${authStyles.submitButton} ${isLoading ? authStyles.loading : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className={authStyles.spinner}></div>
            ) : (
              showCodeField && isHRManager ? "Verify & Sign In" : "Sign In"
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