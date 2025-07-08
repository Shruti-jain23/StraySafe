import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

export interface Location {
@@ .. @@
  getNearbyReports: (location: Location, radius: number) => StrayReport[];
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export const ReportsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<StrayReport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReports();
    
    // Set up real-time listeners
    const socket = apiService.getSocket();
    if (socket) {
      socket.on('new_report', handleNewReport);
      socket.on('report_updated', handleReportUpdate);
      socket.on('report_update_added', handleReportUpdateAdded);
      
      return () => {
        socket.off('new_report', handleNewReport);
        socket.off('report_updated', handleReportUpdate);
        socket.off('report_update_added', handleReportUpdateAdded);
      };
    }
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await apiService.getReports();
      setReports(transformReports(response.reports));
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformReports = (apiReports: any[]): StrayReport[] => {
    return apiReports.map(report => ({
      id: report.id,
      title: report.title,
      description: report.description,
      location: {
        lat: report.latitude,
        lng: report.longitude,
        address: report.address
      },
      photos: report.photos,
      status: report.status.toLowerCase().replace('_', '_') as StrayReport['status'],
      urgency: report.urgency.toLowerCase() as StrayReport['urgency'],
      tags: report.tags,
      reportedBy: report.reportedBy.name,
      reportedAt: new Date(report.createdAt),
      updatedAt: new Date(report.updatedAt),
      assignedNGO: report.assignedNGO?.organizationName,
      updates: report.updates?.map((update: any) => ({
        id: update.id,
        message: update.message,
        timestamp: new Date(update.createdAt),
        author: update.author.name,
        photos: update.photos
      })) || []
    }));
  };

  const handleNewReport = (reportData: any) => {
    // Add new report to the list
    loadReports(); // Refresh the list
  };

  const handleReportUpdate = (updateData: any) => {
    setReports(prev => prev.map(report => 
      report.id === updateData.id 
        ? { ...report, status: updateData.status.toLowerCase().replace('_', '_'), updatedAt: new Date() }
        : report
    ));
  };

  const handleReportUpdateAdded = (data: any) => {
    setReports(prev => prev.map(report => 
      report.id === data.reportId 
        ? { 
            ...report, 
            updates: [
              {
                id: data.update.id,
                message: data.update.message,
                timestamp: new Date(data.update.createdAt),
                author: data.update.author.name,
                photos: data.update.photos
              },
              ...report.updates
            ],
            updatedAt: new Date()
          }
        : report
    ));
  };

  const addReport = async (newReport: Omit<StrayReport, 'id' | 'reportedAt' | 'updatedAt' | 'updates'>) => {
    try {
      const reportData = {
        title: newReport.title,
        description: newReport.description,
        latitude: newReport.location.lat,
        longitude: newReport.location.lng,
        address: newReport.location.address,
        photos: newReport.photos,
        urgency: newReport.urgency.toUpperCase(),
        tags: newReport.tags
      };
      
      await apiService.createReport(reportData);
      // The report will be added via real-time update
    } catch (error) {
      console.error('Failed to create report:', error);
      throw error;
    }
  };

  const updateReport = async (id: string, updates: Partial<StrayReport>) => {
    try {
      await apiService.updateReport(id, {
        status: updates.status?.toUpperCase(),
        assignedNGOId: updates.assignedNGO
      });
      // The update will be reflected via real-time update
    } catch (error) {
      console.error('Failed to update report:', error);
      throw error;
    }
  };

  const addUpdate = async (reportId: string, update: Omit<StrayReport['updates'][0], 'id' | 'timestamp'>) => {
    try {
      await apiService.addReportUpdate(reportId, {
        message: update.message,
        photos: update.photos
      });
      // The update will be added via real-time update
    } catch (error) {
      console.error('Failed to add update:', error);
      throw error;
    }
  };

  const getReportById = (id: string) => {
@@ .. @@
    reports,
    addReport,
    updateReport,
    addUpdate,
    getReportById,
    getNearbyReports,
    loading
  };

  return (
    <ReportsContext.Provider value={value}>
      {children}
    </ReportsContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportsContext);
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};