import { useState } from "react";
import { Search } from "lucide-react";
import "./ManagerAvailableJobs.css";

type Job = {
  id: number;
  title: string;
  responsibilities: string[];
  requirements: string[];
};

const academicJobs: Job[] = [
  {
    id: 1,
    title: "Freelance Lecturer (Business & Management)",
    responsibilities: [
      "Prepare and deliver lectures on business management topics",
      "Develop course materials and assignments",
      "Assess and grade student work",
    ],
    requirements: [
      "Master's degree in Business or related field",
      "Previous teaching experience preferred",
      "Strong communication skills",
    ],
  },
  {
    id: 2,
    title: "Freelance Lecturer (EAIM International College)",
    responsibilities: [
      "Teach courses relevant to EAIM International College curriculum",
      "Participate in curriculum development",
      "Provide academic support to students",
    ],
    requirements: [
      "Relevant academic qualifications",
      "Experience in international education",
      "Ability to engage diverse student groups",
    ],
  },
  {
    id: 3,
    title: "Freelance Lecturer (Hospitality & Tourism)",
    responsibilities: [
      "Deliver lectures on hospitality and tourism management",
      "Organize field visits and practical sessions",
      "Evaluate student performance",
    ],
    requirements: [
      "Degree in Hospitality, Tourism, or related field",
      "Industry experience preferred",
      "Excellent presentation skills",
    ],
  },
];

const operationJobs: Job[] = [
  {
    id: 4,
    title: "Operations Manager",
    responsibilities: [
      "Oversee daily operations",
      "Manage staff and resources",
      "Ensure compliance with policies",
    ],
    requirements: [
      "Bachelor's degree in Business or related field",
      "5+ years experience in operations",
      "Strong leadership skills",
    ],
  },
  {
    id: 5,
    title: "Management Assistant",
    responsibilities: [
      "Assist management with administrative tasks",
      "Coordinate meetings and communications",
      "Prepare reports and documentation",
    ],
    requirements: [
      "Diploma or degree in Business Administration",
      "Excellent organizational skills",
      "Proficient in MS Office",
    ],
  },
];

type JobSectionProps = {
  title: string;
  jobs: Job[];
  expandedJobIds: Set<number>;
  onToggleJob: (id: number) => void;
  searchTerm: string;
};

const JobSection: React.FC<JobSectionProps> = ({
  title,
  jobs,
  expandedJobIds,
  onToggleJob,
  searchTerm,
}) => {
  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="job-column">
      <h2>{title}</h2>
      {filteredJobs.map(job => (
        <div key={job.id} className="job-item">
          <div
            className="job-header"
            onClick={() => onToggleJob(job.id)}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                onToggleJob(job.id);
              }
            }}
            aria-expanded={expandedJobIds.has(job.id)}
          >
            <span>{job.title}</span>
          </div>
          {expandedJobIds.has(job.id) && (
            <div className="job-details">
              <strong>Responsibilities:</strong>
              <ul>
                {job.responsibilities.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <strong>Requirements:</strong>
              <ul>
                {job.requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ManagerAvailableJobs: React.FC = () => {
  const [inputTerm, setInputTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedJobIds, setExpandedJobIds] = useState<Set<number>>(new Set());
  const [isSearching, setIsSearching] = useState(false);

  const handleToggleJob = (id: number) => {
    setExpandedJobIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchTerm(inputTerm);
      setIsSearching(true);
    }
  };

  return (
    <div className="available-jobs-page">
      <div className="search-bar">
        <Search className="search-icon" />
        <input
          type="text"
          placeholder="Search jobs..."
          value={inputTerm}
          onChange={e => {
            setInputTerm(e.target.value);
            if (isSearching) setSearchTerm("");
          }}
          onKeyDown={handleSearchKeyPress}
          aria-label="Search jobs"
        />
      </div>

      <div className="jobs-container">
        <JobSection
          title="Academic/ Teaching Roles"
          jobs={academicJobs}
          expandedJobIds={expandedJobIds}
          onToggleJob={handleToggleJob}
          searchTerm={searchTerm}
        />
        <JobSection
          title="Operation/ Management Roles"
          jobs={operationJobs}
          expandedJobIds={expandedJobIds}
          onToggleJob={handleToggleJob}
          searchTerm={searchTerm}
        />
      </div>
    </div>
  );
};

export default ManagerAvailableJobs;
