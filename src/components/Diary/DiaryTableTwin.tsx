import { memo } from 'react';
import type { HealthDiaryEntry } from '@/types/diary';

export const DiaryTableTwin = memo(function DiaryTableTwin({ entries }: { entries: HealthDiaryEntry[] }) {
  return (
    <div className="sr-only" aria-label="30-day health symptom and AQI history table">
      <h4>Screen Reader Twin: 30-Day Health Diary and Air Quality Log</h4>
      <table>
        <caption>Daily breakdown of ambient AQI alongside logged cough, eye irritation, and breathlessness scores</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">AQI</th>
            <th scope="col">Cough (0-3)</th>
            <th scope="col">Eye Irritation (0-3)</th>
            <th scope="col">Breathlessness (0-3)</th>
            <th scope="col">Total Symptoms (0-9)</th>
            <th scope="col">Notes</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.date}</td>
              <td>{entry.aqi}</td>
              <td>{entry.cough}</td>
              <td>{entry.eyeIrritation}</td>
              <td>{entry.breathlessness}</td>
              <td>{entry.totalScore}</td>
              <td>{entry.notes || 'None'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
