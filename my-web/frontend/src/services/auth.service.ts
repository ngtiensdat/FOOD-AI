const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const authService = {
    async getProfile(userId: number, requesterId?: number) {
        const url = requesterId 
            ? `${API_URL}/auth/profile/${userId}?requesterId=${requesterId}`
            : `${API_URL}/auth/profile/${userId}`;
        const response = await fetch(url);
        return response.json();
    },

    async updateProfile(data: any) {
        const response = await fetch(`${API_URL}/auth/update-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return response.json();
    },

    async completeOnboarding(data: { userId: number, preferences: any }) {
        const response = await fetch(`${API_URL}/auth/complete-onboarding`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return response.json();
    },
};
