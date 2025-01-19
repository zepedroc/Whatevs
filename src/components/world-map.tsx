'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L, { LatLngExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationClock } from './location-clock';

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

function MapController({ targetLocation }: { targetLocation: LatLngTuple | null }) {
  const map = useMap();

  useEffect(() => {
    if (targetLocation) {
      map.setView(targetLocation, 13, {
        animate: false,
        duration: 0,
      });
    }
  }, [map, targetLocation]);

  return null;
}

interface WorldMapProps {
  targetLocation: LatLngTuple | null;
  timezone: string;
}

export default function WorldMap({ targetLocation, timezone }: WorldMapProps) {
  const portoPosition: LatLngExpression = [41.1522, -8.6095];

  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    });
  }, []);

  return (
    <div className="relative h-full w-full">
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
        {targetLocation && (
          <Marker position={targetLocation}>
            <Popup>
              Target Location
              <br />
              Latitude: {targetLocation[0].toFixed(4)}
              <br />
              Longitude: {targetLocation[1].toFixed(4)}
            </Popup>
          </Marker>
        )}
        <LocationMarker />
        <MapController targetLocation={targetLocation} />
      </MapContainer>
      <LocationClock timezone={timezone} />
    </div>
  );
}
