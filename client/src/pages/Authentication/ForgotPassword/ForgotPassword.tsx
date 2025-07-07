import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import authStyles from "../AuthStyles.module.css";
import EAIM from "../../../assets/EAIM.png";
import background from "../../../assets/background4.jpg";
import axios from "axios";
import { Mail, Sun, Moon} from "lucide-react";
import { useState } from "react";
import { useTheme } from "../../../hooks/useTheme";

type ForgotPasswordInputs = {
  email: string;
};

const ForgotPassword: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInputs>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const { isDark, toggleTheme } = useTheme();

  const onSubmit = async (data: ForgotPasswordInputs) => {
    setIsLoading(true);
    setServerMessage("");
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/forgot-password`, {
        email: data.email,
      });

      if (response.data.success) {
        setServerMessage("Password reset link sent to your email address!");
        setMessageType('success');
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setServerMessage("Failed to send reset link: " + response.data.message);
        setMessageType('error');
      }
    } catch (error: any) {
      if (error.response && error.response.data) {
        setServerMessage("Error: " + error.response.data.message);
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
        {/* Theme Toggle Button */}
        <button 
          className={authStyles.themeToggle}
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>


        <div className={authStyles.logoSection}>
          <img src={EAIM} className={authStyles.logo} alt="EAIM Logo" />
          <h1 className={authStyles.title}>Reset Password</h1>
          <p className={authStyles.subtitle}>Enter your email address and we'll send you a link to reset your password</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={authStyles.authForm}>
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
                placeholder="Enter your email address"
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

          {/* Server Message */}
          {serverMessage && (
            <p className={`${authStyles.serverMessage} ${authStyles[messageType]}`}>
              {serverMessage}
            </p>
          )}

          {/* Links */}
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