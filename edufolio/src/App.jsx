import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

import SplashScreen from './pages/SplashScreen';
import RoleSelection from './pages/RoleSelection';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import StudentProfile from './pages/StudentProfile';
import InstallPage from './pages/InstallPage';
import RegisterStudent from './pages/forms/RegisterStudent';
import LogAchievement from './pages/forms/LogAchievement';
import AddFaculty from './pages/forms/AddFaculty';
import ManageRoles from './pages/forms/ManageRoles';
import ManageStudents from './pages/forms/ManageStudents';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/roles" element={<RoleSelection />} />
        <Route path="/login/:role" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allow={['student', 'faculty', 'admin']}>
              <StudentProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:studentId"
          element={
            <ProtectedRoute>
              <StudentProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/install"
          element={
            <ProtectedRoute>
              <InstallPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register-student"
          element={
            <ProtectedRoute allow={['faculty']}>
              <RegisterStudent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log-achievement"
          element={
            <ProtectedRoute allow={['faculty', 'admin']}>
              <LogAchievement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-student"
          element={
            <ProtectedRoute allow={['admin']}>
              <RegisterStudent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-faculty"
          element={
            <ProtectedRoute allow={['admin']}>
              <AddFaculty />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-roles"
          element={
            <ProtectedRoute allow={['admin']}>
              <ManageRoles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-students"
          element={
            <ProtectedRoute allow={['admin']}>
              <ManageStudents />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<SplashScreen />} />
      </Routes>
    </>
  );
}
