import React, { createContext, useState, useEffect, ReactNode } from 'react';

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  bankDetails?: BankDetails;
  paystackSplitCode?: string; // Derived from bankDetails
}

export interface Brand {
  id: string;
  name: string;
  bankDetails?: BankDetails;
  paystackSplitCode?: string; // Derived from bankDetails
  adminIds: string[];
}

export interface Ticket {
  id: string;
  name: string;
  price: number;
  initialQuantity: number; // The original number of tickets available
  quantity: number; // current available
  purchaseLimit: number; // max per order
}

export interface Reward {
    id: string;
    title: string;
    description: string;
}

export interface CustomQuestion {
    id: string;
    question: string;
    required: boolean;
}

export interface Event {
    id:string;
    createdBy: string;
    brandId?: string; // Optional: if null, it's a personal event
    title: string;
    description: string;
    date: string;
    time: string;
    expirationTime: string;
    location: string;
    shareableLink: string;
    tickets: Ticket[];
    // New fields for Landing Page / Rich Event support
    imageUrl?: string;
    hashtags?: string[];
    redirectUrl?: string;
    tags?: string[]; // e.g., "Concert", "Webinar"
    collectPhone?: boolean;
    customQuestions?: CustomQuestion[];
    rewards?: Reward[];
}

// FIX: Allow tickets to have an ID when passed from the form.
type EventCreationData = Omit<Event, 'id' | 'createdBy' | 'shareableLink' | 'tickets'> & {
    tickets: Omit<Ticket, 'initialQuantity'>[]
};
// FIX: Allow tickets to have an ID when passed from the form.
type EventUpdateData = Omit<Event, 'id' | 'createdBy' | 'shareableLink' | 'tickets'> & {
    tickets: Omit<Ticket, 'initialQuantity'>[]
};


interface AuthContextType {
  user: User | null;
  loading: boolean;
  events: Event[];
  userBrands: Brand[];
  login: (email: string, pass: string) => Promise<boolean>;
  register: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  createBrand: (name: string, bankDetails: BankDetails) => Promise<Brand>;
  updateBrandBankDetails: (brandId: string, bankDetails: BankDetails | null) => Promise<void>;
  addBrandAdmin: (brandId: string, email: string) => Promise<boolean>;
  createEvent: (eventData: EventCreationData) => Promise<Event | null>;
  getEventById: (id: string) => Event | undefined;
  getEventOrganizer: (eventId: string) => string;
  updateEvent: (id: string, eventData: EventUpdateData) => Promise<Event | null>;
  deleteEvent: (id: string) => Promise<void>;
  purchaseTickets: (eventId: string, purchaseOrder: Record<string, number>) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In a real app, this would be an API. We'll use localStorage for simulation.
const FAKE_DB = {
  USERS: 'lerida_users',
  SESSION: 'lerida_session',
  EVENTS: 'lerida_events',
  BRANDS: 'lerida_brands',
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to safely save to local storage and handle quota errors
  const saveToStorage = (key: string, data: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("LocalStorage quota exceeded or error:", e);
      alert("Storage Limit Exceeded! Unable to save changes. Please delete some events or use smaller images to free up space.");
      return false;
    }
  };

  useEffect(() => {
    // Check for active session and load data on init
    try {
      // Load user session
      const sessionEmail = localStorage.getItem(FAKE_DB.SESSION);
      if (sessionEmail) {
        const usersStr = localStorage.getItem(FAKE_DB.USERS);
        const users = usersStr ? JSON.parse(usersStr) : {};
        const loggedInUser = Object.values(users).find((u: any) => u.email === sessionEmail);
        if (loggedInUser) {
          setUser(loggedInUser as User);
        }
      }
      // Load events
      const eventsStr = localStorage.getItem(FAKE_DB.EVENTS);
      if (eventsStr) {
        setEvents(JSON.parse(eventsStr));
      }
      // Load brands
      const brandsStr = localStorage.getItem(FAKE_DB.BRANDS);
      if (brandsStr) {
        setBrands(JSON.parse(brandsStr));
      }

    } catch (error) {
      console.error("Failed to load session:", error);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    const usersStr = localStorage.getItem(FAKE_DB.USERS);
    const users = usersStr ? JSON.parse(usersStr) : {};
    const existingUser = Object.values(users).find((u: any) => u.email === email);
    
    // In a real app, you'd check a hashed password. This is a simulation.
    if (existingUser) {
      setUser(existingUser as User);
      localStorage.setItem(FAKE_DB.SESSION, email);
      return true;
    }
    return false;
  };

  const register = async (email: string, pass: string): Promise<boolean> => {
    const usersStr = localStorage.getItem(FAKE_DB.USERS);
    const users = usersStr ? JSON.parse(usersStr) : {};
    
    if (Object.values(users).some((u: any) => u.email === email)) {
      alert('User with this email already exists.');
      return false;
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name: email.split('@')[0],
    };

    users[newUser.id] = newUser;
    
    if (saveToStorage(FAKE_DB.USERS, users)) {
        setUser(newUser);
        localStorage.setItem(FAKE_DB.SESSION, email);
        return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(FAKE_DB.SESSION);
  };

  const updateUserProfile = async (data: Partial<User>) => {
      if (!user) return;
      
      let derivedUpdates = { ...data };

      // SIMULATE PAYSTACK SUBACCOUNT CREATION
      // If bankDetails are provided, the backend would create a subaccount on Paystack
      // with a 5% Lerida / 95% User split configuration.
      if (data.bankDetails) {
        const mockSplitCode = `SPL_USER_${Date.now().toString(36).substr(2, 6).toUpperCase()}_5_95`;
        derivedUpdates.paystackSplitCode = mockSplitCode;
      } else if (data.bankDetails === null) {
          // Explicit deletion
          derivedUpdates.bankDetails = undefined;
          derivedUpdates.paystackSplitCode = undefined;
      }

      const updatedUser = { ...user, ...derivedUpdates };
      
      const usersStr = localStorage.getItem(FAKE_DB.USERS);
      const users = usersStr ? JSON.parse(usersStr) : {};
      users[user.id] = updatedUser;
      
      if (saveToStorage(FAKE_DB.USERS, users)) {
          setUser(updatedUser);
      } else {
          throw new Error("Storage full");
      }
  };

  const createBrand = async (name: string, bankDetails: BankDetails): Promise<Brand> => {
      if (!user) throw new Error("Not authenticated");
      
      // SIMULATE PAYSTACK SPLIT
      const mockSplitCode = `SPL_BRAND_${Date.now().toString(36).substr(2, 6).toUpperCase()}_5_95`;

      const newBrand: Brand = {
          id: `brand_${Date.now()}`,
          name,
          bankDetails,
          paystackSplitCode: mockSplitCode,
          adminIds: [user.id]
      };
      
      const updatedBrands = [...brands, newBrand];
      
      if (saveToStorage(FAKE_DB.BRANDS, updatedBrands)) {
          setBrands(updatedBrands);
          return newBrand;
      }
      throw new Error("Storage full");
  };

  const updateBrandBankDetails = async (brandId: string, bankDetails: BankDetails | null): Promise<void> => {
    if (!user) return;
    
    const brandIndex = brands.findIndex(b => b.id === brandId);
    if (brandIndex === -1) return;
    
    const brand = brands[brandIndex];
    if (!brand.adminIds.includes(user.id)) return;

    let updatedBrand = { ...brand };
    if (bankDetails) {
         // Regenerate split code for new bank details
         updatedBrand.bankDetails = bankDetails;
         updatedBrand.paystackSplitCode = `SPL_BRAND_${Date.now().toString(36).substr(2, 6).toUpperCase()}_5_95`;
    } else {
        updatedBrand.bankDetails = undefined;
        updatedBrand.paystackSplitCode = undefined;
    }

    const updatedBrands = [...brands];
    updatedBrands[brandIndex] = updatedBrand;
    
    if (saveToStorage(FAKE_DB.BRANDS, updatedBrands)) {
        setBrands(updatedBrands);
    } else {
        throw new Error("Storage full");
    }
  };

  const addBrandAdmin = async (brandId: string, email: string): Promise<boolean> => {
    if (!user) return false;
    
    // Verify brand ownership/admin rights
    const brand = brands.find(b => b.id === brandId);
    if (!brand || !brand.adminIds.includes(user.id)) return false;

    // Find user to add
    const usersStr = localStorage.getItem(FAKE_DB.USERS);
    const users = usersStr ? JSON.parse(usersStr) : {};
    const targetUser = Object.values(users).find((u: any) => u.email === email) as User | undefined;
    
    if (!targetUser) return false; // User must exist to be added
    if (brand.adminIds.includes(targetUser.id)) return true; // Already admin

    // Update brand
    const updatedBrand = { ...brand, adminIds: [...brand.adminIds, targetUser.id] };
    const updatedBrands = brands.map(b => b.id === brandId ? updatedBrand : b);
    
    if (saveToStorage(FAKE_DB.BRANDS, updatedBrands)) {
        setBrands(updatedBrands);
        return true;
    }
    return false;
  };
  
  const createEvent = async (eventData: EventCreationData): Promise<Event | null> => {
    if (!user) return null;

    const eventId = `evt_${Date.now()}`;
    const newEvent: Event = {
        ...eventData,
        id: eventId,
        createdBy: user.id,
        shareableLink: `/ticket/${eventId}`,
        tickets: eventData.tickets.map(t => ({
            ...t,
            id: t.id || `t_${Date.now()}_${Math.random()}`,
            initialQuantity: t.quantity, // Set initial quantity on creation
        }))
    };
    
    const updatedEvents = [...events, newEvent];
    
    if (saveToStorage(FAKE_DB.EVENTS, updatedEvents)) {
        setEvents(updatedEvents);
        return newEvent;
    }
    return null;
  };

  const getEventById = (id: string): Event | undefined => {
    return events.find(event => event.id === id);
  };

  const getEventOrganizer = (eventId: string): string => {
    const event = events.find(e => e.id === eventId);
    if (!event) return 'Unknown Organizer';
    
    if (event.brandId) {
        const brand = brands.find(b => b.id === event.brandId);
        return brand ? brand.name : 'Unknown Brand';
    } else {
         const usersStr = localStorage.getItem(FAKE_DB.USERS);
         const users = usersStr ? JSON.parse(usersStr) : {};
         const creator = users[event.createdBy];
         return creator ? (creator.name || creator.email) : 'Event Organizer';
    }
  };

  const updateEvent = async (id: string, eventData: EventUpdateData): Promise<Event | null> => {
    if (!user) return null;
    const eventIndex = events.findIndex(e => e.id === id);
    
    // Check if user is creator or admin of the brand the event belongs to
    const existingEvent = events[eventIndex];
    const isCreator = existingEvent.createdBy === user.id;
    const isBrandAdmin = existingEvent.brandId ? brands.find(b => b.id === existingEvent.brandId)?.adminIds.includes(user.id) : false;

    if (eventIndex === -1 || (!isCreator && !isBrandAdmin)) {
      return null;
    }

    const updatedEvent: Event = {
      ...events[eventIndex],
      ...eventData,
      tickets: eventData.tickets.map(t => ({
        ...t,
        id: t.id || `t_${Date.now()}_${Math.random()}`,
        // When user edits quantity, it updates the total available stock
        initialQuantity: t.quantity,
      }))
    };

    const updatedEvents = [...events];
    updatedEvents[eventIndex] = updatedEvent;
    
    if (saveToStorage(FAKE_DB.EVENTS, updatedEvents)) {
        setEvents(updatedEvents);
        return updatedEvent;
    }
    return null;
  };

  const deleteEvent = async (id: string): Promise<void> => {
     if (!user) return;
     const event = events.find(e => e.id === id);
     if (!event) return;
     
     const isCreator = event.createdBy === user.id;
     const isBrandAdmin = event.brandId ? brands.find(b => b.id === event.brandId)?.adminIds.includes(user.id) : false;

     if (isCreator || isBrandAdmin) {
        const updatedEvents = events.filter(e => e.id !== id);
        if (saveToStorage(FAKE_DB.EVENTS, updatedEvents)) {
             setEvents(updatedEvents);
        }
     }
  };

  const purchaseTickets = async (eventId: string, purchaseOrder: Record<string, number>): Promise<boolean> => {
    const allEvents = [...events];
    const eventIndex = allEvents.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return false;

    const eventToUpdate = { ...allEvents[eventIndex] };
    
    // Validate purchase
    for (const ticketId in purchaseOrder) {
      const ticket = eventToUpdate.tickets.find(t => t.id === ticketId);
      if (!ticket || purchaseOrder[ticketId] > ticket.quantity) {
        return false; // Not enough tickets or ticket doesn't exist
      }
    }

    // DETERMINE PAYSTACK SPLIT CODE
    // If event belongs to a brand, use brand's split code.
    // If event is personal, use creator's split code.
    let paystackSplitCode = '';
    let beneficiary = '';

    if (eventToUpdate.brandId) {
        const brand = brands.find(b => b.id === eventToUpdate.brandId);
        paystackSplitCode = brand?.paystackSplitCode || 'NOT_CONFIGURED';
        beneficiary = `Brand: ${brand?.name} (${brand?.bankDetails ? 'Bank Verified' : 'No Bank'})`;
    } else {
        const usersStr = localStorage.getItem(FAKE_DB.USERS);
        const users = usersStr ? JSON.parse(usersStr) : {};
        const creator = users[eventToUpdate.createdBy];
        paystackSplitCode = creator?.paystackSplitCode || 'NOT_CONFIGURED';
        beneficiary = `User: ${creator?.name || creator?.email} (${creator?.bankDetails ? 'Bank Verified' : 'No Bank'})`;
    }

    console.log(`[PAYMENT SIMULATION] Processing payment for "${eventToUpdate.title}".`);
    console.log(`[PAYMENT SIMULATION] Beneficiary: ${beneficiary}`);
    console.log(`[PAYMENT SIMULATION] Using Paystack Split Code: ${paystackSplitCode}`);

    // Fulfill purchase
    eventToUpdate.tickets = eventToUpdate.tickets.map(ticket => {
      if (purchaseOrder[ticket.id]) {
        return {
          ...ticket,
          quantity: ticket.quantity - purchaseOrder[ticket.id],
        };
      }
      return ticket;
    });

    allEvents[eventIndex] = eventToUpdate;
    
    if (saveToStorage(FAKE_DB.EVENTS, allEvents)) {
        setEvents(allEvents);
        return true;
    }
    return false;
  };

  const userBrands = user ? brands.filter(b => b.adminIds.includes(user.id)) : [];

  const value = { 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      updateUserProfile,
      createBrand,
      updateBrandBankDetails,
      addBrandAdmin,
      events, 
      userBrands,
      createEvent, 
      getEventById, 
      getEventOrganizer,
      updateEvent, 
      deleteEvent, 
      purchaseTickets 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};