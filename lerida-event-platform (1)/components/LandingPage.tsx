import React from 'react';
import { useNavigation } from '../hooks/useNavigation';

const LandingPage: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center text-white overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 z-0"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(140,0,51,0.3),rgba(255,255,255,0))] z-10"></div>
        
        <div className="relative z-20 flex flex-col items-center text-center p-4">
            <header className="mb-8">
                <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-4">
                    Lerida
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 max-w-2xl">
                    The simplest way to manage your events, from intimate gatherings to large-scale conferences.
                </p>
            </header>

            <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                    onClick={() => navigateTo('register')}
                    className="w-full sm:w-auto bg-brand-primary text-white font-semibold py-3 px-8 rounded-lg text-lg hover:bg-brand-dark focus:outline-none focus:ring-4 focus:ring-brand-primary/50 transition-transform transform hover:scale-105"
                >
                    Get Started
                </button>
                <button
                    onClick={() => navigateTo('login')}
                    className="w-full sm:w-auto bg-zinc-700/50 text-white font-semibold py-3 px-8 rounded-lg text-lg hover:bg-zinc-700 focus:outline-none focus:ring-4 focus:ring-zinc-600/50 transition-colors"
                >
                    Log In
                </button>
            </div>
        </div>
    </div>
  );
};

export default LandingPage;
