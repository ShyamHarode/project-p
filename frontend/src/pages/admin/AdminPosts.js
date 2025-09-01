import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const AdminPosts = () => {
  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Post Management
        </Typography>
        <Typography variant="body1">
          Manage and approve posts from users.
        </Typography>
      </Paper>
    </Container>
  );
};

export default AdminPosts;
