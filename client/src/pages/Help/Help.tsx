/**
 * Help Page
 *
 * This component provides a searchable and filterable FAQ/help center for users.
 *
 * Features:
 * - Displays a list of frequently asked questions (FAQs) grouped by category.
 * - Allows users to search FAQs by keyword.
 * - Allows filtering FAQs by category (jobs, account, general, or all).
 * - Expands/collapses answers for each FAQ.
 * - Provides contact information for further support.
 *
 * Usage:
 * - Used as a route page: `/help`
 *
 * State:
 * - expandedIndexes: Set of FAQ indexes currently expanded.
 * - searchTerm: Current search input value.
 * - selectedCategory: Currently selected FAQ category filter.
 *
 * Dependencies:
 * - lucide-react for icons.
 * - Help.module.css for styling.
 *
 * @component
 */

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle, Search, MessageCircle, Book, Mail, Phone } from "lucide-react";
import styles from "./Help.module.css";

// -------------------- Type Definitions --------------------

type FAQ = {
  question: string;
  answer: string;
  category: "general" | "jobs" | "account";
};

// -------------------- FAQ Data --------------------

const faqs: FAQ[] = [
  {
    question: "How do I apply for a job?",
    answer: "Navigate to the Available Jobs page, browse through the listings, and click on any job that interests you. You can expand the job card to view detailed responsibilities and requirements. When ready, click the 'Apply' button to submit your application.",
    category: "jobs"
  },
  {
    question: "How can I bookmark a job for later?",
    answer: "On the Available Jobs page, click the bookmark icon next to any job listing. This will save the job to your Bookmarks section where you can access it anytime. You can view all your saved jobs by navigating to the Bookmarks page.",
    category: "jobs"
  },
  {
    question: "Can I edit my application after submission?",
    answer: "Unfortunately, once an application is submitted, it cannot be modified. We recommend carefully reviewing all information before clicking the submit button. You can track your submitted applications on the Jobs Applied page. You can still change your profile information at any time by visiting your Profile page, but it will only affect future applications.",
    category: "jobs"
  },
  {
    question: "How do I track my job applications?",
    answer: "Visit the 'Jobs Applied' page to see all your submitted applications. Here you can view application status, interview dates, and expand each application to see the original job details including responsibilities and requirements.",
    category: "jobs"
  },
  {
    question: "How do I create an account?",
    answer: "Click on the 'Sign Up' button on the login page. Fill in your personal details, create a secure password, and verify your email address. Once verified, you can start browsing and applying for jobs immediately.",
    category: "account"
  },
  {
    question: "What should I do if I forget my password?",
    answer: "On the login page, click 'Forgot Password' and enter your email address. You'll receive a password reset link via email. Follow the instructions in the email to create a new password and regain access to your account.",
    category: "account"
  },
  {
    question: "How do I update my profile information?",
    answer: "Navigate to your profile page where you can update your personal information, contact details, and preferences. Make sure to save your changes before leaving the page.",
    category: "account"
  },
  {
    question: "Is my personal information secure?",
    answer: "Yes, we take data security seriously. All personal information is encrypted and stored securely. We follow industry best practices and comply with data protection regulations to ensure your privacy.",
    category: "general"
  },
  {
    question: "Can I apply for multiple jobs at once?",
    answer: "Yes, you can apply for as many jobs as you'd like. Each application is tracked separately on your Jobs Applied page. We recommend tailoring your application for each specific role when possible.",
    category: "jobs"
  },
  {
    question: "How will I know if my application was received?",
    answer: "All the applied jobs will appear on the Jobs Applied page. You can check the status of all your applications, which shows current status and any scheduled interviews.",
    category: "general"
  }
];

// -------------------- Main Component --------------------

const Help: React.FC = () => {
  // State for expanded FAQ indexes
  const [expandedIndexes, setExpandedIndexes] = useState<Set<number>>(new Set());
  // State for search input
  const [searchTerm, setSearchTerm] = useState("");
  // State for selected category filter
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  /**
   * Toggle the expanded/collapsed state of an FAQ item.
   */
  const toggleFAQ = (index: number) => {
    setExpandedIndexes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  /**
   * Filter FAQs by search term and selected category.
   */
  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  /**
   * Get the icon for a given FAQ category.
   */
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "jobs": return <Book size={16} />;
      case "account": return <MessageCircle size={16} />;
      case "general": return <HelpCircle size={16} />;
      default: return <HelpCircle size={16} />;
    }
  };

  /**
   * Get the color class for a given FAQ category.
   */
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "jobs": return styles.categoryJobs;
      case "account": return styles.categoryAccount;
      case "general": return styles.categoryGeneral;
      default: return styles.categoryGeneral;
    }
  };

  // -------------------- JSX Rendering --------------------

  return (
    <div className={styles.helpPage}>
      {/* Header */}
      <div className={styles.helpHeader}>
        <div className={styles.headerTitle}>
          <HelpCircle size={40} />
          <h1>Help Center</h1>
        </div>
      </div>

      <div className={styles.helpContainer}>
        {/* Search Bar */}
        <div className={styles.searchSection}>
          <div className={styles.searchBar}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* FAQ Section */}
        <div className={styles.faqSection}>
          <div className={styles.sectionHeader}>
            <h2>Frequently Asked Questions</h2>
            <p>{filteredFAQs.length} questions found</p>
          </div>

          {/* Category Filters */}
          <div className={styles.categoryFilters}>
            <button
              className={`${styles.filterBtn} ${selectedCategory === "all" ? styles.active : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              All Topics
            </button>
            <button
              className={`${styles.filterBtn} ${selectedCategory === "jobs" ? styles.active : ""}`}
              onClick={() => setSelectedCategory("jobs")}
            >
              <Book size={16} />
              Jobs
            </button>
            <button
              className={`${styles.filterBtn} ${selectedCategory === "account" ? styles.active : ""}`}
              onClick={() => setSelectedCategory("account")}
            >
              <MessageCircle size={16} />
              Account
            </button>
            <button
              className={`${styles.filterBtn} ${selectedCategory === "general" ? styles.active : ""}`}
              onClick={() => setSelectedCategory("general")}
            >
              <HelpCircle size={16} />
              General
            </button>
          </div>

          {/* FAQ List */}
          {filteredFAQs.length === 0 ? (
            <div className={styles.noResults}>
              <div className={styles.noResultsIcon}>
                <Search size={48} />
              </div>
              <h3>No results found</h3>
              <p>Try adjusting your search or browse different categories</p>
            </div>
          ) : (
            <div className={styles.faqContainer}>
              {filteredFAQs.map((faq) => {
                const originalIndex = faqs.indexOf(faq);
                return (
                  <div
                    key={originalIndex}
                    className={`${styles.faqItem} ${expandedIndexes.has(originalIndex) ? styles.expanded : ""}`}
                    onClick={() => toggleFAQ(originalIndex)}
                  >
                    <div className={styles.faqHeader}>
                      <div className={styles.faqQuestionSection}>
                        <div className={`${styles.categoryBadge} ${getCategoryColor(faq.category)}`}>
                          {getCategoryIcon(faq.category)}
                          {faq.category}
                        </div>
                        <div className={styles.faqQuestion}>{faq.question}</div>
                      </div>
                      <div className={styles.expandIcon}>
                        {expandedIndexes.has(originalIndex) ? 
                          <ChevronUp size={20} /> : 
                          <ChevronDown size={20} />
                        }
                      </div>
                    </div>
                    {expandedIndexes.has(originalIndex) && (
                      <div className={styles.faqAnswer}>{faq.answer}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className={styles.contactSection}>
          <div className={styles.contactCard}>
            <h3>Still need help?</h3>
            <p>Can't find what you're looking for? Get in touch with our support team.</p>
            <div className={styles.contactOptions}>
              <div className={styles.contactOption}>
                <Mail size={20} />
                <div>
                  <span className={styles.contactLabel}>Email Support</span>
                  <span className={styles.contactValue}>helpdesk@eaim.edu.sg</span>
                </div>
              </div>
              <div className={styles.contactOption}>
                <Phone size={20} />
                <div>
                  <span className={styles.contactLabel}>Phone Support</span>
                  <span className={styles.contactValue}>6252 5500</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;