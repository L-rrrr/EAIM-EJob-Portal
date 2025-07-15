import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import authStyles from "../AuthStyles.module.css";
import styles from "./Login.module.css";
import EAIM from "../../../assets/EAIM.png";
import background from "../../../assets/background4.jpg";
import axios from "axios";
import { Eye, EyeOff, Mail, Lock, User, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../../../hooks/useTheme";

type LoginFormInputs = {
  role: string;
  email: string;
  password: string;
};

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const { isDark, toggleTheme } = useTheme();

  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true);
    setServerMessage("");
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/login`, {
        email: data.email,
        password: data.password,
        role: data.role,
      });

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        setServerMessage("Login successful! Redirecting...");
        setMessageType('success');
        
        setTimeout(() => {
          if (data.role === "Applicant") {
            navigate("/home");
          } else if (data.role === "HR") {
            navigate("/hr/dashboard");
          } else if (data.role === "Manager") {
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
      {/* Theme Toggle Button */}


      <div className={authStyles.authContainer}>
        

        <div className={authStyles.logoSection}>
          <img src={EAIM} className={authStyles.logo} alt="EAIM Logo" />
          <h1 className={authStyles.title}>Welcome Back</h1>
          <p className={authStyles.subtitle}>Sign in to your account to continue</p>
        </div>

        <button 
          className={authStyles.themeToggle}
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <form onSubmit={handleSubmit(onSubmit)} className={authStyles.authForm}>
          {/* Role Selection */}
          <div className={authStyles.formGroup}>
            <label htmlFor="role" className={authStyles.label}>
              <User size={18} />
              Login as
            </label>
            <div className={authStyles.inputWrapper}>
              <select 
                id="role" 
                {...register("role", { required: "Please select a role" })} 
                className={`${authStyles.input} ${styles.selectInput} ${errors.role ? authStyles.inputError : ''}`}
              >
                <option value="">-- Select Your Role --</option>
                <option value="Applicant">Job Applicant</option>
                <option value="Manager">Hiring Manager</option>
                <option value="HR">HR</option>
              </select>
            </div>
            {errors.role && <p className={authStyles.errorMessage}>{errors.role.message}</p>}
          </div>

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
                {...register("email", { 
                  required: "Email is required",
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: "Please enter a valid email address (e.g., user@example.com)"
                  },
                  validate: {
                    noSpaces: value => !/\s/.test(value) || "Email cannot contain spaces",
                    validDomain: value => {
                      const domain = value.split('@')[1];
                      return !domain || domain.includes('.') || "Please enter a valid email domain";
                    }
                  }
                })}
                className={`${authStyles.input} ${errors.email ? authStyles.inputError : ''}`}
              />
            </div>
            {errors.email && <p className={authStyles.errorMessage}>{errors.email.message}</p>}
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
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters"
                  }
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

        {/* Footer */}
        <div className={authStyles.footer}>
          <p>&copy; 2025 EAIM. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;