import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface StrayReport {
  id: string;
  title: string;
  description: string;
  location: Location;
  photos: string[];
  status: 'reported' | 'in_progress' | 'rescued' | 'adopted';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  reportedBy: string;
  reportedAt: Date;
  updatedAt: Date;
  assignedNGO?: string;
  updates: Array<{
    id: string;
    message: string;
    timestamp: Date;
    author: string;
    photos?: string[];
  }>;
}

interface ReportsContextType {
  reports: StrayReport[];
  addReport: (report: Omit<StrayReport, 'id' | 'reportedAt' | 'updatedAt' | 'updates'>) => void;
  updateReport: (id: string, updates: Partial<StrayReport>) => void;
  addUpdate: (reportId: string, update: Omit<StrayReport['updates'][0], 'id' | 'timestamp'>) => void;
  getReportById: (id: string) => StrayReport | undefined;
  getNearbyReports: (location: Location, radius: number) => StrayReport[];
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export const useReports = () => {
  const context = useContext(ReportsContext);
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};

// Mock data for demonstration
const mockReports: StrayReport[] = [
  {
    id: '1',
    title: 'Injured Dog Near Park',
    description: 'Found an injured stray dog near Central Park. Appears to have a wounded leg and is limping. Very friendly but needs immediate medical attention.',
    location: {
      lat: 40.7829,
      lng: -73.9654,
      address: 'Central Park, New York, NY'
    },
    photos: [
      'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/58997/pexels-photo-58997.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    status: 'in_progress',
    urgency: 'high',
    tags: ['injured', 'dog', 'medical-attention'],
    reportedBy: 'Sarah Johnson',
    reportedAt: new Date('2024-01-10T10:30:00'),
    updatedAt: new Date('2024-01-10T14:20:00'),
    assignedNGO: 'NYC Animal Rescue',
    updates: [
      {
        id: '1',
        message: 'Report received. Team dispatched to location.',
        timestamp: new Date('2024-01-10T11:00:00'),
        author: 'NYC Animal Rescue'
      },
      {
        id: '2',
        message: 'Dog found and secured. Taking to veterinary clinic for treatment.',
        timestamp: new Date('2024-01-10T14:20:00'),
        author: 'Dr. Mike Wilson',
        photos: ['https://images.pexels.com/photos/4587998/pexels-photo-4587998.jpeg?auto=compress&cs=tinysrgb&w=800']
      }
    ]
  },
  {
    id: '2',
    title: 'Mother Cat with Kittens',
    description: 'Found a mother cat with 3 small kittens in an abandoned building. They appear healthy but need shelter and food.',
    location: {
      lat: 40.7505,
      lng: -73.9934,
      address: 'Brooklyn, NY'
    },
    photos: [
      'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    status: 'reported',
    urgency: 'medium',
    tags: ['cat', 'kittens', 'shelter-needed'],
    reportedBy: 'Maria Garcia',
    reportedAt: new Date('2024-01-11T08:15:00'),
    updatedAt: new Date('2024-01-11T08:15:00'),
    updates: []
  },
  {
    id: '3',
    title: 'Friendly Stray Looking for Home',
    description: 'Very friendly golden retriever mix, appears well-groomed. Might be lost rather than abandoned. No collar or tags visible.',
    location: {
      lat: 40.7614,
      lng: -73.9776,
      address: 'Times Square, New York, NY'
    },
    photos: [
      'https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    status: 'rescued',
    urgency: 'low',
    tags: ['dog', 'friendly', 'possible-lost-pet'],
    reportedBy: 'James Chen',
    reportedAt: new Date('2024-01-09T16:45:00'),
    updatedAt: new Date('2024-01-10T09:30:00'),
    assignedNGO: 'Best Friends Animal Society',
    updates: [
      {
        id: '1',
        message: 'Dog has been safely rescued and is being cared for at our facility.',
        timestamp: new Date('2024-01-10T09:30:00'),
        author: 'Best Friends Animal Society'
      }
    ]
  }
];

export const ReportsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<StrayReport[]>(mockReports);

  const addReport = (newReport: Omit<StrayReport, 'id' | 'reportedAt' | 'updatedAt' | 'updates'>) => {
    const report: StrayReport = {
      ...newReport,
      id: Date.now().toString(),
      reportedAt: new Date(),
      updatedAt: new Date(),
      updates: []
    };
    setReports(prev => [report, ...prev]);
  };

  const updateReport = (id: string, updates: Partial<StrayReport>) => {
    setReports(prev => prev.map(report => 
      report.id === id 
        ? { ...report, ...updates, updatedAt: new Date() }
        : report
    ));
  };

  const addUpdate = (reportId: string, update: Omit<StrayReport['updates'][0], 'id' | 'timestamp'>) => {
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? {
            ...report,
            updates: [...report.updates, {
              ...update,
              id: Date.now().toString(),
              timestamp: new Date()
            }],
            updatedAt: new Date()
          }
        : report
    ));
  };

  const getReportById = (id: string) => {
    return reports.find(report => report.id === id);
  };

  const getNearbyReports = (location: Location, radius: number) => {
    // Simple distance calculation for demo purposes
    return reports.filter(report => {
      const distance = Math.sqrt(
        Math.pow(report.location.lat - location.lat, 2) +
        Math.pow(report.location.lng - location.lng, 2)
      );
      return distance <= radius;
    });
  };

  const value: ReportsContextType = {
    reports,
    addReport,
    updateReport,
    addUpdate,
    getReportById,
    getNearbyReports
  };

  return (
    <ReportsContext.Provider value={value}>
      {children}
    </ReportsContext.Provider>
  );
};