import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Avatar,
  Button,
  Grid,
  TextField,
  Divider,
} from '@mui/material';
import {
  Edit,
  Person,
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const buildFormState = (user) => ({
  name: user?.name || '',
  phone: user?.phone || '',
  street: user?.address?.street || '',
  city: user?.address?.city || '',
  state: user?.address?.state || '',
});

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(() => buildFormState(user));

  const handleEdit = () => {
    setForm(buildFormState(user));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleFieldChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateProfile({
      name: form.name,
      phone: form.phone,
      address: {
        street: form.street,
        city: form.city,
        state: form.state,
      },
    });
    setIsSaving(false);
    if (result.success) {
      setIsEditing(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Profile
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                src={user?.avatar}
                sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
              >
                {user?.name?.charAt(0)}
              </Avatar>
              <Typography variant="h6" gutterBottom>
                {user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {user?.email}
              </Typography>
              {!isEditing && (
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  fullWidth
                  onClick={handleEdit}
                >
                  Edit Profile
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Personal Information
                </Typography>
                {isEditing && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={handleCancel} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleSave}
                      disabled={isSaving || !form.name.trim()}
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </Box>
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={isEditing ? form.name : (user?.name || '')}
                    onChange={handleFieldChange('name')}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={user?.email || ''}
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={isEditing ? form.phone : (user?.phone || '')}
                    onChange={handleFieldChange('phone')}
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                    disabled={!isEditing}
                  />
                </Grid>
                {isEditing ? (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Street"
                        value={form.street}
                        onChange={handleFieldChange('street')}
                        InputProps={{
                          startAdornment: <LocationOn sx={{ mr: 1, color: 'action.active' }} />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="City"
                        value={form.city}
                        onChange={handleFieldChange('city')}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="State"
                        value={form.state}
                        onChange={handleFieldChange('state')}
                      />
                    </Grid>
                  </>
                ) : (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      value={user?.address
                        ? `${user.address.street || ''}, ${user.address.city || ''}, ${user.address.state || ''}`
                        : ''
                      }
                      InputProps={{
                        startAdornment: <LocationOn sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                      disabled
                    />
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
