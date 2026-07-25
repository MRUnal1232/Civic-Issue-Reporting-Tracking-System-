import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { issuesEndpoints } from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import StatusBadge from '../../components/Common/StatusBadge';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// react-leaflet's default marker icon paths break under webpack bundling;
// point them at the bundled image assets instead.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [40.7128, -74.0060]; // New York City

const MapView = () => {
  const navigate = useNavigate();

  const { data: issuesData, isLoading } = useQuery(
    ['issues', 'map'],
    () => issuesEndpoints.getIssues({ limit: 50 }),
    {
      select: (response) => response.data,
    }
  );

  const issues = (issuesData?.issues || []).filter(
    (issue) => issue.location?.coordinates?.coordinates?.length === 2
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading map..." />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Issue Map
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {issues.length > 0
            ? `Showing ${issues.length} reported issue${issues.length === 1 ? '' : 's'} on the map.`
            : 'No reported issues have a location yet.'}
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ height: 500, width: '100%' }}>
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {issues.map((issue) => {
                // GeoJSON stores [longitude, latitude]; Leaflet expects [latitude, longitude].
                const [lng, lat] = issue.location.coordinates.coordinates;
                return (
                  <Marker key={issue._id} position={[lat, lng]}>
                    <Popup>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        {issue.title}
                      </Typography>
                      <Box sx={{ mb: 1 }}>
                        <StatusBadge status={issue.status} />
                      </Box>
                      <Typography variant="caption" display="block" gutterBottom>
                        {issue.category}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/issues/${issue._id}`)}
                      >
                        View Details
                      </Button>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default MapView;
