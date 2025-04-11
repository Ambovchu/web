import React, { useState } from 'react';
import { TextField, Button, Paper, Typography } from '@mui/material';
import axios from 'axios';

function VacationRequestForm() {
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    type: 'paid',
    file: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError('');
    setSuccess('');

    try {
  
      const formDataObj = new FormData();
      formDataObj.append('start_date', formData.start_date);
      formDataObj.append('end_date', formData.end_date);
      formDataObj.append('type', formData.type);
      if (formData.file) {
        formDataObj.append('file', formData.file);
      }


      const response = await axios.post('http://localhost:5000/vacations', formDataObj, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        setSuccess('Vacation request submitted successfully!');
        setFormData({ start_date: '', end_date: '', type: 'paid', file: null });
      }
    } catch (err) {
      console.error('Error submitting vacation request:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to submit vacation request.');
    }
  };

  return (
    <Paper style={{ marginTop: '20px', padding: '20px' }}>
      <Typography variant="h5" style={{ marginBottom: '10px' }}>
        Request Vacation
      </Typography>

      {error && <Typography color="error">{error}</Typography>}
      {success && <Typography color="primary">{success}</Typography>}

      <form onSubmit={handleSubmit}>
        <TextField
          label="Start Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          fullWidth
          style={{ marginBottom: '10px' }}
          value={formData.start_date}
          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          required
        />

        <TextField
          label="End Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          fullWidth
          style={{ marginBottom: '10px' }}
          value={formData.end_date}
          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          required
        />

        <TextField
          label="Type"
          select
          fullWidth
          SelectProps={{ native: true }}
          style={{ marginBottom: '10px' }}
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        >
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="sick">Sick</option>
        </TextField>

        <input
          type="file"
          onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
          style={{ marginBottom: '10px' }}
        />

        <Button variant="contained" color="primary" type="submit">
          Submit Request
        </Button>
      </form>
    </Paper>
  );
}

export default VacationRequestForm;
