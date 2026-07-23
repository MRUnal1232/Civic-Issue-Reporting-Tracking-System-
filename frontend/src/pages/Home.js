import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Report,
  Map,
  TrendingUp,
  Security,
  Speed,
  Support,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { heroRef } = useScrollAnimation();

  const features = [
    {
      icon: <Report sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Report Issues',
      description: 'Easily report civic issues with photos, location, and detailed descriptions.',
    },
    {
      icon: <Map sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Interactive Map',
      description: 'View all reported issues on an interactive map with real-time updates.',
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Track Progress',
      description: 'Monitor the status of your reported issues from submission to resolution.',
    },
    {
      icon: <Security sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Secure Platform',
      description: 'Your data is protected with enterprise-grade security measures.',
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Fast Response',
      description: 'Get quick responses from local authorities and departments.',
    },
    {
      icon: <Support sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Community Support',
      description: 'Connect with your community and support local improvement initiatives.',
    },
  ];

  const stats = [
    { number: '10,000+', label: 'Issues Reported' },
    { number: '95%', label: 'Resolution Rate' },
    { number: '50+', label: 'Cities Covered' },
    { number: '24/7', label: 'Support Available' },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        ref={heroRef}
        className="hero"
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant={isMobile ? 'h3' : 'h2'}
            component="h1"
            className="scroll-animated"
            gutterBottom
            fontWeight="bold"
            sx={{
              color: '#ffffff', // Initial white color
              transition: 'color 0.3s ease-in-out',
            }}
          >
            Make Your Community Better
          </Typography>
          <Typography
            variant={isMobile ? 'h6' : 'h5'}
            component="p"
            className="scroll-animated"
            paragraph
            sx={{ 
              maxWidth: '600px', 
              mx: 'auto', 
              mb: 4,
              color: '#ffffff', // Initial white color
              transition: 'color 0.3s ease-in-out',
            }}
          >
            Report civic issues, track their progress, and work together with your
            community to create positive change.
          </Typography>
          <Box 
            className="scroll-animated"
            sx={{ 
              display: 'flex', 
              gap: 2, 
              justifyContent: 'center', 
              flexWrap: 'wrap',
              color: '#ffffff', // Initial white color
              transition: 'color 0.3s ease-in-out',
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate(isAuthenticated ? '/report' : '/register')}
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'grey.100',
                },
              }}
            >
              {isAuthenticated ? 'Report Issue' : 'Get Started'}
              <ArrowForward sx={{ ml: 1 }} />
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/issues')}
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              View Issues
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box sx={{ py: 6, backgroundColor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: 'white',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {stat.number}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            gutterBottom
            fontWeight="bold"
          >
            Why Choose Civic Tracker?
          </Typography>
          <Typography
            variant="h6"
            textAlign="center"
            color="text.secondary"
            paragraph
            sx={{ mb: 6, maxWidth: '600px', mx: 'auto' }}
          >
            Our platform makes it easy for citizens to report issues and for
            authorities to respond effectively.
          </Typography>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                    <Box sx={{ mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
          py: 8,
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={3}
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 3,
            }}
          >
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Ready to Make a Difference?
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph>
              Join thousands of citizens who are already using Civic Tracker to
              improve their communities.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate(isAuthenticated ? '/report' : '/register')}
                endIcon={<ArrowForward />}
              >
                {isAuthenticated ? 'Report Your First Issue' : 'Sign Up Now'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/issues')}
              >
                Explore Issues
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
