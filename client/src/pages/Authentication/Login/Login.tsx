import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import authStyles from "../AuthStyles.module.css";
import styles from "./Login.module.css";
import EAIM from "../../../assets/EAIM.png";
import background from "../../../assets/background4.jpg";
import axios from "axios";
import { Eye, EyeOff, Mail, Lock, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

type LoginFormInputs = {
  emailOrUsername: string;
  password: string;
};

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true);
    setServerMessage("");
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/login`, {
        emailOrUsername: data.emailOrUsername,
        password: data.password,
      });

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        setServerMessage("Login successful! Redirecting...");
        setMessageType('success');
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
        <div className={authStyles.logoSection}>
          <img src={EAIM} className={authStyles.logo} alt="EAIM Logo" />
          <h1 className={authStyles.title}>Welcome Back</h1>
          <p className={authStyles.subtitle}>Sign in to your account to continue</p>
        </div>
        <button 
          className={authStyles.themeToggle}
          onClick={toggleDarkMode}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Moon size={20} /> : <Sun size={20} />}
        </button>
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
          {/* Links */}
          <div className={authStyles.linksSection}>
            <Link to="/register" className={authStyles.link}>
              Don't have an account? <span>Create one</span>
            </Link>
            <Link to="/forgot-password" className={authStyles.link}>
              Forgot your password?
            </Link>
          </div>
        </form>
        <div className={authStyles.footer}>
          <p>&copy; 2025 EAIM. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;