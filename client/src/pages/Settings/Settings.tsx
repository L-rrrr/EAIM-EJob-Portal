/**
 * Settings Page
 *
 * This component allows users to manage their account settings, including profile information,
 * password changes, and notification preferences.
 *
 * Features:
 * - Edit and update profile information (first name, last name, email, nationality).
 * - Change password with validation and visibility toggles.
 * - Email verification workflow for email changes.
 * - (Optional) Manage notification preferences.
 * - Shows success/error messages for all actions.
 * - Responsive tab navigation for Profile and Security.
 *
 * Usage:
 * - Used as a route page: `/settings`
 *
 * State:
 * - activeTab: Current tab ("profile" or "security").
 * - isLoading: Loading state for form submissions.
 * - message/messageType: Feedback messages for user actions.
 * - showCurrentPassword, showNewPassword, showConfirmPassword: Password visibility toggles.
 * - notifications: Notification preferences (future use).
 * - Email verification: pendingEmail, showEmailVerify, emailVerifyCode, etc.
 *
 * Dependencies:
 * - react-hook-form for form handling and validation.
 * - axios for HTTP requests.
 * - lucide-react for icons.
 * - Settings.module.css for styling.
 * - Countries utility for nationality dropdown.
 *
 * @component
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  User,
  Save,
  Shield,
  Globe
} from 'lucide-react';
import styles from './Settings.module.css';
import Countries from '../../utils/Countries';

type PasswordChangeInputs = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ProfileInputs = {
  first_name: string;
  last_name: string;
  email: string;
  nationality: string;
};

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    jobAlerts: true,
    applicationUpdates: true,
    marketingEmails: false
  });

  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [showEmailVerify, setShowEmailVerify] = useState(false);
  const [emailVerifyCode, setEmailVerifyCode] = useState("");
  const [emailToVerify, setEmailToVerify] = useState("");
  const [emailVerifyMsg, setEmailVerifyMsg] = useState("");
  const [emailVerifyLoading, setEmailVerifyLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, watch, reset: resetPasswordForm } = useForm<PasswordChangeInputs>();
  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors }, setValue } = useForm<ProfileInputs>();

  const watchNewPassword = watch('newPassword', '');

  // Fetch user information on component mount
  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/user-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const userData = response.data.user;
        setValue('first_name', userData.first_name);
        setValue('last_name', userData.last_name);
        setValue('email', userData.email);
        setValue('nationality', userData.nationality);
        setPendingEmail(userData.email);
        setEmailToVerify(userData.email);
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  // Email change handler
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingEmail(e.target.value);
    setValue('email', e.target.value);
    setEmailVerified(false);
  };

  const sendEmailVerification = async () => {
    setEmailVerifyLoading(true);
    setEmailVerifyMsg("");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/request-register-code`,
        { email: pendingEmail }
      );
      if (res.data.success) {
        setShowEmailVerify(true);
        setEmailToVerify(pendingEmail);
        setEmailVerifyMsg("Verification code sent to your new email.");
      } else {
        setEmailVerifyMsg(res.data.message || "Failed to send verification code.");
      }
    } catch (e: any) {
      setEmailVerifyMsg(e.response?.data?.message || "Failed to send verification code.");
    } finally {
      setEmailVerifyLoading(false);
    }
  };

  const verifyEmailCode = async () => {
    setEmailVerifyLoading(true);
    setEmailVerifyMsg("");
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/verify-register-code`, {
        email: emailToVerify,
        code: emailVerifyCode
      });
      if (res.data.success) {
        setShowEmailVerify(false);
        setEmailVerified(true);
        setMessage("Email verified! You can now update your profile.");
        setMessageType("success");
      } else {
        setEmailVerifyMsg(res.data.message || "Verification failed.");
      }
    } catch (e: any) {
      setEmailVerifyMsg(e.response?.data?.message || "Verification failed.");
    } finally {
      setEmailVerifyLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordChangeInputs) => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/change-password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessage('Password changed successfully!');
        setMessageType('success');
        // Reset form using React Hook Form's reset method
        resetPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        // Also reset password visibility states
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      } else {
        setMessage(response.data.message || 'Failed to change password');
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to change password');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const onProfileSubmit = async (data: ProfileInputs) => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/update-profile`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessage('Profile updated successfully!');
        setMessageType('success');
      } else {
        setMessage(response.data.message || 'Failed to update profile');
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to update profile');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsHeader}>
        <h1 className={styles.pageTitle}>Settings</h1>
        <p className={styles.pageSubtitle}>Manage your account information and preferences</p>
      </div>

      <div className={styles.settingsContent}>
        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            Profile
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'security' ? styles.active : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={18} />
            Password
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className={styles.tabPanel}>
              <h2 className={styles.sectionTitle}>Profile Information</h2>
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className={styles.settingsForm}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <User size={18} />
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your first name"
                      {...registerProfile("first_name", { required: "First name is required" })}
                      className={`${styles.input} ${profileErrors.first_name ? styles.inputError : ''}`}
                    />
                    {profileErrors.first_name && <p className={styles.errorMessage}>{profileErrors.first_name.message}</p>}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <User size={18} />
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your last name"
                      {...registerProfile("last_name", { required: "Last name is required" })}
                      className={`${styles.input} ${profileErrors.last_name ? styles.inputError : ''}`}
                    />
                    {profileErrors.last_name && <p className={styles.errorMessage}>{profileErrors.last_name.message}</p>}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Mail size={18} />
                    Email Address
                  </label>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={pendingEmail || ""}
                        onChange={e => {
                          handleEmailChange(e);
                          // Enable verify button only if email is different from original
                          if (e.target.value !== emailToVerify) {
                            setShowEmailVerify(false);
                            setEmailVerifyMsg("");
                          }
                        }}
                        className={`${styles.input} ${profileErrors.email ? styles.inputError : ''}`}
                      />
                      {emailVerifyMsg && <p className={styles.errorMessage}>{emailVerifyMsg}</p>}
                      
                      <button
                        type="button"
                        className={styles.submitButton}
                        style={{ minWidth: 120 }}
                        disabled={
                          emailVerifyLoading ||
                          !pendingEmail ||
                          pendingEmail === emailToVerify // Disabled by default and when email matches original
                        }
                        onClick={sendEmailVerification}
                      >
                        {emailVerifyLoading ? "Sending..." : "Verify Email"}
                      </button>
                    

                  {profileErrors.email && <p className={styles.errorMessage}>{profileErrors.email.message}</p>}
                  
                </div>

                {/* Show code input if verifying */}
                {showEmailVerify && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Enter Verification Code</label>
                    <input
                      type="text"
                      value={emailVerifyCode}
                      onChange={e => setEmailVerifyCode(e.target.value)}
                      className={styles.input}
                      placeholder="Verification code"
                    />
                    <button
                      type="button"
                      className={styles.submitButton}
                      disabled={emailVerifyLoading || !emailVerifyCode}
                      onClick={verifyEmailCode}
                    >
                      {emailVerifyLoading ? "Verifying..." : "Submit Code"}
                    </button>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Globe size={18} />
                    Nationality
                  </label>
                  <select
                    {...registerProfile("nationality", { required: "Nationality is required" })}
                    className={`${styles.input} ${profileErrors.nationality ? styles.inputError : ''}`}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select your nationality
                    </option>
                    {Countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  {profileErrors.nationality && <p className={styles.errorMessage}>{profileErrors.nationality.message}</p>}
                </div>

                <button 
                  type="submit" 
                  className={`${styles.submitButton} ${isLoading ? styles.loading : ''}`}
                  disabled={
                    isLoading ||
                    (
                      // Only disable if email was changed and not verified
                      pendingEmail !== emailToVerify &&
                      !emailVerified
                    )
                  }
                >
                  <Save size={18} style={{ marginRight: "0.5rem" }}/>
                  Update Profile
                </button>

                {message && (
                  <div className={`${styles.message} ${styles[messageType]}`}>
                    {message}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className={styles.tabPanel}>
              <h2 className={styles.sectionTitle}>Change Password</h2>
              <form id="password-form" onSubmit={handlePasswordSubmit(onPasswordSubmit)} className={styles.settingsForm}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Lock size={18} />
                    Current Password
                  </label>
                  <div className={styles.passwordWrapper}>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter your current password"
                      {...registerPassword("currentPassword", { required: "Current password is required" })}
                      className={`${styles.input} ${passwordErrors.currentPassword ? styles.inputError : ''}`}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && <p className={styles.errorMessage}>{passwordErrors.currentPassword.message}</p>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Lock size={18} />
                    New Password
                  </label>
                  <div className={styles.passwordWrapper}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      {...registerPassword("newPassword", { 
                        required: "New password is required",
                        validate: {
                          requirements: value => {
                            const hasMinLength = value.length >= 8;
                            const hasLetter = /[a-zA-Z]/.test(value);
                            const hasNumber = /\d/.test(value);
                            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
                            
                            if (!hasMinLength || !hasLetter || !hasNumber || !hasSpecialChar) {
                              return "Password must be at least 8 characters long and contain at least one letter, one number, and one special character";
                            }
                            return true;
                          }
                        }
                      })}
                      className={`${styles.input} ${passwordErrors.newPassword ? styles.inputError : ''}`}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && <p className={styles.errorMessage}>{passwordErrors.newPassword.message}</p>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Lock size={18} />
                    Confirm New Password
                  </label>
                  <div className={styles.passwordWrapper}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      {...registerPassword("confirmPassword", { 
                        required: "Please confirm your password",
                        validate: value => value === watchNewPassword || "Passwords do not match"
                      })}
                      className={`${styles.input} ${passwordErrors.confirmPassword ? styles.inputError : ''}`}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && <p className={styles.errorMessage}>{passwordErrors.confirmPassword.message}</p>}
                </div>

                <button 
                  type="submit" 
                  className={`${styles.submitButton} ${isLoading ? styles.loading : ''}`}
                  disabled={isLoading}
                >
                  <Lock size={18} style={{ marginRight: "0.5rem" }}/>
                  Change Password
                </button>
                {message && (
                  <div className={`${styles.message} ${styles[messageType]}`}>
                    {message}
                  </div>
                )}
              </form>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default Settings;