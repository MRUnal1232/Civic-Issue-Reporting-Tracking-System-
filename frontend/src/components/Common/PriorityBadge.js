import React from 'react';
import { Chip } from '@mui/material';

const PriorityBadge = ({ priority, size = 'small' }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low':
        return 'success';
      case 'Medium':
        return 'warning';
      case 'High':
        return 'error';
      case 'Critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'Critical':
        return '🔴';
      case 'High':
        return '🟠';
      case 'Medium':
        return '🟡';
      case 'Low':
        return '🟢';
      default:
        return '';
    }
  };

  return (
    <Chip
      label={`${getPriorityIcon(priority)} ${priority}`}
      color={getPriorityColor(priority)}
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

export default PriorityBadge;
