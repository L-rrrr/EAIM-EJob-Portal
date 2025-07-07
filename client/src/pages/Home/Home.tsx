import { useNavigate } from "react-router-dom";
import { User, Briefcase, ArrowRight, Info, Target } from "lucide-react";
import styles from "./Home.module.css";

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.homeContent}>
      <div className={styles.homeContainer}>

        {/* Dashboard Cards Grid */}
        <div className={styles.dashboardGrid}>
          <div className={`${styles.dashboardCard} ${styles.profileCard}`} onClick={() => navigate("/profile")}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <User size={24} />
              </div>
              <div className={styles.cardTitleSection}>
                <h3 className={styles.cardTitle}>Profile Status</h3>
                <span className={styles.cardSubtitle}>Update your information</span>
              </div>
              <div className={styles.cardAction}>
                <ArrowRight size={20} />
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.metricDisplay}>
                <span className={styles.metricValue}>0%</span>
                <span className={styles.metricLabel}>Overall completeness</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>

          <div className={`${styles.dashboardCard} ${styles.jobsCard}`} onClick={() => navigate("/jobs-applied")}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <Briefcase size={24} />
              </div>
              <div className={styles.cardTitleSection}>
                <h3 className={styles.cardTitle}>Jobs Applied</h3>
                <span className={styles.cardSubtitle}>Track your applications</span>
              </div>
              <div className={styles.cardAction}>
                <ArrowRight size={20} />
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.metricDisplay}>
                <span className={styles.metricValue}>2</span>
                <span className={styles.metricLabel}>Number of Jobs Applied</span>
              </div>
              <div className={styles.statusBadge}>
                <Target size={16} />
                Active Applications
              </div>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <div className={styles.infoHeader}>
              <Info size={24} className={styles.infoIcon} />
              <h3 className={styles.infoTitle}>Important Information</h3>
            </div>
            <div className={styles.infoContent}>
              <div className={styles.infoItem}>
                <div className={styles.infoNumber}>1</div>
                <p>Your Profile Status is incomplete. Please complete your profile before you apply for any job.</p>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoNumber}>2</div>
                <p>There are <strong>14 jobs</strong> available now.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className={styles.ctaSection}>
          <button className={styles.applyNowButton} onClick={() => navigate("/available-jobs")}>
            <Briefcase size={20} />
            Apply Now
            <ArrowRight size={20} />
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default Home;