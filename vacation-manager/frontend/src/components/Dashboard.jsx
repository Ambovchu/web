import React from 'react';
import CEODashboard from './CEODashboard';
import VacationRequestForm from './VacationRequestForm';

function Dashboard() {
  const roleId = localStorage.getItem('role_id');

  return (
    <div style={{ padding: '20px' }}>
      <h1>Manage Vacations and Teams</h1>
      
      {roleId === '1' && <CEODashboard />}
      
      {roleId !== '1' && <VacationRequestForm />}
    </div>
  );
}

export default Dashboard;
