import { apiClient } from '@/lib/api-client';

export const reportService = {
  async createReport(dto: { targetType: string; targetId: number; content: string }) {
    return apiClient.post('/reports', dto);
  },

  async getPendingReports() {
    return apiClient.get('/reports');
  },

  async resolveReport(reportId: number) {
    return apiClient.post(`/reports/${reportId}/resolve`);
  },

  async dismissReport(reportId: number) {
    return apiClient.post(`/reports/${reportId}/dismiss`);
  },
};
