import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, UserPlus, X, Check, MapPin, Phone } from 'lucide-react';
import type { Donor } from '@/lib/types';

export interface DonorPickerValue {
  donor: Donor | null;
  name: string;
  father_name: string;
  phone: string;
  village: string;
}

interface DonorPickerProps {
  donors: Donor[];
  value: string;
  selectedDonor: Donor | null;
  onSelect: (donor: Donor | null, name: string, fatherName: string, phone: string, village: string) => void;
  onAddNew: (name: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function DonorPicker({
  donors,
  value,
  selectedDonor,
  onSelect,
  onAddNew,
  placeholder = 'Type 2+ letters to search donors...',
  autoFocus,
}: DonorPickerProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matches = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (q.length < 2) return [];
    return donors
      .filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.father_name.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q) ||
        d.village.toLowerCase().includes(q) ||
        d.donor_id.toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [donors, query]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setOpen(true);
    setHighlightIndex(-1);
    if (selectedDonor) {
      onSelect(null, e.target.value, '', '', '');
    } else {
      onSelect(null, e.target.value, '', '', '');
    }
  }

  function selectDonor(d: Donor) {
    setQuery(d.name);
    setOpen(false);
    setHighlightIndex(-1);
    onSelect(d, d.name, d.father_name, d.phone, d.village);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || (matches.length === 0 && query.trim().length < 2)) {
      if (e.key === 'Enter' && query.trim().length >= 2 && matches.length === 0) {
        e.preventDefault();
        setOpen(false);
        onAddNew(query.trim());
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(i => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < matches.length) {
        selectDonor(matches[highlightIndex]);
      } else if (query.trim().length >= 2) {
        setOpen(false);
        onAddNew(query.trim());
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showDropdown = open && query.trim().length >= 2;
  const showAddNew = showDropdown && matches.length === 0 && query.trim().length >= 2;
  const showNoMatch = showDropdown && matches.length === 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-maroon-400 dark:text-cream/50 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="input pl-10 pr-10"
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
        />
        {selectedDonor && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onSelect(null, '', '', '', '');
                inputRef.current?.focus();
                setOpen(true);
              }}
              className="text-maroon-400 hover:text-maroon-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-xl bg-white dark:bg-maroon-900 border border-saffron-200 dark:border-maroon-700 shadow-xl"
        >
          {matches.map((d, i) => (
            <button
              key={d.id}
              type="button"
              onClick={() => selectDonor(d)}
              onMouseEnter={() => setHighlightIndex(i)}
              className={`w-full text-left px-3 py-2.5 border-b border-saffron-50 dark:border-maroon-800 last:border-0 transition ${
                i === highlightIndex
                  ? 'bg-saffron-50 dark:bg-maroon-800/80'
                  : 'hover:bg-saffron-50/60 dark:hover:bg-maroon-800/40'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="h-8 w-8 rounded-full bg-saffron-gradient flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                  {d.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-maroon-800 dark:text-cream truncate">
                    {d.name}
                    {d.donor_id && (
                      <span className="ml-2 text-xs font-mono text-maroon-400">#{d.donor_id}</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {d.father_name && (
                      <span className="text-xs text-maroon-500 dark:text-cream/60 truncate">
                        S/o {d.father_name}
                      </span>
                    )}
                    {d.village && (
                      <span className="text-xs text-maroon-500 dark:text-cream/60 flex items-center gap-0.5 truncate">
                        <MapPin className="w-3 h-3" />{d.village}
                      </span>
                    )}
                    {d.phone && (
                      <span className="text-xs text-maroon-500 dark:text-cream/60 flex items-center gap-0.5 truncate">
                        <Phone className="w-3 h-3" />{d.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}

          {showNoMatch && (
            <div className="p-4">
              <p className="text-sm text-maroon-500 dark:text-cream/60 mb-2">
                No matching donor found for "<span className="font-medium">{query.trim()}</span>"
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onAddNew(query.trim());
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-saffron-50 dark:bg-saffron-900/30 text-saffron-700 dark:text-saffron-300 hover:bg-saffron-100 dark:hover:bg-saffron-900/50 transition font-medium text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Add "{query.trim()}" as new donor
              </button>
            </div>
          )}

          {matches.length > 0 && query.trim().length >= 2 && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAddNew(query.trim());
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-saffron-600 dark:text-saffron-300 hover:bg-saffron-50 dark:hover:bg-maroon-800/40 transition border-t border-saffron-100 dark:border-maroon-800"
            >
              <UserPlus className="w-4 h-4" />
              Add "{query.trim()}" as new donor instead
            </button>
          )}
        </div>
      )}
    </div>
  );
}
