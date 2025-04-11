import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Button } from '@mui/material';
import UserList from './components/UserList';
import ManageUsers from './components/ManageUsers'; 
import VacationRequestForm from './components/VacationRequestForm';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username'); 
    if (token && username) {
      setLoggedInUser(username);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role_id');
    setLoggedInUser(null);
    navigate('/login');
  };

  const userRole = localStorage.getItem('role_id');
  const isCEO = userRole === '1';

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Vacation Manager
          </Typography>
          {loggedInUser ? (
            <>
              <Typography variant="body1" style={{ marginRight: '20px' }}>
                Logged in as {loggedInUser}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">Login</Button>
              <Button color="inherit" component={Link} to="/register">Register</Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container>
        <Routes>

          <Route path="/" element={
            <>
              <Typography variant="h4" style={{ margin: '20px 0' }}>
                Manage Vacations and Teams
              </Typography>
              {isCEO ? <ManageUsers /> : <UserList />}
              {!isCEO && <VacationRequestForm />}
            </>
          } />
          <Route path="/login" element={<LoginForm setLoggedInUser={setLoggedInUser} />} />
          <Route path="/register" element={<RegisterForm />} />
        </Routes>
      </Container>
    </>
  );
}

export default App;
