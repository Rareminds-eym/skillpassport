import { useState, useMemo, useCallback } from 'react';
import { CalendarDay, CalendarView, CollegeEvent, WeekEvent } from '../types';
import { toDateStr } from '../helpers';

export const useCalendar = (events: CollegeEvent[]) => {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('month');

  // Get calendar weeks for month view (Monday start)
  const getCalendarWeeks = useMemo((): CalendarDay[][] => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    let startingDay = firstDay.getDay() - 1;
    if (startingDay < 0) startingDay = 6;

    const weeks: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      currentWeek.push({ day, isCurrentMonth: false, date: new Date(year, month - 1, day) });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push({ day, isCurrentMonth: true, date: new Date(year, month, day) });
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    let nextDay = 1;
    while (currentWeek.length < 7 && currentWeek.length > 0) {
      currentWeek.push({
        day: nextDay,
        isCurrentMonth: false,
        date: new Date(year, month + 1, nextDay),
      });
      nextDay++;
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return weeks;
  }, [calendarDate]);

  // Get week days for week view
  const getWeekDays = useMemo(() => {
    const startOfWeek = new Date(calendarDate);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  }, [calendarDate]);

  // Get events for a week with spanning info
  const getWeekEvents = useCallback(
    (week: CalendarDay[]): WeekEvent[] => {
      const weekStartStr = toDateStr(week[0].date);
      const weekEndStr = toDateStr(week[6].date);

      return events
        .filter((event) => {
          const eventStartStr = event.start_date.split('T')[0];
          const eventEndStr = event.end_date.split('T')[0];
          return eventStartStr <= weekEndStr && eventEndStr >= weekStartStr;
        })
        .map((event) => {
          const eventStartStr = event.start_date.split('T')[0];
          const eventEndStr = event.end_date.split('T')[0];

          let startCol = 0;
          for (let i = 0; i < 7; i++) {
            const dayStr = toDateStr(week[i].date);
            if (dayStr >= eventStartStr) {
              startCol = i;
              break;
            }
          }
          if (eventStartStr < weekStartStr) startCol = 0;

          let span = 0;
          for (let i = startCol; i < 7; i++) {
            const dayStr = toDateStr(week[i].date);
            if (dayStr <= eventEndStr) span++;
            else break;
          }
          if (span === 0) span = 1;

          const isEventStart = eventStartStr >= weekStartStr && eventStartStr <= weekEndStr;
          const isEventEnd = eventEndStr >= weekStartStr && eventEndStr <= weekEndStr;

          return { event, startCol, span, isEventStart, isEventEnd };
        });
    },
    [events]
  );

  // Navigation
  const prevMonth = () =>
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  const nextMonth = () =>
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  const prevWeek = () =>
    setCalendarDate(new Date(calendarDate.getTime() - 7 * 24 * 60 * 60 * 1000));
  const nextWeek = () =>
    setCalendarDate(new Date(calendarDate.getTime() + 7 * 24 * 60 * 60 * 1000));
  const prevDay = () => setCalendarDate(new Date(calendarDate.getTime() - 24 * 60 * 60 * 1000));
  const nextDay = () => setCalendarDate(new Date(calendarDate.getTime() + 24 * 60 * 60 * 1000));
  const goToToday = () => setCalendarDate(new Date());

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

  return {
    calendarDate,
    calendarView,
    setCalendarView,
    getCalendarWeeks,
    getWeekDays,
    getWeekEvents,
    prevMonth,
    nextMonth,
    prevWeek,
    nextWeek,
    prevDay,
    nextDay,
    goToToday,
    isToday,
  };
};
