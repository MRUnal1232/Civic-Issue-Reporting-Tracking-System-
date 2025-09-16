import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const AdminIssues = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Manage Issues
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Admin interface for managing all reported issues.
      </Typography>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Admin issue management interface will be implemented here.
        </Typography>
      </Box>
    </Container>
  );
};

export default AdminIssues;
