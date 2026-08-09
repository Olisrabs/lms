import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Plus, Video, Clock, Users, X, Loader2
} from 'lucide-react';
import { scheduleApi } from '../../lib/api';

export default function ClassSchedulePage() {
  const { selectedCohortId, setSelectedCohortId, cohorts } = useOutletContext<{
    selectedCohortId: string | null;
    setSelectedCohortId: (id: string | null) => void;
    cohorts: any[];
  }>();

  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [classTitle, setClassTitle] = useState('');
  const [scheduleType, setScheduleType] = useState('lecture');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');

  const loadSchedules = async (cohortId: string) => {
    try {
      setLoading(true);
      const data = await scheduleApi.getForCohort(cohortId) as any[];
      setSchedules(data || []);
    } catch (err) {
      console.error('Failed to load schedules:', err);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCohortId) {
      loadSchedules(selectedCohortId);
    } else {
      setSchedules([]);
      setLoading(false);
    }
  }, [selectedCohortId]);

  const activeCohort = cohorts.find(c => c.id === selectedCohortId);
  const cohortProgramName = activeCohort?.programs?.name || '';

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedCohortId) {
      setError('Please select an active cohort from the top header first.');
      return;
    }
    if (!classTitle.trim()) {
      setError('Class title is required.');
      return;
    }
    if (!startTime || !endTime) {
      setError('Start time and End time are required.');
      return;
    }

    const payload = {
      cohort_id: selectedCohortId,
      title: `${cohortProgramName ? `[${cohortProgramName}] ` : ''}${classTitle}`,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      schedule_type: scheduleType,
      location,
      meeting_url: meetingUrl
    };

    setSubmitting(true);
    try {
      await scheduleApi.create(payload);
      setIsModalOpen(false);
      setClassTitle('');
      setStartTime('');
      setEndTime('');
      setLocation('');
      setMeetingUrl('');
      loadSchedules(selectedCohortId);
    } catch (err: any) {
      console.error('Failed to create class:', err);
      setError(err.error || err.message || 'Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelClass = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this class?')) return;
    try {
      await scheduleApi.cancel(id);
      if (selectedCohortId) {
        loadSchedules(selectedCohortId);
      }
    } catch (err) {
      console.error('Failed to cancel class:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Class Schedule</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and view all upcoming classes across cohorts.</p>
        </div>
        <div className="flex items-center gap-3">
          {cohorts.length > 0 && (
            <select 
              value={selectedCohortId || ''}
              onChange={(e) => setSelectedCohortId(e.target.value || null)}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 transition-all font-medium text-foreground outline-none cursor-pointer"
            >
              {cohorts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Plus size={16} /> Create Class
          </button>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">Loading schedules...</div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No classes scheduled. Click 'Create Class' to schedule one.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map((session) => (
              <div key={session.id} className="p-5 rounded-2xl border border-border bg-card/50 flex flex-col justify-between hover:border-primary/30 transition-all relative overflow-hidden group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-secondary rounded-full text-muted-foreground">
                      {session.schedule_type}
                    </span>
                    {session.is_cancelled ? (
                      <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full">
                        Cancelled
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleCancelClass(session.id)}
                        className="text-xs font-bold text-red-500 hover:bg-red-500/10 px-2.5 py-1 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Cancel Class
                      </button>
                    )}
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">{session.title}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <p className="flex items-center gap-2">
                      <Clock size={16} />
                      {new Date(session.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • {new Date(session.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} - {new Date(session.end_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="flex items-center gap-2">
                      <Users size={16} />
                      Instructor: {session.users?.full_name || 'TBD'}
                    </p>
                    {session.meeting_url && (
                      <p className="flex items-center gap-2 text-primary font-medium">
                        <Video size={16} />
                        <a href={session.meeting_url} target="_blank" rel="noopener noreferrer" className="hover:underline">Join Live Session</a>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-7 w-full max-w-lg shadow-2xl relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Create Class Session</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-3 rounded-xl">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Target Program (Cohort-dependent)</label>
                <input 
                  type="text"
                  className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-foreground outline-none"
                  value={cohortProgramName || 'No program associated with this cohort'}
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Class Title</label>
                <input 
                  type="text" 
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  placeholder="e.g. Advanced JavaScript Basics" 
                  value={classTitle}
                  onChange={e => setClassTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Class Type</label>
                  <select 
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={scheduleType}
                    onChange={e => setScheduleType(e.target.value)}
                  >
                    <option value="lecture">Lecture</option>
                    <option value="lab">Lab</option>
                    <option value="workshop">Workshop</option>
                    <option value="exam">Exam</option>
                    <option value="office_hours">Office Hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Location / Room</label>
                  <input 
                    type="text" 
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                    placeholder="e.g. Room 402 or Online" 
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Start Date & Time</label>
                  <input 
                    type="datetime-local" 
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">End Date & Time</label>
                  <input 
                    type="datetime-local" 
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Meeting Link (Zoom / Meet)</label>
                <input 
                  type="url" 
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  placeholder="https://zoom.us/j/..." 
                  value={meetingUrl}
                  onChange={e => setMeetingUrl(e.target.value)}
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium hover:bg-secondary/50 transition-colors text-sm">
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  {submitting ? 'Scheduling...' : 'Schedule Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
