import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import IssuesList from './IssuesList';

const MyIssues = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          My Issues
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track the status of issues you've reported.
        </Typography>
      </Box>
      
      <IssuesList showUserFilter={true} />
    </Container>
  );
};

export default MyIssues;
