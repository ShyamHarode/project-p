import React from 'react';
import { Container, Typography, Paper } from '@mui/material';
import { useParams } from 'react-router-dom';

const PostDetail = () => {
  const { postId } = useParams();

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Post Detail
        </Typography>
        <Typography variant="body1">
          Detailed view of post ID: {postId}
        </Typography>
      </Paper>
    </Container>
  );
};

export default PostDetail;
