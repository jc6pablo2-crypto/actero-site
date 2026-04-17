import { useEffect, useState } from 'react';

export default function PortalApp() {
  const [route, setRoute] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (p) => {
    window.history.pushState({}, '', p);
    setRoute(p);
  };

  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <p>Portal — route: <code>{route}</code></p>
      <button onClick={() => navigate('/portal/login')}>Go to login</button>
    </div>
  );
}
