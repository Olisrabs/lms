import { useState } from 'react';
import { 
  Building2, Palette, Bell, Mail, ShieldCheck, 
  Users, Save
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('academy');

  const tabs = [
    { id: 'academy', label: 'Academy', icon: Building2 },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'email', label: 'Email Templates', icon: Mail },
    { id: 'roles', label: 'Roles & Permissions', icon: Users },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure global system preferences.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 w-fit">
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 shrink-0">
          <div className="glass-card rounded-3xl p-3 flex flex-col gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 glass-card rounded-3xl p-6 lg:p-8">
          {activeTab === 'academy' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-xl font-bold border-b border-border pb-4">Academy Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Academy Name</label>
                  <input type="text" defaultValue="Modern Tech Academy" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Support Email</label>
                  <input type="email" defaultValue="support@academy.edu" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Timezone</label>
                  <select className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none">
                    <option>UTC - Coordinated Universal Time</option>
                    <option>EST - Eastern Standard Time</option>
                    <option>PST - Pacific Standard Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Default Date Format</label>
                  <select className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none">
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'academy' && (
             <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm">
               <div className="w-16 h-16 rounded-2xl bg-secondary/30 flex items-center justify-center mb-4 border border-border">
                  {tabs.find(t => t.id === activeTab)?.icon({ size: 32 })}
               </div>
               Settings panel for <span className="font-bold text-foreground mx-1">{tabs.find(t => t.id === activeTab)?.label}</span> is under construction.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
