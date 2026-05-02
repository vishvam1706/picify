import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { Search, X, Loader2 } from 'lucide-react';

export default function CollaboratorInput({ collaborators = [], setCollaborators }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim() || query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?type=users&q=${encodeURIComponent(query)}&limit=8`);
        const data = await res.json();
        if (res.ok) {
          // Filter out the current user and already added collaborators
          const filtered = (data.data?.docs || []).filter(u => 
            u._id !== user._id && !collaborators.some(c => c._id === u._id)
          );
          setResults(filtered);
        }
      } catch (err) {
        console.error('Failed to search users', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query, user, collaborators]);

  const addCollaborator = (u) => {
    setCollaborators([...collaborators, u]);
    setQuery('');
    setResults([]);
  };

  const removeCollaborator = (id) => {
    setCollaborators(collaborators.filter(c => c._id !== id));
  };

  return (
    <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
      <label className="text-sm font-semibold text-muted-foreground ml-2">Collaborators (Optional)</label>
      
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          type="text" 
          placeholder="Search by username or name..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 w-full rounded-xl bg-secondary/50 border-none pl-10 pr-10"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Dropdown Results */}
      {results.length > 0 && (
        <div className="absolute top-20 left-0 right-0 z-10 glass-card rounded-xl shadow-xl border border-border mt-1 py-1 max-h-60 overflow-y-auto">
          {results.map(u => (
            <button
              key={u._id}
              type="button"
              onClick={() => addCollaborator(u)}
              className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Avatar src={u.profileImage} alt={u.username} size="sm" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{u.displayName || u.username}</span>
                  <span className="text-xs text-muted-foreground">@{u.username}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Collaborators Chips */}
      {collaborators.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {collaborators.map(c => (
            <div key={c._id} className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
              <Avatar src={c.profileImage} alt={c.username} className="w-5 h-5" />
              <span>{c.displayName || c.username}</span>
              <button type="button" onClick={() => removeCollaborator(c._id)} className="hover:opacity-70 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
