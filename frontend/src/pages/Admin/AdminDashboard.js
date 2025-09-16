import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Report,
  CheckCircle,
  Schedule,
  TrendingUp,
  Person,
  Warning,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { adminEndpoints } from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const AdminDashboard = () => {
  const { data: dashboardData, isLoading } = useQuery(
    'adminDashboard',
    adminEndpoints.getDashboard,
    {
      select: (response) => response.data,
    }
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  const { overview, analytics } = dashboardData || {};

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Admin Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Overview of civic issues and system statistics.
      </Typography>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Report color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  {overview?.totalIssues || 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total Issues
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  {overview?.resolvedIssues || 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Resolved
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Schedule color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  {overview?.inProgressIssues || 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Warning color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  {overview?.urgentIssues || 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Urgent Issues
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Issues by Category */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Issues by Category
              </Typography>
              <List>
                {analytics?.issuesByCategory?.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={item._id}
                      secondary={`${item.count} issues`}
                    />
                    <Chip
                      label={item.count}
                      color="primary"
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Reporters */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Top Reporters
              </Typography>
              <List>
                {analytics?.topReporters?.map((reporter, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {reporter.name?.charAt(0)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={reporter.name}
                      secondary={`${reporter.count} issues reported`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
