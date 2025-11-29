import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '../hooks/useNavigation';
import ConfirmationModal from './ConfirmationModal';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import EyeIcon from './icons/EyeIcon';

const Dashboard: React.FC = () => {
  const { user, events, deleteEvent, userBrands } = useAuth();
  const { navigateTo } = useNavigation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  if (!user) return null;

  // Filter events: created by user OR belongs to a brand user admins
  const myEvents = events.filter(event => {
      const isPersonal = event.createdBy === user.id;
      const isBrandEvent = event.brandId ? userBrands.some(b => b.id === event.brandId) : false;
      return isPersonal || isBrandEvent;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDeleteClick = (eventId: string) => {
    setEventToDelete(eventId);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (eventToDelete) {
      deleteEvent(eventToDelete);
    }
    setIsModalOpen(false);
    setEventToDelete(null);
  };

  const calculateSales = (event: typeof myEvents[0]) => {
    const totalTickets = event.tickets.reduce((sum, ticket) => sum + ticket.initialQuantity, 0);
    const ticketsSold = event.tickets.reduce((sum, ticket) => sum + (ticket.initialQuantity - ticket.quantity), 0);
    const progress = totalTickets > 0 ? (ticketsSold / totalTickets) * 100 : 0;
    return { totalTickets, ticketsSold, progress };
  };

  const getEventLabel = (event: typeof myEvents[0]) => {
      if (event.brandId) {
          const brand = userBrands.find(b => b.id === event.brandId);
          return brand ? brand.name : 'Unknown Brand';
      }
      return 'Personal';
  };

  return (
    <>
      <div className="bg-zinc-800 text-white rounded-2xl p-6 sm:p-8 shadow-2xl w-full max-w-4xl">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 border-b border-zinc-700 pb-4">
          <h2 className="text-3xl font-bold">My Dashboard</h2>
          <button
            onClick={() => navigateTo('createEvent')}
            className="mt-4 sm:mt-0 w-full sm:w-auto bg-brand-primary text-white font-semibold py-2 px-5 rounded-lg hover:bg-brand-dark focus:outline-none focus:ring-4 focus:ring-brand-primary/50 transition-transform transform hover:scale-105"
          >
            Create New Event
          </button>
        </div>

        {myEvents.length > 0 ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {myEvents.map(event => {
              const { totalTickets, ticketsSold, progress } = calculateSales(event);
              const label = getEventLabel(event);
              
              return (
                <div key={event.id} className="bg-zinc-700 p-4 rounded-lg relative overflow-hidden">
                   {/* Badge */}
                   <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-lg ${event.brandId ? 'bg-purple-900 text-purple-200' : 'bg-brand-dark text-pink-200'}`}>
                       {label}
                   </div>

                  <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-4 sm:mt-0">
                    <div>
                      <h3 className="font-bold text-xl text-white">{event.title}</h3>
                      <p className="text-sm text-gray-400">{new Date(event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} - {event.location}</p>
                    </div>
                    <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                      <button onClick={() => navigateTo('ticket', { eventId: event.id })} className="p-2 rounded-full hover:bg-zinc-600 transition-colors" title="Preview Event"><EyeIcon className="w-5 h-5 text-gray-300" /></button>
                      <button onClick={() => navigateTo('createEvent', { eventId: event.id })} className="p-2 rounded-full hover:bg-zinc-600 transition-colors" title="Edit Event"><EditIcon className="w-5 h-5 text-gray-300" /></button>
                      <button onClick={() => handleDeleteClick(event.id)} className="p-2 rounded-full hover:bg-brand-dark transition-colors" title="Delete Event"><TrashIcon className="w-5 h-5 text-red-400" /></button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-300">Tickets Sold</span>
                        <span className="text-sm font-medium text-white">{ticketsSold} / {totalTickets}</span>
                    </div>
                    <div className="w-full bg-zinc-600 rounded-full h-2.5">
                      <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <h3 className="text-xl font-semibold">No events yet!</h3>
            <p className="text-gray-400 mt-2">Click "Create New Event" to get started.</p>
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
      />
    </>
  );
};

export default Dashboard;