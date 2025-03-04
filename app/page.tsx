'use client';

import React, { useState } from 'react';
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

  const handleSelectSlot = ({ start, end }: SlotInfo) => {
    const title = window.prompt('Enter event title');
    if (title) {
      const newEvent = { start, end, title };
      setEvents([...events, newEvent]);

      // 将事件保存到本地存储
      const storedEvents = JSON.parse(localStorage.getItem('events') || '[]');
      storedEvents.push(newEvent);
      localStorage.setItem('events', JSON.stringify(storedEvents));
    }
  };

  const handleViewSelection = () => {
    // 将事件数据转换为查询字符串
    const eventsParam = encodeURIComponent(JSON.stringify(events));
    // 使用 router.push 进行导航，并传递查询参数
    router.push(`/slots?events=${eventsParam}`);
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
      <button onClick={handleViewSelection}>View Selection</button>
    </div>
  );
};

export default MyCalendar;
