import { useState } from 'react';
import styles from './Interview.module.css';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar as CalendarIcon, Clock, Users, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';

type InterviewEvent = {
  id: number;
  title: string;
  date: string; // YYYY-MM-DD format
  startTime: string;
  endTime: string;
  job: string;
  applicant: string;
  format: string;
  venue?: string;
  description?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
};

let eventIdCounter = 2; // Start from 2 since we have 2 sample events

const Interview: React.FC = () => {
  const [events, setEvents] = useState<InterviewEvent[]>([
    // Sample events
    {
      id: 1,
      title: "Interview with John Doe",
      date: "2025-07-15",
      startTime: "14:00",
      endTime: "15:00",
      job: "Software Engineer",
      applicant: "John Doe",
      format: "Google Meet",
      status: "confirmed"
    },
    {
      id: 2,
      title: "Interview with Jane Smith",
      date: "2025-07-16",
      startTime: "10:30",
      endTime: "11:30",
      job: "UI/UX Designer",
      applicant: "Jane Smith",
      format: "Zoom",
      status: "pending"
    }
  ]);
  
  const [selectedEvent, setSelectedEvent] = useState<InterviewEvent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<Partial<InterviewEvent>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clickedDate, setClickedDate] = useState<string | null>(null);

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
    return events.filter(event => event.date === dateString);
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
      status: 'confirmed'
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

  const handleSave = () => {
    if (!formData.date || !formData.startTime || !formData.endTime || !formData.applicant) return;

    if (formMode === 'add') {
      const newEvent: InterviewEvent = {
        id: ++eventIdCounter,
        title: `Interview with ${formData.applicant}`,
        date: formData.date!,
        startTime: formData.startTime!,
        endTime: formData.endTime!,
        job: formData.job!,
        applicant: formData.applicant!,
        format: formData.format!,
        venue: formData.venue,
        description: formData.description,
        status: formData.status as 'confirmed' | 'pending' | 'cancelled' || 'confirmed',
      };
      setEvents([...events, newEvent]);
    } else if (formMode === 'edit' && selectedEvent) {
      const updatedEvents = events.map((e) =>
        e.id === selectedEvent.id
          ? {
              ...formData,
              id: selectedEvent.id,
              title: `Interview with ${formData.applicant}`,
            } as InterviewEvent
          : e
      );
      setEvents(updatedEvents);
    }

    setShowForm(false);
    setFormData({});
    setSelectedDate(null);
    setClickedDate(null);
  };

  const handleDelete = () => {
    if (formMode === 'edit' && selectedEvent) {
      setEvents(events.filter((e) => e.id !== selectedEvent.id));
      setShowForm(false);
      setFormData({});
      setSelectedDate(null);
      setSelectedEvent(null);
    }
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
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className={styles.interviewContainer}>
      {/* TOP SECTION: STATS ONLY */}
      <div className={styles.topSection}>
        {/* STATS CARDS */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statsCard} ${styles.todayCard}`}>
            <div className={styles.cardIcon}>
              <CalendarIcon size={24} />
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
              <Clock size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>This Week</h3>
              <span className={styles.cardValue}>{events.length}</span>
              <span className={styles.cardSubtitle}>Total interviews</span>
            </div>
          </div>

          <div className={`${styles.statsCard} ${styles.pendingCard}`}>
            <div className={styles.cardIcon}>
              <CalendarIcon size={24} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>This Month</h3>
              <span className={styles.cardValue}>
                {events.filter(e => {
                  const eventDate = new Date(e.date);
                  return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
                }).length}
              </span>
              <span className={styles.cardSubtitle}>Total interviews</span>
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
                  <div className={`${styles.legendColor} ${styles.confirmed}`}></div>
                  <span>Confirmed</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.pending}`}></div>
                  <span>Pending</span>
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
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className={`${styles.eventBar} ${styles[event.status]}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                            title={`${event.startTime} - ${event.applicant}`}
                          >
                            <span className={styles.eventTime}>{event.startTime}</span>
                            <span className={styles.eventTitle}>{event.applicant}</span>
                          </div>
                        ))}
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
              <h3 className={styles.sidebarTitle}>📋 Upcoming Interviews</h3>
            </div>
            <div className={styles.upcomingList}>
              {upcomingInterviews.map((interview) => (
                <div 
                  key={interview.id} 
                  className={styles.upcomingItem}
                  onClick={() => handleEventClick(interview)}
                >
                  <div className={styles.itemTime}>
                    <span className={styles.timeLabel}>{interview.startTime}</span>
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
                    <span className={`${styles.statusBadge} ${styles[interview.status]}`}>
                      {interview.status}
                    </span>
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
        </div>
      </div>

      {/* MODAL */}
      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {formMode === 'add' ? '➕ Schedule Interview' : '✏️ Edit Interview'}
              </h2>
            </div>

            <form className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="job">Job Position *</label>
                  <input
                    type="text"
                    id="job"
                    className={styles.formInput}
                    placeholder="e.g. Software Engineer"
                    value={formData.job || ''}
                    onChange={(e) => handleInputChange('job', e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="applicant">Applicant *</label>
                  <input
                    type="text"
                    id="applicant"
                    className={styles.formInput}
                    placeholder="Applicant name"
                    value={formData.applicant || ''}
                    onChange={(e) => handleInputChange('applicant', e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="date">Interview Date *</label>
                  <input
                    type="date"
                    id="date"
                    className={styles.formInput}
                    value={formData.date || ''}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="format">Meeting Format *</label>
                  <select
                    id="format"
                    className={styles.formSelect}
                    value={formData.format || ''}
                    onChange={(e) => handleInputChange('format', e.target.value)}
                    required
                  >
                    <option value="">Select format</option>
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Physical">Physical Meeting</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="startTime">Start Time *</label>
                  <input
                    type="time"
                    id="startTime"
                    className={styles.formInput}
                    value={formData.startTime || ''}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="endTime">End Time *</label>
                  <input
                    type="time"
                    id="endTime"
                    className={styles.formInput}
                    value={formData.endTime || ''}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    required
                  />
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

                <div className={styles.formGroup}>
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    className={styles.formSelect}
                    value={formData.status || 'confirmed'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
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
                  onClick={() => setShowForm(false)}
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