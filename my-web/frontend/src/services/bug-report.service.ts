import { apiClient } from '@/lib/api-client';

export const bugReportService = {
  async createBugReport(dto: {
    category: string;
    description: string;
    imageUrl?: string;
  }) {
    return apiClient.post('/bug-reports', dto);
  },

  async getBugReports() {
    return apiClient.get('/bug-reports');
  },
};
