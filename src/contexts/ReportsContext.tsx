@@ .. @@
 import React, { createContext, useContext, useState, useEffect } from 'react';
+import { apiService } from '../services/api';

 export interface Location {
@@ .. @@
   getNearbyReports: (location: Location, radius: number) => StrayReport[];
 }

-const ReportsContext = createContext<ReportsContextType | undefined>(undefined);
-
-export const useReports = () => {
-  const context = useContext(ReportsContext);
-  if (context === undefined) {
-    throw new Error('useReports must be used within a ReportsProvider');
-  }
-  return context;
-};
-
-// Mock data for demonstration
-const mockReports: StrayReport[] = [
-  {
-    id: '1',
-    title: 'Injured Dog Near Park',
-    description: 'Found an injured stray dog near Central Park. Appears to have a wounded leg and is limping. Very friendly but needs immediate medical attention.',
-    location: {
-      lat: 40.7829,
-      lng: -73.9654,
-      address: 'Central Park, New York, NY'
-    },
-    photos: [
-      'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800',
-      'https://images.pexels.com/photos/58997/pexels-photo-58997.jpeg?auto=compress&cs=tinysrgb&w=800'
-    ],
-    status: 'in_progress',
-    urgency: 'high',
-    tags: ['injured', 'dog', 'medical-attention'],
-    reportedBy: 'Sarah Johnson',
-    reportedAt: new Date('2024-01-10T10:30:00'),
-    updatedAt: new Date('2024-01-10T14:20:00'),
-    assignedNGO: 'NYC Animal Rescue',
-    updates: [
-      {
-        id: '1',
-        message: 'Report received. Team dispatched to location.',
-        timestamp: new Date('2024-01-10T11:00:00'),
-        author: 'NYC Animal Rescue'
-      },
-      {
-        id: '2',
-        message: 'Dog found and secured. Taking to veterinary clinic for treatment.',
-        timestamp: new Date('2024-01-10T14:20:00'),
-        author: 'Dr. Mike Wilson',
-        photos: ['https://images.pexels.com/photos/4587998/pexels-photo-4587998.jpeg?auto=compress&cs=tinysrgb&w=800']
-      }
-    ]
-  },
-  {
-    id: '2',
-    title: 'Mother Cat with Kittens',
-    description: 'Found a mother cat with 3 small kittens in an abandoned building. They appear healthy but need shelter and food.',
-    location: {
-      lat: 40.7505,
-      lng: -73.9934,
-      address: 'Brooklyn, NY'
-    },
-    photos: [
-      'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=800'
-    ],
-    status: 'reported',
-    urgency: 'medium',
-    tags: ['cat', 'kittens', 'shelter-needed'],
-    reportedBy: 'Maria Garcia',
-    reportedAt: new Date('2024-01-11T08:15:00'),
-    updatedAt: new Date('2024-01-11T08:15:00'),
-    updates: []
-  },
-  {
-    id: '3',
-    title: 'Friendly Stray Looking for Home',
-    description: 'Very friendly golden retriever mix, appears well-groomed. Might be lost rather than abandoned. No collar or tags visible.',
-    location: {
-      lat: 40.7614,
-      lng: -73.9776,
-      address: 'Times Square, New York, NY'
-    },
-    photos: [
-      'https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=800'
-    ],
-    status: 'rescued',
-    urgency: 'low',
-    tags: ['dog', 'friendly', 'possible-lost-pet'],
-    reportedBy: 'James Chen',
-    reportedAt: new Date('2024-01-09T16:45:00'),
-    updatedAt: new Date('2024-01-10T09:30:00'),
-    assignedNGO: 'Best Friends Animal Society',
-    updates: [
-      {
-        id: '1',
-        message: 'Dog has been safely rescued and is being cared for at our facility.',
-        timestamp: new Date('2024-01-10T09:30:00'),
-        author: 'Best Friends Animal Society'
-      }
-    ]
-  }
-];
+const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

 export const ReportsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
-  const [reports, setReports] = useState<StrayReport[]>(mockReports);
+  const [reports, setReports] = useState<StrayReport[]>([]);
+  const [loading, setLoading] = useState(false);
+
+  useEffect(() => {
+    loadReports();
+    
+    // Set up real-time listeners
+    const socket = apiService.getSocket();
+    if (socket) {
+      socket.on('new_report', handleNewReport);
+      socket.on('report_updated', handleReportUpdate);
+      socket.on('report_update_added', handleReportUpdateAdded);
+      
+      return () => {
+        socket.off('new_report', handleNewReport);
+        socket.off('report_updated', handleReportUpdate);
+        socket.off('report_update_added', handleReportUpdateAdded);
+      };
+    }
+  }, []);
+
+  const loadReports = async () => {
+    try {
+      setLoading(true);
+      const response = await apiService.getReports();
+      setReports(transformReports(response.reports));
+    } catch (error) {
+      console.error('Failed to load reports:', error);
+    } finally {
+      setLoading(false);
+    }
+  };
+
+  const transformReports = (apiReports: any[]): StrayReport[] => {
+    return apiReports.map(report => ({
+      id: report.id,
+      title: report.title,
+      description: report.description,
+      location: {
+        lat: report.latitude,
+        lng: report.longitude,
+        address: report.address
+      },
+      photos: report.photos,
+      status: report.status.toLowerCase().replace('_', '_') as StrayReport['status'],
+      urgency: report.urgency.toLowerCase() as StrayReport['urgency'],
+      tags: report.tags,
+      reportedBy: report.reportedBy.name,
+      reportedAt: new Date(report.createdAt),
+      updatedAt: new Date(report.updatedAt),
+      assignedNGO: report.assignedNGO?.organizationName,
+      updates: report.updates?.map((update: any) => ({
+        id: update.id,
+        message: update.message,
+        timestamp: new Date(update.createdAt),
+        author: update.author.name,
+        photos: update.photos
+      })) || []
+    }));
+  };
+
+  const handleNewReport = (reportData: any) => {
+    // Add new report to the list
+    loadReports(); // Refresh the list
+  };
+
+  const handleReportUpdate = (updateData: any) => {
+    setReports(prev => prev.map(report => 
+      report.id === updateData.id 
+        ? { ...report, status: updateData.status.toLowerCase().replace('_', '_'), updatedAt: new Date() }
+        : report
+    ));
+  };
+
+  const handleReportUpdateAdded = (data: any) => {
+    setReports(prev => prev.map(report => 
+      report.id === data.reportId 
+        ? { 
+            ...report, 
+            updates: [
+              {
+                id: data.update.id,
+                message: data.update.message,
+                timestamp: new Date(data.update.createdAt),
+                author: data.update.author.name,
+                photos: data.update.photos
+              },
+              ...report.updates
+            ],
+            updatedAt: new Date()
+          }
+        : report
+    ));
+  };

-  const addReport = (newReport: Omit<StrayReport, 'id' | 'reportedAt' | 'updatedAt' | 'updates'>) => {
-    const report: StrayReport = {
-      ...newReport,
-      id: Date.now().toString(),
-      reportedAt: new Date(),
-      updatedAt: new Date(),
-      updates: []
-    };
-    setReports(prev => [report, ...prev]);
+  const addReport = async (newReport: Omit<StrayReport, 'id' | 'reportedAt' | 'updatedAt' | 'updates'>) => {
+    try {
+      const reportData = {
+        title: newReport.title,
+        description: newReport.description,
+        latitude: newReport.location.lat,
+        longitude: newReport.location.lng,
+        address: newReport.location.address,
+        photos: newReport.photos,
+        urgency: newReport.urgency.toUpperCase(),
+        tags: newReport.tags
+      };
+      
+      await apiService.createReport(reportData);
+      // The report will be added via real-time update
+    } catch (error) {
+      console.error('Failed to create report:', error);
+      throw error;
+    }
   };

-  const updateReport = (id: string, updates: Partial<StrayReport>) => {
-    setReports(prev => prev.map(report => 
-      report.id === id 
-        ? { ...report, ...updates, updatedAt: new Date() }
-        : report
-    ));
+  const updateReport = async (id: string, updates: Partial<StrayReport>) => {
+    try {
+      await apiService.updateReport(id, {
+        status: updates.status?.toUpperCase(),
+        assignedNGOId: updates.assignedNGO
+      });
+      // The update will be reflected via real-time update
+    } catch (error) {
+      console.error('Failed to update report:', error);
+      throw error;
+    }
   };

-  const addUpdate = (reportId: string, update: Omit<StrayReport['updates'][0], 'id' | 'timestamp'>) => {
-    setReports(prev => prev.map(report => 
-      report.id === reportId 
-        ? {
-            ...report,
-            updates: [...report.updates, {
-              ...update,
-              id: Date.now().toString(),
-              timestamp: new Date()
-            }],
-            updatedAt: new Date()
-          }
-        : report
-    ));
+  const addUpdate = async (reportId: string, update: Omit<StrayReport['updates'][0], 'id' | 'timestamp'>) => {
+    try {
+      await apiService.addReportUpdate(reportId, {
+        message: update.message,
+        photos: update.photos
+      });
+      // The update will be added via real-time update
+    } catch (error) {
+      console.error('Failed to add update:', error);
+      throw error;
+    }
   };

   const getReportById = (id: string) => {
@@ .. @@
     reports,
     addReport,
     updateReport,
     addUpdate,
     getReportById,
-    getNearbyReports
+    getNearbyReports,
+    loading
   };

   return (
@@ -189,4 +179,12 @@ export const ReportsProvider: React.FC<{ children: React.ReactNode }> = ({ chil
     </ReportsContext.Provider>
   );
 };
+
+export const useReports = () => {
+  const context = useContext(ReportsContext);
+  if (context === undefined) {
+    throw new Error('useReports must be used within a ReportsProvider');
+  }
+  return context;
+};