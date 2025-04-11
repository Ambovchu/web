import React, { useState } from 'react';
import { TextField, Button, Paper, Typography } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function RegisterForm() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
  
      const response = await axios.post(
        'http://localhost:5000/register',
        formData,
        { headers: { 'Content-Type': 'application/json' } }
      );


      if (response.status === 201) {
        alert('Registration successful! Redirecting to login...');
        navigate('/login'); 
      }
    } catch (err) {
      console.error('Registration Error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <Paper style={{ padding: 20, maxWidth: 400, margin: '20px auto' }}>
      <Typography variant="h5" gutterBottom>Register</Typography>
      {error && <Typography color="error">{error}</Typography>}
      
      <form onSubmit={handleSubmit}>
        <TextField
          label="Username"
          fullWidth
          margin="normal"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
        <TextField
          label="First Name"
          fullWidth
          margin="normal"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          required
        />
        <TextField
          label="Last Name"
          fullWidth
          margin="normal"
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          required
        />
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          fullWidth
          style={{ marginTop: 20 }}
        >
          Register
        </Button>
      </form>
    </Paper>
  );
}

export default RegisterForm;
