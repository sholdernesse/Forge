import type { MuscleGroup, TrainingSessionRecord } from './volumeLedger.js';
import { trainingTrendSummary } from './trainingAnalytics.js';

const headers = ['Date', 'Workout', 'Duration minutes', 'Perceived effort', 'Discomfort', 'Feedback note', 'Muscle volume', 'Exercises'];

export function trainingHistoryCsv(records: TrainingSessionRecord[]): string {
  const rows = [...records]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((record) => [
      record.date,
      record.title,
      String(record.durationMinutes),
      record.perceivedExertion === undefined ? '' : String(record.perceivedExertion),
      record.discomfort ?? '',
      record.feedbackNote ?? '',
      muscleSummary(record.muscleSets),
      record.exerciseSummaries?.map((exercise) => `${exercise.name} (${exercise.completedSets}/${exercise.totalSets} sets)`).join('; ') ?? '',
    ]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export type TrainingHistoryExportScope = 'all' | 'current-view';

export function trainingHistoryExportFilename(asOfDate: string, scope: TrainingHistoryExportScope = 'all'): string {
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(asOfDate) ? asOfDate : 'export';
  return `forge-training-history${scope === 'current-view' ? '-current-view' : ''}-${safeDate}.csv`;
}

export function trainingHistoryExcelFilename(asOfDate: string, scope: TrainingHistoryExportScope = 'all'): string {
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(asOfDate) ? asOfDate : 'export';
  return `forge-training-history${scope === 'current-view' ? '-current-view' : ''}-${safeDate}.xml`;
}

export function trainingHistoryExcelXml(records: TrainingSessionRecord[], asOfDate: string): string {
  const sorted = [...records].sort((left, right) => left.date.localeCompare(right.date));
  const trend = trainingTrendSummary(records, asOfDate);
  const sessionRows = sorted.map((record, index) => {
    const style = record.discomfort === 'stopped' ? 'Stopped' : record.discomfort === 'mild' ? 'Caution' : index % 2 ? 'AltRow' : 'DataRow';
    return `<Row ss:StyleID="${style}">${excelCell(`${record.date}T00:00:00.000`, 'DateTime', 'Date')}${excelCell(record.title)}${excelCell(record.durationMinutes, 'Number', 'Number')}${record.perceivedExertion === undefined ? '<Cell />' : excelCell(record.perceivedExertion, 'Number', 'Decimal')}${excelCell(record.discomfort ?? '')}${excelCell(record.feedbackNote ?? '')}${excelCell(muscleSummary(record.muscleSets))}${excelCell(record.exerciseSummaries?.map((exercise) => `${exercise.name} (${exercise.completedSets}/${exercise.totalSets} sets)`).join('; ') ?? '')}</Row>`;
  }).join('');
  const weekRows = trend.weeks.map((week, index) => `<Row ss:StyleID="${index % 2 ? 'AltRow' : 'DataRow'}">${excelCell(`${week.startDate}T00:00:00.000`, 'DateTime', 'Date')}${excelCell(week.sessions, 'Number', 'Number')}${excelCell(week.minutes, 'Number', 'Number')}</Row>`).join('');
  const effortValue = trend.averageEffort === undefined ? 'Not enough data' : `${trend.averageEffort}/10`;
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Title>Forge Training History</Title><Author>Forge</Author><Created>${escapeXml(`${asOfDate}T00:00:00.000Z`)}</Created></DocumentProperties>
<Styles>
<Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Aptos" ss:Size="10" ss:Color="#17342A"/></Style>
<Style ss:ID="Title"><Alignment ss:Vertical="Center"/><Font ss:FontName="Aptos Display" ss:Size="20" ss:Bold="1" ss:Color="#E9FFF1"/><Interior ss:Color="#0B2B20" ss:Pattern="Solid"/></Style>
<Style ss:ID="Subtitle"><Font ss:FontName="Aptos" ss:Size="10" ss:Color="#6F8F83"/><Interior ss:Color="#EAF5EF" ss:Pattern="Solid"/></Style>
<Style ss:ID="Section"><Font ss:FontName="Aptos Display" ss:Size="13" ss:Bold="1" ss:Color="#17342A"/><Interior ss:Color="#D8F2E2" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#63C98D"/></Borders></Style>
<Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Aptos" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#176B49" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0B2B20"/></Borders></Style>
<Style ss:ID="DataRow"><Alignment ss:Vertical="Top" ss:WrapText="1"/><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCE9E1"/></Borders></Style>
<Style ss:ID="AltRow" ss:Parent="DataRow"><Interior ss:Color="#F3F9F5" ss:Pattern="Solid"/></Style>
<Style ss:ID="Caution" ss:Parent="DataRow"><Interior ss:Color="#FFF4D6" ss:Pattern="Solid"/><Font ss:FontName="Aptos" ss:Size="10" ss:Color="#6E5314"/></Style>
<Style ss:ID="Stopped" ss:Parent="DataRow"><Interior ss:Color="#FDE8E3" ss:Pattern="Solid"/><Font ss:FontName="Aptos" ss:Size="10" ss:Color="#8A3022"/></Style>
<Style ss:ID="KpiLabel"><Font ss:FontName="Aptos" ss:Size="9" ss:Bold="1" ss:Color="#527165"/><Interior ss:Color="#EAF5EF" ss:Pattern="Solid"/></Style>
<Style ss:ID="KpiValue"><Font ss:FontName="Aptos Display" ss:Size="16" ss:Bold="1" ss:Color="#176B49"/><Interior ss:Color="#EAF5EF" ss:Pattern="Solid"/></Style>
<Style ss:ID="Date"><NumberFormat ss:Format="mmm d, yyyy"/></Style><Style ss:ID="Number"><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="#,##0"/></Style><Style ss:ID="Decimal"><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="0.0"/></Style>
</Styles>
<Worksheet ss:Name="Summary"><Table ss:ExpandedColumnCount="4" ss:ExpandedRowCount="${11 + trend.weeks.length}" x:FullColumns="1" x:FullRows="1"><Column ss:Width="150"/><Column ss:Width="110"/><Column ss:Width="150"/><Column ss:Width="110"/>
<Row ss:Height="34"><Cell ss:StyleID="Title" ss:MergeAcross="3"><Data ss:Type="String">FORGE · TRAINING HISTORY</Data></Cell></Row>
<Row ss:Height="22"><Cell ss:StyleID="Subtitle" ss:MergeAcross="3"><Data ss:Type="String">Four-week snapshot through ${escapeXml(asOfDate)} · generated locally in your browser</Data></Cell></Row><Row/>
<Row><Cell ss:StyleID="KpiLabel"><Data ss:Type="String">SESSIONS</Data></Cell><Cell ss:StyleID="KpiValue"><Data ss:Type="Number">${trend.sessions}</Data></Cell><Cell ss:StyleID="KpiLabel"><Data ss:Type="String">TOTAL MINUTES</Data></Cell><Cell ss:StyleID="KpiValue"><Data ss:Type="Number">${trend.minutes}</Data></Cell></Row>
<Row><Cell ss:StyleID="KpiLabel"><Data ss:Type="String">AVERAGE EFFORT</Data></Cell><Cell ss:StyleID="KpiValue"><Data ss:Type="String">${escapeXml(effortValue)}</Data></Cell><Cell ss:StyleID="KpiLabel"><Data ss:Type="String">FEEDBACK COVERAGE</Data></Cell><Cell ss:StyleID="KpiValue"><Data ss:Type="String">${trend.feedbackCoverage}%</Data></Cell></Row>
<Row><Cell ss:StyleID="KpiLabel"><Data ss:Type="String">ACTIVE WEEKS</Data></Cell><Cell ss:StyleID="KpiValue"><Data ss:Type="String">${trend.activeWeeks}/4</Data></Cell><Cell ss:StyleID="KpiLabel"><Data ss:Type="String">DISCOMFORT SESSIONS</Data></Cell><Cell ss:StyleID="KpiValue"><Data ss:Type="Number">${trend.discomfortSessions}</Data></Cell></Row><Row/>
<Row><Cell ss:StyleID="Section" ss:MergeAcross="3"><Data ss:Type="String">WEEKLY CONSISTENCY</Data></Cell></Row><Row ss:StyleID="Header"><Cell><Data ss:Type="String">Week starting</Data></Cell><Cell><Data ss:Type="String">Sessions</Data></Cell><Cell><Data ss:Type="String">Minutes</Data></Cell><Cell><Data ss:Type="String">Activity</Data></Cell></Row>
${weekRows.replaceAll('</Row>', '<Cell><Data ss:Type="String">●</Data></Cell></Row>')}<Row/><Row><Cell ss:StyleID="Subtitle" ss:MergeAcross="3"><Data ss:Type="String">Discomfort is a planning signal, not an injury diagnosis. Missing feedback is never treated as low effort.</Data></Cell></Row>
</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><DoNotDisplayGridlines/><FreezePanes/><FrozenNoSplit/><SplitHorizontal>2</SplitHorizontal><TopRowBottomPane>2</TopRowBottomPane></WorksheetOptions></Worksheet>
<Worksheet ss:Name="Sessions"><Table ss:ExpandedColumnCount="8" ss:ExpandedRowCount="${4 + sorted.length}" x:FullColumns="1" x:FullRows="1"><Column ss:Width="85"/><Column ss:Width="165"/><Column ss:Width="80"/><Column ss:Width="80"/><Column ss:Width="100"/><Column ss:Width="220"/><Column ss:Width="170"/><Column ss:Width="260"/>
<Row ss:Height="34"><Cell ss:StyleID="Title" ss:MergeAcross="7"><Data ss:Type="String">FORGE · COMPLETED SESSIONS</Data></Cell></Row><Row ss:Height="22"><Cell ss:StyleID="Subtitle" ss:MergeAcross="7"><Data ss:Type="String">Validated training history · ${sorted.length} retained session${sorted.length === 1 ? '' : 's'}</Data></Cell></Row><Row/>
<Row ss:StyleID="Header" ss:Height="30">${headers.map((header) => excelCell(header)).join('')}</Row>${sessionRows}</Table><AutoFilter x:Range="R4C1:R${Math.max(4, 4 + sorted.length)}C8" xmlns="urn:schemas-microsoft-com:office:excel"/><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><DoNotDisplayGridlines/><FreezePanes/><FrozenNoSplit/><SplitHorizontal>4</SplitHorizontal><TopRowBottomPane>4</TopRowBottomPane><Selected/></WorksheetOptions></Worksheet>
</Workbook>`;
}

function excelCell(value: string | number, type: 'String' | 'Number' | 'DateTime' = 'String', style?: string): string {
  return `<Cell${style ? ` ss:StyleID="${style}"` : ''}><Data ss:Type="${type}">${escapeXml(String(value))}</Data></Cell>`;
}

function escapeXml(value: string): string {
  const protectedValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return protectedValue.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function muscleSummary(muscleSets: Partial<Record<MuscleGroup, number>>): string {
  return Object.entries(muscleSets)
    .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([muscle, sets]) => `${muscle}: ${sets}`)
    .join('; ');
}

function csvCell(value: string): string {
  const protectedValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${protectedValue.replaceAll('"', '""')}"`;
}
