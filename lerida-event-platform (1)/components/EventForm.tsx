import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Ticket, CustomQuestion, Reward } from '../context/AuthContext';
import { useNavigation } from '../hooks/useNavigation';
import CopyIcon from './icons/CopyIcon';
import TrashIcon from './icons/TrashIcon';

const EventForm: React.FC = () => {
    const { createEvent, updateEvent, getEventById, user, userBrands } = useAuth();
    const { navigateTo, currentPageParams } = useNavigation();

    const eventIdToEdit = currentPageParams?.eventId;
    const isEditMode = Boolean(eventIdToEdit);

    // Basic Info
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [expirationTime, setExpirationTime] = useState('');
    const [location, setLocation] = useState('');
    const [brandId, setBrandId] = useState<string>('');

    // Media & Metadata
    const [imageUrl, setImageUrl] = useState('');
    const [hashtags, setHashtags] = useState(''); // string input
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    
    // Post-purchase & Checkout
    const [redirectUrl, setRedirectUrl] = useState('');
    const [collectPhone, setCollectPhone] = useState(false);
    const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);

    const [tickets, setTickets] = useState<Omit<Ticket, 'initialQuantity'>[]>([{ id: `t_${Date.now()}`, name: 'General Admission', price: 0, quantity: 100, purchaseLimit: 10 }]);
    const [error, setError] = useState('');
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState('');

    const POPULAR_TAGS = ['Show', 'Concert', 'Festival', 'Webinar', 'Meeting', 'In-person', 'Party', 'Conference'];

    useEffect(() => {
        if (isEditMode) {
            const eventToEdit = getEventById(eventIdToEdit);
            if (eventToEdit) {
                setTitle(eventToEdit.title);
                setDescription(eventToEdit.description);
                setDate(eventToEdit.date);
                setTime(eventToEdit.time);
                setExpirationTime(eventToEdit.expirationTime || '');
                setLocation(eventToEdit.location);
                setTickets(eventToEdit.tickets.length > 0 ? eventToEdit.tickets : []);
                setBrandId(eventToEdit.brandId || '');
                
                setImageUrl(eventToEdit.imageUrl || '');
                setHashtags(eventToEdit.hashtags ? eventToEdit.hashtags.join(', ') : '');
                setSelectedTags(eventToEdit.tags || []);
                setRedirectUrl(eventToEdit.redirectUrl || '');
                setCollectPhone(eventToEdit.collectPhone || false);
                setCustomQuestions(eventToEdit.customQuestions || []);
                setRewards(eventToEdit.rewards || []);
            }
        }
    }, [eventIdToEdit, getEventById, isEditMode]);

    const handleTicketChange = (index: number, field: keyof Omit<Ticket, 'id'|'initialQuantity'>, value: string | number) => {
        const newTickets = [...tickets];
        const numericValue = typeof value === 'string' && (field === 'price' || field === 'quantity' || field === 'purchaseLimit') ? parseFloat(value) : value;
        (newTickets[index] as any)[field] = numericValue;
        setTickets(newTickets);
    };

    const addTicketType = () => {
        setTickets([...tickets, { id: `t_${Date.now()}`, name: '', price: 0, quantity: 0, purchaseLimit: 0 }]);
    };

    const removeTicketType = (index: number) => {
        const newTickets = tickets.filter((_, i) => i !== index);
        setTickets(newTickets);
    };
    
    // Tag helpers
    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    // Custom Question Helpers
    const addQuestion = () => {
        setCustomQuestions([...customQuestions, { id: `q_${Date.now()}`, question: '', required: false }]);
    };
    const removeQuestion = (index: number) => {
        setCustomQuestions(customQuestions.filter((_, i) => i !== index));
    };
    const updateQuestion = (index: number, field: keyof CustomQuestion, value: any) => {
        const newQs = [...customQuestions];
        (newQs[index] as any)[field] = value;
        setCustomQuestions(newQs);
    };

    // Reward Helpers
    const addReward = () => {
        setRewards([...rewards, { id: `r_${Date.now()}`, title: '', description: '' }]);
    };
    const removeReward = (index: number) => {
        setRewards(rewards.filter((_, i) => i !== index));
    };
    const updateReward = (index: number, field: keyof Reward, value: string) => {
        const newRewards = [...rewards];
        (newRewards[index] as any)[field] = value;
        setRewards(newRewards);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Strictly limiting to 500KB because we are using LocalStorage for this simulation
            // and it has a hard quota (usually 5MB total for the domain).
            if (file.size > 500 * 1024) {
                setError("Image file is too large (max 500KB for this demo).");
                return;
            }
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result as string);
                setError(''); // clear errors
            };
            reader.readAsDataURL(file);
        }
    };

    const resetForm = () => {
        setTitle(''); setDescription(''); setDate(''); setTime(''); setExpirationTime(''); setLocation('');
        setTickets([{ id: `t_${Date.now()}`, name: 'General Admission', price: 0, quantity: 100, purchaseLimit: 10 }]);
        setBrandId(''); setImageUrl(''); setHashtags(''); setSelectedTags([]); setRedirectUrl('');
        setCollectPhone(false); setCustomQuestions([]); setRewards([]);
        setError(''); setGeneratedLink(null); setCopySuccess('');
        navigateTo('createEvent'); // Clear params
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!title || !date || !time || !location) {
            setError('Please fill in required fields: Title, Date, Time, and Location.');
            return;
        }
        if (tickets.some(t => !t.name || t.price < 0 || t.quantity < 0)) {
            setError('Please ensure all ticket types have a name and non-negative price/quantity.');
            return;
        }

        const processedHashtags = hashtags.split(',').map(s => s.trim()).filter(s => s.length > 0);

        const eventData = { 
            title, 
            description, 
            date, 
            time, 
            expirationTime, 
            location, 
            tickets,
            brandId: brandId || undefined,
            imageUrl,
            hashtags: processedHashtags,
            tags: selectedTags,
            redirectUrl,
            collectPhone,
            customQuestions: customQuestions.filter(q => q.question.trim() !== ''),
            rewards: rewards.filter(r => r.title.trim() !== '')
        };

        const resultEvent = isEditMode
            ? await updateEvent(eventIdToEdit, eventData)
            : await createEvent(eventData);

        if (resultEvent) {
            setGeneratedLink(resultEvent.shareableLink);
        } else {
            setError(`Failed to ${isEditMode ? 'update' : 'create'} event. Storage might be full.`);
        }
    };
    
    const handleCopy = () => {
        if (!generatedLink) return;
        const fullLink = `${window.location.origin}${generatedLink}`;
        navigator.clipboard.writeText(fullLink).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    if (generatedLink) {
        return (
            <div className="bg-zinc-800 text-white rounded-2xl p-8 shadow-2xl w-full max-w-2xl text-center transition-all duration-500">
                <h2 className="text-3xl font-bold mb-4">Event {isEditMode ? 'Updated' : 'Created'}!</h2>
                <p className="text-gray-300 mb-6">Here is the unique link for your event page. Share it with your audience!</p>
                <div className="bg-zinc-700 p-3 rounded-lg flex items-center justify-between space-x-2">
                    <input type="text" readOnly value={`${window.location.origin}${generatedLink}`} className="bg-transparent text-white w-full outline-none select-all font-mono text-sm" />
                    <button onClick={handleCopy} className="flex items-center space-x-2 bg-brand-primary text-white font-semibold py-2 px-4 rounded-md hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-700 focus:ring-brand-primary transition-all text-sm">
                        <CopyIcon className="w-4 h-4" />
                        <span>{copySuccess || 'Copy'}</span>
                    </button>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                     <button onClick={() => navigateTo('home')} className="py-2 px-6 border border-zinc-600 rounded-md shadow-sm font-medium text-gray-300 bg-zinc-700 hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-zinc-500 transition-colors">Back to Dashboard</button>
                    <button onClick={resetForm} className="py-2 px-6 border border-transparent rounded-md shadow-sm font-medium text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-brand-primary transition-colors">Create Another Event</button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-zinc-800 text-white rounded-2xl p-8 shadow-2xl w-full max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-6">{isEditMode ? 'Edit Event' : 'Create New Event'}</h2>
            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* SECTION 1: Basic Details */}
                <section className="space-y-4">
                     <h3 className="text-xl font-semibold border-b border-zinc-700 pb-2">Basic Details</h3>
                     {/* Organizer Selection */}
                    <div className="bg-zinc-700/30 p-4 rounded-lg border border-zinc-700">
                        <label htmlFor="organizer" className="block text-sm font-medium text-gray-300 mb-2">Organized By</label>
                        <select 
                            id="organizer" 
                            value={brandId} 
                            onChange={(e) => setBrandId(e.target.value)}
                            className="block w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                        >
                            <option value="">Personal (Me)</option>
                            {userBrands.map(brand => (
                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-300">Event Title</label>
                        <input id="title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary"></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-300">Date</label>
                            <input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                        <div>
                            <label htmlFor="time" className="block text-sm font-medium text-gray-300">Time</label>
                            <input id="time" type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="expirationTime" className="block text-sm font-medium text-gray-300">Registration Deadline (Optional)</label>
                        <input id="expirationTime" type="datetime-local" value={expirationTime} onChange={(e) => setExpirationTime(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary" />
                    </div>
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-300">Location</label>
                        <input id="location" type="text" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Online or Physical Address" className="mt-1 block w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary" />
                    </div>
                </section>
                
                {/* SECTION 2: Media & Visibility */}
                <section className="space-y-4">
                     <h3 className="text-xl font-semibold border-b border-zinc-700 pb-2">Media & Visibility</h3>
                     
                     <div>
                         <label className="block text-sm font-medium text-gray-300 mb-2">Event Image</label>
                         <div className="flex items-start space-x-4">
                             {imageUrl ? (
                                 <div className="relative w-full h-48 sm:w-64 sm:h-40 rounded-lg overflow-hidden border border-zinc-600 group bg-zinc-900">
                                     <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                     <button 
                                         type="button"
                                         onClick={() => setImageUrl('')}
                                         className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium"
                                     >
                                         <TrashIcon className="w-6 h-6 mr-1 text-red-400" /> Remove
                                     </button>
                                 </div>
                             ) : (
                                 <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-600 border-dashed rounded-lg cursor-pointer hover:bg-zinc-700/50 hover:border-zinc-500 transition-all bg-zinc-700/20">
                                     <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
                                         <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                         <p className="text-sm"><span className="font-semibold">Click to upload</span> image</p>
                                         <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or GIF (Max 500KB)</p>
                                     </div>
                                     <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                 </label>
                             )}
                         </div>
                     </div>

                     <div>
                         <label className="block text-sm font-medium text-gray-300">Hashtags (comma separated)</label>
                         <input type="text" placeholder="#music, #festival, #2024" value={hashtags} onChange={e => setHashtags(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary" />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                         <div className="flex flex-wrap gap-2">
                             {POPULAR_TAGS.map(tag => (
                                 <button 
                                    type="button" 
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${selectedTags.includes(tag) ? 'bg-brand-primary border-brand-primary text-white' : 'bg-transparent border-zinc-600 text-gray-400 hover:border-gray-300'}`}
                                 >
                                     {tag}
                                 </button>
                             ))}
                         </div>
                     </div>
                </section>

                {/* SECTION 3: Ticket Types */}
                <section className="pt-4 border-t border-zinc-700">
                    <h3 className="text-xl font-semibold mb-4 text-white">Ticket Types</h3>
                    <div className="space-y-3">
                        {tickets.map((ticket, index) => (
                            <div key={ticket.id} className="p-2 bg-zinc-700/50 rounded-md">
                                <div className="grid grid-cols-12 gap-2">
                                     <div className="col-span-12 md:col-span-5">
                                        <label className="text-xs text-gray-400">Ticket Name</label>
                                        <input type="text" placeholder="e.g., VIP" value={ticket.name} onChange={e => handleTicketChange(index, 'name', e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary" />
                                     </div>
                                     <div className="col-span-4 md:col-span-2">
                                        <label className="text-xs text-gray-400">Price ($)</label>
                                        <input type="number" placeholder="Price" value={ticket.price} onChange={e => handleTicketChange(index, 'price', e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary" />
                                     </div>
                                    <div className="col-span-4 md:col-span-2">
                                        <label className="text-xs text-gray-400">Quantity</label>
                                        <input type="number" placeholder="Qty" value={ticket.quantity} onChange={e => handleTicketChange(index, 'quantity', e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary" />
                                    </div>
                                    <div className="col-span-4 md:col-span-2">
                                        <label className="text-xs text-gray-400">Limit</label>
                                        <input type="number" placeholder="Limit" value={ticket.purchaseLimit} onChange={e => handleTicketChange(index, 'purchaseLimit', e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary" />
                                    </div>
                                    <div className="col-span-12 md:col-span-1 flex items-end mt-2 md:mt-0">
                                        <button type="button" onClick={() => removeTicketType(index)} disabled={tickets.length <= 1} className="w-full h-[30px] flex items-center justify-center bg-zinc-600 hover:bg-brand-dark rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><TrashIcon className="w-4 h-4 text-red-400" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                     <button type="button" onClick={addTicketType} className="mt-3 text-sm font-semibold text-brand-primary hover:text-brand-dark">+ Add Ticket Type</button>
                </section>

                {/* SECTION 4: Checkout & Rewards */}
                <section className="space-y-4 pt-4 border-t border-zinc-700">
                     <h3 className="text-xl font-semibold mb-4 text-white">Checkout Settings & Rewards</h3>
                     
                     <div>
                         <label className="block text-sm font-medium text-gray-300">Post-Purchase Redirection URL (Optional)</label>
                         <input type="url" placeholder="https://yoursite.com/thank-you" value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary" />
                     </div>

                     <div className="flex items-center space-x-3">
                         <input 
                            id="collectPhone" 
                            type="checkbox" 
                            checked={collectPhone} 
                            onChange={e => setCollectPhone(e.target.checked)} 
                            className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                        />
                        <label htmlFor="collectPhone" className="text-sm text-gray-300">Collect Phone Numbers from attendees</label>
                     </div>

                     {/* Custom Questions */}
                     <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Custom Questions</label>
                        {customQuestions.map((q, idx) => (
                            <div key={q.id} className="flex gap-2 mb-2 items-center">
                                <input 
                                    type="text" 
                                    placeholder="e.g., T-Shirt Size" 
                                    value={q.question} 
                                    onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                                    className="flex-1 bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                />
                                <div className="flex items-center space-x-1 px-2">
                                    <input 
                                        type="checkbox" 
                                        checked={q.required} 
                                        onChange={(e) => updateQuestion(idx, 'required', e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                    <span className="text-xs text-gray-400">Req</span>
                                </div>
                                <button type="button" onClick={() => removeQuestion(idx)} className="text-red-400 hover:text-red-300"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        ))}
                        <button type="button" onClick={addQuestion} className="text-sm text-brand-primary hover:underline">+ Add Question</button>
                     </div>

                     {/* Rewards */}
                     <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Rewards</label>
                        {rewards.map((r, idx) => (
                            <div key={r.id} className="flex flex-col sm:flex-row gap-2 mb-2 sm:items-start bg-zinc-700/30 p-2 rounded">
                                <input 
                                    type="text" 
                                    placeholder="Reward Title" 
                                    value={r.title} 
                                    onChange={(e) => updateReward(idx, 'title', e.target.value)}
                                    className="flex-1 bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                />
                                <input 
                                    type="text" 
                                    placeholder="Description" 
                                    value={r.description} 
                                    onChange={(e) => updateReward(idx, 'description', e.target.value)}
                                    className="flex-[2] bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                />
                                <button type="button" onClick={() => removeReward(idx)} className="text-red-400 hover:text-red-300 p-2"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        ))}
                        <button type="button" onClick={addReward} className="text-sm text-brand-primary hover:underline">+ Add Reward</button>
                     </div>
                </section>

                {error && <p className="text-red-400 text-sm text-center pt-2">{error}</p>}

                <div className="flex justify-end pt-4 space-x-4 border-t border-zinc-700">
                     <button type="button" onClick={() => navigateTo(isEditMode ? 'profile' : 'home')} className="py-2 px-4 border border-zinc-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-zinc-700 hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-zinc-500 transition-colors">Cancel</button>
                    <button type="submit" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-brand-primary transition-colors">{isEditMode ? 'Save Changes' : 'Create Event'}</button>
                </div>
            </form>
        </div>
    );
};

export default EventForm;