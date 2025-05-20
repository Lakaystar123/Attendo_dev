import React, { useState, useCallback } from 'react';
import { isHoliday, getUpcomingHolidays } from '../../utils/bhutaneseHolidays';
import CalendarModal from './CalendarModal';
import './BhutaneseCalendar.css';

function BhutaneseCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getDaysInMonth = useCallback((date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }, []);

  const getFirstDayOfMonth = useCallback((date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  }, []);

  const getMonthName = useCallback((date) => {
    return date.toLocaleString('en-US', { month: 'long' });
  }, []);

  const getHolidayInfo = useCallback((date) => {
    return isHoliday(date);
  }, []);

  const getMonthHolidays = useCallback((date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return getUpcomingHolidays(startOfMonth, endOfMonth);
  }, []);

  const renderCalendar = useCallback(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const monthName = getMonthName(currentDate);
    const year = currentDate.getFullYear();

    const days = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Add weekday headers
    weekdays.forEach(day => {
      days.push(
        <div key={`header-${day}`} className="calendar-weekday">
          {day}
        </div>
      );
    });

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const holiday = getHolidayInfo(date);
      const isToday = new Date().toDateString() === date.toDateString();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0 is Sunday, 6 is Saturday

      days.push(
        <div 
          key={day} 
          className={`calendar-day ${holiday ? 'holiday' : ''} ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
        >
          <span className="day-number">{day}</span>
          {holiday && (
            <div className="holiday-indicator" title={holiday.name}>
              {holiday.name}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="calendar-nav-btn"
          >
            ←
          </button>
          <h3>{monthName} {year}</h3>
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="calendar-nav-btn"
          >
            →
          </button>
        </div>
        <div className="calendar-grid">
          {days}
        </div>
      </div>
    );
  }, [currentDate, getDaysInMonth, getFirstDayOfMonth, getMonthName, getHolidayInfo]);

  const renderMonthHolidays = useCallback(() => {
    const monthHolidays = getMonthHolidays(currentDate);

    if (monthHolidays.length === 0) {
      return (
        <div className="month-holidays">
          <h3>Holidays in {getMonthName(currentDate)}</h3>
          <p className="no-holidays">No holidays this month</p>
        </div>
      );
    }

    return (
      <div className="month-holidays">
        <h3>Holidays in {getMonthName(currentDate)}</h3>
        <div className="holiday-list">
          {monthHolidays.map((holiday, index) => {
            const isWeekend = holiday.date.getDay() === 0 || holiday.date.getDay() === 6;
            return (
              <div 
                key={index} 
                className={`holiday-item ${isWeekend ? 'weekend-holiday' : ''}`}
              >
                <div className="holiday-date">
                  {holiday.date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="holiday-name">{holiday.name}</div>
                {holiday.duration > 1 && (
                  <div className="holiday-duration">
                    {holiday.duration} days
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [currentDate, getMonthHolidays, getMonthName]);

  return (
    <div className="bhutanese-calendar-sidebar">
      <button 
        className="calendar-toggle-btn"
        onClick={() => setIsModalOpen(true)}
        aria-label="Open calendar"
      >
        <span className="calendar-icon">📅</span>
      </button>
      
      <CalendarModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
      >
        <div className="calendar-content">
          {renderCalendar()}
          {renderMonthHolidays()}
        </div>
      </CalendarModal>
    </div>
  );
}

export default BhutaneseCalendar; 