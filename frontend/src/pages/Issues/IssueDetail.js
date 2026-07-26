import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Avatar,
  Chip,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  LocationOn,
  ThumbUp,
  Comment,
  Share,
  Edit,
  Delete,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { issuesEndpoints } from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import StatusBadge from '../../components/Common/StatusBadge';
import PriorityBadge from '../../components/Common/PriorityBadge';
import toast from 'react-hot-toast';

const CATEGORIES = [
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

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const { data: issue, isLoading } = useQuery(
    ['issue', id],
    () => issuesEndpoints.getIssue(id),
    {
      select: (response) => response.data.issue,
    }
  );

  const upvoteMutation = useMutation(
    () => issuesEndpoints.upvoteIssue(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['issue', id]);
        toast.success('Upvoted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to upvote');
      },
    }
  );

  const removeUpvoteMutation = useMutation(
    () => issuesEndpoints.removeUpvote(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['issue', id]);
        toast.success('Upvote removed');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to remove upvote');
      },
    }
  );

  const addCommentMutation = useMutation(
    (comment) => issuesEndpoints.addComment(id, comment),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['issue', id]);
        setCommentText('');
        setShowCommentDialog(false);
        toast.success('Comment added successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add comment');
      },
    }
  );

  const updateMutation = useMutation(
    (data) => issuesEndpoints.updateIssue(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['issue', id]);
        setIsEditing(false);
        toast.success('Issue updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update issue');
      },
    }
  );

  const deleteMutation = useMutation(
    () => issuesEndpoints.deleteIssue(id),
    {
      onSuccess: () => {
        toast.success('Issue deleted successfully');
        navigate('/issues');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete issue');
        setShowDeleteDialog(false);
      },
    }
  );

  const handleUpvote = () => {
    if (issue.hasUpvoted) {
      removeUpvoteMutation.mutate();
    } else {
      upvoteMutation.mutate();
    }
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      addCommentMutation.mutate({ content: commentText.trim() });
    }
  };

  const handleEdit = () => {
    setEditForm({
      title: issue.title,
      description: issue.description,
      category: issue.category,
      priority: issue.priority,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const handleSaveEdit = () => {
    updateMutation.mutate(editForm);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading issue details..." />;
  }

  if (!issue) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Issue not found or you don't have permission to view it.
        </Alert>
      </Container>
    );
  }

  const userId = user?.id || user?._id;
  const canEdit = user && (userId === issue.reporter._id || isAdmin);
  const isLocked = ['Resolved', 'Closed'].includes(issue.status);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                {isEditing ? (
                  <TextField
                    fullWidth
                    label="Title"
                    value={editForm.title}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                    sx={{ mr: 2 }}
                  />
                ) : (
                  <Typography variant="h4" fontWeight="bold">
                    {issue.title}
                  </Typography>
                )}
                {canEdit && !isEditing && (
                  <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={handleEdit}
                      disabled={isLocked}
                      title={isLocked ? 'Resolved or closed issues cannot be edited' : undefined}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      Delete
                    </Button>
                  </Box>
                )}
                {isEditing && (
                  <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                    <Button size="small" onClick={handleCancelEdit} disabled={updateMutation.isLoading}>
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleSaveEdit}
                      disabled={updateMutation.isLoading || !editForm.title.trim() || !editForm.description.trim()}
                    >
                      {updateMutation.isLoading ? 'Saving...' : 'Save'}
                    </Button>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                <StatusBadge status={issue.status} />
                {isEditing ? (
                  <>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        label="Priority"
                        value={editForm.priority}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, priority: e.target.value }))}
                      >
                        {PRIORITIES.map((p) => (
                          <MenuItem key={p} value={p}>{p}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Category</InputLabel>
                      <Select
                        label="Category"
                        value={editForm.category}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                      >
                        {CATEGORIES.map((c) => (
                          <MenuItem key={c} value={c}>{c}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </>
                ) : (
                  <>
                    <PriorityBadge priority={issue.priority} />
                    <Chip
                      label={issue.category}
                      variant="outlined"
                      color="primary"
                    />
                  </>
                )}
                {issue.isUrgent && (
                  <Chip
                    label="Urgent"
                    color="error"
                    size="small"
                  />
                )}
              </Box>

              {isEditing ? (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  sx={{ mb: 3 }}
                />
              ) : (
                <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                  {issue.description}
                </Typography>
              )}

              {/* Images */}
              {issue.images && issue.images.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Photos
                  </Typography>
                  <Grid container spacing={2}>
                    {issue.images.map((image, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Box
                          component="img"
                          src={image.url}
                          alt={`Issue photo ${index + 1}`}
                          sx={{
                            width: '100%',
                            height: 200,
                            objectFit: 'cover',
                            borderRadius: 1,
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            // Open image in full screen
                            window.open(image.url, '_blank');
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Location */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <LocationOn color="action" />
                <Typography variant="body2" color="text.secondary">
                  {issue.location.address}
                </Typography>
              </Box>

              {/* Reporter Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar src={issue.reporter.avatar}>
                  {issue.reporter.name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {issue.reporter.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Reported on {new Date(issue.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant={issue.hasUpvoted ? 'contained' : 'outlined'}
                  startIcon={<ThumbUp />}
                  onClick={handleUpvote}
                  disabled={!user}
                >
                  {issue.hasUpvoted ? 'Upvoted' : 'Upvote'} ({issue.upvoteCount || 0})
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Comment />}
                  onClick={() => setShowCommentDialog(true)}
                  disabled={!user}
                >
                  Comment ({issue.commentCount || 0})
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Share />}
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied to clipboard!');
                  }}
                >
                  Share
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Comments */}
          {issue.comments && issue.comments.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Comments ({issue.commentCount || 0})
                </Typography>
                <List>
                  {issue.comments.map((comment, index) => (
                    <React.Fragment key={index}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar src={comment.user.avatar}>
                            {comment.user.name?.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {comment.user.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {comment.content}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < issue.comments.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Issue Details
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <StatusBadge status={issue.status} />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Priority
                  </Typography>
                  <PriorityBadge priority={issue.priority} />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Category
                  </Typography>
                  <Chip label={issue.category} variant="outlined" />
                </Box>

                {isAdmin && issue.aiSuggestion?.category && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      AI Suggested Category
                    </Typography>
                    <Chip
                      label={`${issue.aiSuggestion.category} (${issue.aiSuggestion.priority})`}
                      size="small"
                      color={issue.aiSuggestion.category === issue.category ? 'success' : 'warning'}
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      From the Java classification service
                      {issue.aiSuggestion.category !== issue.category && ' — differs from reporter\'s choice'}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Reported
                  </Typography>
                  <Typography variant="body2">
                    {new Date(issue.createdAt).toLocaleString()}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {new Date(issue.lastUpdated).toLocaleString()}
                  </Typography>
                </Box>

                {issue.assignedTo?.department && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Assigned To
                    </Typography>
                    <Typography variant="body2">
                      {issue.assignedTo.department}
                    </Typography>
                  </Box>
                )}

                {issue.estimatedResolution && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Estimated Resolution
                    </Typography>
                    <Typography variant="body2">
                      {new Date(issue.estimatedResolution).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Comment Dialog */}
      <Dialog
        open={showCommentDialog}
        onClose={() => setShowCommentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Your comment"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your thoughts about this issue..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCommentDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddComment}
            variant="contained"
            disabled={!commentText.trim() || addCommentMutation.isLoading}
          >
            {addCommentMutation.isLoading ? 'Adding...' : 'Add Comment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Issue</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{issue.title}"? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)} disabled={deleteMutation.isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default IssueDetail;
