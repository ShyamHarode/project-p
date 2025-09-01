import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const AdminDashboard = () => {
  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1">
          Welcome to the admin dashboard. Manage your platform from here.
        </Typography>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
