@@ .. @@
 import React, { useState, useRef } from 'react';
 import { Camera, MapPin, Upload, AlertTriangle, Heart, CheckCircle, X } from 'lucide-react';
 import { useReports, type Location } from '../contexts/ReportsContext';
+import { apiService } from '../services/api';
 import { useNavigate } from 'react-router-dom';

@@ .. @@
   const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
     const files = event.target.files;
     if (files) {
-      Array.from(files).forEach(file => {
-        const reader = new FileReader();
-        reader.onload = (e) => {
-          if (e.target?.result) {
-            setPhotos(prev => [...prev, e.target!.result as string]);
-          }
-        };
-        reader.readAsDataURL(file);
-      });
+      uploadPhotos(Array.from(files));
     }
   };

+  const uploadPhotos = async (files: File[]) => {
+    try {
+      const response = await apiService.uploadImages(files);
+      setPhotos(prev => [...prev, ...response.imageUrls]);
+    } catch (error) {
+      console.error('Photo upload failed:', error);
+      alert('Failed to upload photos. Please try again.');
+    }
+  };
+
   const removePhoto = (index: number) => {