'use client';

import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface TimeSlot {
  start: Date;
  end: Date;
  title: string;
}

const TimeSlotsPage: React.FC = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    // 从本地存储获取事件数据
    const storedSlots = JSON.parse(localStorage.getItem('events') || '[]');
    setTimeSlots(storedSlots);
  }, []);

  const handleDateChange = (index: number, date: Date, isStart: boolean) => {
    const updatedSlots = [...timeSlots];
    if (isStart) {
      updatedSlots[index].start = date;
    } else {
      updatedSlots[index].end = date;
    }
    setTimeSlots(updatedSlots);
    saveUpdatedSlots(updatedSlots);
  };

  const handleDeleteEvent = (index: number) => {
    const updatedSlots = timeSlots.filter((_, i) => i !== index);
    setTimeSlots(updatedSlots);
    saveUpdatedSlots(updatedSlots);
    if (updatedSlots.length === 0) {
      if (window.confirm('所有事件已删除。是否清空本地存储中的事件数据？')) {
        localStorage.removeItem('events');
      }
    }
  };

  const saveUpdatedSlots = (updatedSlots: TimeSlot[]) => {
    localStorage.setItem('events', JSON.stringify(updatedSlots));
  };

  const renderTimeSlots = () => {
    return timeSlots.map((slot, index) => {
      const startDate = new Date(slot.start);
      const endDate = new Date(slot.end);
      const dates = [];
      while (startDate < endDate) {
        const nextDate = new Date(startDate);
        nextDate.setHours(startDate.getHours() + 1);
        dates.push({ start: new Date(startDate), end: nextDate });
        startDate.setHours(startDate.getHours() + 1);
      }
      return (
        <div key={index} style={{ display: 'flex', justifyContent: 'center' }}>
          <div>
            {dates.map((date, idx) => (
              <div key={idx} style={{ display: 'flex' }}>
                <DatePicker
                  selected={date.start}
                  onChange={(date: Date) => handleDateChange(index, date, true)}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                  style={{ marginRight: '10px' }}
                />
                <DatePicker
                  selected={date.end}
                  onChange={(date: Date) => handleDateChange(index, date, false)}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                />
              </div>
            ))}
            <button onClick={() => handleDeleteEvent(index)}>删除事件</button>
          </div>
        </div>
      );
    });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
      {renderTimeSlots()}
    </div>
  );
};

export default TimeSlotsPage;
