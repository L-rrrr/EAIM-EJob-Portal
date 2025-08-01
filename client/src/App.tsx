import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";

import Login from "./pages/Authentication/Login/Login";
import Register from "./pages/Authentication/Register/Register";
import ForgotPassword from "./pages/Authentication/ForgotPassword/ForgotPassword";
import AvailableJobs from "./pages/AvailableJobs/AvailableJobs";
import JobsApplied from "./pages/JobsApplied/JobsApplied";
import Bookmark from "./pages/Bookmark/Bookmark";
import Help from "./pages/Help/Help";
import MainLayout from "./pages/MainLayout";
import Home from "./pages/Home/Home";
import ProfileLayout from "./pages/ProfileLayout";
import Education from "./pages/Education/Education";
import PersonalParticulars from "./pages/PersonalParticulars/PersonalParticulars";
import Experience from "./pages/Work/Work";
import Family from "./pages/Family/Family";
import Support from "./pages/Support/Support";
import Apply from "./pages/Apply/Apply";

import HRLayout from "./HRpages/HRLayout";
import Dashboard from "./HRpages/Dashboard/Dashboard";

import HRAvailableJobs from "./HRpages/HRAvailableJobs.tsx/HRAvailableJobs";
import Applicants from "./HRpages/Applicants/Applicants";
import HRProfileLayout from "./HRpages/HRProfileLayout";
import ApplicantPersonalParticulars from "./HRpages/ApplicantPersonalParticulars/ApplicantPersonalParticulars";
import ApplicantEducation from "./HRpages/ApplicantEducation/ApplicantEducation";
import ApplicantExperience from "./HRpages/ApplicantWork/ApplicantWork";
import ApplicantFamily from "./HRpages/ApplicantFamily/ApplicantFamily";
import ApplicantSupport from "./HRpages/ApplicantSupport/ApplicantSupport";
import PostJob from "./HRpages/PostJob/PostJob";
import Interview from "./HRpages/Interview/Interview";
import ManagerAvailableJobs from "./ManagerPages/ManagerAvailableJobs.tsx/ManagerAvailableJobs";
import ManagerLayout from "./ManagerPages/ManagerLayout";
import JobRequisition from "./ManagerPages/JobRequisition/JobRequisition";
import Settings from "./pages/Settings/Settings";
import Assessment from "./ManagerPages/Assessment/Assessment";
import ProtectedRoute from "./components/ProtectedRoute";
import ResetPassword from "./pages/Authentication/ResetPassword/ResetPassword";
import HRApply from "./HRpages/HRApply/HRApply";

// ------------------------ App Routes ------------------------

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Applicant routes */}
      <Route element={<ProtectedRoute allowedRoles={["Applicant"]} />}>
        <Route path="/" element={<MainLayout />}>
          <Route path="home" element={<Home />} />
          <Route path="available-jobs" element={<AvailableJobs />} />
          <Route path="jobs-applied" element={<JobsApplied />} />
          <Route path="bookmark" element={<Bookmark />} />
          <Route path="help" element={<Help />} />
          <Route path="settings" element={<Settings />} />
          <Route path="apply" element={<Apply />} />

          <Route path="profile" element={<ProfileLayout />}>
            <Route path="personal-particulars" element={<PersonalParticulars />} />
            <Route path="education" element={<Education />} />
            <Route path="work" element={<Experience />} />
            <Route path="family" element={<Family />} />
            <Route path="support" element={<Support />} />
          </Route>
        </Route>
      </Route>

      {/* HR routes */}
      <Route element={<ProtectedRoute allowedRoles={["HR"]} />}>
        <Route path="/hr" element={<HRLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="available-jobs" element={<HRAvailableJobs />} />
          <Route path="applicants" element={<Applicants />} />
          <Route path="applicant-details" element={<HRProfileLayout />}>
            <Route path="overview" element={<HRApply />} />
            <Route path="personal-particulars" element={<ApplicantPersonalParticulars />} />
            <Route path="education" element={<ApplicantEducation />} />
            <Route path="work" element={<ApplicantExperience />} />
            <Route path="family" element={<ApplicantFamily />} />
            <Route path="support" element={<ApplicantSupport />} />
          </Route>
          <Route path="post-job" element={<PostJob />} />
          <Route path="interview" element={<Interview />} />
          {/* <Route path="application-form" element={<Apply />} /> */}
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["Manager"]} />}>
        <Route path="/manager" element={<ManagerLayout />}>
          <Route path="available-jobs" element={<ManagerAvailableJobs />} />
          <Route path="new-job" element={<JobRequisition />} />
          <Route path="assessment" element={<Assessment />} />
        </Route>
      </Route>
    </Routes>
  );
};

// ------------------------ Theme Initialization ------------------------

const ThemeInitializer = () => {
  useEffect(() => {
    // Initialize dark mode from localStorage or system preference
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      const isDark = JSON.parse(savedTheme);
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
      localStorage.setItem('darkMode', JSON.stringify(prefersDark));
    }
  }, []);

  return null;
};

// ------------------------ App Component ------------------------

const App: React.FC = () => {
  return (
    <Router>
      <ThemeInitializer />
        <div style={{ width: '100vw', minHeight: '100vh' }}>
          <AppRoutes />
        </div>
    </Router>
  );
};

export default App;