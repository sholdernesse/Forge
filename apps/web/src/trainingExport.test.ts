import { describe, expect, it } from 'vitest';
import { trainingHistoryCsv, trainingHistoryExcelFilename, trainingHistoryExcelXml, trainingHistoryExportFilename } from './trainingExport.js';

describe('training history export', () => {
  it('exports chronological session, feedback, muscle, and exercise context', () => {
    const csv = trainingHistoryCsv([
      { workoutId: 'new', date: '2026-08-12', title: 'Upper', durationMinutes: 52, muscleSets: { triceps: 3, chest: 4 }, perceivedExertion: 8, discomfort: 'mild', feedbackNote: 'Shoulder felt tight.', exerciseSummaries: [{ exerciseId: 'bench', name: 'Bench press', completedSets: 3, totalSets: 4 }] },
      { workoutId: 'old', date: '2026-08-08', title: 'Recovery', durationMinutes: 30, muscleSets: {} },
    ]);
    const lines = csv.trim().split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('"2026-08-08","Recovery","30"');
    expect(lines[2]).toContain('"chest: 4; triceps: 3"');
    expect(lines[2]).toContain('"Bench press (3/4 sets)"');
  });

  it('escapes quotes, line breaks, and spreadsheet formula prefixes', () => {
    const csv = trainingHistoryCsv([{ workoutId: 'unsafe', date: '2026-08-12', title: '=HYPERLINK("bad")', durationMinutes: 10, muscleSets: {}, feedbackNote: 'line one\nline "two"' }]);
    expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
    expect(csv).toContain('"line one\nline ""two"""');
  });

  it('uses only an ISO date in the exported filename', () => {
    expect(trainingHistoryExportFilename('2026-08-12')).toBe('forge-training-history-2026-08-12.csv');
    expect(trainingHistoryExportFilename('../unsafe')).toBe('forge-training-history-export.csv');
    expect(trainingHistoryExcelFilename('2026-08-12')).toBe('forge-training-history-2026-08-12.xml');
    expect(trainingHistoryExportFilename('2026-08-12', 'current-view')).toBe('forge-training-history-current-view-2026-08-12.csv');
    expect(trainingHistoryExcelFilename('2026-08-12', 'current-view')).toBe('forge-training-history-current-view-2026-08-12.xml');
  });

  it('creates a styled two-sheet Excel workbook with frozen headers and filters', () => {
    const xml = trainingHistoryExcelXml([{ workoutId: 'one', date: '2026-08-12', title: 'Upper', durationMinutes: 52, muscleSets: { chest: 4 }, perceivedExertion: 8, discomfort: 'mild' }], '2026-08-12');
    expect(xml).toContain('<Worksheet ss:Name="Summary">');
    expect(xml).toContain('<Worksheet ss:Name="Sessions">');
    expect(xml).toContain('<Style ss:ID="Title">');
    expect(xml).toContain('<Style ss:ID="Caution"');
    expect(xml).toContain('<FreezePanes/>');
    expect(xml).toContain('<AutoFilter');
    expect(xml).toContain('ss:Type="Number">52</Data>');
  });
});
