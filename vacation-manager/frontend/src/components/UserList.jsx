import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Paper, Typography } from '@mui/material';
import Pagination from '@mui/material/Pagination';
import axios from 'axios';

function UserList() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const fetchUsers = async (currentPage) => {
    try {
      const response = await axios.get(`http://localhost:5000/users?page=${currentPage}&limit=10`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('Fetched Users:', response.data.users); 
      setUsers(response.data.users);
      setTotalPages(Math.ceil(response.data.total / response.data.limit));
    } catch (err) {
      console.error('Error fetching users:', err.response?.data || err.message);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <Paper style={{ marginTop: '20px', padding: '20px' }}>
      <Typography variant="h5" style={{ marginBottom: '10px' }}>Users</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Username</TableCell>
            <TableCell>First Name</TableCell>
            <TableCell>Last Name</TableCell>
            <TableCell>Role</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.first_name}</TableCell>
              <TableCell>{user.last_name}</TableCell>
              <TableCell>{user.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      <Pagination
        count={totalPages}
        page={page}
        onChange={handlePageChange}
        variant="outlined"
        color="primary"
        style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}
      />
    </Paper>
  );
}

export default UserList;
