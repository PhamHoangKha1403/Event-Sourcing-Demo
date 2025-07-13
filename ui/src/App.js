import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, ArrowDownCircle, ArrowUpCircle, RefreshCw, Copy } from 'lucide-react';
import { Toaster, toast } from 'sonner';

// --- UI Components (imitating shadcn/ui) ---
const Button = ({ children, variant = 'default', size = 'default', className = '', ...props }) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    const variants = {
        default: "bg-slate-900 text-slate-50 hover:bg-slate-900/90",
        destructive: "bg-red-500 text-slate-50 hover:bg-red-500/90",
        outline: "border border-slate-200 bg-transparent hover:bg-slate-100 hover:text-slate-900",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80",
        ghost: "hover:bg-slate-100 hover:text-slate-900",
        link: "text-slate-900 underline-offset-4 hover:underline",
    };
    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
    };
    return (
        <button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
            {children}
        </button>
    );
};

const Input = React.forwardRef(({ className = '', ...props }, ref) => (
    <input
        className={`flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
    />
));

const Card = ({ children, className = '', ...props }) => (
    <div className={`rounded-xl border bg-white text-slate-900 shadow ${className}`} {...props}>
        {children}
    </div>
);
const CardHeader = ({ children, className = '' }) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }) => <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
const CardDescription = ({ children, className = '' }) => <p className={`text-sm text-slate-500 ${className}`}>{children}</p>;
const CardContent = ({ children, className = '' }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
const CardFooter = ({ children, className = '' }) => <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>;

const Dialog = ({ open, onOpenChange, children }) => open ? <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={() => onOpenChange(false)}><div onClick={e => e.stopPropagation()}>{children}</div></div> : null;
const DialogContent = ({ children, className = '' }) => <div className={`relative z-50 bg-white p-6 rounded-lg shadow-lg w-full max-w-md ${className}`}>{children}</div>;
const DialogHeader = ({ children, className = '' }) => <div className={`flex flex-col space-y-2 text-center sm:text-left ${className}`}>{children}</div>;
const DialogTitle = ({ children, className = '' }) => <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>;
const DialogDescription = ({ children, className = '' }) => <p className={`text-sm text-slate-500 ${className}`}>{children}</p>;
const DialogFooter = ({ children, className = '' }) => <div className={`mt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}>{children}</div>;

// --- Main App Component ---
const API_URL = 'http://localhost:3001';

function App() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newOwner, setNewOwner] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [dialogAction, setDialogAction] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchAccounts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/accounts`);
            const data = await response.json();
            setAccounts(data);
        } catch (error) {
            toast.error("Error: Could not fetch accounts from server.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        if (!newOwner.trim()) {
            toast.warning("Please enter the account owner's name.");
            return;
        }
        setIsCreating(true);
        try {
            const response = await fetch(`${API_URL}/accounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ owner: newOwner, initialBalance: 0 }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            toast.success("Account created successfully!");
            setNewOwner('');
            fetchAccounts();
        } catch (error) {
            toast.error(`Creation failed: ${error.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleTransaction = async () => {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.warning("Please enter a valid amount.");
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_URL}/accounts/${selectedAccount.id}/${dialogAction}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: parsedAmount }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            toast.success(`${dialogAction === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!`);
            closeDialog();
            fetchAccounts();
        } catch (error) {
            toast.error(`Failed: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDialog = (account, action) => {
        setSelectedAccount(account);
        setDialogAction(action);
        setAmount('');
    };

    const closeDialog = () => {
        setDialogAction(null);
        setSelectedAccount(null);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Account ID copied to clipboard!");
    };

    return (
        <>
            <Toaster position="top-right" richColors />
            <div className="min-h-screen bg-slate-50 text-slate-900">
                <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight">Bank Dashboard</h1>
                        <p className="text-slate-500 mt-1">Event Sourcing & CQRS Demo</p>
                    </header>
                    <Card className="mb-8">
                        <CardHeader><CardTitle>Create a new account</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateAccount} className="flex flex-col sm:flex-row gap-2">
                                <Input
                                    type="text"
                                    placeholder="Account Owner (e.g., John Doe)"
                                    value={newOwner}
                                    onChange={(e) => setNewOwner(e.target.value)}
                                    disabled={isCreating}
                                />
                                <Button type="submit" disabled={isCreating}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    {isCreating ? 'Creating...' : 'Create'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Account List</h2>
                        <Button variant="ghost" size="sm" onClick={fetchAccounts} disabled={loading}>
                           <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                           Refresh
                        </Button>
                    </div>
                    {loading ? (
                        <p>Loading data...</p>
                    ) : accounts.length === 0 ? (
                        <p className="text-center text-slate-500 py-10">No accounts yet. Create one to get started!</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {accounts.map((acc) => (
                                <Card key={acc.id} className="flex flex-col">
                                    <CardHeader>
                                        <CardTitle>{acc.owner}</CardTitle>
                                        <CardDescription className="flex items-center">
                                            ID: {acc.id.substring(0, 8)}...
                                            <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={() => copyToClipboard(acc.id)}>
                                                <Copy className="h-4 w-4"/>
                                            </Button>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <p className="text-3xl font-bold">${acc.balance.toLocaleString('en-US')}</p>
                                    </CardContent>
                                    <CardFooter className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" onClick={() => openDialog(acc, 'deposit')}>
                                            <ArrowDownCircle className="mr-2 h-4 w-4" /> Deposit
                                        </Button>
                                        <Button variant="outline" onClick={() => openDialog(acc, 'withdraw')}>
                                            <ArrowUpCircle className="mr-2 h-4 w-4" /> Withdraw
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Dialog open={!!dialogAction} onOpenChange={closeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialogAction === 'deposit' ? 'Deposit to account' : 'Withdraw from account'}</DialogTitle>
                        <DialogDescription>
                            Account Owner: {selectedAccount?.owner} <br/>
                            Current Balance: ${selectedAccount?.balance.toLocaleString('en-US')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={closeDialog}>Cancel</Button>
                        <Button onClick={handleTransaction} disabled={isSubmitting}>
                            {isSubmitting ? 'Processing...' : 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default App;