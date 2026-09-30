import { Routes, Route, Navigate } from 'react-router-dom';

import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { TransfersPage } from './pages/TransfersPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import ExpendituresPage from './pages/ExpendituresPage';
import PersonnelPage from './pages/PersonnelPage';
import BasesPage from './pages/BasesPage';
import EquipmentTypesPage from './pages/EquipmentTypesPage';
import AuditLogsPage from './pages/AuditLogsPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <Routes>

      {/* Public route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected application */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>

          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/purchases"
            element={<PurchasesPage />}
          />

           <Route
            path="/transfers"
            element={<TransfersPage />}
          />

          <Route
            path="/assignments"
            element={<AssignmentsPage />}
          />

          <Route
            path="/expenditures"
            element={<ExpendituresPage />}
          />

          <Route
            path="/personnel"
            element={<PersonnelPage />}
          />

          <Route
            path="/bases"
            element={<BasesPage />}
          />

          <Route
            path="/equipment-types"
            element={<EquipmentTypesPage />}
          />

           <Route
            path="/audit-logs"
            element={<AuditLogsPage />}
          /> 

          <Route
            path="/profile"
            element={<ProfilePage />}
          />
        </Route>
        
      </Route>

      {/* Unknown route */}
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />

    </Routes>
  );
}