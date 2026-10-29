import AppLayout from '../components/dashboard/AppLayout';
import { DashboardBackground } from '../components/background/Backgrounds';
import InstallPrompt from '../components/pwa/InstallPrompt';

export default function InstallPage() {
  return (
    <AppLayout background={<DashboardBackground />}>
      <h1 className="mb-6 font-display text-2xl font-semibold text-text-primary">Install Edufolio App</h1>
      <div className="max-w-md">
        <InstallPrompt />
      </div>
    </AppLayout>
  );
}
