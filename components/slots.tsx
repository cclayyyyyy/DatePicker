'use client';

import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';

interface TimeSlot {
  start: Date;
  end: Date;
  title: string;
}

interface OneHourSegment {
  eventIndex: number;
  start: Date;
  end: Date;
}

function formatHour(hour: number): string {
  const h = hour % 12;
  const displayHour = h === 0 ? 12 : h;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${displayHour}:00 ${ampm}`;
}

const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${formatHour(i)} - ${formatHour((i + 1) % 24)}`,
}));

function mergeContinuousSegments(segments: { start: Date; end: Date }[]) {
  if (segments.length === 0) return [];
  const sorted = [...segments].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const seg = sorted[i];
    if (seg.start.getTime() === current.end.getTime()) {
      current.end = seg.end;
    } else {
      merged.push(current);
      current = { ...seg };
    }
  }
  merged.push(current);
  return merged;
}

export default function TimeSlotsPage() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('events');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const rehydrated = parsed.map((slot: any) => ({
            ...slot,
            start: new Date(slot.start),
            end: new Date(slot.end),
          }));
          setTimeSlots(rehydrated);
        }
      }
    } catch (error) {
      console.error('Error parsing localStorage events in TimeSlots:', error);
      localStorage.setItem('events', JSON.stringify([]));
    }
  }, []);

  const getAllSegments = (): OneHourSegment[] => {
    const segments: OneHourSegment[] = [];
    timeSlots.forEach((slot, eventIndex) => {
      const startDate = new Date(slot.start);
      const endDate = new Date(slot.end);
      while (startDate < endDate) {
        const nextDate = new Date(startDate);
        nextDate.setHours(startDate.getHours() + 1);
        if (nextDate > endDate) break;
        segments.push({
          eventIndex,
          start: new Date(startDate),
          end: new Date(nextDate),
        });
        startDate.setHours(startDate.getHours() + 1);
      }
    });
    segments.sort((a, b) => a.start.getTime() - b.start.getTime());
    return segments;
  };

  const getSelectedHourOptionIndex = (seg: OneHourSegment) => {
    return seg.start.getHours();
  };

  const handleDateChange = (seg: OneHourSegment, newDate: Date) => {
    const startHour = seg.start.getHours();
    const endHour = seg.end.getHours();
    const newStart = new Date(newDate);
    newStart.setHours(startHour, 0, 0, 0);
    const newEnd = new Date(newDate);
    newEnd.setHours(endHour, 0, 0, 0);
    updateEventTimeRange(seg.eventIndex, seg.start, seg.end, newStart, newEnd);
  };

  const handleHourChange = (seg: OneHourSegment, selectedOption: any) => {
    const newHourValue = selectedOption.value;
    const dateOnly = new Date(seg.start);
    dateOnly.setHours(0, 0, 0, 0);
    const newStart = new Date(dateOnly);
    newStart.setHours(newHourValue, 0, 0, 0);
    const newEnd = new Date(dateOnly);
    newEnd.setHours((newHourValue + 1) % 24, 0, 0, 0);
    updateEventTimeRange(seg.eventIndex, seg.start, seg.end, newStart, newEnd);
  };

  const updateEventTimeRange = (
    eventIndex: number,
    oldSegStart: Date,
    oldSegEnd: Date,
    newSegStart: Date,
    newSegEnd: Date
  ) => {
    const updated = [...timeSlots];
    if (!updated[eventIndex]) return;

    const slot = updated[eventIndex];
    const splitted: { start: Date; end: Date }[] = [];
    let cur = new Date(slot.start);
    while (cur < slot.end) {
      const nxt = new Date(cur);
      nxt.setHours(cur.getHours() + 1);
      if (nxt > slot.end) break;
      splitted.push({ start: new Date(cur), end: new Date(nxt) });
      cur.setHours(cur.getHours() + 1);
    }

    for (let i = 0; i < splitted.length; i++) {
      if (
        splitted[i].start.getTime() === oldSegStart.getTime() &&
        splitted[i].end.getTime() === oldSegEnd.getTime()
      ) {
        splitted[i] = { start: newSegStart, end: newSegEnd };
        break;
      }
    }

    splitted.sort((a, b) => a.start.getTime() - b.start.getTime());
    if (splitted.length > 0) {
      slot.start = splitted[0].start;
      slot.end = splitted[splitted.length - 1].end;
      updated[eventIndex] = slot;
    } else {
      updated.splice(eventIndex, 1);
    }

    setTimeSlots(updated);
    localStorage.setItem('events', JSON.stringify(updated));
  };

  const handleDeleteSegment = (seg: OneHourSegment) => {
    const eventIndex = seg.eventIndex;
    const updated = [...timeSlots];
    if (eventIndex < 0 || eventIndex >= updated.length) return;

    const originalSlot = updated[eventIndex];
    const splitted: { start: Date; end: Date }[] = [];
    let cur = new Date(originalSlot.start);
    
    while (cur < originalSlot.end) {
      const nextHour = new Date(cur);
      nextHour.setHours(cur.getHours() + 1);
      if (nextHour > originalSlot.end) break;
      splitted.push({ start: new Date(cur), end: new Date(nextHour) });
      cur = nextHour;
    }

    const filtered = splitted.filter(
      (s) => !(s.start.getTime() === seg.start.getTime() && s.end.getTime() === seg.end.getTime())
    );

    const mergedSegments = mergeContinuousSegments(filtered);
    const newTimeSlots = mergedSegments.map(seg => ({
      start: seg.start,
      end: seg.end,
      title: originalSlot.title || '',
    }));

    updated.splice(eventIndex, 1, ...newTimeSlots);
    const validUpdated = updated.filter(slot => slot.start < slot.end);

    setTimeSlots(validUpdated);
    localStorage.setItem('events', JSON.stringify(validUpdated));
  };

  const segments = getAllSegments();

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        Select Your Available Time Slots
      </h2>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>#</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Time</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((seg, idx) => (
            <tr 
              key={`${seg.start.getTime()}-${seg.end.getTime()}`} 
              style={{ borderBottom: '1px solid #eee' }}
            >
              <td style={{ padding: '8px' }}>{idx + 1}</td>
              <td style={{ padding: '8px' }}>
                <DatePicker
                  selected={seg.start}
                  onChange={(date: Date) => handleDateChange(seg, date)}
                  dateFormat="MMMM d, yyyy"
                />
              </td>
              <td style={{ padding: '8px' }}>
                <Select
                  value={hourOptions[getSelectedHourOptionIndex(seg)]}
                  onChange={(selectedOption) => handleHourChange(seg, selectedOption)}
                  options={hourOptions}
                  styles={{
                    control: (base: any) => ({
                      ...base,
                      padding: '8px 12px',
                      fontSize: '16px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      backgroundColor: '#f9f9f9',
                      cursor: 'pointer',
                    }),
                    option: (provided: any, state: any) => ({
                      ...provided,
                      padding: '10px 12px',
                      fontSize: '14px',
                      backgroundColor: state.isSelected ? '#007BFF' : provided.backgroundColor,
                      color: state.isSelected ? '#fff' : provided.color,
                    }),
                    dropdownIndicator: (provided: any) => ({
                      ...provided,
                      color: '#007BFF',
                    }),
                    indicatorSeparator: (provided: any) => ({
                      ...provided,
                      backgroundColor: '#007BFF',
                    }),
                  }}
                />
              </td>
              <td style={{ padding: '8px' }}>
                <button
                  onClick={() => handleDeleteSegment(seg)}
                  style={{
                    backgroundColor: '#f0ad4e',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Delete This Hour
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
