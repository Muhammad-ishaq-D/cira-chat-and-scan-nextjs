import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/activityTracker";

const RouteTracker = () => {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
    const hideStyle = document.getElementById("spa-fallback-hide");
    if (hideStyle) hideStyle.remove();
  }, [location.pathname, location.search]);
  return null;
};

export default RouteTracker;
