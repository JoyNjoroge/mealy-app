import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardRouter from "@/components/DashboardRouter";
import HomePage from "@/pages/HomePage";
import AdminDashboard from "@/pages/admin/AdminDashboard";


// Auth Pages
import Login from "./components/auth/Login.jsx";
import Register from "./components/auth/Register.jsx";

// Dashboard Pages
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CatererDashboard from "./pages/caterer/CatererDashboard";

// Utility Pages
import { ProtectedRoute } from "./components/common/ProtectedRoute.jsx";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Dashboard Router Component


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/" element={<HomePage />} />

            {/* Protected Routes */}
            <Route
     path="/admin"
     element={
       <ProtectedRoute allowedRoles={["admin"]}>
         <AdminDashboard />
       </ProtectedRoute>
     }
   />

            <Route
              path="/customer"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/caterer"
              element={
                <ProtectedRoute allowedRoles={["caterer", "admin"]}>
                  <CatererDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;