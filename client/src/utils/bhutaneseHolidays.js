// Bhutanese holidays data
// Note: Some dates are fixed, while others follow the lunar calendar
// For lunar calendar dates, we'll use approximate dates for the current year
const BHUTANESE_HOLIDAYS = {
  // Fixed date holidays
  FIXED_HOLIDAYS: [
    {
      name: "New Year's Day",
      date: "01-01",
      type: "public"
    },
    {
      name: "Birthday of His Majesty the King",
      date: "02-21",
      type: "public"
    },
    {
      name: "Birthday of Her Majesty the Queen",
      date: "06-04",
      type: "public"
    },
    {
      name: "Blessed Rainy Day",
      date: "09-23",
      type: "public"
    },
    {
      name: "National Day",
      date: "12-17",
      type: "public"
    }
  ],
  
  // Lunar calendar holidays (approximate dates for 2024)
  LUNAR_HOLIDAYS: [
    {
      name: "Losar (Bhutanese New Year)",
      date: "02-10",
      type: "public",
      duration: 2 // Number of days
    },
    {
      name: "Shabdrung Kuchoe",
      date: "04-23",
      type: "public"
    },
    {
      name: "Buddha's Parinirvana",
      date: "05-23",
      type: "public"
    },
    {
      name: "First Sermon of Buddha",
      date: "07-06",
      type: "public"
    },
    {
      name: "Thimphu Tshechu",
      date: "09-16",
      type: "public",
      duration: 3
    }
  ]
};

// Function to check if a given date is a holiday
export const isHoliday = (date) => {
  const dateStr = date.toISOString().slice(5, 10); // Get MM-DD format
  const year = date.getFullYear();
  
  // Check fixed holidays
  const isFixedHoliday = BHUTANESE_HOLIDAYS.FIXED_HOLIDAYS.some(
    holiday => holiday.date === dateStr
  );
  
  if (isFixedHoliday) {
    return BHUTANESE_HOLIDAYS.FIXED_HOLIDAYS.find(
      holiday => holiday.date === dateStr
    );
  }
  
  // Check lunar holidays
  const isLunarHoliday = BHUTANESE_HOLIDAYS.LUNAR_HOLIDAYS.some(holiday => {
    if (holiday.date === dateStr) {
      return true;
    }
    // Check for multi-day holidays
    if (holiday.duration) {
      const holidayDate = new Date(`${year}-${holiday.date}`);
      const daysDiff = Math.floor((date - holidayDate) / (1000 * 60 * 60 * 24));
      return daysDiff >= 0 && daysDiff < holiday.duration;
    }
    return false;
  });
  
  if (isLunarHoliday) {
    return BHUTANESE_HOLIDAYS.LUNAR_HOLIDAYS.find(holiday => {
      if (holiday.date === dateStr) return true;
      if (holiday.duration) {
        const holidayDate = new Date(`${year}-${holiday.date}`);
        const daysDiff = Math.floor((date - holidayDate) / (1000 * 60 * 60 * 24));
        return daysDiff >= 0 && daysDiff < holiday.duration;
      }
      return false;
    });
  }
  
  return null;
};

// Function to get upcoming holidays within a date range
export const getUpcomingHolidays = (startDate, endDate) => {
  const holidays = [];
  const currentDate = new Date(startDate);
  const lastDate = new Date(endDate);
  
  while (currentDate <= lastDate) {
    const holiday = isHoliday(currentDate);
    if (holiday) {
      holidays.push({
        ...holiday,
        date: new Date(currentDate)
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return holidays;
};

// Function to get holiday-adjusted schedule
export const getHolidayAdjustedSchedule = (date, originalSchedule) => {
  const holiday = isHoliday(date);
  if (!holiday) return originalSchedule;
  
  // Return adjusted schedule based on holiday type
  // This is a placeholder - you would implement specific adjustment rules
  return {
    ...originalSchedule,
    isHoliday: true,
    holidayName: holiday.name,
    adjusted: true,
    // Add any specific schedule adjustments here
  };
};

// Function to format holiday message
export const formatHolidayMessage = (holiday) => {
  if (!holiday) return null;
  
  return {
    type: 'holiday',
    message: `${holiday.name} - Classes may be adjusted or cancelled. Please check with your teachers for schedule changes.`,
    icon: '🎉',
    date: holiday.date
  };
}; 