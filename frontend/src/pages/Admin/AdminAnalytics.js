import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const AdminAnalytics = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Analytics
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Detailed analytics and reporting for the civic issue tracking system.
      </Typography>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Analytics dashboard will be implemented here.
        </Typography>
      </Box>
    </Container>
  );
};

export default AdminAnalytics;
