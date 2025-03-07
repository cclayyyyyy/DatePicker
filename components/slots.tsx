'use client';

import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface TimeSlot {
  start: Date;
  end: Date;
  title: string;
}

export default function TimeSlotsPage() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // ====== 样式对象（可根据喜好移到 CSS 文件里） ======
  const containerStyle: React.CSSProperties = {
    maxWidth: '600px',
    margin: '20px auto',
    border: '1px solid #ccc',
    padding: '20px',
    borderRadius: '8px',
  };

  const headingStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '20px',
  };

  const eventContainerStyle: React.CSSProperties = {
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '1px solid #eee',
  };

  const slotRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
  };

  const slotLabelStyle: React.CSSProperties = {
    marginRight: '10px',
    fontWeight: 'bold',
  };

  const deleteButtonStyle: React.CSSProperties = {
    marginTop: '10px',
    backgroundColor: '#d9534f',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
  };

  // ====== 从 localStorage 读取并转换为 Date 对象 ======
  useEffect(() => {
    try {
      const storedSlots = localStorage.getItem('events');
      if (storedSlots) {
        const parsedSlots = JSON.parse(storedSlots);
        if (Array.isArray(parsedSlots)) {
          // 把字符串转换成 Date 对象
          const rehydratedSlots = parsedSlots.map((slot: any) => ({
            ...slot,
            start: new Date(slot.start),
            end: new Date(slot.end),
          }));
          setTimeSlots(rehydratedSlots);
        }
      }
    } catch (error) {
      console.error('Error parsing localStorage events in TimeSlots:', error);
      localStorage.setItem('events', JSON.stringify([]));
    }
  }, []);

  // ====== 更新单个时段的开始或结束时间 ======
  const handleDateChange = (index: number, date: Date, isStart: boolean) => {
    const updatedSlots = [...timeSlots];
    if (isStart) {
      updatedSlots[index].start = date;
    } else {
      updatedSlots[index].end = date;
    }
    setTimeSlots(updatedSlots);
    localStorage.setItem('events', JSON.stringify(updatedSlots));
  };

  // ====== 删除整个“事件”（即用户在 Calendar 里一次性选的时段） ======
  const handleDeleteEvent = (index: number) => {
    const updatedSlots = timeSlots.filter((_, i) => i !== index);
    setTimeSlots(updatedSlots);
    localStorage.setItem('events', JSON.stringify(updatedSlots));
    if (updatedSlots.length === 0 && window.confirm('Clear event data from local storage?')) {
      localStorage.removeItem('events');
    }
  };

  // ====== 渲染逻辑：将每个事件拆分成多段 (1 小时为单位) ======
  const renderTimeSlots = () => {
    return timeSlots.map((slot, index) => {
      const startDate = new Date(slot.start);
      const endDate = new Date(slot.end);
      const hourSlots = [];

      // 把比如 1:00 - 3:00 拆分成 [1:00 - 2:00, 2:00 - 3:00]
      while (startDate < endDate) {
        const nextDate = new Date(startDate);
        nextDate.setHours(startDate.getHours() + 1);
        hourSlots.push({ start: new Date(startDate), end: nextDate });
        startDate.setHours(startDate.getHours() + 1);
      }

      return (
        <div key={index} style={eventContainerStyle}>
          <h3>Event {index + 1}</h3>
          {hourSlots.map((date, idx) => (
            <div key={idx} style={slotRowStyle}>
              <span style={slotLabelStyle}>Slot {idx + 1}:</span>
              <DatePicker
                selected={date.start}
                onChange={(newDate: Date) => handleDateChange(index, newDate, true)}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
              />
              <span style={{ margin: '0 10px' }}>to</span>
              <DatePicker
                selected={date.end}
                onChange={(newDate: Date) => handleDateChange(index, newDate, false)}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
              />
            </div>
          ))}

          <button onClick={() => handleDeleteEvent(index)} style={deleteButtonStyle}>
            Delete Event
          </button>
        </div>
      );
    });
  };

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Select Your Available Time Slots</h2>
      {renderTimeSlots()}
    </div>
  );
}
