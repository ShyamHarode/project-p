import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const CreatePost = () => {
  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create New Post
        </Typography>
        <Typography variant="body1">
          Create a new post with text and media content.
        </Typography>
      </Paper>
    </Container>
  );
};

export default CreatePost;
