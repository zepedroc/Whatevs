import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useChat } from 'ai/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapIcon, CompassIcon, MessageSquareIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type SearchMode = 'location' | 'coordinates' | 'chat';

interface SearchModeOption {
  value: SearchMode;
  label: string;
  icon: React.ReactNode;
}

interface MapActionsProps {
  onLocationFound: (lat: number, lng: number) => void;
}

export function MapActions({ onLocationFound }: MapActionsProps) {
  const t = useTranslations('WorldMap');
  const [searchMode, setSearchMode] = useState<SearchMode>('location');
  const [open, setOpen] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const searchModes: SearchModeOption[] = [
    {
      value: 'location',
      label: t('searchByLocation'),
      icon: <MapIcon className="h-4 w-4" />,
    },
    {
      value: 'coordinates',
      label: t('searchByCoordinates'),
      icon: <CompassIcon className="h-4 w-4" />,
    },
    {
      value: 'chat',
      label: t('searchByChat'),
      icon: <MessageSquareIcon className="h-4 w-4" />,
    },
  ];

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    body: { mode: 'location_finder' },
    onFinish: async (message) => {
      const location = message.content.trim();
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`,
        );
        const data = await response.json();

        if (data && data[0]) {
          onLocationFound(parseFloat(data[0].lat), parseFloat(data[0].lon));
        }
      } catch (error) {
        console.error('Error fetching location:', error);
      }
    },
  });

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const currentMode = searchModes.find((mode) => mode.value === searchMode);

  return (
    <div className="flex flex-col gap-4 h-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            <div className="flex items-center gap-2">
              {currentMode?.icon}
              <span>{currentMode?.label}</span>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-2" align="start">
          <div className="space-y-1">
            {searchModes.map((mode) => (
              <Button
                key={mode.value}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setSearchMode(mode.value);
                  setOpen(false);
                }}
              >
                <div className="flex items-center w-full">
                  {mode.icon}
                  <span className="ml-2">{mode.label}</span>
                  <Check className={cn('ml-auto h-4 w-4', searchMode === mode.value ? 'opacity-100' : 'opacity-0')} />
                </div>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex-1">
        {searchMode === 'location' && (
          <form onSubmit={handleLocationSearch} className="flex flex-col gap-2">
            <Input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder={t('searchPlaceholder')}
            />
            <Button type="submit" className="w-full">
              {t('searchButton')}
            </Button>
          </form>
        )}

        {searchMode === 'coordinates' && (
          <form onSubmit={handleCoordinateSearch} className="flex flex-col gap-2">
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
            <Button type="submit" className="w-full">
              {t('searchButton')}
            </Button>
          </form>
        )}

        {searchMode === 'chat' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 h-full">
            <Textarea
              className="flex-1 min-h-[200px] resize-none"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={t('askLocation')}
            />
            <Button type="submit" className="w-full">
              {t('searchButton')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
