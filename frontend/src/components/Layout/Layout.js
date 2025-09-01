import React from 'react';
import { Box } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8, // Account for fixed navbar
          ml: { xs: 0, md: 30 }, // Account for sidebar on desktop
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
