import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import styles from "./Dashboard.module.css";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Users, BarChart3 } from "lucide-react";
import axios from "axios";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicantsData, setApplicantsData] = useState<any[]>([]);
  const [nationalityData, setNationalityData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[]>([]);

  const nationalityColors = [
    "#B3238B", "#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#059669", "#6366f1", "#f472b6", "#f87171"
  ];

    const statusColors = [
      "#f59e0b", // Pending
      "#10b981", // Interview Scheduled
      "#3b82f6", // Reviewing
      "#ef4444", // Rejected
      "#059669", // Accepted
    ];


  type Job = {
    title: string;
    job_type: string;
    posting_date: string;
    seekers_required: number;
    applicants_now?: number;
  };

  useEffect(() => {
    const fetchNationalityStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/applicant-nationality-stats`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (res.data.success) {
          // Map to chart data format
          const chartData = res.data.data.map((row: any, idx: number) => ({
            name: row.nationality,
            value: row.count,
            color: nationalityColors[idx % nationalityColors.length]
          }));
          setNationalityData(chartData);
        }
      } catch (error) {
        console.error("Error fetching nationality stats:", error);
      }
    };
    fetchNationalityStats();
  }, []);

  useEffect(() => {
    const fetchStatusStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/application-status-stats`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (res.data.success) {
          // Map to chart data format
          const chartData = res.data.data.map((row: any, idx: number) => ({
            name: row.application_status,
            value: row.count,
            color: statusColors[idx % statusColors.length]
          }));
          setStatusData(chartData);
        }
      } catch (error) {
        console.error("Error fetching application status stats:", error);
      }
    };
    fetchStatusStats();
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/jobs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setJobs(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/applicants`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (res.data.success) {
          // Sort by date descending (most recent first)
          const sorted = [...res.data.data].sort((a, b) => new Date(b.applied).getTime() - new Date(a.applied).getTime());
          setApplicantsData(sorted);
        }
      } catch (error) {
        console.error("Error fetching applicants:", error);
      }
    };
    fetchApplicants();
  }, []);

  // Helper function to format date to dd-mm-yyyy
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  };

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
                <span className={styles.metricLabel}>Job postings</span>
              </div>
            </div>
          </div>

          <div className={`${styles.statsCard} ${styles.totalApplicantsCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <Users size={24} />
              </div>
              <div className={styles.cardTitleSection}>
                <h3 className={styles.cardTitle}>Total Applicants</h3>
                <span className={styles.cardSubtitle}>Unique applicants applied</span>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.metricDisplay}>
                <span className={styles.metricValue}>
                  {
                    // Count unique applicants by name (or use applicant_id if available)
                    Array.from(new Set(applicantsData.map(a => a.user_id))).length
                  }
                </span>
                <span className={styles.metricLabel}>Applicants</span>
              </div>
            </div>
          </div>

          <div className={`${styles.statsCard} ${styles.applicantsCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <Users size={24} />
              </div>
              <div className={styles.cardTitleSection}>
                <h3 className={styles.cardTitle}>Total Applications</h3>
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
                      outerRadius={120}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
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
                      outerRadius={120}
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
                        <td>{formatDate(job.posting_date)}</td>
                        <td>{job.seekers_required}</td>
                        <td>{job.applicants_now || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Applicants Table - Now wider */}
            <div className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <h3 className={styles.tableTitle}>Recent Applications</h3>
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
                      <th>Applied Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicantsData.slice(0, 6).map((applicant, index) => (
                      <tr key={index}>
                        <td>{applicant.name}</td>
                        <td>{applicant.job}</td>
                        <td>{applicant.applied || "-"}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[applicant.status?.toLowerCase().replace(/\s+/g, '')]}`}>
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