import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Pagination,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search,
  FilterList,
  LocationOn,
  ThumbUp,
  Comment,
  Visibility,
  Add,
  Clear,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { issuesEndpoints } from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import StatusBadge from '../../components/Common/StatusBadge';
import PriorityBadge from '../../components/Common/PriorityBadge';

const IssuesList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    priority: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: issuesData, isLoading, refetch } = useQuery(
    ['issues', page, filters],
    () => issuesEndpoints.getIssues({
      page,
      limit: 12,
      ...filters,
    }),
    {
      select: (response) => response.data,
      keepPreviousData: true,
    }
  );

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
    setPage(1); // Reset to first page when filters change
  };

  const handleSearch = (value) => {
    setFilters(prev => ({
      ...prev,
      search: value,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      category: '',
      priority: '',
    });
    setPage(1);
  };

  const handleUpvote = async (issueId) => {
    try {
      if (issue.hasUpvoted) {
        await issuesEndpoints.removeUpvote(issueId);
      } else {
        await issuesEndpoints.upvoteIssue(issueId);
      }
      refetch();
    } catch (error) {
      console.error('Upvote error:', error);
    }
  };

  const categories = [
    'Roads & Infrastructure',
    'Water & Sanitation',
    'Electricity',
    'Waste Management',
    'Public Safety',
    'Environment',
    'Healthcare',
    'Education',
    'Transportation',
    'Other',
  ];

  const statuses = [
    'Submitted',
    'Under Review',
    'In Progress',
    'Resolved',
    'Closed',
    'Rejected',
  ];

  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  if (isLoading) {
    return <LoadingSpinner message="Loading issues..." />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          Community Issues
        </Typography>
        {user && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/report')}
          >
            Report Issue
          </Button>
        )}
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search issues..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: filters.search && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => handleSearch('')}
                      >
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filters
                </Button>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  disabled={Object.values(filters).every(v => !v)}
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Filter Options */}
          {showFilters && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      {statuses.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      label="Category"
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={filters.priority}
                      onChange={(e) => handleFilterChange('priority', e.target.value)}
                      label="Priority"
                    >
                      <MenuItem value="">All Priorities</MenuItem>
                      {priorities.map((priority) => (
                        <MenuItem key={priority} value={priority}>
                          {priority}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Issues Grid */}
      {issuesData?.issues?.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {issuesData.issues.map((issue) => (
              <Grid item xs={12} sm={6} md={4} key={issue._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => navigate(`/issues/${issue._id}`)}
                >
                  {issue.images && issue.images.length > 0 && (
                    <Box
                      sx={{
                        height: 200,
                        backgroundImage: `url(${issue.images[0].url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          display: 'flex',
                          gap: 1,
                        }}
                      >
                        <StatusBadge status={issue.status} />
                        <PriorityBadge priority={issue.priority} />
                      </Box>
                    </Box>
                  )}

                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold" noWrap>
                      {issue.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      paragraph
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {issue.description}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {issue.location.address}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Avatar
                        src={issue.reporter.avatar}
                        sx={{ width: 24, height: 24 }}
                      >
                        {issue.reporter.name?.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" color="text.secondary">
                        {issue.reporter.name}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip
                        label={issue.category}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<ThumbUp />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpvote(issue._id);
                        }}
                        color={issue.hasUpvoted ? 'primary' : 'default'}
                      >
                        {issue.upvoteCount || 0}
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Comment />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/issues/${issue._id}`);
                        }}
                      >
                        {issue.commentCount || 0}
                      </Button>
                    </Box>
                    <Button
                      size="small"
                      endIcon={<Visibility />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/issues/${issue._id}`);
                      }}
                    >
                      View
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {issuesData.pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={issuesData.pagination.totalPages}
                page={page}
                onChange={(event, value) => setPage(value)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" gutterBottom>
            No issues found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {Object.values(filters).some(v => v) 
              ? 'Try adjusting your filters to see more results.'
              : 'Be the first to report a civic issue in your area.'
            }
          </Typography>
          {user && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/report')}
              sx={{ mt: 2 }}
            >
              Report an Issue
            </Button>
          )}
        </Box>
      )}
    </Container>
  );
};

export default IssuesList;
