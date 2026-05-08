const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
};


export const authService = {
    async getProfile(userId: number, requesterId?: number) {
        const url = requesterId 
            ? `${API_URL}/auth/profile/${userId}?requesterId=${requesterId}`
            : `${API_URL}/auth/profile/${userId}`;
        const response = await fetch(url);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Lỗi khi tải thông tin cá nhân');
        }
        return response.json();
    },

    async updateProfile(data: any) {
        const response = await fetch(`${API_URL}/auth/update-profile`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Lỗi khi cập nhật thông tin');
        }
        return response.json();
    },

    async completeOnboarding(data: { userId: number, preferences: any }) {
        const response = await fetch(`${API_URL}/auth/complete-onboarding`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Lỗi khi lưu thông tin onboarding');
        }
        return response.json();
    },
};
