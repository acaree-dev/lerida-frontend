import React from 'react';

interface OptionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
}

const OptionButton: React.FC<OptionButtonProps> = ({ icon, title, description, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="w-full bg-lerida-light text-left p-4 rounded-lg flex items-center space-x-4 hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-brand-primary transition-all duration-300 transform hover:-translate-y-1 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={!onClick}
    >
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-lg text-lerida-text-primary">{title}</h3>
        <p className="text-sm text-lerida-text-secondary">{description}</p>
      </div>
    </button>
  );
};

export default OptionButton;