import { io, Socket } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiService {
  private socket: Socket | null = null;
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('straysafe_token');
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('straysafe_token', token);
  }

  // Remove authentication token
  removeToken() {
    this.token = null;
    localStorage.removeItem('straysafe_token');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Get headers with authentication
  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic API request method
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Authentication methods
  async register(userData: any) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(profileData: any) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Report methods
  async createReport(reportData: any) {
    return this.request('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async getReports(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports?${queryString}`);
  }

  async getReport(id: string) {
    return this.request(`/reports/${id}`);
  }

  async updateReport(id: string, updateData: any) {
    return this.request(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async addReportUpdate(id: string, updateData: any) {
    return this.request(`/reports/${id}/updates`, {
      method: 'POST',
      body: JSON.stringify(updateData),
    });
  }

  async assignReport(id: string, ngoId: string) {
    return this.request(`/reports/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ ngoId }),
    });
  }

  async getMyReports(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/my?${queryString}`);
  }

  // NGO methods
  async createNGOProfile(profileData: any) {
    return this.request('/ngos/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async updateNGOProfile(profileData: any) {
    return this.request('/ngos/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getNGOProfile(id: string) {
    return this.request(`/ngos/profile/${id}`);
  }

  async getNGOs(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/ngos?${queryString}`);
  }

  async getMyNGOReports(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/ngos/my/reports?${queryString}`);
  }

  async getNGOStats() {
    return this.request('/ngos/my/stats');
  }

  // File upload methods
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  async uploadImages(files: File[]) {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    const response = await fetch(`${API_BASE_URL}/upload/images`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  // Socket.IO methods
  connectSocket() {
    if (!this.token || this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: {
        token: this.token,
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return this.socket;
  }

  getSocket() {
    return this.socket;
  }

  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const apiService = new ApiService();