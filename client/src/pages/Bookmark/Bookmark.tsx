/**
 * Bookmark Page
 *
 * This component displays and manages the user's bookmarked jobs.
 *
 * Features:
 * - Fetches and displays all jobs the user has bookmarked.
 * - Allows users to expand/collapse job details (responsibilities and requirements).
 * - Allows users to remove a job from their bookmarks.
 * - Provides an "Apply Now" button for each bookmarked job.
 * - Shows a friendly message if there are no bookmarked jobs.
 * - Handles loading state while fetching bookmarks.
 *
 * Usage:
 * - Used as a route page: `/bookmark`
 *
 * State:
 * - bookmarkedJobs: List of jobs the user has bookmarked.
 * - expandedJobIds: Set of job IDs currently expanded for details.
 * - loading: Indicates if bookmarks are being fetched.
 *
 * Dependencies:
 * - axios for HTTP requests.
 * - react-router-dom for navigation.
 * - lucide-react for icons.
 * - Bookmark.module.css for styling.
 *
 * @component
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ChevronDown, ChevronUp, Clock, MapPin, Briefcase, Users, BookmarkMinus, Bookmark as BookmarkIcon } from "lucide-react";
import styles from "./Bookmark.module.css";

// Type definition for a job object
type Job = {
  job_id: number;
  title: string;
  job_category: string;
  job_type: string;
  job_requirements: string;
  job_responsibilities: string;
};

const Bookmark: React.FC = () => {
  // State for all bookmarked jobs
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Job[]>([]);
  // State for expanded job IDs (for showing details)
  const [expandedJobIds, setExpandedJobIds] = useState<Set<string>>(new Set());
  // State for loading indicator
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch bookmarked jobs on mount
  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/bookmarks`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (res.data.success) {
          setBookmarkedJobs(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch bookmarks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  // Toggle expand/collapse for a job's details
  const toggleJobDetails = (id: string) => {
    setExpandedJobIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // Remove a job from bookmarks
  const removeBookmark = async (job_id: number) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/bookmarks`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        data: { job_id },
      });

      // Remove job from local state
      setBookmarkedJobs(prev => prev.filter(job => job.job_id !== job_id));
      setExpandedJobIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(job_id.toString());
        return newSet;
      });
    } catch (error) {
      console.error("Failed to remove bookmark:", error);
      alert("Failed to remove bookmark.");
    }
  };

  return (
    <div className={styles.bookmarkPage}>
      {loading ? (
        // Loading state - only background, no content
        <div className={styles.loadingContainer}>
          {/* Empty loading container, background only */}
        </div>
      ) : (
        // Content shows only after loading is complete
        <div className={styles.bookmarkContainer}>
          <div className={styles.pageHeader}>
            <h2>Saved Jobs</h2>
            <p className={styles.pageSubtitle}>Manage your bookmarked job opportunities</p>
          </div>

          {/* Show message if no bookmarked jobs */}
          {bookmarkedJobs.length === 0 ? (
            <div className={styles.noJobsCard}>
              <div className={styles.noJobsIcon}>
                <BookmarkIcon size={48} />
              </div>
              <h3>No Saved Jobs</h3>
              <p>You haven't bookmarked any jobs yet. Start exploring opportunities!</p>
            </div>
          ) : (
            <div className={styles.jobsGrid}>
              {bookmarkedJobs.map((job) => (
                <div key={job.job_id} className={styles.jobCard}>
                  {/* Job header: click to expand/collapse details */}
                  <div
                    className={styles.jobHeader}
                    onClick={() => toggleJobDetails(job.job_id.toString())}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") toggleJobDetails(job.job_id.toString());
                    }}
                    aria-expanded={expandedJobIds.has(job.job_id.toString())}
                  >
                    <div className={styles.jobMainInfo}>
                      <div className={styles.jobTitleSection}>
                        <h3 className={styles.jobTitle}>{job.title}</h3>
                        <div className={styles.jobMeta}>
                          <span className={styles.jobTypeBadge}>
                            <Clock size={12} />
                            {job.job_type}
                          </span>
                          <span className={styles.jobCategoryBadge}>
                            <MapPin size={12} />
                            {job.job_category === "lecturer" ? "Academic" : "Operations"}
                          </span>
                          <span className={`${styles.jobStatusBadge} ${styles.statusSaved}`}>
                            <BookmarkIcon size={12} />
                            Bookmarked
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions: Remove bookmark and Apply Now */}
                      <div className={styles.jobActions} onClick={(e) => e.stopPropagation()}>
                        <button
                          className={styles.removeBookmarkBtn}
                          onClick={() => removeBookmark(job.job_id)}
                          aria-label="Remove bookmark"
                        >
                          <BookmarkMinus size={16} />
                          Remove
                        </button>
                        <button
                          className={styles.applyBtn}
                          onClick={() => navigate("/apply")}
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                    
                    {/* Expand/collapse indicator */}
                    <div className={styles.expandIndicator}>
                      {expandedJobIds.has(job.job_id.toString()) ? 
                        <ChevronUp size={20} /> : 
                        <ChevronDown size={20} />
                      }
                    </div>
                  </div>

                  {/* Expanded job details */}
                  {expandedJobIds.has(job.job_id.toString()) && (
                    <div className={styles.jobDetails}>
                      <div className={styles.detailsSection}>
                        <h4 className={styles.sectionTitle}>
                          <Briefcase size={16} />
                          Job Responsibilities
                        </h4>
                        <div 
                          className={styles.sectionContent}
                          dangerouslySetInnerHTML={{ __html: job.job_responsibilities }} 
                        />
                      </div>

                      <div className={styles.detailsSection}>
                        <h4 className={styles.sectionTitle}>
                          <Users size={16} />
                          Job Requirements
                        </h4>
                        <div 
                          className={styles.sectionContent}
                          dangerouslySetInnerHTML={{ __html: job.job_requirements }} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Bookmark;