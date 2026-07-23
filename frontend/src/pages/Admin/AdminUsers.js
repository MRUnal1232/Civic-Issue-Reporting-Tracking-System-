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
  Chip,
  Switch,
  Pagination,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminEndpoints } from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery(
    ['adminUsers', page, role, search],
    () => adminEndpoints.getUsers({
      page,
      limit: 10,
      role: role || undefined,
      search: search || undefined,
    }),
    { keepPreviousData: true, select: (response) => response.data }
  );

  const statusMutation = useMutation(
    ({ id, isActive }) => adminEndpoints.updateUserStatus(id, { isActive }),
    {
      onSuccess: (_, variables) => {
        toast.success(`User ${variables.isActive ? 'activated' : 'deactivated'}`);
        queryClient.invalidateQueries('adminUsers');
      },
      onError: (error) => toast.error(error.response?.data?.message || 'Failed to update user'),
    }
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading users..." />;
  }

  const users = data?.users || [];
  const pagination = data?.pagination;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Manage Users
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Admin interface for managing user accounts.
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
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Role</InputLabel>
          <Select
            label="Role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Issues Reported</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="right">Active</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    size="small"
                    color={user.role === 'admin' ? 'secondary' : 'default'}
                  />
                </TableCell>
                <TableCell>{user.issueCount}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <Switch
                    checked={user.isActive}
                    disabled={statusMutation.isLoading}
                    onChange={(e) => statusMutation.mutate({ id: user._id, isActive: e.target.checked })}
                  />
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No users found.
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
    </Container>
  );
};

export default AdminUsers;
