import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const EditProfile = () => {
  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Edit Profile
        </Typography>
        <Typography variant="body1">
          Edit your profile information here.
        </Typography>
      </Paper>
    </Container>
  );
};

export default EditProfile;
