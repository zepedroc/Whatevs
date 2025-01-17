'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function WorldMap() {
  const center: LatLngExpression = [0, 0];
  const madridPosition: LatLngExpression = [40.4168, -3.7038];

  useEffect(() => {
    // Fix Leaflet's default icon path issues
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    });
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={2}
      scrollWheelZoom={true}
      className="h-full w-full rounded-lg"
      style={{ background: '#f0f0f0' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={madridPosition}>
        <Popup>Madrid, Spain</Popup>
      </Marker>
    </MapContainer>
  );
}
