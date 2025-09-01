import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const AdminAccount = () => {
  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Account Dashboard
        </Typography>
        <Typography variant="body1">
          View earnings and process payments.
        </Typography>
      </Paper>
    </Container>
  );
};

export default AdminAccount;
