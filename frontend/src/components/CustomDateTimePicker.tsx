import React, { useState, useEffect } from 'react';

interface CustomDateTimePickerProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({ value, onChange, className }) => {
  const [dateStr, setDateStr] = useState('');
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');
  const [ampm, setAmpm] = useState('AM');

  // Initialize from value prop once
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const localDate = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
        setDateStr(localDate);
        let h = d.getHours();
        setAmpm(h >= 12 ? 'PM' : 'AM');
        h = h % 12 || 12;
        setHours(h.toString().padStart(2, '0'));
        setMinutes(d.getMinutes().toString().padStart(2, '0'));
      }
    }
  }, []); // Only on mount to set initial values

  useEffect(() => {
    if (!dateStr) {
      onChange('');
      return;
    }
    let h = parseInt(hours, 10);
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    
    // Construct local date time string manually
    const newDate = new Date(`${dateStr}T${h.toString().padStart(2, '0')}:${minutes}:00`);
    if (!isNaN(newDate.getTime())) {
      onChange(newDate.toISOString());
    }
  }, [dateStr, hours, minutes, ampm]);

  return (
    <div style={{ display: 'flex', gap: '8px' }} className={className}>
      <input 
        type="date" 
        className="input-field" 
        style={{ flex: 2, padding: '10px' }} 
        value={dateStr} 
        onChange={e => setDateStr(e.target.value)} 
      />
      <select 
        className="input-field" 
        style={{ flex: 1, padding: '10px' }} 
        value={hours} 
        onChange={e => setHours(e.target.value)}
      >
        {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>:</span>
      <select 
        className="input-field" 
        style={{ flex: 1, padding: '10px' }} 
        value={minutes} 
        onChange={e => setMinutes(e.target.value)}
      >
        {Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0')).map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select 
        className="input-field" 
        style={{ flex: 1, padding: '10px' }} 
        value={ampm} 
        onChange={e => setAmpm(e.target.value)}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
};

export default CustomDateTimePicker;
