import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UsersRound, Loader2 } from 'lucide-react';
import { groupsApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface GroupMember {
  role: string;
  users?: { id: string; full_name: string; avatar_url: string | null };
}

interface Group {
  id: string;
  name: string;
  description?: string;
  cohorts?: { id: string; name: string };
  group_members?: GroupMember[];
}

interface MyGroupEntry {
  role: string;
  groups?: Group;
}

export default function StudentGroupsPage() {
  const { user } = useAuth();
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await groupsApi.myGroups() as MyGroupEntry[];
        const groups = (data || []).map(e => e.groups).filter(Boolean) as Group[];
        setMyGroups(groups);
      } catch (err) {
        console.error('Failed to fetch student groups', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Groups</h1>
        <p className="text-muted-foreground">Collaborate with your peers on group projects.</p>
      </div>

      {myGroups.length === 0 ? (
        <div className="glass-card rounded-2xl border border-dashed border-border p-16 text-center">
          <UsersRound size={48} className="mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-bold mb-2">No Groups Assigned</h3>
          <p className="text-muted-foreground">Your instructor will assign you to a group.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {myGroups.map((group, i) => {
            const members = group.group_members || [];
            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-6 border border-border"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-primary/20">
                    <UsersRound size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{group.name}</h2>
                    {group.cohorts?.name && (
                      <p className="text-sm text-muted-foreground">{group.cohorts.name}</p>
                    )}
                  </div>
                </div>

                {group.description && (
                  <p className="text-sm text-muted-foreground mb-5">{group.description}</p>
                )}

                <div className="border-t border-border pt-4">
                  <h3 className="font-bold mb-3 flex items-center gap-2 text-sm">
                    <UsersRound size={16} className="text-primary" /> Members ({members.length})
                  </h3>
                  <div className="space-y-2">
                    {members.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No members yet</p>
                    ) : members.map((m, j) => (
                      <div key={j} className="flex items-center gap-3 p-2 rounded-xl bg-secondary/20">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {(m.users?.full_name || 'U').charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{m.users?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                        </div>
                        {m.users?.id === user?.id && (
                          <span className="ml-auto text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">You</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
