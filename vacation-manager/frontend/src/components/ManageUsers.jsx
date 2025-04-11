import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Paper, Button, Select, MenuItem, FormControl } from '@mui/material';
import axios from 'axios';

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [pendingVacations, setPendingVacations] = useState({});

  useEffect(() => {
    fetchUsers();
    fetchPendingVacations();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
  
      console.log('Fetched Users:', response.data.users); 
      setUsers(response.data.users);
    } catch (err) {
      console.error('Error fetching users:', err.response?.data || err.message);
    }
  };
  
  const fetchPendingVacations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/vacations/pending', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      const pendingMap = {};
      response.data.forEach((vacation) => {
        const startDate = vacation.start_date.split('T')[0];
        const endDate = vacation.end_date.split('T')[0];
        pendingMap[vacation.user_id] = { id: vacation.id, dates: `${startDate} - ${endDate}` };
      });
      setPendingVacations(pendingMap);
    } catch (err) {
      console.error('Error fetching pending vacations:', err.response?.data || err.message);
    }
  };

  const handleRoleChange = async (userId, newRoleId) => {
    try {
      await axios.patch(`http://localhost:5000/users/${userId}/role`, 
        { role_id: newRoleId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      alert('Role updated successfully!');
      fetchUsers(); 
    } catch (err) {
      console.error('Error updating role:', err.response?.data || err.message);
    }
  };

  const approveVacationRequest = async (vacationId) => {
    try {
      await axios.patch(`http://localhost:5000/vacations/${vacationId}/approve`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Vacation approved successfully!');
      fetchPendingVacations(); 
    } catch (err) {
      console.error('Error approving vacation:', err.response?.data || err.message);
    }
  };

  return (
    <Paper style={{ marginTop: '20px', padding: '20px' }}>
      <h2>Manage Users</h2>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Full Name</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Pending Vacation</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
              <TableCell>
  <FormControl fullWidth>
    <Select
      value={user.role_id || ''} 
      onChange={(e) => handleRoleChange(user.id, e.target.value)}
      displayEmpty
    >
      <MenuItem value={1}>CEO</MenuItem>
      <MenuItem value={2}>Developer</MenuItem>
      <MenuItem value={3}>Team Lead</MenuItem>
      <MenuItem value={4}>Unassigned</MenuItem>
    </Select>
  </FormControl>
</TableCell>
              <TableCell>{pendingVacations[user.id]?.dates || 'No Pending Vacation'}</TableCell>

              <TableCell>
                {pendingVacations[user.id] && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => approveVacationRequest(pendingVacations[user.id].id)} 
                  >
                    Accept Vacation
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
    
  );
}

export default ManageUsers;
