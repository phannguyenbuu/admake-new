import { useState, useEffect } from "react";

function useApiFlaskReceive<T = any>(api: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(api)
      .then(res => {
        if (!res.ok) throw new Error("HTTP status " + res.status);
        return res.json();
      })
      .then(result => setData(result))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [api]);

  return { data, loading, error };
}

export default useApiFlaskReceive;
