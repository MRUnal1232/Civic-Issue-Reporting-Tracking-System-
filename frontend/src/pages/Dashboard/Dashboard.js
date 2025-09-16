import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
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
  TrendingUp,
  CheckCircle,
  Schedule,
  Map,
  Comment,
  ThumbUp,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from 'react-query';
import { usersEndpoints } from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import StatusBadge from '../../components/Common/StatusBadge';
import PriorityBadge from '../../components/Common/PriorityBadge';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery(
    'userStats',
    usersEndpoints.getStats,
    {
      select: (response) => response.data,
    }
  );

  const { data: recentIssues, isLoading: issuesLoading } = useQuery(
    'recentIssues',
    () => usersEndpoints.getMyIssues({ limit: 5 }),
    {
      select: (response) => response.data.issues,
    }
  );

  if (statsLoading || issuesLoading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  const quickActions = [
    {
      title: 'Report New Issue',
      description: 'Report a civic issue in your area',
      icon: <Report />,
      color: 'primary',
      action: () => navigate('/report'),
    },
    {
      title: 'View All Issues',
      description: 'Browse issues reported by the community',
      icon: <Map />,
      color: 'secondary',
      action: () => navigate('/issues'),
    },
    {
      title: 'My Issues',
      description: 'Track your reported issues',
      icon: <TrendingUp />,
      color: 'success',
      action: () => navigate('/my-issues'),
    },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resolved':
        return <CheckCircle color="success" />;
      case 'In Progress':
        return <Schedule color="info" />;
      default:
        return <Report color="action" />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Welcome back, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your civic issues and community.
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Report color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  {stats?.overview?.totalIssues || 0}
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
                  {stats?.overview?.resolvedIssues || 0}
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
                <ThumbUp color="info" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  {stats?.overview?.totalUpvotes || 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Upvotes Received
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Comment color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  {stats?.overview?.totalComments || 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Comments Received
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                {quickActions.map((action, index) => (
                  <Grid item xs={12} key={index}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          elevation: 3,
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={action.action}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box
                          sx={{
                            color: `${action.color}.main`,
                            mr: 2,
                          }}
                        >
                          {action.icon}
                        </Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {action.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {action.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Issues */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Issues
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/my-issues')}
                >
                  View All
                </Button>
              </Box>
              
              {recentIssues && recentIssues.length > 0 ? (
                <List>
                  {recentIssues.map((issue) => (
                    <ListItem
                      key={issue._id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                      onClick={() => navigate(`/issues/${issue._id}`)}
                    >
                      <ListItemIcon>
                        {getStatusIcon(issue.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {issue.title}
                            </Typography>
                            <StatusBadge status={issue.status} size="small" />
                            <PriorityBadge priority={issue.priority} size="small" />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {issue.description}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip
                                label={issue.category}
                                size="small"
                                variant="outlined"
                              />
                              <Typography variant="caption" color="text.secondary">
                                {new Date(issue.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Report sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" paragraph>
                    You haven't reported any issues yet.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Report />}
                    onClick={() => navigate('/report')}
                  >
                    Report Your First Issue
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
