import { useAnalytics } from '@/hooks/useAnalytics';

/**
 * Component that activates analytics page view tracking.
 * Must be rendered inside BrowserRouter.
 */
export const AnalyticsProvider = () => {
  useAnalytics(); // This auto-tracks page views via useEffect
  return null;
};
