'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useRouter } from 'next/navigation';

const localizer = momentLocalizer(moment);

interface Event {
  start: Date;
  end: Date;
  title: string;
}

const MyCalendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedEvents = localStorage.getItem('events');
      if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents);
        if (Array.isArray(parsedEvents)) {
          const rehydratedEvents = parsedEvents.map((event: any) => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end)
          }));
          setEvents(rehydratedEvents);
        } else {
          console.error('Stored events is not an array, resetting storage');
          localStorage.setItem('events', JSON.stringify([]));
        }
      }
    } catch (error) {
      console.error('Error parsing localStorage events:', error);
      localStorage.setItem('events', JSON.stringify([]));
    }
  }, []);

  const handleSelectSlot = ({ start, end }: SlotInfo) => {
    const title = window.prompt('Enter event title');
    if (title) {
      const newEvent = { start, end, title };
      const updatedEvents = [...events, newEvent];

      setEvents(updatedEvents);
      localStorage.setItem('events', JSON.stringify(updatedEvents));
    }
  };

  const handleViewSelection = () => {
    router.push('/slots');
  };

  return (
    <div>
      <Calendar
        localizer={localizer}
        events={events}
        selectable
        onSelectSlot={handleSelectSlot}
        defaultView="week"
        views={['week']}
        step={60}
        showMultiDayTimes
        style={{ height: 500 }}
      />
      <button onClick={handleViewSelection}>View Time Slots</button>
    </div>
  );
};

export default MyCalendar;
