import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import authStyles from "../AuthStyles.module.css";
import styles from "./Register.module.css";
import EAIM from "../../../assets/EAIM.png";
import background from "../../../assets/background4.jpg";
import axios from "axios";
import { User, Mail, Lock, Globe, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import countries from "../../../utils/Countries"; 

type RegisterFormInputs = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  nationality: string;
};

const Register: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormInputs>();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const onSubmit = async (data: RegisterFormInputs) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/register`, data);
      
      if (response.data.success) {
        setServerMessage("Registration successful! You can now login.");
        setMessageType('success');
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setServerMessage(response.data.message);
        setMessageType('error');
      }
    } catch (error: any) {
      if (error.response && error.response.data) {
        setServerMessage("Registration failed: " + error.response.data.message);
      } else {
        setServerMessage("Server error. Please try again.");
      }
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={authStyles.authBackground} style={{ backgroundImage: `url(${background})` }}>
      

      <div className={authStyles.authContainer}>
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

        <form onSubmit={handleSubmit(onSubmit)} className={authStyles.authForm}>
          {/* Name Fields Grid */}
          <div className={styles.formGrid}>
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

          {/* Email Field */}
          <div className={authStyles.formGroup}>
            <label htmlFor="username" className={authStyles.label}>
              <Mail size={18} />
              Email Address
            </label>
            <div className={authStyles.inputWrapper}>
              <input
                id="username"
                type="email"
                placeholder="Enter your email"
                {...register("username", { 
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
                    },
                    commonDomains: value => {
                      const domain = value.split('@')[1];
                      return !domain || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain) || "Please enter a valid email domain";
                    }
                  }
                })}
                className={`${authStyles.input} ${errors.username ? authStyles.inputError : ''}`}
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

export default Register;