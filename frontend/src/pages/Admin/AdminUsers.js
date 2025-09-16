import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const AdminUsers = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Manage Users
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Admin interface for managing user accounts.
      </Typography>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Admin user management interface will be implemented here.
        </Typography>
      </Box>
    </Container>
  );
};

export default AdminUsers;
