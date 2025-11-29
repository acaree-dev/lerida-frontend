import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { BankDetails, Brand } from '../context/AuthContext';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';

const BankForm: React.FC<{
    initialData?: BankDetails,
    onSubmit: (data: BankDetails) => void,
    onCancel?: () => void,
    submitLabel?: string,
    isCompact?: boolean
}> = ({ initialData, onSubmit, onCancel, submitLabel = "Save Details", isCompact = false }) => {
    const [bankName, setBankName] = useState(initialData?.bankName || '');
    const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber || '');
    const [accountName, setAccountName] = useState(initialData?.accountName || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bankName || !accountNumber || !accountName) return;
        onSubmit({ bankName, accountNumber, accountName });
    };

    return (
        <form onSubmit={handleSubmit} className={`space-y-3 ${!isCompact ? 'bg-zinc-700/30 p-4 rounded-lg border border-zinc-600' : ''}`}>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Bank Name</label>
                <input 
                    type="text" 
                    required 
                    value={bankName} 
                    onChange={e => setBankName(e.target.value)} 
                    placeholder="e.g., GTBank, Access Bank"
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary" 
                />
                <a 
                    href="https://paystack.com/docs/payments/payment-channels/#supported-banks" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs text-brand-primary hover:underline mt-1 block"
                >
                    View Paystack supported banks
                </a>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Account Number</label>
                <input 
                    type="text" 
                    required 
                    value={accountNumber} 
                    onChange={e => setAccountNumber(e.target.value)} 
                    placeholder="0123456789"
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary" 
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Account Name</label>
                <input 
                    type="text" 
                    required 
                    value={accountName} 
                    onChange={e => setAccountName(e.target.value)} 
                    placeholder="Matching Bank Account Name"
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary" 
                />
            </div>
            <div className="flex space-x-2 pt-2">
                {onCancel && (
                    <button 
                        type="button" 
                        onClick={onCancel} 
                        className="flex-1 py-2 px-4 bg-zinc-600 hover:bg-zinc-500 text-white rounded-md font-medium transition-colors text-sm"
                    >
                        Cancel
                    </button>
                )}
                <button 
                    type="submit" 
                    className="flex-1 py-2 px-4 bg-brand-primary hover:bg-brand-dark text-white rounded-md font-medium transition-colors text-sm"
                >
                    {submitLabel}
                </button>
            </div>
        </form>
    );
};

const BrandCard: React.FC<{
    brand: Brand,
    inviteEmail: string,
    setInviteEmail: (val: string) => void,
    onInvite: () => void,
    onUpdateBank: (data: BankDetails | null) => void
}> = ({ brand, inviteEmail, setInviteEmail, onInvite, onUpdateBank }) => {
    const [isEditingBank, setIsEditingBank] = useState(false);

    return (
        <div className="bg-zinc-700 p-5 rounded-lg flex flex-col space-y-4">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-lg text-white">{brand.name}</h4>
                    {brand.bankDetails ? (
                         <div className="mt-1 text-sm text-gray-300">
                            <p className="font-semibold">{brand.bankDetails.bankName}</p>
                            <p className="font-mono text-xs opacity-80">{brand.bankDetails.accountNumber} • {brand.bankDetails.accountName}</p>
                            <p className="text-xs text-green-400 mt-1 flex items-center">
                                <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span> Active Split: {brand.paystackSplitCode}
                            </p>
                         </div>
                    ) : (
                        <p className="text-xs text-red-400 mt-1">No payout account configured.</p>
                    )}
                </div>
                <span className="text-xs bg-brand-primary px-2 py-1 rounded text-white">Admin</span>
            </div>

            {/* Bank Actions */}
            <div className="bg-zinc-800/50 p-3 rounded border border-zinc-600/50">
                {isEditingBank ? (
                     <BankForm 
                        initialData={brand.bankDetails} 
                        onSubmit={(data) => {
                            onUpdateBank(data);
                            setIsEditingBank(false);
                        }} 
                        onCancel={() => setIsEditingBank(false)}
                        submitLabel="Update Brand Bank"
                        isCompact={true}
                     />
                ) : (
                    <div className="flex items-center space-x-3">
                         <button 
                            onClick={() => setIsEditingBank(true)}
                            className="text-xs flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                        >
                            <EditIcon className="w-3 h-3" />
                            <span>{brand.bankDetails ? 'Edit Bank Details' : 'Add Bank Details'}</span>
                        </button>
                        {brand.bankDetails && (
                             <button 
                                onClick={() => {
                                    if(window.confirm('Remove bank details for this brand? Payouts will stop.')) {
                                        onUpdateBank(null);
                                    }
                                }}
                                className="text-xs flex items-center space-x-1 text-red-400 hover:text-red-300 transition-colors"
                            >
                                <TrashIcon className="w-3 h-3" />
                                <span>Remove</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
            
            {/* Admin Invites */}
            <div className="pt-3 border-t border-zinc-600">
                <p className="text-xs text-gray-400 mb-2">{brand.adminIds.length} Admins</p>
                <div className="flex space-x-2">
                    <input 
                        type="email" 
                        placeholder="Add admin email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm bg-zinc-800 border border-zinc-600 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary text-white"
                    />
                    <button 
                        onClick={onInvite}
                        className="px-3 py-1 bg-zinc-600 hover:bg-zinc-500 text-xs text-white rounded transition-colors"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
};


const ProfilePage: React.FC = () => {
  const { user, updateUserProfile, createBrand, addBrandAdmin, updateBrandBankDetails, userBrands } = useAuth();
  
  // Create Brand Form State
  const [brandName, setBrandName] = useState('');
  const [createBrandBank, setCreateBrandBank] = useState<BankDetails | undefined>(undefined); // Used if we want to capture it in state, but BankForm handles it.
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isEditingPersonalBank, setIsEditingPersonalBank] = useState(false);
  
  // Admin Invite State
  const [inviteEmails, setInviteEmails] = useState<Record<string, string>>({});

  if (!user) {
    return <p>Loading profile...</p>;
  }

  const handleSavePersonalBank = async (details: BankDetails) => {
      setSuccessMsg('');
      setErrorMsg('');
      try {
          await updateUserProfile({ bankDetails: details });
          setIsEditingPersonalBank(false);
          setSuccessMsg('Personal bank details updated. 95/5 split configured.');
      } catch (e) {
          setErrorMsg('Failed to update settings.');
      }
  };

  const handleDeletePersonalBank = async () => {
      if(!window.confirm("Are you sure? You won't receive payouts for personal events.")) return;
      try {
          // Explicitly pass null to remove
          // We need to cast because Partial<User> expects bankDetails? which is BankDetails | undefined
          // In AuthContext we handle null specially or we can pass undefined if we updated the interface logic strictly
          // Ideally in Context: if (data.bankDetails === undefined) checks might be ambiguous for partial updates.
          // Let's assume Context handles null or we pass a specific object structure.
          // The context implementation checked `if (data.bankDetails === null)`.
          await updateUserProfile({ bankDetails: null } as any); 
          setSuccessMsg('Personal bank details removed.');
      } catch (e) {
          setErrorMsg('Failed to remove bank details.');
      }
  };

  const handleCreateBrand = async (details: BankDetails) => {
      setSuccessMsg('');
      setErrorMsg('');
      
      if (!brandName) {
          setErrorMsg('Please provide a brand name.');
          return;
      }

      try {
          await createBrand(brandName, details);
          setBrandName('');
          setSuccessMsg('Brand created successfully!');
      } catch (e) {
          setErrorMsg('Failed to create brand.');
      }
  };

  const handleInviteAdmin = async (brandId: string) => {
      const email = inviteEmails[brandId];
      if (!email) return;
      
      setSuccessMsg('');
      setErrorMsg('');
      
      const success = await addBrandAdmin(brandId, email);
      if (success) {
          setSuccessMsg(`Admin added to brand.`);
          setInviteEmails(prev => ({...prev, [brandId]: ''}));
      } else {
          setErrorMsg('Could not add admin. User must exist and not already be an admin.');
      }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-zinc-800 text-white rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold mb-2">My Profile</h2>
            <p className="text-gray-400">Manage your personal bank details and brands.</p>
            
            {successMsg && <div className="mt-4 p-3 bg-green-900/50 text-green-300 rounded-md border border-green-800">{successMsg}</div>}
            {errorMsg && <div className="mt-4 p-3 bg-red-900/50 text-red-300 rounded-md border border-red-800">{errorMsg}</div>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Settings */}
            <div className="bg-zinc-800 text-white rounded-2xl p-8 shadow-2xl">
                <h3 className="text-xl font-bold mb-6 border-b border-zinc-700 pb-2">Personal Payouts</h3>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                    <input type="text" disabled value={user.email} className="w-full px-3 py-2 bg-zinc-700/50 border border-zinc-600 rounded-md text-gray-400 cursor-not-allowed" />
                </div>
                
                <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Bank Account Details</h4>
                    <p className="text-xs text-gray-500 mb-4">Used for payouts from your personal events (95% You / 5% Lerida).</p>
                    
                    {!user.bankDetails && !isEditingPersonalBank && (
                        <BankForm onSubmit={handleSavePersonalBank} />
                    )}

                    {user.bankDetails && !isEditingPersonalBank && (
                        <div className="bg-zinc-700/50 border border-brand-primary/30 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-white">{user.bankDetails.bankName}</p>
                                    <p className="text-sm text-gray-300">{user.bankDetails.accountNumber}</p>
                                    <p className="text-sm text-gray-400">{user.bankDetails.accountName}</p>
                                </div>
                                <div className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded border border-green-800">
                                    Active
                                </div>
                            </div>
                             <p className="text-xs text-gray-500 mb-3">Split Code: {user.paystackSplitCode}</p>
                            <div className="flex space-x-3 pt-2 border-t border-zinc-600/50">
                                <button 
                                    onClick={() => setIsEditingPersonalBank(true)} 
                                    className="flex items-center text-sm text-gray-300 hover:text-white transition-colors"
                                >
                                    <EditIcon className="w-4 h-4 mr-1" /> Edit
                                </button>
                                <button 
                                    onClick={handleDeletePersonalBank} 
                                    className="flex items-center text-sm text-red-400 hover:text-red-300 transition-colors"
                                >
                                    <TrashIcon className="w-4 h-4 mr-1" /> Remove
                                </button>
                            </div>
                        </div>
                    )}

                    {isEditingPersonalBank && (
                         <BankForm 
                            initialData={user.bankDetails} 
                            onSubmit={handleSavePersonalBank} 
                            onCancel={() => setIsEditingPersonalBank(false)}
                        />
                    )}
                </div>
            </div>

            {/* Create Brand */}
            <div className="bg-zinc-800 text-white rounded-2xl p-8 shadow-2xl">
                 <h3 className="text-xl font-bold mb-6 border-b border-zinc-700 pb-2">Create New Brand</h3>
                 <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Brand Name</label>
                        <input 
                            type="text" 
                            value={brandName} 
                            onChange={(e) => setBrandName(e.target.value)}
                            placeholder="e.g., Acme Events"
                            className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Brand Bank Account</label>
                        <p className="text-xs text-gray-500 mb-3">Payouts for this brand will be sent here.</p>
                        <BankForm 
                            onSubmit={handleCreateBrand} 
                            submitLabel="Create Brand"
                            isCompact={true}
                        />
                    </div>
                 </div>
            </div>
        </div>

        {/* My Brands List */}
         <div className="bg-zinc-800 text-white rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6 border-b border-zinc-700 pb-2">My Brands</h3>
            {userBrands.length === 0 ? (
                <p className="text-gray-400">You don't manage any brands yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userBrands.map(brand => (
                        <BrandCard 
                            key={brand.id}
                            brand={brand}
                            inviteEmail={inviteEmails[brand.id] || ''}
                            setInviteEmail={(val) => setInviteEmails({...inviteEmails, [brand.id]: val})}
                            onInvite={() => handleInviteAdmin(brand.id)}
                            onUpdateBank={(data) => updateBrandBankDetails(brand.id, data)}
                        />
                    ))}
                </div>
            )}
         </div>
    </div>
  );
};

export default ProfilePage;