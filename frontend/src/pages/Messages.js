import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const Messages = () => {
  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Messages
        </Typography>
        <Typography variant="body1">
          Direct messages and conversations with other users.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Messages;
