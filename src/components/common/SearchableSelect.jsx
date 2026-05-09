import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export default function SearchableSelect({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select...", 
  label,
  disabled = false,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (opt) => {
    onChange(opt);
    setIsOpen(false);
    setSearch("");
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
          {label}
        </label>
      )}
      
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all cursor-pointer
          ${disabled ? 'bg-gray-50 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-200 hover:border-primary-300 hover:shadow-sm'}
          ${isOpen ? 'ring-2 ring-primary-500/20 border-primary-500 shadow-sm' : ''}
        `}
      >
        <span className={`text-sm ${!value ? 'text-gray-400' : 'text-gray-900 font-medium'}`}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400 ml-1" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent border-none outline-none text-sm py-1 placeholder:text-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
          
          <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors
                    ${value === opt ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}
                  `}
                >
                  <span className="truncate">{opt}</span>
                  {value === opt && <Check className="w-4 h-4 text-primary-600" />}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center italic">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
