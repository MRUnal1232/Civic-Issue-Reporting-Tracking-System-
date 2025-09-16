import React from 'react';
import { Chip } from '@mui/material';

const StatusBadge = ({ status, size = 'small' }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted':
        return 'primary';
      case 'Under Review':
        return 'warning';
      case 'In Progress':
        return 'info';
      case 'Resolved':
        return 'success';
      case 'Closed':
        return 'default';
      case 'Rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Under Review':
        return 'Under Review';
      case 'In Progress':
        return 'In Progress';
      default:
        return status;
    }
  };

  return (
    <Chip
      label={getStatusLabel(status)}
      color={getStatusColor(status)}
      size={size}
      variant="outlined"
      sx={{
        fontWeight: 500,
        textTransform: 'uppercase',
        fontSize: '0.75rem',
      }}
    />
  );
};

export default StatusBadge;
