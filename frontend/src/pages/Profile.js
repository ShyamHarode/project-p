import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import { useParams } from 'react-router-dom';

const Profile = () => {
  const { username } = useParams();

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          User Profile: {username}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1">
            Profile page for user @{username}. This page will show user information, posts, followers, and following.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile;
