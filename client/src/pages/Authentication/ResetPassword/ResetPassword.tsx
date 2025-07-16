import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import authStyles from "../AuthStyles.module.css";
import background from "../../../assets/background4.jpg";
import EAIM from "../../../assets/EAIM.png";
import { Lock, Sun, Moon } from "lucide-react";
import axios from "axios";

type ResetInputs = {
  password: string;
  confirmPassword: string;
};

const ResetPassword: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetInputs>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  // Get token from URL
  const params = new URLSearchParams(location.search);
  const token = params.get("token");

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const onSubmit = async (data: ResetInputs) => {
    setIsLoading(true);
    setServerMessage("");
    try {
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
        <button 
          className={authStyles.themeToggle}
          onClick={toggleDarkMode}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className={authStyles.logoSection}>
          <img src={EAIM} className={authStyles.logo} alt="EAIM Logo" />
          <h1 className={authStyles.title}>Set New Password</h1>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className={authStyles.authForm}>
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
            {errors.password && <p className={authStyles.errorMessage}>{errors.password.message}</p>}
          </div>
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
            {errors.confirmPassword && <p className={authStyles.errorMessage}>{errors.confirmPassword.message}</p>}
          </div>
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
          {serverMessage && (
            <p className={`${authStyles.serverMessage} ${authStyles[messageType]}`}>
              {serverMessage}
            </p>
          )}
        </form>
        <div className={authStyles.footer}>
          <p>&copy; 2025 EAIM. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;