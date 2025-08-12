import { useState, useEffect } from "react";
import styles from "./Applicants.module.css";
import { Link } from "react-router-dom";
import axios from "axios";
import { Eye, Mail, Printer } from "lucide-react"; 
import TiptapEditor from "../../components/TiptapEditor/TiptapEditor";
import jsPDF from "jspdf";
import {
  personalParticularsFields,
  sgAddressFields,
  overseasAddressFields,
  militaryServiceFields,
  educationBackgroundFields,
  scholarshipAwardsFields,
  otherQualificationsFields,
  workExperienceFields,
  teachingExperienceFields,
  skillsFields,
  languagesFields,
  familyBackgroundFields,
  emergencyContactFields,
  referencesFields
} from "../../utils/FormFields";

const Applicants = () => {
  const [search, setSearch] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [interviewFrom, setInterviewFrom] = useState("");
  const [interviewTo, setInterviewTo] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [analysisLevel, setAnalysisLevel] = useState("Basic");
  const [assessmentOverlay, setAssessmentOverlay] = useState<{ open: boolean, assessment: any | null }>({ open: false, assessment: null });

  type Manager = {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    display_name: string; // Added to match usage in code
    emp_no?: number; // Optional, since it's used as key in the select
    // add other fields if needed
  };
  const [managers, setManagers] = useState<Manager[]>([]);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailTargetUserId, setEmailTargetUserId] = useState<number | null>(null);
  const [emailStatus, setEmailStatus] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Filter panel collapse state
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  // Replace mockData with dynamic data from database
  const [applicantsData, setApplicantsData] = useState<any[]>([]);
  const [filteredApplicants, setFilteredApplicants] = useState<any[]>([]);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // AI Analysis state
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const questionList = [
    { key: "q1", label: "Education & Training", desc: "(Sufficient education, grades of relevant subjects, appropriate qualifications for the job)" },
    { key: "q2", label: "Work/ Relevant Experience", desc: "(Technical/Supervisor/ Administrative experience)" },
    { key: "q3", label: "Proven Producer Role", desc: "(Past key successes -projects & $ amount or total annual revenue achieved)" },
    { key: "q4", label: "Appearance", desc: "(Neat, pleasant, smart, sloppy, sickly, robust)" },
    { key: "q5", label: "Personality", desc: "(Cheerful, sociable, likeable, assertive, sense of humour, confident, outgoing, polite, shy, unresponsive)" },
    { key: "q6", label: "Attitude/ Team Player", desc: "" },
    { key: "q7", label: "Character/ Temperament", desc: "(Sincere, trustworthy, disciplined, responsible, emotionally mature, independent, passive, weak, indecisive)" },
    { key: "q8", label: "Ability To Communicate", desc: "(Coherent, persuasive, able to listen, fluent, long-winded)" },
    { key: "q9", label: "Motivation", desc: "(Reason for application enthusiastic, conscientious, indifferent)" },
    { key: "q10", label: "Mental Alertness", desc: "(Intelligent, sharp, logical reasoning, sound judgment, well-informed, naive, slow)" },
    { key: "q11", label: "Leadership Qualities", desc: "(Sufficient education, grades of relevant subjects, appropriate qualifications for the job)" },
    { key: "q12", label: "Job Stability", desc: "(Steady employment record, job-hopper)" }
  ];

  // Helper to fetch full details for an applicant
  async function fetchFullDetails(applicationId: number) {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/application-full-details?applicationId=${applicationId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    if (!data.success) throw new Error("Failed to fetch application details");
    return data.data;
  }

  function checkPageBreak(doc: jsPDF, y: number, minSpace: number = 60) {
    const topMargin = 40;
    const bottomMargin = 40; // Set your desired bottom margin here
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + minSpace > pageHeight - bottomMargin) {
      doc.addPage();
      return topMargin; // Reset y to top margin for new page
    }
    return y;
  }

  
  async function handlePrintApplicationForm(applicationId: number) {
    try {
      const details = await fetchFullDetails(applicationId);

      // Fetch job title using job_id
        let jobTitle = "Unknown Position";
      if (details.job_id) {
        try {
          const token = localStorage.getItem("token");
          const jobRes = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/jobs/${details.job_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const jobData = await jobRes.json();
          if (jobData.success && jobData.data && jobData.data.title) {
            jobTitle = jobData.data.title;
          }
        } catch {
          jobTitle = "Unknown Position";
        }
      }
  
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      let y = 40;
  
      // Header
      doc.setFontSize(18);
      doc.setFillColor(180, 180, 180);
      // Draw header border
      doc.setDrawColor(100);
      doc.rect(40, y, 520, 24); // Border for header
      doc.setFillColor(180, 180, 180);
      doc.rect(40, y, 520, 24, "F"); // Fill header background
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("PERSONAL PARTICULARS", 45, y + 17);
      y += 24;
  
      // Multi-column layout settings
      const startX = 40;
      const rowHeight = 40;
      // Custom column widths for each row
      const rows = [
        // Row 1: Full Name (wider), Alias, Gender, Age
        [
          { width: 220, name: "full_name" },
          { width: 90, name: "alias" },
          { width: 100, name: "gender" },
          { width: 110, name: "status_in_sg" }

        ],
        // Row 2: Email Address (wider), Nationality, Race, Marital Status
        [
          { width: 220, name: "email" },
          { width: 90, name: "nationality" },
          { width: 100, name: "race" },
          { width: 110, name: "marital_status" }
        ],
        // Row 3: NRIC, Country of Birth, Religion, Dialect
        [
          { width: 130, name: "nric" },
          { width: 130, name: "country_of_birth" },
          { width: 130, name: "religion" },
          { width: 130, name: "dialect" }
        ],
        // Row 4: Date of Birth, Passport No., Passport Expiry
        [
          { width: 180, name: "date_of_birth" },
          { width: 160, name: "passport_no" },
          { width: 180, name: "passport_expiry" },
        ]
      ];
  
      // Map field names to labels for easy lookup
      const labelMap = Object.fromEntries(
        personalParticularsFields.map(f => [f.name, f.label])
      );

      // Parse personal particulars from details
      let personalParticulars: Record<string, any> = {};
      if (details.personal_particulars) {
        try {
          personalParticulars = JSON.parse(details.personal_particulars);
        } catch {
          personalParticulars = {};
        }
      }
  
      rows.forEach(row => {
        let x = startX;
        let cellHeights: number[] = [];
        let formattedAnswers: string[] = [];
      
        // First, measure each cell's content height and format answer
        row.forEach(cell => {
          let answer = personalParticulars[cell.name] || "";
          if (
            cell.name === "date_of_birth" ||
            cell.name === "passport_expiry"
          ) {
            // Format yyyy-mm-dd to dd-mm-yyyy
            const match = answer.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
              answer = `${match[3]}-${match[2]}-${match[1]}`;
            }
          }
          formattedAnswers.push(answer);
      
          // Measure label height
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(labelMap[cell.name] || cell.name, cell.width - 10);
          const labelHeight = labelLines.length * 12;
      
          // Measure answer height
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(answer, cell.width - 10);
          const answerHeight = answerLines.length * 14;
      
          // Total cell height needed
          cellHeights.push(labelHeight + answerHeight + 8); // +8 for padding
        });
      
        // Use the tallest cell for the row height
        const dynamicRowHeight = Math.max(...cellHeights, rowHeight);
      
        // Draw cells
        x = startX;
        row.forEach((cell, idx) => {
          doc.setDrawColor(100);
          doc.rect(x, y, cell.width, dynamicRowHeight);
      
          // Draw label
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(labelMap[cell.name] || cell.name, cell.width - 10);
          doc.text(labelLines, x + 5, y + 13);
      
          // Draw answer (use formattedAnswers)
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(formattedAnswers[idx], cell.width - 10);
          doc.text(answerLines, x + 5, y + 13 + labelLines.length * 12 + 5);
      
          x += cell.width;
        });
      y += dynamicRowHeight;
      });

      // --- Application Information ---
      let applicationInfo: Record<string, any> = {};
      if (details.apply_info) {
        try {
          applicationInfo = JSON.parse(details.apply_info);
        } catch {
          applicationInfo = {};
        }
      }
      
      // Get job title from details.job_title (joined from tbl_jobs), fallback to job_id if needed

      // Print APPLICATION INFORMATION section
      y = checkPageBreak(doc, y, 24);
      doc.setFontSize(18);
      doc.setFillColor(180, 180, 180);
      doc.setDrawColor(100);
      doc.rect(40, y, 520, 24);
      doc.setFillColor(180, 180, 180);
      doc.rect(40, y, 520, 24, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("APPLICATION INFORMATION", 45, y + 17);
      y += 24;
      
      // Split into two rows
      const appFieldsRow1 = [
        { label: "Job Title", name: "job_title" },
        { label: "Current Salary ($)", name: "currentSalary" },
        { label: "Expected Salary ($)", name: "expectedSalary" },
        { label: "Earliest Starting Date", name: "earliestStartingDate" }
      ];
      const colWidthsRow1 = [160, 120, 120, 120]; // total 520
      
      const appFieldsRow2 = [
        { label: "Source Obtained From", name: "sourceObtainedFrom" },
        { label: "Total Work Experience (years)", name: "totalWorkExperience" },
        { label: "Relevant Work Experience (years)", name: "relevantWorkExperience" }
      ];
      const colWidthsRow2 = [160, 180, 180]; // total 480

      // Row 1
      let formattedAnswersRow1: string[] = appFieldsRow1.map(field => {
        if (field.name === "job_title") return jobTitle;
        return applicationInfo[field.name] || "";
      });
      let cellHeightsRow1: number[] = [];
      appFieldsRow1.forEach((field, i) => {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        const labelLines = doc.splitTextToSize(field.label, colWidthsRow1[i] - 10);
        const labelHeight = labelLines.length * 12;
      
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const answerLines = doc.splitTextToSize(formattedAnswersRow1[i], colWidthsRow1[i] - 10);
        const answerHeight = answerLines.length * 14;
      
        cellHeightsRow1.push(labelHeight + answerHeight + 8);
      });
      const dynamicRowHeight1 = Math.max(...cellHeightsRow1, 40);
      y = checkPageBreak(doc, y, dynamicRowHeight1);
      
      let x = 40;
      appFieldsRow1.forEach((field, i) => {
        doc.setDrawColor(100);
        doc.rect(x, y, colWidthsRow1[i], dynamicRowHeight1);
      
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        const labelLines = doc.splitTextToSize(field.label, colWidthsRow1[i] - 10);
        doc.text(labelLines, x + 5, y + 13);
      
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const answerLines = doc.splitTextToSize(formattedAnswersRow1[i], colWidthsRow1[i] - 10);
        doc.text(answerLines, x + 5, y + 13 + labelLines.length * 12 + 5);
      
        x += colWidthsRow1[i];
      });
      y += dynamicRowHeight1;
      
      // Row 2
      let formattedAnswersRow2: string[] = appFieldsRow2.map(field => applicationInfo[field.name] || "");
      let cellHeightsRow2: number[] = [];
      appFieldsRow2.forEach((field, i) => {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        const labelLines = doc.splitTextToSize(field.label, colWidthsRow2[i] - 10);
        const labelHeight = labelLines.length * 12;
      
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const answerLines = doc.splitTextToSize(formattedAnswersRow2[i], colWidthsRow2[i] - 10);
        const answerHeight = answerLines.length * 14;
      
        cellHeightsRow2.push(labelHeight + answerHeight + 8);
      });
      const dynamicRowHeight2 = Math.max(...cellHeightsRow2, 40);
      y = checkPageBreak(doc, y, dynamicRowHeight2);
      
      x = 40;
      appFieldsRow2.forEach((field, i) => {
        doc.setDrawColor(100);
        doc.rect(x, y, colWidthsRow2[i], dynamicRowHeight2);
      
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        const labelLines = doc.splitTextToSize(field.label, colWidthsRow2[i] - 10);
        doc.text(labelLines, x + 5, y + 13);
      
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const answerLines = doc.splitTextToSize(formattedAnswersRow2[i], colWidthsRow2[i] - 10);
        doc.text(answerLines, x + 5, y + 13 + labelLines.length * 12 + 5);
      
        x += colWidthsRow2[i];
      });
      y += dynamicRowHeight2;
      
      // Parse Singapore address
      let sgAddress: Record<string, any> = {};
      if (details.singapore_address) {
        try {
          sgAddress = JSON.parse(details.singapore_address);
        } catch {
          sgAddress = {};
        }
      }
      
      // Print SINGAPORE ADDRESS section
      doc.setFontSize(18);
      doc.setFillColor(180, 180, 180);
      // Draw header border
      doc.setDrawColor(100);
      doc.rect(40, y, 520, 24); // Border for header
      doc.setFillColor(180, 180, 180);
      doc.rect(40, y, 520, 24, "F"); // Fill header background
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("SINGAPORE ADDRESS", 45, y + 17);
      y += 24;
      
      // Define suitable column widths for sgAddress (total 520)
      const sgRows = [
        [
          { width: 100, name: "blk_no" },
          { width: 180, name: "street_name" },
          { width: 120, name: "unit_no" },
          { width: 120, name: "postal_code" }
        ],
        [
          { width: 260, name: "mobile_no" },
          { width: 260, name: "home_no" }
        ]
      ];
      
      const sgLabelMap = Object.fromEntries(
        sgAddressFields.map(f => [f.name, f.label])
      );
      
      sgRows.forEach(row => {
        let x = 40;
        let cellHeights: number[] = [];
        let formattedAnswers: string[] = [];
      
        // Measure each cell's content height and format answer
        row.forEach(cell => {
          let answer = sgAddress[cell.name] || "";
          formattedAnswers.push(answer);
      
          // Measure label height
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(sgLabelMap[cell.name] || cell.name, cell.width - 10);
          const labelHeight = labelLines.length * 12;
      
          // Measure answer height
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(answer, cell.width - 10);
          const answerHeight = answerLines.length * 14;
      
          cellHeights.push(labelHeight + answerHeight + 8); // +8 for padding
        });
      
        // Use the tallest cell for the row height
        const dynamicRowHeight = Math.max(...cellHeights, 40);
      
        // Draw cells
        x = 40;
        row.forEach((cell, idx) => {
          doc.setDrawColor(100);
          doc.rect(x, y, cell.width, dynamicRowHeight);
      
          // Draw label
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(sgLabelMap[cell.name] || cell.name, cell.width - 10);
          doc.text(labelLines, x + 5, y + 13);
      
          // Draw answer
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(formattedAnswers[idx], cell.width - 10);
          doc.text(answerLines, x + 5, y + 13 + labelLines.length * 12 + 5);
      
          x += cell.width;
        });
        y += dynamicRowHeight;
      });
      
      // Parse Overseas address
      let overseasAddress: Record<string, any> = {};
      if (details.overseas_address) {
        try {
          overseasAddress = JSON.parse(details.overseas_address);
        } catch {
          overseasAddress = {};
        }
      }
      
      // Print OVERSEAS ADDRESS section
      doc.setFontSize(18);
      doc.setFillColor(180, 180, 180);
      // Draw header border
      doc.setDrawColor(100);
      doc.rect(40, y, 520, 24); // Border for header
      doc.setFillColor(180, 180, 180);
      doc.rect(40, y, 520, 24, "F"); // Fill header background
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("OVERSEAS ADDRESS", 45, y + 17);
      y += 24;

      
      // Define suitable column widths for overseasAddress (total 520)
      const overseasRows = [
        [
          { width: 100, name: "blk_or_house_no" },
          { width: 180, name: "street_name" },
          { width: 120, name: "building_name" },
          { width: 120, name: "city" }
        ],
        [
          { width: 130, name: "state_or_province" },
          { width: 130, name: "country" },
          { width: 130, name: "postal_code" },
          { width: 130, name: "mobile_number" }
        ],
        [
          { width: 260, name: "home_number" }
        ]
      ];
      
      const overseasLabelMap = Object.fromEntries(
        overseasAddressFields.map(f => [f.name, f.label])
      );
      
      overseasRows.forEach(row => {
        let x = 40;
        let cellHeights: number[] = [];
        let formattedAnswers: string[] = [];
      
        // Measure each cell's content height and format answer
        row.forEach(cell => {
          let answer = overseasAddress[cell.name] || "";
          formattedAnswers.push(answer);
      
          // Measure label height
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(overseasLabelMap[cell.name] || cell.name, cell.width - 10);
          const labelHeight = labelLines.length * 12;
      
          // Measure answer height
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(answer, cell.width - 10);
          const answerHeight = answerLines.length * 14;
      
          cellHeights.push(labelHeight + answerHeight + 8); // +8 for padding
        });
      
        // Use the tallest cell for the row height
        const dynamicRowHeight = Math.max(...cellHeights, 40);
      
        // Draw cells
        x = 40;
        row.forEach((cell, idx) => {
          doc.setDrawColor(100);
          doc.rect(x, y, cell.width, dynamicRowHeight);
      
          // Draw label
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(overseasLabelMap[cell.name] || cell.name, cell.width - 10);
          doc.text(labelLines, x + 5, y + 13);
      
          // Draw answer
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(formattedAnswers[idx], cell.width - 10);
          doc.text(answerLines, x + 5, y + 13 + labelLines.length * 12 + 5);
      
          x += cell.width;
        });
        y += dynamicRowHeight;
      });
      
      // Parse Military Service
      let militaryService: Record<string, any> = {};
      if (details.military_service) {
        try {
          militaryService = JSON.parse(details.military_service);
        } catch {
          militaryService = {};
        }
      }
      
      // Print MILITARY SERVICE section
      doc.setFontSize(18);
      doc.setFillColor(180, 180, 180);
      // Draw header border
      doc.setDrawColor(100);
      doc.rect(40, y, 520, 24); // Border for header
      doc.setFillColor(180, 180, 180);
      doc.rect(40, y, 520, 24, "F"); // Fill header background
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("MILITARY SERVICE", 45, y + 17);
      y += 24;
      
      // Define suitable column widths for militaryService (total 520)
      const militaryRows = [
        [
          { width: 130, name: "ns_status" },
          { width: 130, name: "service_from_year" },
          { width: 130, name: "service_from_month" },
          { width: 130, name: "service_to_year" }
        ],
        [
          { width: 130, name: "service_to_month" },
          { width: 130, name: "rank" },
          { width: 130, name: "unit" },
          { width: 130, name: "vocation" }
        ],
        [
          { width: 130, name: "next_camp_date" },
          { width: 130, name: "is_operationally_ready" },
          { width: 130, name: "nsman_unit" },
          { width: 130, name: "nsman_vocation" }
        ],
        [
          { width: 520, name: "ns_exemption_reason" }
        ]
      ];
      
      const militaryLabelMap = Object.fromEntries(
        militaryServiceFields.map(f => [f.name, f.label])
      );
      
      militaryRows.forEach(row => {
        let x = 40;
        let cellHeights: number[] = [];
        let formattedAnswers: string[] = [];
      
        // Measure each cell's content height and format answer
        row.forEach(cell => {
          let answer = militaryService[cell.name] || "";
          // Format date if needed
          if (cell.name.toLowerCase().includes("date")) {
            const match = answer.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
              answer = `${match[3]}-${match[2]}-${match[1]}`;
            }
          }
          formattedAnswers.push(answer);
      
          // Measure label height
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(militaryLabelMap[cell.name] || cell.name, cell.width - 10);
          const labelHeight = labelLines.length * 12;
      
          // Measure answer height
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(answer, cell.width - 10);
          const answerHeight = answerLines.length * 14;
      
          cellHeights.push(labelHeight + answerHeight + 8); // +8 for padding
        });
      
        // Use the tallest cell for the row height
        const dynamicRowHeight = Math.max(...cellHeights, 40);
      
        // Draw cells
        x = 40;
        row.forEach((cell, idx) => {
          doc.setDrawColor(100);
          doc.rect(x, y, cell.width, dynamicRowHeight);
      
          // Draw label
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(militaryLabelMap[cell.name] || cell.name, cell.width - 10);
          doc.text(labelLines, x + 5, y + 13);
      
          // Draw answer
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(formattedAnswers[idx], cell.width - 10);
          doc.text(answerLines, x + 5, y + 13 + labelLines.length * 12 + 5);
      
          x += cell.width;
        });
        y += dynamicRowHeight;
      });
      
      // Parse Education Background
      let educationBackground: Record<string, any>[] = [];
      if (details.education_background) {
        try {
          educationBackground = JSON.parse(details.education_background);
        } catch {
          educationBackground = [];
        }
      }
      
      // Print EDUCATION BACKGROUND section
      doc.setFontSize(18);
      doc.setFillColor(180, 180, 180);
      doc.setDrawColor(100);
      doc.rect(40, y, 520, 24); // Border for header
      doc.setFillColor(180, 180, 180);
      doc.rect(40, y, 520, 24, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("EDUCATION BACKGROUND", 45, y + 17);
      y += 24;
      
      // Print each education record in a table-like format
      educationBackground.forEach((edu) => {
        let x = 40;
        let cellHeights: number[] = [];
        let formattedAnswers: string[] = [];
        const eduFields = educationBackgroundFields;
        const colWidths = [60, 100, 120, 120, 60, 60]; // Adjust as needed, total 520
      
        eduFields.forEach((field, i) => {
          let answer = edu[field.name] || "";
          formattedAnswers.push(answer);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          const labelHeight = labelLines.length * 12;
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(answer, colWidths[i] - 10);
          const answerHeight = answerLines.length * 14;
      
          cellHeights.push(labelHeight + answerHeight + 8);
        });
      
        const dynamicRowHeight = Math.max(...cellHeights, 40);
        y = checkPageBreak(doc, y, dynamicRowHeight);
      
        x = 40;
        eduFields.forEach((field, i) => {
          doc.setDrawColor(100);
          doc.rect(x, y, colWidths[i], dynamicRowHeight);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          doc.text(labelLines, x + 5, y + 13);
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(formattedAnswers[i], colWidths[i] - 10);
          doc.text(answerLines, x + 5, y + 13 + labelLines.length * 12 + 5);
      
          x += colWidths[i];
        });
        y += dynamicRowHeight;
      });
      
      // --- Scholarship & Awards ---
      let scholarshipAwards: Record<string, any>[] = [];
      if (details.scholarship_awards) {
        try {
          scholarshipAwards = JSON.parse(details.scholarship_awards);
        } catch {
          scholarshipAwards = [];
        }
      }
      
      y = checkPageBreak(doc, y, 24);
      doc.setFontSize(18);
      doc.setFillColor(180, 180, 180);
      doc.setDrawColor(100);
      doc.rect(40, y, 520, 24);
      doc.setFillColor(180, 180, 180);
      doc.rect(40, y, 520, 24, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("SCHOLARSHIP & AWARDS", 45, y + 17);
      y += 24;
      
      scholarshipAwards.forEach((award) => {
        let x = 40;
        let cellHeights: number[] = [];
        let formattedAnswers: string[] = [];
        const awardFields = scholarshipAwardsFields;
        const colWidths = [100, 120, 80, 55, 55, 55, 55]; // Adjust as needed
      
        awardFields.forEach((field, i) => {
          let answer = award[field.name] || "";
          formattedAnswers.push(answer);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          const labelHeight = labelLines.length * 12;
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(answer, colWidths[i] - 10);
          const answerHeight = answerLines.length * 14;
      
          cellHeights.push(labelHeight + answerHeight + 8);
        });
      
        const dynamicRowHeight = Math.max(...cellHeights, 40);
        y = checkPageBreak(doc, y, dynamicRowHeight);

        x = 40;
        awardFields.forEach((field, i) => {
          doc.setDrawColor(100);
          doc.rect(x, y, colWidths[i], dynamicRowHeight);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          doc.text(labelLines, x + 5, y + 13);
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(formattedAnswers[i], colWidths[i] - 10);
          doc.text(answerLines, x + 5, y + 13 + labelLines.length * 12 + 5);
      
          x += colWidths[i];
        });
        y += dynamicRowHeight;
      });
      
      // --- Other Qualifications ---
      let otherQualifications: Record<string, any>[] = [];
      if (details.other_qualifications) {
        try {
          otherQualifications = JSON.parse(details.other_qualifications);
        } catch {
          otherQualifications = [];
        }
      }
      
      y = checkPageBreak(doc, y, 24);
      doc.setFontSize(18);
      doc.setFillColor(180, 180, 180);
      doc.setDrawColor(100);
      doc.rect(40, y, 520, 24);
      doc.setFillColor(180, 180, 180);
      doc.rect(40, y, 520, 24, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("OTHER QUALIFICATIONS", 45, y + 17);
      y += 24;
      
      otherQualifications.forEach((qual) => {
        let x = 40;
        let cellHeights: number[] = [];
        let formattedAnswers: string[] = [];
        const qualFields = otherQualificationsFields;
        const colWidths = [100, 120, 80, 55, 55, 55, 55]; // Adjust as needed
      
        qualFields.forEach((field, i) => {
          let answer = qual[field.name] || "";
          formattedAnswers.push(answer);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          const labelHeight = labelLines.length * 12;
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(answer, colWidths[i] - 10);
          const answerHeight = answerLines.length * 14;
      
          cellHeights.push(labelHeight + answerHeight + 8);
        });
      
        const dynamicRowHeight = Math.max(...cellHeights, 40);
        y = checkPageBreak(doc, y, dynamicRowHeight);
      
        x = 40;
        qualFields.forEach((field, i) => {
          doc.setDrawColor(100);
          doc.rect(x, y, colWidths[i], dynamicRowHeight);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          doc.text(labelLines, x + 5, y + 13);
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(formattedAnswers[i], colWidths[i] - 10);
          doc.text(answerLines, x + 5, y + 13 + labelLines.length * 12 + 5);
      
          x += colWidths[i];
        });
        y += dynamicRowHeight;
      }); 
      
      
      // Parse Work Experience
      let workExperience: Record<string, any>[] = [];
      if (details.work_experience) {
        try {
          workExperience = JSON.parse(details.work_experience);
        } catch {
          workExperience = [];
        }
      }
      
      // Print WORK EXPERIENCE section
      y = checkPageBreak(doc, y, 24);
      doc.setFontSize(18);
      doc.setFillColor(180, 180, 180);
      doc.setDrawColor(100);
      doc.rect(40, y, 520, 24); // Border for header
      doc.setFillColor(180, 180, 180);
      doc.rect(40, y, 520, 24, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("WORK EXPERIENCE", 45, y + 17);
      y += 24;
      
      workExperience.forEach((exp) => {
        let x = 40;
        let cellHeights: number[] = [];
        let formattedAnswers: string[] = [];
        const expFields = workExperienceFields;
        const colWidths = [100, 80, 80, 55, 55, 55, 55, 90]; // Adjust as needed, total 520
      
        expFields.forEach((field, i) => {
          let answer = exp[field.name] || "";
          formattedAnswers.push(answer);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          const labelHeight = labelLines.length * 12;
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(answer, colWidths[i] - 10);
          const answerHeight = answerLines.length * 14;
      
          cellHeights.push(labelHeight + answerHeight + 8);
        });
      
        const dynamicRowHeight = Math.max(...cellHeights, 40);
        y = checkPageBreak(doc, y, dynamicRowHeight);
      
        x = 40;
        expFields.forEach((field, i) => {
          doc.setDrawColor(100);
          doc.rect(x, y, colWidths[i], dynamicRowHeight);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          doc.text(labelLines, x + 5, y + 13);
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(formattedAnswers[i], colWidths[i] - 10);
          doc.text(answerLines, x + 5, y + 13 + labelLines.length * 12 + 5);
      
          x += colWidths[i];
        });
        y += dynamicRowHeight;
      });
      
      // Parse Teaching Experience
      let teachingExperience: Record<string, any>[] = [];
      if (details.teaching_experience) {
        try {
          teachingExperience = JSON.parse(details.teaching_experience);
        } catch {
          teachingExperience = [];
        }
      }
      
      // Print TEACHING EXPERIENCE section
      y = checkPageBreak(doc, y, 24);
      doc.setFontSize(18);
      doc.setFillColor(180, 180, 180);
      doc.setDrawColor(100);
      doc.rect(40, y, 520, 24); // Border for header
      doc.setFillColor(180, 180, 180);
      doc.rect(40, y, 520, 24, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("TEACHING EXPERIENCE", 45, y + 17);
      y += 24;
      
      teachingExperience.forEach((teach) => {
        let x = 40;
        let cellHeights: number[] = [];
        let formattedAnswers: string[] = [];
        const teachFields = teachingExperienceFields;
        const colWidths = [120, 80, 80, 55, 55, 55, 55]; // Adjust as needed, total 520
      
        teachFields.forEach((field, i) => {
          let answer = teach[field.name] || "";
          formattedAnswers.push(answer);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          const labelHeight = labelLines.length * 12;
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(answer, colWidths[i] - 10);
          const answerHeight = answerLines.length * 14;
      
          cellHeights.push(labelHeight + answerHeight + 8);
        });
      
        const dynamicRowHeight = Math.max(...cellHeights, 40);
        y = checkPageBreak(doc, y, dynamicRowHeight);
      
        x = 40;
        teachFields.forEach((field, i) => {
          doc.setDrawColor(100);
          doc.rect(x, y, colWidths[i], dynamicRowHeight);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          doc.text(labelLines, x + 5, y + 13);
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(formattedAnswers[i], colWidths[i] - 10);
          doc.text(answerLines, x + 5, y + 13 + labelLines.length * 12 + 5);
      
          x += colWidths[i];
        });
        y += dynamicRowHeight;
      });
      
      // --- Skills ---
      let skills: Record<string, any>[] = [];
      if (details.skills) {
        try {
          skills = JSON.parse(details.skills);
        } catch {
          skills = [];
        }
      }
      
      y = checkPageBreak(doc, y, 24);
      doc.setFontSize(18);
      doc.setFillColor(180, 180, 180);
      doc.setDrawColor(100);
      doc.rect(40, y, 520, 24);
      doc.setFillColor(180, 180, 180);
      doc.rect(40, y, 520, 24, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("SKILLS", 45, y + 17);
      y += 24;
      
      skills.forEach((skill) => {
        let x = 40;
        let cellHeights: number[] = [];
        let formattedAnswers: string[] = [];
        const skillFields = skillsFields;
        const colWidths = [260, 260]; // Two columns, total 520
      
        skillFields.forEach((field, i) => {
          let answer = skill[field.name] || "";
          formattedAnswers.push(answer);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          const labelHeight = labelLines.length * 12;
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(answer, colWidths[i] - 10);
          const answerHeight = answerLines.length * 14;
      
          cellHeights.push(labelHeight + answerHeight + 8);
        });
      
        const dynamicRowHeight = Math.max(...cellHeights, 40);
        y = checkPageBreak(doc, y, dynamicRowHeight);
      
        x = 40;
        skillFields.forEach((field, i) => {
          doc.setDrawColor(100);
          doc.rect(x, y, colWidths[i], dynamicRowHeight);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          doc.text(labelLines, x + 5, y + 13);
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(formattedAnswers[i], colWidths[i] - 10);
          doc.text(answerLines, x + 5, y + 13 + labelLines.length * 12 + 5);
      
          x += colWidths[i];
        });
        y += dynamicRowHeight;
      });
      
      // --- Languages ---
      let languages: Record<string, any>[] = [];
      if (details.languages) {
        try {
          languages = JSON.parse(details.languages);
        } catch {
          languages = [];
        }
      }
      
      y = checkPageBreak(doc, y, 24);
      doc.setFontSize(18);
      doc.setFillColor(180, 180, 180);
      doc.setDrawColor(100);
      doc.rect(40, y, 520, 24);
      doc.setFillColor(180, 180, 180);
      doc.rect(40, y, 520, 24, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("LANGUAGES", 45, y + 17);
      y += 24;
      
      languages.forEach((lang) => {
        let x = 40;
        let cellHeights: number[] = [];
        let formattedAnswers: string[] = [];
        const langFields = languagesFields;
        const colWidths = [130, 130, 130, 130]; // Four columns, total 520

        langFields.forEach((field, i) => {
          let answer = lang[field.name] || "";
          formattedAnswers.push(answer);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          const labelHeight = labelLines.length * 12;
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(answer, colWidths[i] - 10);
          const answerHeight = answerLines.length * 14;
      
          cellHeights.push(labelHeight + answerHeight + 8);
        });
      
        const dynamicRowHeight = Math.max(...cellHeights, 40);
        y = checkPageBreak(doc, y, dynamicRowHeight);
      
        x = 40;
        langFields.forEach((field, i) => {
          doc.setDrawColor(100);
          doc.rect(x, y, colWidths[i], dynamicRowHeight);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          doc.text(labelLines, x + 5, y + 13);
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(formattedAnswers[i], colWidths[i] - 10);
          doc.text(answerLines, x + 5, y + 13 + labelLines.length * 12 + 5);
      
          x += colWidths[i];
        });
        y += dynamicRowHeight;
      });

      // --- Family Background ---
      let familyBackground: Record<string, any>[] = [];
      if (details.family_background) {
        try {
          familyBackground = JSON.parse(details.family_background);
        } catch {
          familyBackground = [];
        }
      }
      
      y = checkPageBreak(doc, y, 24);
      doc.setFontSize(18);
      doc.setFillColor(180, 180, 180);
      doc.setDrawColor(100);
      doc.rect(40, y, 520, 24);
      doc.setFillColor(180, 180, 180);
      doc.rect(40, y, 520, 24, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("FAMILY BACKGROUND", 45, y + 17);
      y += 24;
      
      familyBackground.forEach((fam) => {
        let x = 40;
        let cellHeights: number[] = [];
        let formattedAnswers: string[] = [];
        const famFields = familyBackgroundFields;
        const colWidths = [120, 100, 60, 120, 120]; // Five columns, total 520
      
        famFields.forEach((field, i) => {
          let answer = fam[field.name] || "";
          formattedAnswers.push(answer);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          const labelHeight = labelLines.length * 12;
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(answer, colWidths[i] - 10);
          const answerHeight = answerLines.length * 14;
      
          cellHeights.push(labelHeight + answerHeight + 8);
        });
      
        const dynamicRowHeight = Math.max(...cellHeights, 40);
        y = checkPageBreak(doc, y, dynamicRowHeight);
      
        x = 40;
        famFields.forEach((field, i) => {
          doc.setDrawColor(100);
          doc.rect(x, y, colWidths[i], dynamicRowHeight);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          doc.text(labelLines, x + 5, y + 13);
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(formattedAnswers[i], colWidths[i] - 10);
          doc.text(answerLines, x + 5, y + 13 + labelLines.length * 12 + 5);
      
          x += colWidths[i];
        });
        y += dynamicRowHeight;
      });
      
      // --- Emergency Contact ---
      let emergencyContact: Record<string, any>[] = [];
      if (details.emergency_contact) {
        try {
          emergencyContact = JSON.parse(details.emergency_contact);
        } catch {
          emergencyContact = [];
        }
      }
      
      y = checkPageBreak(doc, y, 24);
      doc.setFontSize(18);
      doc.setFillColor(180, 180, 180);
      doc.setDrawColor(100);
      doc.rect(40, y, 520, 24);
      doc.setFillColor(180, 180, 180);
      doc.rect(40, y, 520, 24, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("EMERGENCY CONTACT", 45, y + 17);
      y += 24;
      
      emergencyContact.forEach((contact) => {
        let x = 40;
        let cellHeights: number[] = [];
        let formattedAnswers: string[] = [];
        const contactFields = emergencyContactFields;
        const colWidths = [173, 173, 174]; // Three columns, total 520
      
        contactFields.forEach((field, i) => {
          let answer = contact[field.name] || "";
          formattedAnswers.push(answer);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          const labelHeight = labelLines.length * 12;
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(answer, colWidths[i] - 10);
          const answerHeight = answerLines.length * 14;
      
          cellHeights.push(labelHeight + answerHeight + 8);
        });
      
        const dynamicRowHeight = Math.max(...cellHeights, 40);
        y = checkPageBreak(doc, y, dynamicRowHeight);
      
        x = 40;
        contactFields.forEach((field, i) => {
          doc.setDrawColor(100);
          doc.rect(x, y, colWidths[i], dynamicRowHeight);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          doc.text(labelLines, x + 5, y + 13);
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(formattedAnswers[i], colWidths[i] - 10);
          doc.text(answerLines, x + 5, y + 13 + labelLines.length * 12 + 5);
      
          x += colWidths[i];
        });
        y += dynamicRowHeight;
      });
  
      // --- References ---
      let references: Record<string, any>[] = [];
      if (details.references) {
        try {
          references = JSON.parse(details.references);
        } catch {
          references = [];
        }
      }
      
      y = checkPageBreak(doc, y, 24);
      doc.setFontSize(18);
      doc.setFillColor(180, 180, 180);
      doc.setDrawColor(100);
      doc.rect(40, y, 520, 24);
      doc.setFillColor(180, 180, 180);
      doc.rect(40, y, 520, 24, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("REFERENCES", 45, y + 17);
      y += 24;
      
      references.forEach((ref) => {
        let x = 40;
        let cellHeights: number[] = [];
        let formattedAnswers: string[] = [];
        const refFields = referencesFields;
        const colWidths = [130, 130, 130, 130]; // Four columns, total 520
      
        refFields.forEach((field, i) => {
          let answer = ref[field.name] || "";
          formattedAnswers.push(answer);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          const labelHeight = labelLines.length * 12;
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(answer, colWidths[i] - 10);
          const answerHeight = answerLines.length * 14;
      
          cellHeights.push(labelHeight + answerHeight + 8);
        });
      
        const dynamicRowHeight = Math.max(...cellHeights, 40);
        y = checkPageBreak(doc, y, dynamicRowHeight);
      
        x = 40;
        refFields.forEach((field, i) => {
          doc.setDrawColor(100);
          doc.rect(x, y, colWidths[i], dynamicRowHeight);
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const labelLines = doc.splitTextToSize(field.label, colWidths[i] - 10);
          doc.text(labelLines, x + 5, y + 13);
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const answerLines = doc.splitTextToSize(formattedAnswers[i], colWidths[i] - 10);
          doc.text(answerLines, x + 5, y + 13 + labelLines.length * 12 + 5);
      
          x += colWidths[i];
        });
        y += dynamicRowHeight;
      });

      

      // Show preview
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");
    } catch (e) {
      const errorMessage = (e instanceof Error) ? e.message : String(e);
      alert("Failed to generate form: " + errorMessage);
    }
  }

  // Fetch managers on mount
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/managers`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) setManagers(res.data.data);
      } catch (e) {
        setManagers([]);
      }
    };
    fetchManagers();
  }, []);


  // Fetch applicants data from database
  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/applicants`,
          {
            headers: { 
              Authorization: `Bearer ${token}` // Add authorization header
            }
          }
        );
        
        if (response.data.success) {
          setApplicantsData(response.data.data);
          setFilteredApplicants(response.data.data);
        } else {
          console.error("Failed to fetch applicants:", response.data.message);
          setApplicantsData([]);
          setFilteredApplicants([]);
        }
      } catch (error) {
        console.error("Error fetching applicants:", error);
        setApplicantsData([]);
        setFilteredApplicants([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicants();
  }, []);

  const openAnalysisPanel = (applicant: any) => {
    setSelectedCandidate(applicant);
    setAiAnalysis(""); // Clear previous analysis
  };

  // Separate function for actual analysis
  const startAnalysis = async () => {
    if (!selectedCandidate) return;
  
    setIsAnalyzing(true);
    setAiAnalysis("");
  
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/ai/candidate-analysis`,
        {
          candidateName: selectedCandidate.name,
          jobTitle: selectedCandidate.job,
          userId: selectedCandidate.user_id,
          applicationData: `Applied for ${selectedCandidate.job} position. Current status: ${selectedCandidate.status || 'Unknown'}.`,
          analysisLevel: analysisLevel
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
  
      if (response.data.success) {
        setAiAnalysis(response.data.data.analysis);
      } else {
        setAiAnalysis("Failed to analyze candidate profile. Please try again.");
      }
    } catch (error: any) {
      console.error("Failed to analyze candidate:", error);
      setAiAnalysis("Failed to analyze candidate profile. Please check your connection and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSelection = (item: string, list: string[], setList: (val: string[]) => void) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  // Helper function to parse date strings (DD-MM-YYYY format)
  const parseDate = (dateString: string) => {
    if (!dateString) return null;
    const [day, month, year] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  // Apply filters function
  const applyFilters = () => {
    let filtered = [...applicantsData];

    // Search filter
    if (search.trim()) {
      filtered = filtered.filter(applicant =>
        applicant.name.toLowerCase().includes(search.toLowerCase()) ||
        applicant.job.toLowerCase().includes(search.toLowerCase()) ||
        applicant.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(applicant => {
        const category = applicant.job_category?.toLowerCase();
        
        return selectedCategories.some(selectedCategory => {
          if (selectedCategory === "Operative") {
            return category === "operative"

          } else if (selectedCategory === "Academic") {
            return category === "academic"
          }
          return false;
        });
      });
    }

    // Status filter
    if (selectedStatus.length > 0) {
      filtered = filtered.filter(applicant => {
        return selectedStatus.some(status => {
          if (status === "Pending Review") {
            return applicant.status === "Pending review" || applicant.status === "Pending";
          } else if (status === "Shortlisted") {
            return applicant.status.includes("Shortlisted");
          } else {
            return applicant.status === status;
          }
        });
      });
    }

    // Applied date filters
    if (appliedFrom) {
      const fromDate = new Date(appliedFrom);
      fromDate.setHours(0, 0, 0, 0); // Ensure midnight
      filtered = filtered.filter(applicant => {
        const appliedDate = parseDate(applicant.applied);
        if (!appliedDate) return false;
        appliedDate.setHours(0, 0, 0, 0); // Ensure midnight
        return appliedDate >= fromDate;
      });
    }

    if (appliedTo) {
      const toDate = new Date(appliedTo);
      // Add one day to make 'to' inclusive
      toDate.setDate(toDate.getDate() + 1);
      filtered = filtered.filter(applicant => {
        const appliedDate = parseDate(applicant.applied);
        // Inclusive: < toDate (which is one day after selected date)
        return appliedDate && appliedDate < toDate;
      });
    }

    // Interview date filters
    if (interviewFrom) {
      const fromDate = new Date(interviewFrom);
      filtered = filtered.filter(applicant => {
        const interviewDate = parseDate(applicant.interview);
        return interviewDate && interviewDate >= fromDate;
      });
    }

    if (interviewTo) {
      const toDate = new Date(interviewTo);
      // Add one day to make 'to' inclusive
      toDate.setDate(toDate.getDate() + 1);
      filtered = filtered.filter(applicant => {
        const interviewDate = parseDate(applicant.interview);
        // Inclusive: < toDate
        return interviewDate && interviewDate < toDate;
      });
    }

    setFilteredApplicants(filtered);
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    applyFilters();
    const hasActiveFilters = !!(search.trim() ||
                           selectedCategories.length > 0 ||
                           selectedStatus.length > 0 ||
                           appliedFrom ||
                           appliedTo ||
                           interviewFrom ||
                           interviewTo);
    setFiltersApplied(hasActiveFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearch("");
    setAppliedFrom("");
    setAppliedTo("");
    setInterviewFrom("");
    setInterviewTo("");
    setSelectedCategories([]);
    setSelectedStatus([]);
    setFilteredApplicants(applicantsData);
    setFiltersApplied(false);
  };

  const formatAiResponse = (text: string) => {
    // Improved URL regex: do not include trailing ')'
    const urlRegex = /(https?:\/\/[^\s<\)]+[^\s<\)\.,"'])/g;
    let formatted = text.replace(urlRegex, url => {
      // Remove trailing punctuation or bracket if present
      let cleanUrl = url.replace(/[)\].,;:'"]+$/, '');
      return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${cleanUrl}</a>`;
    });
  
    // Remove markdown headings like "#", "##", "###" at the start of lines
    formatted = formatted.replace(/^#{1,6}\s*/gm, '');
  
    // Remove numbering from lines like "1. Education Foundation"
    formatted = formatted.replace(/^\d+\.\s+/gm, '');
  
    // Existing formatting logic (without numbered list logic)
    formatted = formatted
      // .replace(/###\s*(.*?)(?=\n|$)/g, '<h3 class="ai-section-heading">$1</h3>') // REMOVE this line
      .replace(/^---+$/gm, '<div class="ai-section-divider"></div>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^-\s+(.*?)$/gm, '<li class="ai-bullet-point">$1</li>')
      .replace(/(<li class="ai-bullet-point">.*?<\/li>)(\s*<li class="ai-bullet-point">.*?<\/li>)*/gs, '<ul class="ai-bullet-list">$&</ul>')
      .replace(/\n\n/g, '</p><p class="ai-paragraph">')
      .replace(/^(.*)$/gm, '<p class="ai-paragraph">$1</p>')
      .replace(/<p class="ai-paragraph"><\/p>/g, '')
      .replace(/<p class="ai-paragraph">(<div|<ul|<ol)/g, '$1')
      .replace(/(<\/div>|<\/ul>|<\/ol>)<\/p>/g, '$1');
  
    return formatted;
  };

  return (
    <div className={styles.applicantsContainer}>
      {/* TOP SECTION: TABLE AND FILTER SIDE BY SIDE */}
      <div 
        className={styles.topSection}
        style={
          (selectedCandidate || isAnalyzing)
            ? { maxHeight: "650px" }
            : { maxHeight: "100%" }
        }
      >

        {/* APPLICANTS TABLE PANEL */}
        <div className={styles.tablePanel}>
          <div className={styles.tableHeader}>
            <h2>📋 Application Information</h2>
            <div className={styles.tableStats}>
              <span className={styles.totalCount}>
                {filteredApplicants.length} of {applicantsData.length} Total Applicants
                {filtersApplied && <span className={styles.filteredIndicator}> (Filtered)</span>}
              </span>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading applicants...</p>
              </div>
            ) : (
              <table className={styles.applicantsTable}>
                <thead>
                  <tr>
                    <th>Applicant's Name</th>
                    <th>Job Applied</th>
                    <th>Applied Date</th>
                    <th>Interview Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                    <th>Manager Assessment</th>
                    <th>AI Analysis</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplicants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.noResults}>
                        {applicantsData.length === 0 ? "No applicants available" : "No applicants match your filter criteria"}
                      </td>
                    </tr>
                  ) : (
                    filteredApplicants.map((applicant, idx) => (
                      <tr key={`${applicant.application_id}-${idx}`}>
                        <td>
                          {applicant.name}
                        </td>
                        <td>{applicant.job}</td>
                        <td>{applicant.applied}</td>
                        <td>{applicant.interview || "Not scheduled"}</td>
                        <td>
                          <select
                            className={styles.statusSelect}
                            value={applicant.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              if (newStatus === applicant.status) return;
                              if (
                                window.confirm(
                                  "Changing the application status will notify the applicant. Do you want to proceed?"
                                )
                              ) {
                                try {
                                  const token = localStorage.getItem("token");
                                  await axios.put(
                                    `${import.meta.env.VITE_BACKEND_URL}/application-status/${applicant.application_id}`,
                                    { status: newStatus },
                                    { headers: { Authorization: `Bearer ${token}` } }
                                  );
                                  // Update the status in the table immediately
                                  setFilteredApplicants((prev) =>
                                    prev.map((a) =>
                                      a.application_id === applicant.application_id
                                        ? { ...a, status: newStatus }
                                        : a
                                    )
                                  );
                                  setApplicantsData((prev) =>
                                    prev.map((a) =>
                                      a.application_id === applicant.application_id
                                        ? { ...a, status: newStatus }
                                        : a
                                    )
                                  );
                                } catch (err) {
                                  alert("Failed to update status. Please try again.");
                                }
                              }
                            }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Interview Scheduled" disabled>Interview Scheduled</option>
                            <option value="Reviewing">Reviewing</option>
                            <option value="Assessed" disabled>Assessed</option>
                            <option value="Offer Made">Offer Made</option>
                            <option value="Not Selected">Not Selected</option>
                            <option value="Offer Accepted" disabled>Offer Accepted</option>
                            <option value="Offer Declined" disabled>Offer Declined</option>

                          </select>
                        </td>

                        <td> {/* Add this new Actions column */}
                          <div className={styles.actionButtons}>
                            <Link
                              to={`/hr/applicant-details/overview?applicationId=${applicant.application_id}&userId=${applicant.user_id}`}
                              className={styles.actionBtn}
                              title="View Details"
                            >
                              <Eye size={14} />
                            </Link>
                            
                            <button
                              className={styles.actionBtn}
                              onClick={() => {
                                setEmailTargetUserId(applicant.user_id);
                                setShowEmailModal(true);
                                setEmailSubject("");
                                setEmailMessage("");
                                setEmailStatus("");
                              }}
                              title="Send Email"
                            >
                              <Mail size={14} />
                            </button>

                            <button
                              className={styles.actionBtn}
                              onClick={() => handlePrintApplicationForm(applicant.application_id)}
                              title="Print Application Form"
                            >
                              <Printer size={14} />
                            </button>
                          </div>
                        </td>
                        <td>
                          {(applicant.status === "Assessed" || applicant.assessment_done) ? (
                            <button
                              className={styles.assessmentDoneBtn}
                              onClick={async () => {
                                const token = localStorage.getItem("token");
                                const res = await fetch(
                                  `${import.meta.env.VITE_BACKEND_URL}/get-assessment-details/${applicant.application_id}`,
                                  { headers: { Authorization: `Bearer ${token}` } }
                                );
                                const data = await res.json();
                                if (data.success && data.assessment) {
                                  setAssessmentOverlay({ open: true, assessment: data.assessment });
                                } else {
                                  alert("Assessment details not found.");
                                }
                              }}
                            >
                              View Assessment
                            </button>
                          ) : applicant.status === "Reviewing" ? (
                            <div className={styles.managerAssignRow}>
                              <select
                                className={styles.managerSelect}
                                value={applicant.assigned_manager_id || ""}
                                onChange={e => {
                                  const newManagerId = e.target.value;
                                  setFilteredApplicants(prev =>
                                    prev.map(a =>
                                      a.application_id === applicant.application_id
                                        ? { ...a, assigned_manager_id: newManagerId }
                                        : a
                                    )
                                  );
                                }}
                              >
                                <option value="">Select Manager</option>
                                {managers.map(m => (
                                  <option key={m.emp_no} value={m.emp_no}>
                                    {m.display_name}
                                  </option>
                                ))}
                              </select>
                              <button
                                className={styles.assignBtn}
                                disabled={!applicant.assigned_manager_id}
                                style={{ marginLeft: 0 }}
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem("token");
                                    await axios.post(
                                      `${import.meta.env.VITE_BACKEND_URL}/assign-manager-to-application`,
                                      {
                                        application_id: applicant.application_id,
                                        manager_id: applicant.assigned_manager_id,
                                      },
                                      { headers: { Authorization: `Bearer ${token}` } }
                                    );
                                    alert("Manager assigned for assessment!");
                                  } catch {
                                    alert("Failed to assign manager.");
                                  }
                                }}
                              >
                                Send
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: "#888" }}>N/A</span>
                          )}
                        </td>
                        <td>
                          <button
                            className={styles.aiAnalyzeBtn}
                            onClick={() => openAnalysisPanel(applicant)}
                          >
                            🤖 Analyze
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {assessmentOverlay.open && (
          <div className={styles.modalOverlay}>
            <div className={styles.jobModal}>
              {/* Modal Header */}
              <div className={styles.modalHeader}>
                <div className={styles.modalTitleSection}>
                  <h2 className={styles.modalTitle}>Manager Assessment Details</h2>
                </div>
                <button
                  className={styles.modalCloseBtn}
                  onClick={() => setAssessmentOverlay({ open: false, assessment: null })}
                >
                  ×
                </button>
              </div>
              {/* Modal Content */}
              <div className={styles.modalContent}>
                {assessmentOverlay.assessment ? (
                  <>
                    <div className={styles.modalSection}>
                      <div className={styles.sectionHeader}>
                        <h3>Candidate & Interview Information</h3>
                      </div>
                      <div className={styles.overviewGrid}>
                        <div className={styles.overviewItem}>
                          <span className={styles.overviewLabel}>Candidate Name:</span>
                          <span className={styles.overviewValue}>{assessmentOverlay.assessment.candidate_name}</span>
                        </div>
                        <div className={styles.overviewItem}>
                          <span className={styles.overviewLabel}>Age:</span>
                          <span className={styles.overviewValue}>{assessmentOverlay.assessment.age}</span>
                        </div>
                        <div className={styles.overviewItem}>
                          <span className={styles.overviewLabel}>Department:</span>
                          <span className={styles.overviewValue}>{assessmentOverlay.assessment.department}</span>
                        </div>
                        <div className={styles.overviewItem}>
                          <span className={styles.overviewLabel}>Position Applied:</span>
                          <span className={styles.overviewValue}>{assessmentOverlay.assessment.position}</span>
                        </div>
                        <div className={styles.overviewItem}>
                          <span className={styles.overviewLabel}>Current Salary ($):</span>
                          <span className={styles.overviewValue}>{assessmentOverlay.assessment.current_salary}</span>
                        </div>
                        <div className={styles.overviewItem}>
                          <span className={styles.overviewLabel}>Expected Salary ($):</span>
                          <span className={styles.overviewValue}>{assessmentOverlay.assessment.expected_salary}</span>
                        </div>
                        <div className={styles.overviewItem}>
                          <span className={styles.overviewLabel}>Interviewer Name:</span>
                          <span className={styles.overviewValue}>{assessmentOverlay.assessment.interviewer}</span>
                        </div>
                        <div className={styles.overviewItem}>
                          <span className={styles.overviewLabel}>Notice Period:</span>
                          <span className={styles.overviewValue}>{assessmentOverlay.assessment.notice_period}</span>
                        </div>
                        <div className={styles.overviewItem}>
                          <span className={styles.overviewLabel}>Interview Date:</span>
                          <span className={styles.overviewValue}>
                            {assessmentOverlay.assessment.interview_date
                              ? assessmentOverlay.assessment.interview_date.slice(0, 10)
                              : "—"}
                          </span>
                        </div>
                        <div className={styles.overviewItem}>
                          <span className={styles.overviewLabel}>Interview Time:</span>
                          <span className={styles.overviewValue}>{assessmentOverlay.assessment.interview_time}</span>
                        </div>
                        <div className={styles.overviewItem}>
                          <span className={styles.overviewLabel}>Assessed On:</span>
                          <span className={styles.overviewValue}>
                            {assessmentOverlay.assessment.assessment_date
                              ? assessmentOverlay.assessment.assessment_date.slice(0, 10)
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.modalSection}>
                      <div className={styles.sectionHeader}>
                        <h3>Assessment Questions (1 means Very Poor and 5 means Excellent)</h3>
                      </div>
                      <div className={styles.sectionContent}>
                        <ul className={styles.questionList}>
                          {questionList.map((q, i) => (
                            <li key={q.key} className={styles.questionCard}>
                              <div>
                                <span className={styles.questionLabel}>Q{i + 1}: {q.label}</span>
                                {q.desc && <span className={styles.questionDesc}>{q.desc}</span>}
                              </div>
                              <div className={styles.questionScore}>Score: {assessmentOverlay.assessment[q.key]}</div>
                              {assessmentOverlay.assessment[`${q.key}_remark`] && (
                                <div className={styles.questionRemark}>
                                  Remark: {assessmentOverlay.assessment[`${q.key}_remark`]}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className={styles.modalSection}>
                      <div className={styles.sectionHeader}>
                        <h3>Overall Impression & Comments</h3>
                      </div>
                      <div className={styles.sectionContent}>
                        <div className={styles.overallSection}>
                          <strong>Overall Impression:</strong> {assessmentOverlay.assessment.q13}
                          <div>
                            <em>{assessmentOverlay.assessment.q13_remark}</em>
                          </div>
                          <strong>Interviewer's Recommendation:</strong> {assessmentOverlay.assessment.q14}
                        </div>
                        <div className={styles.commentsSection}>
                          <strong>Comments:</strong>
                          <div>{assessmentOverlay.assessment.comments}</div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <div>Loading assessment...</div>
                  </div>
                )}
              </div>
              {/* Modal Footer */}
              <div className={styles.modalFooter}>
                <div className={styles.modalActions}>
                  <button
                    className={styles.closeModalBtn}
                    onClick={() => setAssessmentOverlay({ open: false, assessment: null })}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COLLAPSIBLE FILTER PANEL */}
        <div className={`${styles.filterPanel} ${isFilterExpanded ? styles.expanded : styles.collapsed}`}>
          <div className={styles.filterHeader} onClick={() => setIsFilterExpanded(!isFilterExpanded)}>
            <h3>🔍 Filters</h3>
            <button className={styles.collapseToggle}>
              {isFilterExpanded ? '▶' : '◀'}
            </button>
          </div>
          
          {isFilterExpanded && (
            <div className={styles.filterContent}>
              {/* Search Field */}
              <div className={styles.filterGroup}>
                <label htmlFor="search-applicants">Search Applicants</label>
                <input
                  type="text"
                  id="search-applicants"
                  className={styles.customSearchInput}
                  placeholder="Enter applicant name or job"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Job Category */}
              <div className={styles.filterGroup}>
                <label>Job Category</label>
                <div className={styles.buttonGrid}>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedCategories.includes("Operative") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Operative", selectedCategories, setSelectedCategories)
                    }
                  >
                    Operative
                  </button>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedCategories.includes("Academic") ? styles.selected : ""}`}
                    onClick={() =>
                      toggleSelection("Academic", selectedCategories, setSelectedCategories)
                    }
                  >
                    Academic
                  </button>
                </div>
              </div>

              {/* Application Status */}
              <div className={styles.filterGroup}>
                <label>Application Status</label>
                <div className={styles.buttonGrid}>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedStatus.includes("Pending") ? styles.selected : ""}`}
                    onClick={() => toggleSelection("Pending", selectedStatus, setSelectedStatus)}
                  >
                    Pending
                  </button>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedStatus.includes("Interview Scheduled") ? styles.selected : ""}`}
                    onClick={() => toggleSelection("Interview Scheduled", selectedStatus, setSelectedStatus)}
                  >
                    Interview Scheduled
                  </button>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedStatus.includes("Reviewing") ? styles.selected : ""}`}
                    onClick={() => toggleSelection("Reviewing", selectedStatus, setSelectedStatus)}
                  >
                    Reviewing
                  </button>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedStatus.includes("Assessed") ? styles.selected : ""}`}
                    onClick={() => toggleSelection("Assessed", selectedStatus, setSelectedStatus)}
                  >
                    Assessed
                  </button>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedStatus.includes("Offer Made") ? styles.selected : ""}`}
                    onClick={() => toggleSelection("Offer Made", selectedStatus, setSelectedStatus)}
                  >
                    Offer Made
                  </button>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedStatus.includes("Not Selected") ? styles.selected : ""}`}
                    onClick={() => toggleSelection("Not Selected", selectedStatus, setSelectedStatus)}
                  >
                    Not Selected
                  </button>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedStatus.includes("Offer Accepted") ? styles.selected : ""}`}
                    onClick={() => toggleSelection("Offer Accepted", selectedStatus, setSelectedStatus)}
                  >
                    Offer Accepted
                  </button>
                  <button
                    className={`${styles.filterBtn} ${styles.compact} ${selectedStatus.includes("Offer Declined") ? styles.selected : ""}`}
                    onClick={() => toggleSelection("Offer Declined", selectedStatus, setSelectedStatus)}
                  >
                    Offer Declined
                  </button>
                </div>
              </div>

              {/* Date Filters */}
              <div className={styles.filterGroup}>
                <label>Applied Date From</label>
                <input
                  type="date"
                  className={`${styles.dateInput} ${styles.input}`}
                  value={appliedFrom}
                  onChange={(e) => setAppliedFrom(e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <label>Applied Date To</label>
                <input
                  type="date"
                  className={`${styles.dateInput} ${styles.input}`}
                  value={appliedTo}
                  onChange={(e) => setAppliedTo(e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <label>Interview Date From</label>
                <input
                  type="date"
                  className={`${styles.dateInput} ${styles.input}`}
                  value={interviewFrom}
                  onChange={(e) => setInterviewFrom(e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <label>Interview Date To</label>
                <input
                  type="date"
                  className={`${styles.dateInput} ${styles.input}`}
                  value={interviewTo}
                  onChange={(e) => setInterviewTo(e.target.value)}
                />
              </div>

              {/* Filter Action Buttons */}
              <div className={styles.filterActions}>
                <button 
                  className={`${styles.applyFilterBtn} ${styles.compact}`}
                  onClick={handleApplyFilters}
                >
                  Apply Filter
                </button>
                <button 
                  className={`${styles.resetFilterBtn} ${styles.compact}`}
                  onClick={clearAllFilters}
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: AI ANALYSIS PANEL */}
      {(selectedCandidate || isAnalyzing) && (
        <div className={styles.aiAnalysisPanel}>
          <div className={styles.aiPanelHeader}>
            <div className={styles.aiPanelTitle}>
              <h3>🤖 AI Background Analysis</h3>
                  <div className={styles.analysisLevelGroup}>
                    <label className={styles.analysisLevelLabel}>Analysis Level:</label>
                    <div className={styles.radioGroup}>
                      <label className={styles.radioOption}>
                        <input
                          type="radio"
                          name="analysisLevel"
                          value="Basic"
                          checked={analysisLevel === "Basic"}
                          onChange={(e) => setAnalysisLevel(e.target.value)}
                        />
                        <span>Basic</span>
                      </label>
                      <label className={styles.radioOption}>
                        <input
                          type="radio"
                          name="analysisLevel"
                          value="Standard"
                          checked={analysisLevel === "Standard"}
                          onChange={(e) => setAnalysisLevel(e.target.value)}
                        />
                        <span>Standard</span>
                      </label>
                      <label className={styles.radioOption}>
                        <input
                          type="radio"
                          name="analysisLevel"
                          value="Comprehensive"
                          checked={analysisLevel === "Comprehensive"}
                          onChange={(e) => setAnalysisLevel(e.target.value)}
                        />
                        <span>Comprehensive</span>
                      </label>
                    </div>
                  </div>
            </div>
            <div className={styles.aiPanelInfo}>
              {selectedCandidate && (
                <div className={styles.candidateInfo}>
                  <span className={styles.candidateName}>{selectedCandidate.name}</span>
                  <span className={styles.candidatePosition}> Applied Position: {selectedCandidate.job}</span>
                </div>
              )}
            </div>
            <button className={styles.closeAiPanel} onClick={() => {
              setSelectedCandidate(null);
              setAiAnalysis("");
            }}>×</button>
          </div>
          
          <div className={styles.aiPanelContent}>
            {!aiAnalysis && !isAnalyzing ? (
              <div className={styles.aiPlaceholder}>
                <div className={styles.aiPlaceholderContent}>
                  <h4>Ready to Analyze: {selectedCandidate?.name}</h4>
                  <p>Position: {selectedCandidate?.job}</p>
                  <p>Select your preferred analysis level above and click "Start Analysis" to begin the AI background review.</p>
                  
                  <button 
                    className={styles.startAnalysisBtn}
                    onClick={startAnalysis}
                    disabled={isAnalyzing}
                  >
                    🚀 Start Analysis
                  </button>
                </div>
              </div>
            ) : isAnalyzing ? (
              <div className={styles.aiLoading}>
                <div className={styles.loadingSpinner}></div>
                <p>Analyzing candidate background with AI...</p>
              </div>
            ) : (
              <div className={styles.aiAnalysisText}>
                <div 
                  className={styles.aiResponse}
                  dangerouslySetInnerHTML={{ __html: formatAiResponse(aiAnalysis) }}
                />
              </div>
            )}
          </div>
          
          <div className={styles.aiPanelFooter}>
            <div className={styles.aiPanelActions}>
              {aiAnalysis && (
                <button className={styles.refreshAnalysis} onClick={startAnalysis}>
                  🔄 Analyze Again
                </button>
              )}
            </div>
            <small>Powered by OpenAI API</small>
          </div>
        </div>
      )}

      {showEmailModal && (
        <div className={styles.emailModalOverlay}>
          <div className={styles.emailModal}>
            <h3>Send Email to Applicant</h3>
            <label>
              Subject:
              <input
                type="text"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                className={styles.emailInput}
              />
            </label>
            <div className={styles.emailLabel}>
              Message:
              <div className={styles.tiptapWrapper}>
                <TiptapEditor
                  content={emailMessage}
                  onChange={setEmailMessage}
                />
              </div>
            </div>
            <div className={styles.emailModalActions}>
              <button
                onClick={async () => {
                  setIsSendingEmail(true);
                  setEmailStatus("");
                  try {
                    const token = localStorage.getItem("token");
                    await axios.post(
                      `${import.meta.env.VITE_BACKEND_URL}/send-email`,
                      {
                        user_id: emailTargetUserId,
                        subject: emailSubject,
                        message: emailMessage,
                      },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setEmailStatus("Email sent successfully!");
                    setTimeout(() => setShowEmailModal(false), 1500);
                  } catch (e) {
                    setEmailStatus("Failed to send email.");
                  } finally {
                    setIsSendingEmail(false);
                  }
                }}
                disabled={isSendingEmail || !emailSubject || !emailMessage}
                className={styles.sendEmailBtn}
              >
                {isSendingEmail ? "Sending..." : "Send"}
              </button>
              <button
                onClick={() => setShowEmailModal(false)}
                className={styles.cancelEmailBtn}
              >
                Cancel
              </button>
            </div>
            {emailStatus && <p className={styles.emailStatus}>{emailStatus}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Applicants;