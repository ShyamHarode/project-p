import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const AdminRevenue = () => {
  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Revenue Management
        </Typography>
        <Typography variant="body1">
          Manage pricing for views and likes.
        </Typography>
      </Paper>
    </Container>
  );
};

export default AdminRevenue;
