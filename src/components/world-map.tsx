'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L, { LatLngExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';

function LocationMarker() {
  const [position, setPosition] = useState<LatLngTuple | null>(null);

  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>
        Latitude: {(position as number[])[0].toFixed(4)}
        <br />
        Longitude: {(position as number[])[1].toFixed(4)}
      </Popup>
    </Marker>
  );
}

export default function WorldMap() {
  const portoPosition: LatLngExpression = [41.1522, -8.6095];

  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    });
  }, []);

  return (
    <MapContainer
      center={portoPosition}
      zoom={12}
      scrollWheelZoom={true}
      className="h-full w-full rounded-lg"
      style={{ background: '#f0f0f0' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={portoPosition}>
        <Popup>Porto, Portugal</Popup>
      </Marker>
      <LocationMarker />
    </MapContainer>
  );
}
