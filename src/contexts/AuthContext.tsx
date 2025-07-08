@@ .. @@
 import React, { createContext, useContext, useState, useEffect } from 'react';
+import { apiService } from '../services/api';

 interface User {
@@ .. @@
   const [user, setUser] = useState<User | null>(null);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
-    // Check for stored user session
-    const storedUser = localStorage.getItem('straysafe_user');
-    if (storedUser) {
-      setUser(JSON.parse(storedUser));
+    // Check for stored token and get user profile
+    const token = localStorage.getItem('straysafe_token');
+    if (token) {
+      apiService.setToken(token);
+      loadUserProfile();
+    } else {
+      setIsLoading(false);
     }
-    setIsLoading(false);
   }, []);

+  const loadUserProfile = async () => {
+    try {
+      const response = await apiService.getProfile();
+      setUser(response.user);
+      apiService.connectSocket();
+    } catch (error) {
+      console.error('Failed to load user profile:', error);
+      // Token might be invalid, clear it
+      apiService.removeToken();
+    } finally {
+      setIsLoading(false);
+    }
+  };
+
   const login = async (email: string, password: string) => {
     setIsLoading(true);
     try {
-      // Simulate API call
-      await new Promise(resolve => setTimeout(resolve, 1000));
-      
-      // Mock user data
-      const mockUser: User = {
-        id: '1',
-        name: 'John Doe',
-        email,
-        role: 'citizen',
-        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'
-      };
-      
-      setUser(mockUser);
-      localStorage.setItem('straysafe_user', JSON.stringify(mockUser));
+      const response = await apiService.login(email, password);
+      setUser(response.user);
+      apiService.connectSocket();
     } catch (error) {
-      throw new Error('Login failed');
+      throw error;
     } finally {
       setIsLoading(false);
     }
@@ -54,21 +67,11 @@ export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ childre
   const signup = async (userData: Partial<User> & { email: string; password: string }) => {
     setIsLoading(true);
     try {
-      // Simulate API call
-      await new Promise(resolve => setTimeout(resolve, 1000));
-      
-      const newUser: User = {
-        id: Date.now().toString(),
-        name: userData.name || 'New User',
-        email: userData.email,
-        role: userData.role || 'citizen',
-        phone: userData.phone,
-        organization: userData.organization,
-        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'
-      };
-      
-      setUser(newUser);
-      localStorage.setItem('straysafe_user', JSON.stringify(newUser));
+      const response = await apiService.register(userData);
+      setUser(response.user);
+      apiService.connectSocket();
     } catch (error) {
-      throw new Error('Signup failed');
+      throw error;
     } finally {
       setIsLoading(false);
     }
@@ -76,7 +79,8 @@ export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ childre

   const logout = () => {
     setUser(null);
-    localStorage.removeItem('straysafe_user');
+    apiService.removeToken();
+    apiService.disconnectSocket();
   };

   const value: AuthContextType = {