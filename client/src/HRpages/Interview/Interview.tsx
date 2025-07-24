import { useState, useEffect } from 'react';
import styles from './Interview.module.css';
import { Calendar as CalendarIcon, Clock, Trash2, Edit, Plus, CalendarArrowUp} from 'lucide-react';
import axios from 'axios';

type InterviewEvent = {
  id: number;
  application_id?: number | string;
  user_id?: number | string;
  job_id?: number | string;
  title: string;
  date: string; // YYYY-MM-DD format
  startTime: string;
  endTime: string;
  job: string;
  applicant: string;
  format: string;
  venue?: string;
  description?: string;
};

const Interview: React.FC = () => {
  const [events, setEvents] = useState<InterviewEvent[]>([]);

  

  useEffect(() => {
    fetchPendingApplicants();
  }, []);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const [pendingApplicants, setPendingApplicants] = useState<{id: number, name: string, job: string, date: string}[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<InterviewEvent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<Partial<InterviewEvent>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clickedDate, setClickedDate] = useState<string | null>(null);
  const [addToCalendar, setAddToCalendar] = useState<string>(""); 
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [applicantList, setApplicantList] = useState<{user_id: number, full_name: string}[]>([]);
  const [jobList, setJobList] = useState<{job_id: number, title: string}[]>([]);
  

  // Calendar functionality
  const today = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDateString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getEventsForDate = (dateString: string) => {
    return events
      .filter(event => event.date === dateString)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  };

  const isToday = (year: number, month: number, day: number) => {
    return today.getFullYear() === year && 
           today.getMonth() === month && 
           today.getDate() === day;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (dateString: string) => {
    setClickedDate(dateString);
    setFormMode('add');
    setFormData({
      date: dateString,
    });
    setSelectedDate(new Date(dateString));
    setShowForm(true);
  };

  const handleEventClick = (event: InterviewEvent) => {
    setSelectedEvent(event);
    setFormMode('edit');
    setFormData({ ...event });
    setSelectedDate(new Date(event.date));
    setShowForm(true);
  };

  const handleInputChange = (field: keyof InterviewEvent, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/interviews`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        // Map backend fields to InterviewEvent fields if needed
        setEvents(res.data.data.map((item: any) => ({
          id: item.interview_id,
          user_id: item.user_id,
          job_id: item.job_id,
          title: `Interview with ${item.applicant}`,
          date: item.interview_date,
          startTime: item.start_time,
          endTime: item.end_time,
          job: item.job,
          applicant: item.applicant,
          format: item.meeting_format,
          venue: item.venue,
          description: item.additional_notes,
        })));
      }
    } catch (err) {
      setEvents([]);
    }
  };

  const fetchPendingApplicants = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/pending-applicants`,
        {
          headers: { 
            Authorization: `Bearer ${token}` // Add authorization header if needed
          }
        }
      );
      if (response.data.success) {
        setPendingApplicants(response.data.data);
      } else {
        setPendingApplicants([]);
      }
    } catch (error) {
      setPendingApplicants([]);
    } finally {}
  };

  const fetchDropdownData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [applicantsRes, jobsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/all-applicants`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/all-jobs`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (applicantsRes.data.success) setApplicantList(applicantsRes.data.data);
      if (jobsRes.data.success) setJobList(jobsRes.data.data);
    } catch (e) {
      setApplicantList([]);
      setJobList([]);
    }
  };


  // const handleSave = () => {
  //   const errors: { [key: string]: string } = {};
  //   if (!formData.job) errors.job = "Job Position is required.";
  //   if (!formData.applicant) errors.applicant = "Applicant is required.";
  //   if (!formData.date) errors.date = "Interview Date is required.";
  //   if (!formData.format) errors.format = "Meeting Format is required.";
  //   if (!formData.startTime) errors.startTime = "Start Time is required.";
  //   if (!formData.endTime) errors.endTime = "End Time is required.";
  //   if (!addToCalendar) errors.addToCalendar = "Please select if you want to add to your calendar.";

  //   setFieldErrors(errors);

  //   if (Object.keys(errors).length > 0) {
  //     return;
  //   }

  //   if (formMode === 'add') {
  //     const newEvent: InterviewEvent = {
  //       id: ++eventIdCounter,
  //       title: `Interview with ${formData.applicant}`,
  //       date: formData.date!,
  //       startTime: formData.startTime!,
  //       endTime: formData.endTime!,
  //       job: formData.job!,
  //       applicant: formData.applicant!,
  //       format: formData.format!,
  //       venue: formData.venue,
  //       description: formData.description,
  //     };
  //     setEvents([...events, newEvent]);
  //   } else if (formMode === 'edit' && selectedEvent) {
  //     const updatedEvents = events.map((e) =>
  //       e.id === selectedEvent.id
  //         ? {
  //             ...formData,
  //             id: selectedEvent.id,
  //             title: `Interview with ${formData.applicant}`,
  //           } as InterviewEvent
  //         : e
  //     );
  //     setEvents(updatedEvents);
  //   }

  //   setShowForm(false);
  //   setFormData({});
  //   setSelectedDate(null);
  //   setClickedDate(null);
  //   setAddToCalendar("");
  //   setFieldErrors({});
  // };

  const handleSave = async () => {
    const errors: { [key: string]: string } = {};
    if (!formData.job_id) errors.job = "Job Position is required.";
    if (!formData.user_id) errors.applicant = "Applicant is required.";
    if (!formData.date) errors.date = "Interview Date is required.";
    if (!formData.format) errors.format = "Meeting Format is required.";
    if (!formData.startTime) errors.startTime = "Start Time is required.";
    if (!formData.endTime) errors.endTime = "End Time is required.";
    if (!addToCalendar) errors.addToCalendar = "Please select if you want to add to your calendar.";

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload = {
      application_id: formData.application_id,
      user_id: formData.user_id,
      job_id: formData.job_id,
      applicant: formData.applicant,
      job: formData.job,
      interview_date: formData.date,
      meeting_format: formData.format,
      start_time: formData.startTime,
      end_time: formData.endTime,
      venue: formData.venue,
      add_to_my_calendar: addToCalendar === "Yes" ? 1 : 0,
      additional_notes: formData.description
    };

    const token = localStorage.getItem("token");

    try {
      if (formMode === 'add') {
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/schedule-interview`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (formMode === 'edit' && selectedEvent) {
        await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/interview/${selectedEvent.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      await fetchInterviews();
      await fetchPendingApplicants(); // Refresh pending applicants list
      setShowForm(false);
      setFormData({});
      setSelectedDate(null);
      setClickedDate(null);
      setAddToCalendar("");
      setFieldErrors({});
    } catch (err: any) {
      alert("Server error: " + (err?.response?.data?.message || err.message));
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/interview/${selectedEvent.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchInterviews(); // Refresh interview list
      await fetchPendingApplicants(); // Refresh pending applicants list
      setShowForm(false);
      setFormData({});
      setSelectedDate(null);
      setClickedDate(null);
      setAddToCalendar("");
      setFieldErrors({});
    } catch (err: any) {
      alert("Server error: " + (err?.response?.data?.message || err.message));
    }
  };

  const handleAddInterview = (applicant: any) => {
    setFormMode('add');
    setFormData({
      application_id: applicant.id,
      user_id: applicant.user_id,
      applicant: applicant.name,
      job_id: applicant.job_id,
      job: applicant.job,
      date: '', // or prefill with today if you want
      format: '',
      startTime: '',
      endTime: '',
      venue: '',
      description: ''
    });
    setAddToCalendar('');
    setFieldErrors({});
    setShowForm(true);
  };

  // Generate calendar days with proper month/year reference
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

const upcomingInterviews = events
  .filter(event => new Date(event.date) >= today)
  .sort((a, b) => {
    // First, compare by date
    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    // If same date, compare by startTime
    return (a.startTime || '').localeCompare(b.startTime || '');
  })
  .slice(0, 5);

  return (
    <div className={styles.interviewContainer}>
      {/* TOP SECTION: STATS ONLY */}
      <div className={styles.topSection}>
        {/* STATS CARDS */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statsCard} ${styles.todayCard}`}>
            <div className={styles.cardIcon}>
              <Clock size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Today's Interviews</h3>
              <span className={styles.cardValue}>
                {events.filter(e => e.date === formatDateString(today.getFullYear(), today.getMonth(), today.getDate())).length}
              </span>
              <span className={styles.cardSubtitle}>Scheduled</span>
            </div>
          </div>

          <div className={`${styles.statsCard} ${styles.weekCard}`}>
            <div className={styles.cardIcon}>
              <CalendarIcon  size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Upcoming Interviews</h3>
              <span className={styles.cardValue}>{upcomingInterviews.length}</span>
              <span className={styles.cardSubtitle}>Scheduled</span>
            </div>
          </div>

          <div className={`${styles.statsCard} ${styles.pendingCard}`}>
            <div className={styles.cardIcon}>
              <CalendarArrowUp size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Pending Applicants</h3>
              <span className={styles.cardValue}>
                {pendingApplicants.length}
              </span>
              <span className={styles.cardSubtitle}>Awaiting Interviews</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN SECTION: CALENDAR AND SIDEBAR */}
      <div className={styles.mainSection}>
        {/* CALENDAR PANEL */}
        <div className={styles.calendarPanel}>
          <div className={styles.calendarHeader}>
            <h2 className={styles.calendarTitle}>📅 Interview Calendar (Click on the date to add an interview)</h2>
          </div>
          
          <div className={styles.calendarWrapper}>
            {/* Calendar Toolbar */}
            <div className={styles.calendarToolbar}>
              <div className={styles.calendarNavigation}>
                <button 
                  className={styles.navBtn}
                  onClick={() => navigateMonth('prev')}
                >
                  &#8249;
                </button>
                <button 
                  className={styles.todayBtn}
                  onClick={goToToday}
                >
                  Today
                </button>
                <button 
                  className={styles.navBtn}
                  onClick={() => navigateMonth('next')}
                >
                  &#8250;
                </button>
              </div>
              
              <h3 className={styles.calendarMonth}>
                {monthNames[currentMonth]} {currentYear}
              </h3>
              
              <div className={styles.calendarLegend}>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.upcoming}`}></div>
                  <span>Upcoming</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.completed}`}></div>
                  <span>Completed</span>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className={styles.customCalendar}>
              {/* Days of week header */}
              <div className={styles.calendarDaysHeader}>
                {daysOfWeek.map(day => (
                  <div key={day} className={styles.dayHeader}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className={styles.calendarGrid}>
                {generateCalendarDays().map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className={styles.emptyDay}></div>;
                  }

                  const dateString = formatDateString(currentYear, currentMonth, day);
                  const dayEvents = getEventsForDate(dateString);
                  const isTodayDate = isToday(currentYear, currentMonth, day);

                  return (
                    <div
                      key={`${currentYear}-${currentMonth}-${day}`}
                      className={`${styles.calendarDay} ${isTodayDate ? styles.today : ''}`}
                      onClick={() => handleDateClick(dateString)}
                    >
                      <div className={styles.dayNumber}>
                        {day}
                      </div>
                      <div className={styles.dayEvents}>
                        {dayEvents.slice(0, 3).map(event => {
                          // Determine if the interview is completed or upcoming
                          const isCompleted =
                            new Date(`${event.date}T${event.endTime}`) < new Date();

                          return (
                            <div
                              key={event.id}
                              className={`${styles.eventBar} ${isCompleted ? styles.completed : styles.upcoming}`}
                              onClick={e => {
                                e.stopPropagation();
                                handleEventClick(event);
                              }}
                              title={`${event.startTime} - ${event.applicant}`}
                            >
                              <span className={styles.eventTime}>
                                {event.startTime?.slice(0, 5)}
                              </span>
                              <span className={styles.eventTitle}>{event.applicant}</span>
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className={styles.moreEvents}>
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarPanel}>
            <div className={styles.sidebarHeader}>
                <CalendarIcon size={24} /> 
                <h3 className={styles.sidebarTitle}> Upcoming Interviews</h3>
            </div>
            <div className={styles.upcomingList}>
              {upcomingInterviews.map((interview) => (
                <div 
                  key={interview.id} 
                  className={styles.upcomingItem}
                  onClick={() => handleEventClick(interview)}
                >
                  <div className={styles.itemTime}>
                    <span className={styles.timeLabel}>{interview.startTime?.slice(0,5)}</span>
                    <span className={styles.dateLabel}>
                      {new Date(interview.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className={styles.itemContent}>
                    <h4 className={styles.applicantName}>{interview.applicant}</h4>
                    <p className={styles.jobTitle}>{interview.job}</p>
                  </div>
                  <div className={styles.itemActions}>
                    <button 
                      className={styles.editBtn} 
                      title="Edit Interview"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(interview);
                      }}
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                </div>
              ))}
              
              {upcomingInterviews.length === 0 && (
                <div className={styles.emptyState}>
                  <CalendarIcon size={48} />
                  <p>No upcoming interviews</p>
                </div>
              )}
            </div>
          </div>

          <div className={styles.sidebarPanel}>
            <div className={styles.pendingHeader}>
              <CalendarArrowUp size={24} />
              <h3 className={styles.sidebarTitle}> Pending Applicants</h3>
            </div>
            <div className={styles.pendingList}>
              {pendingApplicants.map(applicant => (
                <div key={applicant.id} className={styles.pendingItem} onClick={() => handleAddInterview(applicant)}>
                  <div className={styles.pendingTime}>
                    <span className={styles.appliedOnLabel}>Applied on</span>
                    <span className={styles.pendingDateLabel}>
                      {new Date(applicant.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div className={styles.pendingContent}>
                    <h4 className={styles.pendingApplicantName}>{applicant.name}</h4>
                    <p className={styles.pendingJobTitle}>{applicant.job}</p>
                  </div>
                  <div className={styles.pendingActions}>
                    <button
                      className={styles.editBtn}
                      title="Add to Interview"
                      onClick={() => handleAddInterview(applicant)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {pendingApplicants.length === 0 && (
                <div className={styles.emptyState}>
                  <p>No pending applicants</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {formMode === 'add' ? 'Schedule Interview' : '✏️ Edit Interview'}
              </h2>
            </div>

            <form className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="applicant">
                    Applicant <span style={{ color: "red" }}>*</span>
                  </label>

                  <select
                    id="applicant"
                    className={`${styles.formInput} ${fieldErrors.applicant ? styles.inputError : ""}`}
                    value={formData.user_id || ''}
                    onChange={e => {
                      const selectedUserId = e.target.value;
                      const selectedApplicant = applicantList.find(app => String(app.user_id) === selectedUserId);
                      setFormData({
                        ...formData,
                        user_id: selectedUserId,
                        applicant: selectedApplicant ? selectedApplicant.full_name : ''
                      });
                      setFieldErrors({ ...fieldErrors, applicant: "" });
                    }}
                    required
                    disabled={formMode === 'edit'}
                    title={formMode === 'edit' ? "To change applicant, delete and schedule a new interview." : ""}
                  >
                    <option value="" disabled>Select applicant</option>
                    {applicantList.map(app => (
                      <option key={app.user_id} value={app.user_id}>{app.full_name}</option>
                    ))}
                  </select>
                  
                  {fieldErrors.applicant && (
                    <div className={styles.fieldError}>{fieldErrors.applicant}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="job">
                    Job Position <span style={{ color: "red" }}>*</span>
                  </label>
                  <select
                    id="job"
                    className={`${styles.formInput} ${fieldErrors.job ? styles.inputError : ""}`}
                    value={formData.job_id || ''}
                    onChange={e => {
                      const selectedJobId = e.target.value;
                      const selectedJob = jobList.find(job => String(job.job_id) === selectedJobId);
                      setFormData({
                        ...formData,
                        job_id: selectedJobId,
                        job: selectedJob ? selectedJob.title : ''
                      });
                      setFieldErrors({ ...fieldErrors, job: "" });
                    }}
                    required
                    disabled={formMode === 'edit'}
                    title={formMode === 'edit' ? "To change job position, delete and schedule a new interview." : ""}
                  >
                    <option value="" disabled>Select job</option>
                    {jobList.map(job => (
                      <option key={job.job_id} value={job.job_id}>{job.title}</option>
                    ))}
                  </select>
                  {fieldErrors.job && (
                    <div className={styles.fieldError}>{fieldErrors.job}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="date">
                    Interview Date <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    className={`${styles.formInput} ${fieldErrors.date ? styles.inputError : ""}`}
                    value={formData.date || ''}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      handleInputChange('date', e.target.value);
                      setFieldErrors({ ...fieldErrors, date: "" });
                    }}
                    required
                  />
                  {fieldErrors.date && (
                    <div className={styles.fieldError}>{fieldErrors.date}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="format">
                    Meeting Format <span style={{ color: "red" }}>*</span>
                  </label>
                  <select
                    id="format"
                    className={`${styles.formInput} ${fieldErrors.format ? styles.inputError : ""}`}
                    value={formData.format || ''}
                    onChange={(e) => {
                      handleInputChange('format', e.target.value);
                      setFieldErrors({ ...fieldErrors, format: "" });
                    }}
                    required
                  >
                    <option value="">Select format</option>
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Physical">Physical Meeting</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                  </select>

                  {fieldErrors.format && (
                    <div className={styles.fieldError}>{fieldErrors.format}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="startTime">
                    Start Time <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    className={`${styles.formInput} ${fieldErrors.startTime ? styles.inputError : ""}`}
                    value={formData.startTime || ''}
                    onChange={(e) => {
                      handleInputChange('startTime', e.target.value);
                      setFieldErrors({ ...fieldErrors, startTime: "" });
                    }}
                    required
                  />
                  {fieldErrors.startTime && (
                    <div className={styles.fieldError}>{fieldErrors.startTime}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="endTime">
                    End Time <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    className={`${styles.formInput} ${fieldErrors.endTime ? styles.inputError : ""}`}
                    value={formData.endTime || ''}
                    onChange={(e) => {
                      handleInputChange('endTime', e.target.value);
                      setFieldErrors({ ...fieldErrors, endTime: "" });
                    }}
                    required
                  />
                  {fieldErrors.endTime && (
                    <div className={styles.fieldError}>{fieldErrors.endTime}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="venue">Venue</label>
                  <input
                    type="text"
                    id="venue"
                    className={styles.formInput}
                    placeholder="Meeting room or address..."
                    value={formData.venue || ''}
                    onChange={(e) => handleInputChange('venue', e.target.value)}
                  />
                </div>

                {/* Add to my calendar question */}
                <div className={styles.formGroup}>
                  <label htmlFor="addToCalendar">
                    Add to my calendar? <span style={{ color: "red" }}>*</span>
                  </label>
                  <select
                    id="addToCalendar"
                    className={`${styles.formInput} ${fieldErrors.addToCalendar ? styles.inputError : ""}`}
                    value={addToCalendar}
                    onChange={e => {
                      setAddToCalendar(e.target.value);
                      setFieldErrors({ ...fieldErrors, addToCalendar: "" });
                    }}
                    required
                  >
                    <option value="" disabled>Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  {fieldErrors.addToCalendar && (
                    <div className={styles.fieldError}>{fieldErrors.addToCalendar}</div>
                  )}
                </div>

              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description">Additional Notes</label>
                <textarea
                  id="description"
                  className={styles.formTextarea}
                  placeholder="Add any additional notes or requirements..."
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.cancelBtn}
                  onClick={() => {
                    setShowForm(false);
                  }}
                >
                  Cancel
                </button>
                {formMode === 'edit' && (
                  <button 
                    type="button" 
                    className={styles.deleteBtn}
                    onClick={handleDelete}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
                <button 
                  type="button" 
                  className={styles.saveBtn}
                  onClick={handleSave}
                >
                  <CalendarIcon size={16} />
                  {formMode === 'add' ? 'Schedule' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interview;