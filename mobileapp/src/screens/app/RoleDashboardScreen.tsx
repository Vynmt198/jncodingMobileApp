import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { HomeScreen } from './Home';
import { InstructorDashboardScreen } from './Instructor/InstructorDashboardScreen';
import { AdminUserManagementScreen } from './Admin/AdminUserManagementScreen';

export const RoleDashboardScreen: React.FC = () => {
  const role = useAppSelector(state => state.auth.user?.role);

  if (role === 'instructor') {
    return <InstructorDashboardScreen />;
  }

  if (role === 'admin') {
    return <AdminUserManagementScreen />;
  }

  return <HomeScreen />;
};

