import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapView = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Issue Map
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View all reported issues on an interactive map.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Map functionality will be implemented with real issue data.
            This is a placeholder for the interactive map view.
          </Alert>
          
          <Box sx={{ height: 500, width: '100%' }}>
            <MapContainer
              center={[40.7128, -74.0060]} // New York City coordinates
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* Markers will be added here when connected to real data */}
            </MapContainer>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default MapView;
