CREATE DATABASE IF NOT EXISTS Jobv2 CHARACTER
SET
    utf8mb4 COLLATE utf8mb4_unicode_ci;

USE Jobv2;

-- Users & auth
CREATE TABLE IF NOT EXISTS tbl_users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    nationality VARCHAR(100),
    reset_password_token VARCHAR(255),
    reset_password_expires DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tbl_pending_register_code (
    email VARCHAR(255) PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tbl_pending_login_code (
    email VARCHAR(255) PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL
) ENGINE = InnoDB;

-- Jobs & requisitions
CREATE TABLE IF NOT EXISTS tbl_jobs (
    job_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    job_category VARCHAR(100),
    job_type VARCHAR(100),
    hiring_status VARCHAR(50),
    job_requirements TEXT,
    job_responsibilities TEXT,
    seekers_required INT,
    posting_date DATETIME
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tbl_job_requisition (
    job_requisition_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50),
    job_title VARCHAR(255),
    job_category VARCHAR(100),
    job_type VARCHAR(100),
    job_requirements TEXT,
    job_responsibilities TEXT,
    seekers_required INT,
    posting_date DATETIME,
    requisition_status VARCHAR(50),
    remarks TEXT
) ENGINE = InnoDB;

-- Bookmarks
CREATE TABLE IF NOT EXISTS tbl_bookmark (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    job_id INT,
    created_at DATETIME
) ENGINE = InnoDB;

-- Applications & workflow
CREATE TABLE IF NOT EXISTS tbl_application (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    job_id INT,
    applied_date DATETIME,
    application_status VARCHAR(50),
    interview_date DATETIME,
    document_type VARCHAR(100),
    document_name VARCHAR(255),
    file_name VARCHAR(255),
    file_path VARCHAR(1024),
    file_size INT,
    current_salary DECIMAL(12, 2),
    expected_salary DECIMAL(12, 2),
    earliest_start_date VARCHAR(50),
    source_obtained_from VARCHAR(255),
    total_work_experience DECIMAL(6, 2),
    relevant_work_experience DECIMAL(6, 2),
    assessment_done VARCHAR(5) DEFAULT 'No',
    assigned_manager_id VARCHAR(50),
    assigned_by VARCHAR(50)
) ENGINE = InnoDB;

-- Personal/profile sections (many use ON DUPLICATE KEY UPDATE with user_id -> make user_id UNIQUE)
CREATE TABLE IF NOT EXISTS tbl_personal_particulars (
    user_id INT PRIMARY KEY,
    salutation VARCHAR(20),
    full_name VARCHAR(255),
    nric VARCHAR(50),
    alias VARCHAR(255),
    email VARCHAR(255),
    date_of_birth DATE,
    marital_status VARCHAR(50),
    gender VARCHAR(20),
    nationality VARCHAR(100),
    status_in_sg VARCHAR(100),
    race VARCHAR(100),
    dialect VARCHAR(100),
    religion VARCHAR(100),
    country_of_birth VARCHAR(100),
    passport_no VARCHAR(50),
    passport_expiry DATE,
    is_draft CHAR(1) DEFAULT 'N'
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tbl_sg_address (
    user_id INT PRIMARY KEY,
    blk_no VARCHAR(50),
    street_name VARCHAR(255),
    unit_no VARCHAR(50),
    postal_code VARCHAR(20),
    mobile_no VARCHAR(50),
    home_no VARCHAR(50),
    is_draft CHAR(1) DEFAULT 'N'
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tbl_overseas_address (
    user_id INT PRIMARY KEY,
    has_overseas_address VARCHAR(10),
    blk_or_house_no VARCHAR(255),
    street_name VARCHAR(255),
    building_name VARCHAR(255),
    city VARCHAR(100),
    state_or_province VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(50),
    mobile_country_code VARCHAR(10),
    mobile_number VARCHAR(50),
    home_country_code VARCHAR(10),
    home_number VARCHAR(50),
    is_draft CHAR(1) DEFAULT 'N'
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tbl_military_service (
    user_id INT PRIMARY KEY,
    ns_status VARCHAR(50),
    service_from_year VARCHAR(10),
    service_from_month VARCHAR(10),
    service_to_year VARCHAR(10),
    service_to_month VARCHAR(10),
    `rank` VARCHAR(100),
    unit VARCHAR(255),
    vocation VARCHAR(255),
    next_camp_date DATE,
    is_operationally_ready VARCHAR(10),
    nsman_unit VARCHAR(255),
    nsman_vocation VARCHAR(255),
    ns_exemption_reason TEXT,
    is_draft CHAR(1) DEFAULT 'N'
) ENGINE = InnoDB;

-- Repeatable sections (multi-row per user)
CREATE TABLE IF NOT EXISTS tbl_education_background (
    education_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    is_highest_qualification VARCHAR(10),
    level_of_qualification VARCHAR(255),
    institute VARCHAR(255),
    qualification_attained VARCHAR(255),
    year_from VARCHAR(10),
    year_to VARCHAR(10),
    is_draft CHAR(1) DEFAULT 'N'
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tbl_scholarship_awards (
    scholarship_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    organization VARCHAR(255),
    description TEXT,
    certificate VARCHAR(255),
    from_month VARCHAR(20),
    from_year VARCHAR(10),
    to_month VARCHAR(20),
    to_year VARCHAR(10),
    is_draft CHAR(1) DEFAULT 'N'
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tbl_other_qualifications (
    qualification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    organization VARCHAR(255),
    course VARCHAR(255),
    certificate VARCHAR(255),
    from_month VARCHAR(20),
    from_year VARCHAR(10),
    to_month VARCHAR(20),
    to_year VARCHAR(10),
    is_draft CHAR(1) DEFAULT 'N'
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tbl_work_experience (
    work_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    company VARCHAR(255),
    role VARCHAR(255),
    salary VARCHAR(50),
    description TEXT,
    reason TEXT,
    from_month VARCHAR(20),
    from_year VARCHAR(10),
    to_month VARCHAR(20),
    to_year VARCHAR(10),
    is_draft CHAR(1) DEFAULT 'N'
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tbl_teaching_experience (
    teaching_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    institution VARCHAR(255),
    position VARCHAR(255),
    salary VARCHAR(50),
    subject VARCHAR(255),
    reason TEXT,
    from_month VARCHAR(20),
    from_year VARCHAR(10),
    to_month VARCHAR(20),
    to_year VARCHAR(10),
    is_draft CHAR(1) DEFAULT 'N'
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tbl_skills (
    skill_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(255),
    level VARCHAR(50),
    is_draft CHAR(1) DEFAULT 'N'
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tbl_languages (
    language_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(255),
    spoken VARCHAR(50),
    written VARCHAR(50),
    reading VARCHAR(50),
    is_draft CHAR(1) DEFAULT 'N'
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tbl_family_background (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(255),
    relationship VARCHAR(100),
    age INT,
    occupation VARCHAR(255),
    contact_no VARCHAR(50),
    is_draft CHAR(1) DEFAULT 'N'
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tbl_emergency_contact (
    contact_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(255),
    contact_no VARCHAR(50),
    relationship VARCHAR(100),
    is_draft CHAR(1) DEFAULT 'N'
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tbl_references (
    reference_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(255),
    occupation VARCHAR(255),
    contact_no VARCHAR(50),
    relationship VARCHAR(100),
    is_draft CHAR(1) DEFAULT 'N'
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tbl_attachments (
    attachment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    document_type VARCHAR(100),
    document_name VARCHAR(255),
    file_name VARCHAR(255),
    file_path VARCHAR(1024),
    file_size INT,
    file_type VARCHAR(100),
    is_draft CHAR(1) DEFAULT 'N'
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tbl_interview (
    interview_id INT PRIMARY KEY,
    user_id INT,
    job_id INT,
    applicant VARCHAR(255),
    job VARCHAR(255),
    interview_date DATE,
    meeting_format VARCHAR(50),
    start_time VARCHAR(50),
    end_time VARCHAR(50),
    venue VARCHAR(255),
    additional_notes TEXT,
    add_to_my_calendar TINYINT DEFAULT 0
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tbl_assessment (
    application_id INT PRIMARY KEY,
    candidate_name VARCHAR(255),
    age VARCHAR(10),
    department VARCHAR(255),
    position VARCHAR(255),
    current_salary VARCHAR(50),
    expected_salary VARCHAR(50),
    interviewer VARCHAR(255),
    notice_period VARCHAR(50),
    interview_date DATE,
    interview_time VARCHAR(50),
    q1 VARCHAR(50),
    q1_remark TEXT,
    q2 VARCHAR(50),
    q2_remark TEXT,
    q3 VARCHAR(50),
    q3_remark TEXT,
    q4 VARCHAR(50),
    q4_remark TEXT,
    q5 VARCHAR(50),
    q5_remark TEXT,
    q6 VARCHAR(50),
    q6_remark TEXT,
    q7 VARCHAR(50),
    q7_remark TEXT,
    q8 VARCHAR(50),
    q8_remark TEXT,
    q9 VARCHAR(50),
    q9_remark TEXT,
    q10 VARCHAR(50),
    q10_remark TEXT,
    q11 VARCHAR(50),
    q11_remark TEXT,
    q12 VARCHAR(50),
    q12_remark TEXT,
    q13 VARCHAR(50),
    q13_remark TEXT,
    q14 VARCHAR(50),
    comments TEXT,
    assessment_date DATE
) ENGINE = InnoDB;

-- Full application capture (JSON/text fields)
CREATE TABLE IF NOT EXISTS tbl_application_full_details (
  application_id INT PRIMARY KEY,
  user_id INT,
  job_id INT,
  personal_particulars LONGTEXT,
  singapore_address LONGTEXT,
  overseas_address LONGTEXT,
  military_service LONGTEXT,
  education_background LONGTEXT,
  scholarship_awards LONGTEXT,
  other_qualifications LONGTEXT,
  work_experience LONGTEXT,
  teaching_experience LONGTEXT,
  skills LONGTEXT,
  languages LONGTEXT,
  family_background LONGTEXT,
  emergency_contact LONGTEXT,
  `references` LONGTEXT,
  attachments LONGTEXT,
  apply_info LONGTEXT,
  created_at DATETIME
) ENGINE=InnoDB;

-- Utility view tables needed by code (you can replace with mock vw_staff/vw_country or remove calls)
-- vw_country and vw_staff are referenced as data sources (if not available create simple mock tables/views)

CREATE TABLE IF NOT EXISTS vw_country (name VARCHAR(255) PRIMARY KEY) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS vw_staff (
    emp_no VARCHAR(50) PRIMARY KEY,
    user_name VARCHAR(255),
    email VARCHAR(255),
    staff_name VARCHAR(255),
    staff_status VARCHAR(50),
    dept_code VARCHAR(20),
    display_name VARCHAR(255),
    supervisor VARCHAR(50),
    user_password VARCHAR(255)
) ENGINE = InnoDB;