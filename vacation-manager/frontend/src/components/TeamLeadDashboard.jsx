import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Paper, Button } from '@mui/material';
import axios from 'axios';

function TeamLeadDashboard() {
  const [vacations, setVacations] = useState([]);

  useEffect(() => {
    fetchPendingVacations();
  }, []);

  const fetchPendingVacations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/vacations/team-pending', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setVacations(response.data);
    } catch (err) {
      console.error('Error fetching pending vacations:', err.response?.data || err.message);
    }
  };

  const approveVacation = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/vacations/${id}/approve`, {}, {
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
      <h2>Pending Vacation Requests From Your Team</h2>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Requester</TableCell>
            <TableCell>Start Date</TableCell>
            <TableCell>End Date</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vacations.map((vacation) => (
            <TableRow key={vacation.id}>
              <TableCell>{`${vacation.requester_first_name} ${vacation.requester_last_name}`}</TableCell>
              <TableCell>{vacation.start_date}</TableCell>
              <TableCell>{vacation.end_date}</TableCell>
              <TableCell>{vacation.type}</TableCell>
              <TableCell>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => approveVacation(vacation.id)}
                >
                  Approve
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

export default TeamLeadDashboard;
