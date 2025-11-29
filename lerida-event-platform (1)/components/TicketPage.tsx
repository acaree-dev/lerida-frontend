import React, { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useAuth } from '../hooks/useAuth';
import { Event, Ticket } from '../context/AuthContext';
import CalendarIcon from './icons/CalendarIcon';
import MinusIcon from './icons/MinusIcon';
import PlusIcon from './icons/PlusIcon';

type PageView = 'selection' | 'checkout' | 'processing' | 'confirmation';

const TicketPage: React.FC = () => {
    const { currentPageParams } = useNavigation();
    const { getEventById, purchaseTickets, getEventOrganizer } = useAuth();
    
    const [event, setEvent] = useState<Event | null | undefined>(undefined);
    const [organizerName, setOrganizerName] = useState('Organizer');
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<PageView>('selection');
    
    // State for purchasing
    const [purchaseOrder, setPurchaseOrder] = useState<Record<string, number>>({});
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    // Store answers to custom questions: { questionId: answer }
    const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
    
    const [checkoutError, setCheckoutError] = useState('');

    useEffect(() => {
        const eventId = currentPageParams?.eventId;
        if (eventId) {
            // We get a fresh copy of the event every time to ensure ticket counts are up to date
            const foundEvent = getEventById(eventId);
            setEvent(foundEvent);
            if (foundEvent) {
                setOrganizerName(getEventOrganizer(eventId));
                // Initialize purchase order
                const initialOrder = foundEvent.tickets.reduce((acc, ticket) => {
                    acc[ticket.id] = 0;
                    return acc;
                }, {} as Record<string, number>);
                setPurchaseOrder(initialOrder);
            }
        } else {
            setEvent(null);
        }
        setLoading(false);
    }, [currentPageParams, getEventById, getEventOrganizer]);

    const handleQuantityChange = (ticketId: string, delta: number) => {
        const ticket = event?.tickets.find(t => t.id === ticketId);
        if (!ticket) return;

        setPurchaseOrder(prev => {
            const currentQuantity = prev[ticketId] || 0;
            const newQuantity = Math.max(0, Math.min(ticket.purchaseLimit, ticket.quantity, currentQuantity + delta));
            return { ...prev, [ticketId]: newQuantity };
        });
    };
    
    const { orderDetails, totalCost, totalTickets } = useMemo(() => {
        if (!event) return { orderDetails: [], totalCost: 0, totalTickets: 0 };
        
        const details = Object.entries(purchaseOrder)
            .map(([ticketId, quantity]) => {
                const ticket = event.tickets.find(t => t.id === ticketId);
                // FIX: Ensure quantity is treated as a number
                return { ticket, quantity: Number(quantity) };
            })
            .filter(item => item.ticket && item.quantity > 0);

        const cost = details.reduce((acc, item) => acc + (item.ticket!.price * item.quantity), 0);
        const ticketsCount = details.reduce((acc, item) => acc + item.quantity, 0);

        return { orderDetails: details, totalCost: cost, totalTickets: ticketsCount };
    }, [purchaseOrder, event]);


    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setCheckoutError('');
        if (!customerName || !customerEmail) {
            setCheckoutError('Please enter your name and email.');
            return;
        }

        if (event?.collectPhone && !customerPhone) {
             setCheckoutError('Phone number is required.');
             return;
        }

        // Validate custom questions
        if (event?.customQuestions) {
            for (const q of event.customQuestions) {
                if (q.required && (!customAnswers[q.id] || customAnswers[q.id].trim() === '')) {
                    setCheckoutError(`Please answer: ${q.question}`);
                    return;
                }
            }
        }

        if (event) {
            setView('processing');
            const success = await purchaseTickets(event.id, purchaseOrder);
            if (success) {
                if (event.redirectUrl) {
                    // Simulate redirect
                    window.location.href = event.redirectUrl;
                    // If this was a real app, the page would unload. 
                    // For SPA simulation, we can just show a "Redirecting..." message if href doesn't trigger immediately (e.g. if it was internal)
                    // but standard href assignment works.
                } else {
                    setView('confirmation');
                }
            } else {
                setCheckoutError('Failed to process purchase. Tickets may no longer be available. Please try again.');
                setView('checkout');
            }
        }
    }


    if (loading) {
        return <p className="text-white">Loading event...</p>;
    }

    if (!event) {
        return <div className="text-center pt-10">
            <h2 className="text-3xl font-bold text-white">Event Not Found</h2>
            <p className="text-gray-400 mt-2">The event you are looking for does not exist or may have been moved.</p>
        </div>
    }

    const eventDate = new Date(`${event.date}T${event.time}`);

    const renderSelectionView = () => (
         <div className="bg-zinc-700/50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-center">Tickets</h2>
            <div className="space-y-4">
                {event.tickets.map(ticket => (
                    <div key={ticket.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-700 p-4 rounded-lg border border-zinc-600 gap-4">
                        <div className="flex-1">
                            <h3 className="font-bold text-lg">{ticket.name}</h3>
                            <p className="text-sm text-brand-primary font-semibold">${ticket.price.toFixed(2)}</p>
                            {ticket.quantity < 10 && ticket.quantity > 0 && (
                                <span className="text-xs text-orange-400">Only {ticket.quantity} left!</span>
                            )}
                            {ticket.quantity === 0 && (
                                <span className="text-xs text-red-500">Sold Out</span>
                            )}
                        </div>
                        <div className="flex items-center space-x-3 self-end sm:self-center">
                            <button 
                                onClick={() => handleQuantityChange(ticket.id, -1)}
                                disabled={!purchaseOrder[ticket.id]}
                                className="p-1 rounded-full bg-zinc-600 hover:bg-zinc-500 disabled:opacity-30 transition-colors"
                            >
                                <MinusIcon className="w-5 h-5" />
                            </button>
                            <span className="w-6 text-center font-mono text-lg">{purchaseOrder[ticket.id] || 0}</span>
                            <button 
                                onClick={() => handleQuantityChange(ticket.id, 1)}
                                disabled={ticket.quantity === 0 || (purchaseOrder[ticket.id] || 0) >= ticket.quantity || (purchaseOrder[ticket.id] || 0) >= ticket.purchaseLimit}
                                className="p-1 rounded-full bg-zinc-600 hover:bg-zinc-500 disabled:opacity-30 transition-colors"
                            >
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            {totalTickets > 0 && (
                <div className="mt-8 pt-4 border-t border-zinc-600">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-medium">Total ({totalTickets} tickets)</span>
                        <span className="text-2xl font-bold text-white">${totalCost.toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={() => setView('checkout')}
                        className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-dark text-white rounded-lg font-bold text-lg shadow-lg transition-transform transform hover:scale-105 focus:ring-4 focus:ring-brand-primary/50"
                    >
                        Proceed to Checkout
                    </button>
                </div>
            )}
        </div>
    );

    const renderCheckoutView = () => (
        <div className="bg-zinc-700/50 p-6 rounded-lg">
             <button onClick={() => setView('selection')} className="mb-4 text-sm text-gray-400 hover:text-white underline">
                &larr; Back to tickets
            </button>
            <h2 className="text-2xl font-semibold mb-6">Checkout</h2>
            
            <div className="mb-6 bg-zinc-700 p-4 rounded-md">
                <h3 className="font-medium mb-2 text-gray-300">Order Summary</h3>
                <ul className="space-y-2 mb-4">
                    {orderDetails.map(({ticket, quantity}) => (
                        <li key={ticket?.id} className="flex justify-between text-sm">
                            <span>{quantity}x {ticket?.name}</span>
                            <span>${(ticket!.price * quantity).toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
                <div className="flex justify-between pt-2 border-t border-zinc-600 font-bold text-lg">
                    <span>Total</span>
                    <span>${totalCost.toFixed(2)}</span>
                </div>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                        <input 
                            type="text" 
                            required
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                        <input 
                            type="email" 
                            required
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-white"
                        />
                    </div>
                    {event.collectPhone && (
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                            <input 
                                type="tel" 
                                required
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-white"
                            />
                        </div>
                    )}
                </div>
                
                {/* Custom Questions */}
                {event.customQuestions && event.customQuestions.length > 0 && (
                    <div className="pt-4 border-t border-zinc-600 mt-4">
                        <h3 className="font-medium text-gray-300 mb-3">Additional Information</h3>
                        <div className="space-y-4">
                            {event.customQuestions.map(q => (
                                <div key={q.id}>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">{q.question} {q.required && '*'}</label>
                                    <input 
                                        type="text"
                                        required={q.required}
                                        value={customAnswers[q.id] || ''}
                                        onChange={(e) => setCustomAnswers({...customAnswers, [q.id]: e.target.value})}
                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-white"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {checkoutError && <p className="text-red-400 text-sm">{checkoutError}</p>}
                
                <button 
                    type="submit"
                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg shadow-lg transition-colors mt-6"
                >
                    Pay ${totalCost.toFixed(2)}
                </button>
            </form>
        </div>
    );

    const renderProcessingView = () => (
         <div className="bg-zinc-700/50 p-12 rounded-lg flex flex-col items-center justify-center text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <h2 className="text-2xl font-semibold">Processing Payment...</h2>
            <p className="text-gray-400 mt-2">Please do not close this window.</p>
        </div>
    );

    const renderConfirmationView = () => (
        <div className="bg-zinc-700/50 p-8 rounded-lg text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-3xl font-bold mb-2">You're going!</h2>
            <p className="text-gray-300 mb-6">Your tickets for <span className="text-white font-semibold">{event.title}</span> have been sent to {customerEmail}.</p>
            
            {/* Show Rewards in Confirmation */}
            {event.rewards && event.rewards.length > 0 && (
                <div className="bg-brand-dark/30 border border-brand-primary/30 p-4 rounded-lg mb-6 text-left">
                    <h4 className="font-bold text-brand-primary mb-2">Included Rewards:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-300">
                        {event.rewards.map(r => (
                            <li key={r.id}><span className="font-semibold text-white">{r.title}</span>: {r.description}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="bg-zinc-800 p-4 rounded-lg max-w-sm mx-auto mb-6">
                <p className="text-sm text-gray-400 mb-1">Order Reference</p>
                <p className="font-mono text-lg select-all text-white">REF-{Date.now().toString().slice(-6)}</p>
            </div>
            <button onClick={() => window.location.reload()} className="text-brand-primary hover:text-white underline">
                Buy More Tickets
            </button>
        </div>
    );

    return (
        <div className="w-full max-w-5xl mx-auto">
             {/* Event Header */}
            <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden mb-8 shadow-2xl group">
                {event.imageUrl ? (
                    <img src={event.imageUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                     <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-black"></div>
                )}
                <div className="absolute inset-0 bg-black/50 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 p-6 sm:p-10 w-full">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <span className="bg-white/20 px-2 py-1 rounded backdrop-blur-md uppercase tracking-wide text-xs">
                            {organizerName} Presents
                        </span>
                        {event.tags?.map(tag => (
                            <span key={tag} className="bg-brand-primary/80 px-2 py-1 rounded text-xs">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <h1 className="text-3xl sm:text-6xl font-bold text-white mb-2 leading-tight">{event.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm sm:text-lg text-gray-200">
                        <div className="flex items-center space-x-2">
                            <CalendarIcon className="w-5 h-5 text-brand-primary" />
                            <span>{eventDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} at {event.time}</span>
                        </div>
                        <span>•</span>
                        <span>{event.location}</span>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Description & Details */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-white border-b border-zinc-700 pb-2">About this Event</h2>
                        <div className="prose prose-invert max-w-none text-gray-300 text-lg leading-relaxed">
                            <p className="whitespace-pre-line">{event.description}</p>
                        </div>
                    </section>
                    
                    {(event.rewards && event.rewards.length > 0) && (
                        <section className="bg-zinc-800 p-6 rounded-xl border border-zinc-700">
                            <h3 className="text-xl font-bold mb-4 text-brand-primary">Ticket Holder Rewards</h3>
                            <div className="grid gap-4">
                                {event.rewards.map(r => (
                                    <div key={r.id} className="flex items-start">
                                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-brand-dark flex items-center justify-center mt-1 text-xs font-bold">✓</div>
                                        <div className="ml-3">
                                            <h4 className="font-bold text-white">{r.title}</h4>
                                            <p className="text-sm text-gray-400">{r.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {event.hashtags && event.hashtags.length > 0 && (
                         <div className="flex flex-wrap gap-2 pt-4">
                             {event.hashtags.map((tag, i) => (
                                 <span key={i} className="text-brand-primary hover:text-brand-primary/80 cursor-pointer">#{tag.replace('#', '')}</span>
                             ))}
                         </div>
                    )}
                </div>

                {/* Right Column: Ticket Action */}
                <div className="lg:col-span-1">
                     <div className="sticky top-6">
                        {view === 'selection' && renderSelectionView()}
                        {view === 'checkout' && renderCheckoutView()}
                        {view === 'processing' && renderProcessingView()}
                        {view === 'confirmation' && renderConfirmationView()}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default TicketPage;