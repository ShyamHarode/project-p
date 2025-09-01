import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const Search = () => {
  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Search
        </Typography>
        <Typography variant="body1">
          Search for users, posts, and hashtags.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Search;
