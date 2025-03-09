'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface Event {
  start: Date;
  end: Date;
  title?: string;
}

export default function MyCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('events');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const rehydrated = parsed.map((e: any) => ({
            ...e,
            start: new Date(e.start),
            end: new Date(e.end),
          }));
          setEvents(rehydrated);
        }
      }
    } catch (error) {
      console.error('Error parsing localStorage events:', error);
      localStorage.setItem('events', JSON.stringify([]));
    }
  }, []);

  const handleSelectSlot = ({ start, end }: SlotInfo) => {
    const newEvent = { start, end, title: '' };
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    localStorage.setItem('events', JSON.stringify(updatedEvents));
  };


  const handleViewSelection = () => {
    router.push('/slots');
  };

  const handleSelecting = (slotRange: { start: Date; end: Date }) => {
    const hasOverlap = events.some((event) => {
      return slotRange.start < event.end && slotRange.end > event.start;
    });
    return !hasOverlap;
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto' }}>
      <Calendar
        localizer={localizer}
        events={events}
        selectable
        onSelecting={handleSelecting}
        onSelectSlot={handleSelectSlot}
        defaultView="week"
        views={['week']}
        step={60}
        showMultiDayTimes
        style={{ height: 600 }}
      />
      <button 
        onClick={handleViewSelection}
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
        View Time Slots
      </button>

    </div>
  );
}
