import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  User, 
  Bell, 
  Save,
  Shield,
  Globe
} from 'lucide-react';
import styles from './Settings.module.css';

type PasswordChangeInputs = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ProfileInputs = {
  firstName: string;
  lastName: string;
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
        setValue('firstName', userData.firstName);
        setValue('lastName', userData.lastName);
        setValue('email', userData.email);
        setValue('nationality', userData.nationality);
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
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

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveNotificationSettings = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/notification-settings`, notifications, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Notification settings saved!');
      setMessageType('success');
    } catch (error) {
      setMessage('Failed to save notification settings');
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
          <button 
            className={`${styles.tabButton} ${activeTab === 'notifications' ? styles.active : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={18} />
            Notifications
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
                      {...registerProfile("firstName", { required: "First name is required" })}
                      className={`${styles.input} ${profileErrors.firstName ? styles.inputError : ''}`}
                    />
                    {profileErrors.firstName && <p className={styles.errorMessage}>{profileErrors.firstName.message}</p>}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <User size={18} />
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your last name"
                      {...registerProfile("lastName", { required: "Last name is required" })}
                      className={`${styles.input} ${profileErrors.lastName ? styles.inputError : ''}`}
                    />
                    {profileErrors.lastName && <p className={styles.errorMessage}>{profileErrors.lastName.message}</p>}
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
                    {...registerProfile("email", { 
                      required: "Email is required",
                      pattern: {
                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: "Please enter a valid email address"
                      }
                    })}
                    className={`${styles.input} ${profileErrors.email ? styles.inputError : ''}`}
                  />
                  {profileErrors.email && <p className={styles.errorMessage}>{profileErrors.email.message}</p>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Globe size={18} />
                    Nationality
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your nationality"
                    {...registerProfile("nationality", { required: "Nationality is required" })}
                    className={`${styles.input} ${profileErrors.nationality ? styles.inputError : ''}`}
                  />
                  {profileErrors.nationality && <p className={styles.errorMessage}>{profileErrors.nationality.message}</p>}
                </div>

                <button 
                  type="submit" 
                  className={`${styles.submitButton} ${isLoading ? styles.loading : ''}`}
                  disabled={isLoading}
                >
                  <Save size={18} />
                  Update Profile
                </button>
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
                  <Lock size={18} />
                  Change Password
                </button>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className={styles.tabPanel}>
              <h2 className={styles.sectionTitle}>Notification Preferences</h2>
              <div className={styles.notificationSettings}>
                <div className={styles.notificationItem}>
                  <div className={styles.notificationInfo}>
                    <h3>Email Notifications</h3>
                    <p>Receive general email notifications</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.notificationItem}>
                  <div className={styles.notificationInfo}>
                    <h3>Job Alerts</h3>
                    <p>Get notified about new job postings</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notifications.jobAlerts}
                      onChange={(e) => handleNotificationChange('jobAlerts', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.notificationItem}>
                  <div className={styles.notificationInfo}>
                    <h3>Application Updates</h3>
                    <p>Receive updates on your job applications</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notifications.applicationUpdates}
                      onChange={(e) => handleNotificationChange('applicationUpdates', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>



                <button 
                  onClick={saveNotificationSettings}
                  className={`${styles.submitButton} ${isLoading ? styles.loading : ''}`}
                  disabled={isLoading}
                >
                  <Save size={18} />
                  Save Notification Settings
                </button>
              </div>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className={`${styles.message} ${styles[messageType]}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;