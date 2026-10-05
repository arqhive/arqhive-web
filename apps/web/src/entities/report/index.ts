// entities/report: "제보"라는 업무 개념. GitHub 이슈에서 읽은 제보와 그 표시(카드).
export { fetchReports } from './api/fetch-reports.ts';
export type { Report } from './model/report.ts';
export { ReportCard } from './ui/report-card.tsx';
