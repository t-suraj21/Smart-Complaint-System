import React, { useEffect, useMemo, useState } from 'react';

const NOTES = [
  'Small complaints solved early prevent big campus problems later.',
  'Speak up. Better classrooms and hostels start with your voice.',
  'Every report helps make campus life safer and smarter.',
  'From WiFi to wellbeing, your feedback drives real action.',
  'Raise concerns confidently and let the system prioritize them.',
  'Transparent tracking builds trust between students and staff.',
];

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [index, setIndex] = useState(0);

  const startIndex = useMemo(() => Math.floor(Math.random() * NOTES.length), []);

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  useEffect(() => {
    if (!visible) return undefined;

    const noteTimer = setInterval(() => {
      setIndex((prev) => (prev + 1) % NOTES.length);
    }, 760);

    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 3200);

    return () => {
      clearInterval(noteTimer);
      clearTimeout(hideTimer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="splash-wrap" role="status" aria-live="polite" aria-label="Loading Smart Complaint System">
      <div className="splash-grid" />
      <div className="splash-card">
        <span className="splash-pill">Smart Complaint System</span>
        <h1 className="splash-title">Turning student voices into action</h1>
        <p key={index} className="splash-note">{NOTES[index]}</p>
        <div className="splash-loader" aria-hidden="true" />
      </div>
    </div>
  );
}
