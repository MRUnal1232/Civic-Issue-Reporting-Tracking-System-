import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useQuery } from 'react-query';
import { adminEndpoints } from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f', '#0288d1', '#7b1fa2', '#c2185b', '#455a64', '#5d4037'];

const PERIOD_LABELS = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '1y': 'Last year',
};

const AdminAnalytics = () => {
  const [period, setPeriod] = useState('30d');

  const { data, isLoading } = useQuery(
    ['adminAnalytics', period],
    () => adminEndpoints.getAnalytics({ period }),
    { select: (response) => response.data }
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  const analytics = data?.analytics || {};
  const issueTrends = (analytics.issueTrends || []).map((item) => ({
    date: `${item._id.month}/${item._id.day}`,
    count: item.count,
  }));
  const categoryDistribution = analytics.categoryDistribution || [];
  const departmentPerformance = analytics.departmentPerformance || [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Detailed analytics and reporting for the civic issue tracking system.
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Period</InputLabel>
          <Select label="Period" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {Object.entries(PERIOD_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Issues Reported Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={issueTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#1976d2" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Category Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryDistribution} dataKey="count" nameKey="_id" outerRadius={100} label>
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={entry._id} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Department Performance
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Department</TableCell>
                      <TableCell align="right">Total Issues</TableCell>
                      <TableCell align="right">Resolved</TableCell>
                      <TableCell align="right">Resolution Rate</TableCell>
                      <TableCell align="right">Avg. Resolution (days)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {departmentPerformance.map((dept) => (
                      <TableRow key={dept._id}>
                        <TableCell>{dept._id}</TableCell>
                        <TableCell align="right">{dept.total}</TableCell>
                        <TableCell align="right">{dept.resolved}</TableCell>
                        <TableCell align="right">{dept.resolutionRate?.toFixed(1)}%</TableCell>
                        <TableCell align="right">
                          {dept.avgResolutionTime ? dept.avgResolutionTime.toFixed(1) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {departmentPerformance.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No department data for this period.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminAnalytics;
