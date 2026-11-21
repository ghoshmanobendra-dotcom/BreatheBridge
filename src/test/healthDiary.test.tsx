// ============================================================
// src/test/healthDiary.test.tsx
// Vitest unit and integration tests for Health Diary feature
// Covers pure score math, 30-day SVG chart, .sr-only twin, per-user storage,
// weekly reports, and DOM interactions.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/App';
import { AppContextProvider } from '@/context/AppContext';
import { HealthDiary } from '@/components/Diary/HealthDiary';
import { DiaryChart } from '@/components/Diary/DiaryChart';
import { SymptomLogger } from '@/components/Diary/SymptomLogger';
import { WeeklyReportCard } from '@/components/Diary/WeeklyReportCard';
import {
  calculateTotalSymptomScore,
  generateSample30DayDiary,
  computeWeeklyReport,
  computeDiaryChartCoordinates,
} from '@/lib/compute/diaryAnalytics';
import { storageService } from '@/services/storageService';
import type { HealthDiaryEntry } from '@/types/diary';

describe('Health Diary Pure Mathematics & Algorithms', () => {
  it('calculateTotalSymptomScore correctly sums symptom values from 0 to 9', () => {
    expect(calculateTotalSymptomScore(0, 0, 0)).toBe(0);
    expect(calculateTotalSymptomScore(1, 2, 1)).toBe(4);
    expect(calculateTotalSymptomScore(3, 3, 3)).toBe(9);
  });

  it('calculateTotalSymptomScore throws RangeError on scores < 0 or > 3', () => {
    // @ts-expect-error testing invalid input
    expect(() => calculateTotalSymptomScore(-1, 2, 2)).toThrow(RangeError);
    // @ts-expect-error testing invalid input
    expect(() => calculateTotalSymptomScore(2, 4, 1)).toThrow(RangeError);
    // @ts-expect-error testing invalid input
    expect(() => calculateTotalSymptomScore(0, 0, 5)).toThrow(RangeError);
  });

  it('generateSample30DayDiary generates exactly 30 entries with valid scores', () => {
    const diary = generateSample30DayDiary('test-user-123', 150);
    expect(diary.length).toBe(30);

    for (const entry of diary) {
      expect(entry.userId).toBe('test-user-123');
      expect(entry.cough).toBeGreaterThanOrEqual(0);
      expect(entry.cough).toBeLessThanOrEqual(3);
      expect(entry.eyeIrritation).toBeGreaterThanOrEqual(0);
      expect(entry.eyeIrritation).toBeLessThanOrEqual(3);
      expect(entry.breathlessness).toBeGreaterThanOrEqual(0);
      expect(entry.breathlessness).toBeLessThanOrEqual(3);
      expect(entry.totalScore).toBe(entry.cough + entry.eyeIrritation + entry.breathlessness);
      expect(entry.aqi).toBeGreaterThan(0);
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('computeWeeklyReport calculates correct 7-day averages and identifies peak day', () => {
    const entries: HealthDiaryEntry[] = [
      { id: '1', userId: 'u1', date: '2026-11-15', timestamp: 1, cough: 1, eyeIrritation: 1, breathlessness: 1, totalScore: 3, aqi: 100 },
      { id: '2', userId: 'u1', date: '2026-11-16', timestamp: 2, cough: 2, eyeIrritation: 2, breathlessness: 2, totalScore: 6, aqi: 180 },
      { id: '3', userId: 'u1', date: '2026-11-17', timestamp: 3, cough: 3, eyeIrritation: 3, breathlessness: 3, totalScore: 9, aqi: 250 },
    ];

    const report = computeWeeklyReport(entries);
    expect(report.totalEntries).toBe(3);
    expect(report.averageAqi).toBe(Math.round((100 + 180 + 250) / 3));
    expect(report.averageCough).toBe(2);
    expect(report.averageEyeIrritation).toBe(2);
    expect(report.averageBreathlessness).toBe(2);
    expect(report.averageTotalSymptomScore).toBe(6);
    expect(report.peakSymptomDay).toEqual({ date: '2026-11-17', score: 9, aqi: 250 });
    expect(report.clinicalAdvisory).toContain('physician');
  });

  it('computeWeeklyReport gracefully handles empty array', () => {
    const report = computeWeeklyReport([]);
    expect(report.totalEntries).toBe(0);
    expect(report.averageAqi).toBe(0);
    expect(report.peakSymptomDay).toBeNull();
  });

  it('computeDiaryChartCoordinates calculates valid SVG paths and point mappings', () => {
    const entries = generateSample30DayDiary('user-abc', 120);
    const chart = computeDiaryChartCoordinates(entries, 700, 240);

    expect(chart.points.length).toBe(30);
    expect(chart.aqiPath.startsWith('M')).toBe(true);
    expect(chart.symptomPath.startsWith('M')).toBe(true);
    expect(chart.maxAqi).toBeGreaterThanOrEqual(120);

    // Verify coordinates stay within the SVG canvas boundaries
    for (const pt of chart.points) {
      expect(pt.x).toBeGreaterThanOrEqual(40);
      expect(pt.x).toBeLessThanOrEqual(700);
      expect(pt.yAqi).toBeGreaterThanOrEqual(20);
      expect(pt.yAqi).toBeLessThanOrEqual(240);
      expect(pt.ySymptom).toBeGreaterThanOrEqual(20);
      expect(pt.ySymptom).toBeLessThanOrEqual(240);
    }
  });

  it('computeDiaryChartCoordinates handles empty entries', () => {
    const chart = computeDiaryChartCoordinates([]);
    expect(chart.points).toEqual([]);
    expect(chart.aqiPath).toBe('');
    expect(chart.symptomPath).toBe('');
  });
});

describe('Per-User Storage Isolation (firestore.rules pattern)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('isolates health diary entries per user ID', () => {
    const user1Entries: HealthDiaryEntry[] = [
      { id: 'd1', userId: 'user-alpha', date: '2026-11-01', timestamp: 1000, cough: 1, eyeIrritation: 0, breathlessness: 0, totalScore: 1, aqi: 80 },
    ];
    const user2Entries: HealthDiaryEntry[] = [
      { id: 'd2', userId: 'user-beta', date: '2026-11-01', timestamp: 1000, cough: 3, eyeIrritation: 3, breathlessness: 3, totalScore: 9, aqi: 290 },
    ];

    storageService.saveHealthDiary(user1Entries, 'user-alpha');
    storageService.saveHealthDiary(user2Entries, 'user-beta');

    const retrieved1 = storageService.getHealthDiary('user-alpha');
    const retrieved2 = storageService.getHealthDiary('user-beta');

    expect(retrieved1.length).toBe(1);
    expect(retrieved1[0].userId).toBe('user-alpha');
    expect(retrieved1[0].totalScore).toBe(1);

    expect(retrieved2.length).toBe(1);
    expect(retrieved2[0].userId).toBe('user-beta');
    expect(retrieved2[0].totalScore).toBe(9);
  });

  it('addHealthDiaryEntry calculates total score and saves entry', () => {
    const newEntry = storageService.addHealthDiaryEntry(
      {
        userId: 'patient-42',
        date: '2026-11-20',
        cough: 2,
        eyeIrritation: 1,
        breathlessness: 2,
        aqi: 175,
        notes: 'Cold morning air trigger',
      },
      'patient-42'
    );

    expect(newEntry.totalScore).toBe(5);
    expect(newEntry.userId).toBe('patient-42');

    const stored = storageService.getHealthDiary('patient-42');
    expect(stored.some((e) => e.date === '2026-11-20' && e.totalScore === 5)).toBe(true);
  });
});

describe('HealthDiary Component Rendering & Accessibility', () => {
  it('renders section landmark and main heading', () => {
    render(
      <AppContextProvider>
        <HealthDiary />
      </AppContextProvider>
    );

    expect(screen.getByLabelText('Health Diary & Symptom Tracker')).toBeInTheDocument();
    expect(screen.getByText(/Health Diary & Smog Reaction Tracker/i)).toBeInTheDocument();
  });

  it('renders DiaryChart with 30-day SVG and required .sr-only twin table', () => {
    const entries = generateSample30DayDiary('test-twin', 140);
    render(<DiaryChart entries={entries} />);

    // Screen reader only twin representation
    const srTwin = screen.getByLabelText('30-day health symptom and AQI history table');
    expect(srTwin).toBeInTheDocument();
    expect(srTwin).toHaveClass('sr-only');

    // Table rows correspond to entries
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    expect(screen.getByText(/Daily breakdown of ambient AQI/i)).toBeInTheDocument();
  });

  it('SymptomLogger allows changing symptom levels and submitting', () => {
    const onSave = vi.fn();
    render(<SymptomLogger currentAqi={160} zoneName="Central Zone" onSave={onSave} />);

    // Select Moderate cough (value 2)
    const coughButtons = screen.getAllByRole('radio', { name: /2/ });
    fireEvent.click(coughButtons[0]);

    // Save log
    const submitBtn = screen.getByRole('button', { name: /Save Today's Log/i });
    fireEvent.click(submitBtn);

    expect(onSave).toHaveBeenCalled();
  });

  it('WeeklyReportCard triggers download and print workflows', () => {
    const summary = computeWeeklyReport(generateSample30DayDiary('rep-u', 150));
    const entries = generateSample30DayDiary('rep-u', 150);

    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<WeeklyReportCard summary={summary} entries={entries} zoneName="Eco-Park" />);

    // Print button
    const printBtn = screen.getByRole('button', { name: /Print weekly health summary/i });
    fireEvent.click(printBtn);
    expect(printSpy).toHaveBeenCalled();

    // Download button
    const downloadBtn = screen.getByRole('button', { name: /Download weekly report as text file/i });
    expect(downloadBtn).toBeInTheDocument();
    fireEvent.click(downloadBtn);
    expect(clickSpy).toHaveBeenCalled();

    printSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it('switches to Health Diary tab from main navigation', () => {
    render(<App />);

    const diaryTab = screen.getAllByRole('tab', { name: /Health Diary/i })[0];
    expect(diaryTab).toBeInTheDocument();
    fireEvent.click(diaryTab);

    expect(screen.getByLabelText('Health Diary & Symptom Tracker')).toBeInTheDocument();
  });
});
