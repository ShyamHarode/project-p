import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const AdminEmployees = () => {
  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Employee Management
        </Typography>
        <Typography variant="body1">
          Manage employees and their roles.
        </Typography>
      </Paper>
    </Container>
  );
};

export default AdminEmployees;
