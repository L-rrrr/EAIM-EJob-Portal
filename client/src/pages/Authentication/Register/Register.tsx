import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import authStyles from "../AuthStyles.module.css";
import styles from "./Register.module.css";
import EAIM from "../../../assets/EAIM.png";
import background from "../../../assets/background4.jpg";
import axios from "axios";
import { User, Mail, Lock, Globe, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { useState} from "react";
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
  const [step, setStep] = useState<"email" | "verify" | "register">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

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

        {/* Step 1: Enter Email */}
        {step === "email" && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsLoading(true);
              setServerMessage("");
              try {
                const res = await axios.post(
                  `${import.meta.env.VITE_BACKEND_URL}/request-register-code`,
                  { email }
                );
                setServerMessage(res.data.message);
                setMessageType("success");
                setStep("verify");
              } catch (error: any) {
                setServerMessage(error.response?.data?.message || "Failed to send code.");
                setMessageType("error");
              } finally {
                setIsLoading(false);
              }
            }}
            className={authStyles.authForm}
          >
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
            <button type="submit" className={authStyles.submitButton} disabled={isLoading}>
              {isLoading ? <div className={authStyles.spinner}></div> : "Send Verification Code"}
            </button>
            {serverMessage && (
              <p className={`${authStyles.serverMessage} ${messageType === 'success' ? authStyles.success : authStyles.error}`}>
                {serverMessage}
              </p>
            )}
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

        {/* Step 2: Enter Code */}
        {step === "verify" && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
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
                setServerMessage(error.response?.data?.message || "Verification failed.");
                setMessageType("error");
              } finally {
                setIsLoading(false);
              }
            }}
            className={authStyles.authForm}
          >
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
            <button type="submit" className={authStyles.submitButton} disabled={isLoading}>
              {isLoading ? <div className={authStyles.spinner}></div> : "Verify Code"}
            </button>
            {serverMessage && (
              <p className={`${authStyles.serverMessage} ${messageType === 'success' ? authStyles.success : authStyles.error}`}>
                {serverMessage}
              </p>
            )}
          </form>
        )}


        {/* Step 3: Registration Form */}
        {step === "register" && (
          <form
            onSubmit={handleSubmit(async (data) => {
              setIsLoading(true);
              setServerMessage("");
              try {
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

            {/* <form onSubmit={handleSubmit(onSubmit)} className={authStyles.authForm}> */}
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

        {/* Dark Mode Toggle */}

        {/* Footer */}
        <div className={authStyles.footer}>
          <p>&copy; 2025 EAIM. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Register;