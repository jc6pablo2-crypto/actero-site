import { useEffect, useState } from 'react';
import PortalLayout from './PortalLayout.jsx';
import PortalLoginPage from './PortalLoginPage.jsx';
import PortalVerifyPage from './PortalVerifyPage.jsx';
import PortalTicketsListPage from './PortalTicketsListPage.jsx';
import PortalTicketDetailPage from './PortalTicketDetailPage.jsx';

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

  let page;
  const ticketMatch = route.match(/^\/portal\/tickets\/([^/]+)$/);
  if (route === '/portal/login' || route === '/' || route === '') page = <PortalLoginPage />;
  else if (route === '/portal/verify') page = <PortalVerifyPage navigate={navigate} />;
  else if (route === '/portal/tickets') page = <PortalTicketsListPage navigate={navigate} />;
  else if (ticketMatch) page = <PortalTicketDetailPage ticketId={ticketMatch[1]} navigate={navigate} />;
  else page = <div>Page à venir · route: {route}</div>;

  return <PortalLayout navigate={navigate}>{page}</PortalLayout>;
}
