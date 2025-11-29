import React from 'react';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProfilePage from './components/ProfilePage';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import EventForm from './components/EventForm';
import TicketPage from './components/TicketPage';
import { useAuth } from './hooks/useAuth';
import { useNavigation } from './hooks/useNavigation';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const { currentPage, navigateTo } = useNavigation();

  React.useEffect(() => {
    if (loading) return;

    const isAuthPage = ['landing', 'login', 'register'].includes(currentPage);
    // Protected pages that require a logged-in user
    const isProtectedAppPage = ['home', 'profile', 'createEvent'].includes(currentPage);

    // If a user is logged in, they shouldn't be on the auth pages. Redirect them home.
    if (user && isAuthPage) {
      navigateTo('home');
    }
    
    // If a user is not logged in and tries to access a protected page, redirect them to the landing page.
    if (!user && isProtectedAppPage) {
        navigateTo('landing');
    }

  }, [user, loading, currentPage, navigateTo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <h1 className="text-white text-2xl">Loading...</h1>
      </div>
    );
  }

  // The ticket page is a special case: it's a public page but we render it within the app shell for consistency.
  // It can be viewed by both logged-in and logged-out users.
  if (currentPage === 'ticket') {
    return (
      <div className="min-h-screen w-full bg-zinc-900 text-white font-sans">
        <Navbar />
        <main className="flex justify-center p-4 sm:p-6 md:p-8">
          <TicketPage />
        </main>
      </div>
    );
  }

  // Unauthenticated routes
  if (!user) {
    switch (currentPage) {
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      case 'landing':
      default:
        return <LandingPage />;
    }
  }

  // Authenticated routes
  return (
    <div className="min-h-screen w-full bg-zinc-900 text-white font-sans">
      <Navbar />
      <main className="flex items-center justify-center p-4 sm:p-6 md:p-8" style={{ minHeight: 'calc(100vh - 4rem)' /* 64px navbar height */ }}>
        {currentPage === 'home' && <Dashboard />}
        {currentPage === 'profile' && <ProfilePage />}
        {currentPage === 'createEvent' && <EventForm />}
      </main>
    </div>
  );
};

export default App;