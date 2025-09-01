import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const Settings = () => {
  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1">
          Manage your account settings, privacy, and preferences.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Settings;
