import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MapActionsProps {
  onLocationFound: (lat: number, lng: number) => void;
}

export function MapActions({ onLocationFound }: MapActionsProps) {
  const t = useTranslations('WorldMap');
  const [searchLocation, setSearchLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}`,
      );
      const data = await response.json();

      if (data && data[0]) {
        onLocationFound(parseFloat(data[0].lat), parseFloat(data[0].lon));
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  };

  const handleCoordinateSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (!isNaN(lat) && !isNaN(lng)) {
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        onLocationFound(lat, lng);
      }
    }
  };

  return (
    <Tabs defaultValue="location" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="location">{t('searchByLocation')}</TabsTrigger>
        <TabsTrigger value="coordinates">{t('searchByCoordinates')}</TabsTrigger>
      </TabsList>
      <TabsContent value="location">
        <form onSubmit={handleLocationSearch} className="flex gap-2">
          <Input
            type="text"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            placeholder={t('searchPlaceholder')}
          />
          <Button type="submit" size="sm">
            {t('searchButton')}
          </Button>
        </form>
      </TabsContent>
      <TabsContent value="coordinates">
        <form onSubmit={handleCoordinateSearch} className="flex gap-2">
          <Input
            type="text"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder={t('latitudePlaceholder')}
          />
          <Input
            type="text"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder={t('longitudePlaceholder')}
          />
          <Button type="submit" size="sm">
            {t('searchButton')}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
