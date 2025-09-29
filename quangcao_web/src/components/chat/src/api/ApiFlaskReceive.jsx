import { useState, useEffect } from "react";

function useApiFlaskReceive(api) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
