import React from 'react';
import OptionButton from './OptionButton';
import CalendarIcon from './icons/CalendarIcon';
import LinkIcon from './icons/LinkIcon';
import { useNavigation } from '../hooks/useNavigation';

const CreateModal: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <div className="bg-brand-dark text-white rounded-2xl p-8 md:p-12 shadow-2xl w-full max-w-2xl transform transition-all duration-300">
      <div className="space-y-6">
        <OptionButton
          icon={<CalendarIcon className="w-10 h-10 text-brand-dark" />}
          title="Event"
          description="An event with a set date and time"
          onClick={() => navigateTo('createEvent')}
        />
        <OptionButton
          icon={<LinkIcon className="w-10 h-10 text-brand-dark" />}
          title="Landing Page"
          description="A rich event page for shows, webinars, and more."
          onClick={() => navigateTo('createEvent')}
        />
      </div>
      
      <div className="text-center mt-10">
        <button 
          onClick={() => navigateTo('profile')}
          className="text-white font-semibold py-2 px-4 rounded-lg hover:bg-white/10 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-white/50">
          Manage Brands
        </button>
      </div>
    </div>
  );
};

export default CreateModal;