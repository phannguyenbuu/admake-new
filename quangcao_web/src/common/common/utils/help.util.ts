export const getLocation = (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
};

export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
    );
    const data = await response.json();

    if (data.address) {
      const { city, town, village, state, country } = data.address;
      const cityName = city || town || village || "";
      const stateName = state || "";
      const countryName = country || "";

      return [cityName, stateName, countryName].filter(Boolean).join(", ");
    }

    return "Không xác định được địa chỉ";
  } catch (error) {
    return "Không xác định được địa chỉ";
  }
};

export const convert = (early_leave: number) => {
  const minutes = Math.abs(early_leave);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} giờ ${mins} phút`;
};
