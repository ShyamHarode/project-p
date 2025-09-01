import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const Notifications = () => {
  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Notifications
        </Typography>
        <Typography variant="body1">
          View your notifications for likes, comments, follows, and mentions.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Notifications;
