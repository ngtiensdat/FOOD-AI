import { useState, useEffect } from 'react';
import { LOCATION_DATA, DEFAULT_CITY } from '@/constants/location.constant';
import { Restaurant, UpdateRestaurantInput } from '@/types/restaurant';
import { LABELS } from '@/constants/labels';

/* eslint-disable react-hooks/set-state-in-effect */

interface UseEditRestaurantProps {
  restaurant: Restaurant | null | undefined;
  isOpen: boolean;
  onSave: (data: UpdateRestaurantInput) => Promise<boolean>;
  onClose: () => void;
}

export const useEditRestaurant = ({
  restaurant,
  isOpen,
  onSave,
  onClose,
}: UseEditRestaurantProps) => {
  const [activeTab, setActiveTab] = useState<'info' | 'images' | 'contact'>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState((LOCATION_DATA[0]?.value) ?? DEFAULT_CITY);
  const [district, setDistrict] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [logo, setLogo] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [bio, setBio] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [syncWithPersonalAvatar, setSyncWithPersonalAvatar] = useState(false);
  const [syncWithPersonalCover, setSyncWithPersonalCover] = useState(false);

  // Load initial data
  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name || '');
      setDescription(restaurant.description || '');
      setAddress(restaurant.address || '');
      setCity(restaurant.city || ((LOCATION_DATA[0]?.value) ?? DEFAULT_CITY));
      setDistrict(restaurant.district || '');
      setMapUrl(restaurant.mapUrl || '');
      setLogo(restaurant.profile?.logo || '');
      setCoverImage(restaurant.profile?.coverImage || '');
      setBio(restaurant.profile?.bio || '');
      setContactEmail(restaurant.profile?.contactEmail || '');
      setContactPhone(restaurant.profile?.contactPhone || '');
      setOpeningHours(restaurant.profile?.openingHours || '');
    }
  }, [restaurant, isOpen]);

  const handleCityChange = (selectedCity: string) => {
    setCity(selectedCity);
    const cityData = LOCATION_DATA.find((c) => c.value === selectedCity);
    if (cityData && cityData.districts.length > 0) {
      setDistrict(cityData.districts[0].value);
    } else {
      setDistrict('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!name.trim()) {
      setError(LABELS.RESTAURANT.EDIT_MODAL.NAME_REQUIRED);
      setLoading(false);
      return;
    }

    if (openingHours && !/^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$/.test(openingHours)) {
      setError(LABELS.RESTAURANT.HOURS_FORMAT_ERROR);
      setLoading(false);
      return;
    }

    try {
      await onSave({
        name,
        address,
        city,
        district,
        description,
        mapUrl,
        logo: logo || null,
        coverImage: coverImage || null,
        bio,
        contactEmail,
        contactPhone,
        openingHours,
        syncWithPersonalAvatar,
        syncWithPersonalCover,
      });
      onClose();
    } catch (err: unknown) {
      const errorVal = err as Error;
      setError(errorVal.message || LABELS.RESTAURANT.EDIT_MODAL.SAVE_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    loading,
    error,
    name,
    setName,
    description,
    setDescription,
    address,
    setAddress,
    city,
    setCity: handleCityChange,
    district,
    setDistrict,
    mapUrl,
    setMapUrl,
    logo,
    setLogo,
    coverImage,
    setCoverImage,
    bio,
    setBio,
    contactEmail,
    setContactEmail,
    contactPhone,
    setContactPhone,
    openingHours,
    setOpeningHours,
    syncWithPersonalAvatar,
    setSyncWithPersonalAvatar,
    syncWithPersonalCover,
    setSyncWithPersonalCover,
    handleSubmit,
  };
};
