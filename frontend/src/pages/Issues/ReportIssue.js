import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material';
import {
  LocationOn,
  PhotoCamera,
  Send,
  MyLocation,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { issuesEndpoints } from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { getCurrentAddress } from '../../utils/geolocation';
import toast from 'react-hot-toast';

const ReportIssue = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedImages, setSelectedImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm();

  const stepFields = [
    ['title', 'category', 'priority'],
    ['location.address'],
    ['description'],
  ];

  const reportMutation = useMutation(
    (data) => issuesEndpoints.createIssue(data),
    {
      onSuccess: (response) => {
        toast.success('Issue reported successfully!');
        navigate(`/issues/${response.data.issue._id}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to report issue');
      },
    }
  );

  const steps = [
    'Basic Information',
    'Location Details',
    'Photos & Description',
    'Review & Submit',
  ];

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

  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  const handleNext = async () => {
    const fieldsToValidate = stepFields[activeStep];
    const isValid = fieldsToValidate ? await trigger(fieldsToValidate) : true;
    if (isValid) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    setSelectedImages((prev) => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const result = await getCurrentAddress();

      // Coordinates variable stored locally for any further use
      const currentCoordinates = {
        latitude: result.coordinates.lat,
        longitude: result.coordinates.lng,
      };

      // Update/replace the address field value via react-hook-form
      setValue('location.address', result.address, { shouldValidate: true, shouldDirty: true });

      // Persist location in component state (address + [lng, lat])
      setLocation({
        address: result.address,
        coordinates: [currentCoordinates.longitude, currentCoordinates.latitude],
      });

      toast.success('Location detected successfully!');
    } catch (error) {
      toast.error(`Failed to get location: ${error.message}`);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const onSubmit = (data) => {
    const formData = new FormData();
    
    // Add form fields
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });

    // Add location
    if (location) {
      formData.append('location[address]', location.address);
      formData.append('location[coordinates]', JSON.stringify(location.coordinates));
    }

    // Add images
    selectedImages.forEach((image, index) => {
      formData.append('images', image);
    });

    reportMutation.mutate(formData);
  };

  const getCurrentStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Issue Title"
                {...register('title', {
                  required: 'Title is required',
                  minLength: { value: 5, message: 'Title must be at least 5 characters' },
                  maxLength: { value: 100, message: 'Title must be less than 100 characters' },
                })}
                error={!!errors.title}
                helperText={errors.title?.message}
                placeholder="Brief description of the issue"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  {...register('category', { required: 'Category is required' })}
                  label="Category"
                  defaultValue=""
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.priority}>
                <InputLabel>Priority</InputLabel>
                <Select
                  {...register('priority', { required: 'Priority is required' })}
                  label="Priority"
                  defaultValue="Medium"
                >
                  {priorities.map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      {priority}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Please allow location access to automatically detect your current location,
              or manually enter the address where the issue is located.
            </Alert>
            <TextField
              fullWidth
              label="Address"
              {...register('location.address', { required: 'Address is required' })}
              error={!!errors.location?.address}
              helperText={errors.location?.address?.message}
              placeholder="Enter the address where the issue is located"
              InputProps={{
                startAdornment: <LocationOn sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />
            <Button
              variant="outlined"
              startIcon={<MyLocation />}
              sx={{ mt: 2 }}
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
            </Button>
          </Box>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Detailed Description"
                {...register('description', {
                  required: 'Description is required',
                  minLength: { value: 10, message: 'Description must be at least 10 characters' },
                  maxLength: { value: 1000, message: 'Description must be less than 1000 characters' },
                })}
                error={!!errors.description}
                helperText={errors.description?.message}
                placeholder="Provide detailed information about the issue..."
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Photos (Optional)
              </Typography>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                multiple
                onChange={handleImageUpload}
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCamera />}
                  sx={{ mb: 2 }}
                >
                  Upload Photos
                </Button>
              </label>
              {selectedImages.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedImages.map((image, index) => (
                    <Chip
                      key={index}
                      label={image.name}
                      onDelete={() => removeImage(index)}
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Report
            </Typography>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {watch('title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {watch('description')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Chip label={watch('category')} color="primary" size="small" />
                <Chip label={watch('priority')} color="secondary" size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Location: {watch('location.address')}
              </Typography>
              {selectedImages.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  Photos: {selectedImages.length} image(s)
                </Typography>
              )}
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  if (reportMutation.isLoading) {
    return <LoadingSpinner message="Submitting your report..." />;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" textAlign="center">
        Report a Civic Issue
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center" paragraph>
        Help improve your community by reporting issues that need attention.
      </Typography>

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            {getCurrentStepContent()}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Back
              </Button>
              <Box>
                {activeStep === steps.length - 1 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Send />}
                    disabled={reportMutation.isLoading}
                  >
                    Submit Report
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={
                      (activeStep === 0 && (!watch('title') || !watch('category') || !watch('priority'))) ||
                      (activeStep === 1 && !watch('location.address')) ||
                      (activeStep === 2 && !watch('description'))
                    }
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ReportIssue;
