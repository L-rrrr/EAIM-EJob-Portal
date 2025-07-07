import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import styles from "./Dashboard.module.css";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Users, BarChart3 } from "lucide-react";
import axios from "axios";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  type Job = {
    title: string;
    job_type: string;
    posting_date: string;
    seekers_required: number;
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/jobs`);
        if (res.data.success) {
          setJobs(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      }
    };

    fetchJobs();
  }, []);

  // Chart data
  const nationalityData = [
    { name: "Singaporean", value: 45, color: "#B3238B" },
    { name: "Malaysian", value: 30, color: "#7c3aed" },
    { name: "Indian", value: 15, color: "#3b82f6" },
    { name: "Others", value: 10, color: "#10b981" },
  ];

  const statusData = [
    { name: "Pending Review", value: 3, color: "#f59e0b" },
    { name: "Shortlisted", value: 1, color: "#10b981" },
    { name: "Rejected", value: 1, color: "#ef4444" },
    { name: "Accepted", value: 1, color: "#059669" },
  ];

  const applicantsData = [
    { name: "Tan Wei Ling", job: "Admin Assistant", date: "2025-06-14", status: "Pending Review" },
    { name: "Ali bin Salleh", job: "Preschool Teacher", date: "2025-06-15", status: "Interview Scheduled" },
    { name: "Lim Hui Yi", job: "Operations Executive", date: "2025-06-13", status: "Shortlisted" },
    { name: "Siti Nur Aisyah", job: "Cleaner", date: "2025-06-12", status: "Pending Review" },
    { name: "Rajesh Kumar", job: "ICT Support Officer", date: "2025-06-11", status: "Rejected" },
    { name: "Chua Min Jie", job: "Exam Coordinator", date: "2025-06-14", status: "Pending Review" },
    { name: "Ng Wei Ting", job: "Finance Officer", date: "2025-06-13", status: "Shortlisted" },
    { name: "Ahmad Zaki", job: "Security Officer", date: "2025-06-14", status: "Pending Review" },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div className={styles.dashboardContainer}>

        {/* Stats Cards Grid */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statsCard} ${styles.totalJobsCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <BarChart3 size={24} />
              </div>
              <div className={styles.cardTitleSection}>
                <h3 className={styles.cardTitle}>Total Jobs</h3>
                <span className={styles.cardSubtitle}>Available positions</span>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.metricDisplay}>
                <span className={styles.metricValue}>{jobs.length}</span>
                <span className={styles.metricLabel}>Active job postings</span>
              </div>
            </div>
          </div>

          <div className={`${styles.statsCard} ${styles.applicantsCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <Users size={24} />
              </div>
              <div className={styles.cardTitleSection}>
                <h3 className={styles.cardTitle}>Total Applicants</h3>
                <span className={styles.cardSubtitle}>Current applications</span>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.metricDisplay}>
                <span className={styles.metricValue}>{applicantsData.length}</span>
                <span className={styles.metricLabel}>Active applicants</span>
              </div>
            </div>
          </div>

        </div>

        {/* Main Content Grid */}
        <div className={styles.mainGrid}>
          
          {/* Charts Section - Now full width */}
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>Applicants by Nationality</h3>
              </div>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={nationalityData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120} // Increased from 80
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {nationalityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>Application Status</h3>
              </div>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120} // Increased from 80
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tables Section - Now in a grid layout for side by side */}
          <div className={styles.tablesGrid}>
            {/* Jobs Table */}
            <div className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <h3 className={styles.tableTitle}>Available Jobs</h3>
                <button className={styles.viewDetailsBtn} onClick={() => navigate("/hr/available-jobs")}>
                  View Details
                  <ArrowRight size={16} />
                </button>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Job Title</th>
                      <th>Job Type</th>
                      <th>Date Posted</th>
                      <th>Positions</th>
                      <th>Applicants</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.slice(0, 5).map((job, index) => (
                      <tr key={index}>
                        <td>{job.title}</td>
                        <td>{job.job_type}</td>
                        <td>{job.posting_date?.slice(0, 10)}</td>
                        <td>{job.seekers_required}</td>
                        <td>0</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Applicants Table - Now wider */}
            <div className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <h3 className={styles.tableTitle}>Recent Applicants</h3>
                <button className={styles.viewDetailsBtn} onClick={() => navigate("/hr/applicants")}>
                  View All
                  <ArrowRight size={16} />
                </button>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Position</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicantsData.slice(0, 6).map((applicant, index) => (
                      <tr key={index}>
                        <td>{applicant.name}</td>
                        <td>{applicant.job}</td>
                        <td>{applicant.date}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[applicant.status.toLowerCase().replace(/\s+/g, '')]}`}>
                            {applicant.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;