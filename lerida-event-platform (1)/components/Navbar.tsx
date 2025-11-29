import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '../hooks/useNavigation';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { navigateTo, currentPage } = useNavigation();

  const handleLogout = () => {
    logout();
    navigateTo('landing');
  };
  
  const linkClasses = (page: string) => 
    `px-3 py-2 rounded-md text-sm font-medium transition ${currentPage === page ? 'text-white bg-zinc-700' : 'text-gray-300 hover:bg-zinc-700 hover:text-white'}`;


  return (
    <nav className="bg-zinc-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 cursor-pointer" onClick={() => user ? navigateTo('home'): navigateTo('landing')}>
            <h1 className="text-2xl font-bold text-white">Lerida</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <button
                  onClick={() => navigateTo('home')}
                  className={linkClasses('home')}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigateTo('profile')}
                  className={linkClasses('profile')}
                >
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-300 hover:bg-zinc-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigateTo('login')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${currentPage === 'login' ? 'text-white' : 'text-gray-300 hover:bg-zinc-700 hover:text-white'}`}
                >
                  Login
                </button>
                <button
                  onClick={() => navigateTo('register')}
                  className="bg-brand-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-brand-dark transition"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
