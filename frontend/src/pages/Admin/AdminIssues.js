import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminEndpoints } from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import StatusBadge from '../../components/Common/StatusBadge';
import PriorityBadge from '../../components/Common/PriorityBadge';
import toast from 'react-hot-toast';

const STATUSES = ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Closed', 'Rejected'];
const DEPARTMENTS = [
  'Public Works',
  'Water Department',
  'Electricity Board',
  'Waste Management',
  'Police Department',
  'Environmental Agency',
  'Health Department',
  'Education Board',
  'Transport Department',
  'General Administration',
];

const AdminIssues = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [statusDialogIssue, setStatusDialogIssue] = useState(null);
  const [assignDialogIssue, setAssignDialogIssue] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [newDepartment, setNewDepartment] = useState('');

  const { data, isLoading } = useQuery(
    ['adminIssues', page, status, search],
    () => adminEndpoints.getIssues({
      page,
      limit: 10,
      status: status || undefined,
      search: search || undefined,
    }),
    { keepPreviousData: true, select: (response) => response.data }
  );

  const statusMutation = useMutation(
    ({ id, status }) => adminEndpoints.updateIssueStatus(id, { status }),
    {
      onSuccess: () => {
        toast.success('Status updated');
        queryClient.invalidateQueries('adminIssues');
        setStatusDialogIssue(null);
      },
      onError: (error) => toast.error(error.response?.data?.message || 'Failed to update status'),
    }
  );

  const assignMutation = useMutation(
    ({ id, department }) => adminEndpoints.assignIssue(id, { department }),
    {
      onSuccess: () => {
        toast.success('Issue assigned');
        queryClient.invalidateQueries('adminIssues');
        setAssignDialogIssue(null);
      },
      onError: (error) => toast.error(error.response?.data?.message || 'Failed to assign issue'),
    }
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading issues..." />;
  }

  const issues = data?.issues || [];
  const pagination = data?.pagination;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Manage Issues
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Admin interface for managing all reported issues.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          size="small"
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="">All</MenuItem>
            {STATUSES.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Reporter</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Department</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {issues.map((issue) => (
              <TableRow key={issue._id}>
                <TableCell>{issue.title}</TableCell>
                <TableCell>{issue.reporter?.name}</TableCell>
                <TableCell>{issue.category}</TableCell>
                <TableCell><PriorityBadge priority={issue.priority} /></TableCell>
                <TableCell><StatusBadge status={issue.status} /></TableCell>
                <TableCell>{issue.assignedTo?.department || '—'}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    onClick={() => {
                      setStatusDialogIssue(issue);
                      setNewStatus(issue.status);
                    }}
                  >
                    Status
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setAssignDialogIssue(issue);
                      setNewDepartment(issue.assignedTo?.department || '');
                    }}
                  >
                    Assign
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {issues.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No issues found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination?.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
          />
        </Box>
      )}

      <Dialog open={!!statusDialogIssue} onClose={() => setStatusDialogIssue(null)}>
        <DialogTitle>Update Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1, minWidth: 300 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogIssue(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={statusMutation.isLoading}
            onClick={() => statusMutation.mutate({ id: statusDialogIssue._id, status: newStatus })}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!assignDialogIssue} onClose={() => setAssignDialogIssue(null)}>
        <DialogTitle>Assign Department</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1, minWidth: 300 }}>
            <InputLabel>Department</InputLabel>
            <Select label="Department" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)}>
              {DEPARTMENTS.map((d) => (
                <MenuItem key={d} value={d}>{d}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogIssue(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={assignMutation.isLoading || !newDepartment}
            onClick={() => assignMutation.mutate({ id: assignDialogIssue._id, department: newDepartment })}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminIssues;
