'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Avatar from '@/components/ui/Avatar';
import { Loader2 } from 'lucide-react';

/**
 * MentionTextarea — A textarea that supports @username mentions.
 * When the user types "@" it shows a user-search dropdown.
 * The selected username is inserted as plain text "@username".
 */
export default function MentionTextarea({ value, onChange, placeholder, maxLength, className }) {
  const [mentionQuery, setMentionQuery] = useState(null); // null = no active mention search
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [activeSuggestion, setActiveSuggestion] = useState(0);

  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  // Lookup caret position so we can position the dropdown near the @ symbol
  const getCaretCoords = () => {
    const ta = textareaRef.current;
    if (!ta) return { top: 0, left: 0 };
    const { offsetTop, offsetLeft, scrollTop } = ta;
    // Create a mirrored div to measure position (simplified: just use offsetTop + lineHeight)
    return {
      top: offsetTop + ta.clientHeight,
      left: offsetLeft,
    };
  };

  // When value changes from outside or user types, detect @mention trigger
  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);

    const ta = e.target;
    const caretPos = ta.selectionStart;
    const textBefore = v.slice(0, caretPos);

    // Find if caret is in a @... word
    const match = textBefore.match(/@([a-zA-Z0-9_]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setActiveSuggestion(0);
      setDropdownPos(getCaretCoords());
    } else {
      setMentionQuery(null);
      setSuggestions([]);
    }
  };

  // Debounced search when mentionQuery changes
  useEffect(() => {
    if (mentionQuery === null) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (mentionQuery.length < 1) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(`/api/search?type=users&q=${encodeURIComponent(mentionQuery)}&limit=6`);
        const data = await res.json();
        if (res.ok && data.data?.docs) {
          setSuggestions(data.data.docs);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);
  }, [mentionQuery]);

  // Insert selected mention into the textarea
  const insertMention = useCallback((username) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const caretPos = ta.selectionStart;
    const textBefore = value.slice(0, caretPos);
    const textAfter = value.slice(caretPos);

    // Replace the @query with @username + space
    const replaced = textBefore.replace(/@([a-zA-Z0-9_]*)$/, `@${username} `);
    const newValue = replaced + textAfter;
    onChange(newValue);

    // Reset mention state
    setMentionQuery(null);
    setSuggestions([]);

    // Restore focus and set caret
    ta.focus();
    const newCaretPos = replaced.length;
    setTimeout(() => {
      ta.setSelectionRange(newCaretPos, newCaretPos);
    }, 0);
  }, [value, onChange]);

  // Keyboard navigation in dropdown
  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (suggestions[activeSuggestion]) {
        e.preventDefault();
        insertMention(suggestions[activeSuggestion].username);
      }
    } else if (e.key === 'Escape') {
      setMentionQuery(null);
      setSuggestions([]);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          textareaRef.current && !textareaRef.current.contains(e.target)) {
        setMentionQuery(null);
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showDropdown = mentionQuery !== null && (loadingSuggestions || suggestions.length > 0);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        className={className}
      />
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 z-50 glass-card rounded-xl shadow-xl border border-border mt-1 py-1 max-h-52 overflow-y-auto"
          style={{ top: '100%' }}
        >
          {loadingSuggestions ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            suggestions.map((u, i) => (
              <button
                key={u._id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); insertMention(u.username); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  i === activeSuggestion ? 'bg-primary/10' : 'hover:bg-secondary/50'
                }`}
              >
                <Avatar src={u.profileImage} alt={u.username} size="sm" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">{u.displayName || u.username}</span>
                  <span className="text-xs text-muted-foreground">@{u.username}</span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
