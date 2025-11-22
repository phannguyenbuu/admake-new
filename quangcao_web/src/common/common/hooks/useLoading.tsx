export const useLoading = () => {
  const [loading, setLoading] = useState(false);

  const startLoading = () => setLoading(true);
  const stopLoading = () => setLoading(false);

  return { loading, toggle: () => (loading ? stopLoading() : startLoading()) };
};
import { useState } from "react";
