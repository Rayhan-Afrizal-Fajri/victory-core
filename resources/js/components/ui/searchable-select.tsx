import * as React from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { multiTokenMatch } from '@/lib/search';

export interface SearchableOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
  disabled?: boolean;
  keywords?: string[];
  raw?: any;
}

export interface SearchableSelectProps {
  options: SearchableOption[];
  value?: string | number | null;
  onChange: (value: string, option: SearchableOption | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  readOnly?: boolean;
  clearable?: boolean;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  id?: string;
  name?: string;
  required?: boolean;
  maxDropdownHeight?: string;
  actionButton?: {
    label: string;
    onClick: (searchKeyword: string) => void;
    className?: string;
  };
  renderOption?: (option: SearchableOption, isSelected: boolean) => React.ReactNode;
  renderTrigger?: (selectedOption: SearchableOption | null) => React.ReactNode;
}

export function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Pilih opsi...',
  searchPlaceholder = 'Cari...',
  emptyMessage = 'Tidak ada data ditemukan.',
  disabled = false,
  readOnly = false,
  clearable = true,
  className,
  triggerClassName,
  dropdownClassName,
  id,
  name,
  required = false,
  maxDropdownHeight = 'max-h-64',
  actionButton,
  renderOption,
  renderTrigger,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const stringValue = value !== undefined && value !== null ? String(value) : '';

  const selectedOption = React.useMemo(() => {
    return options.find((opt) => opt.value === stringValue) || null;
  }, [options, stringValue]);

  // Filter options menggunakan multi-token search
  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options;

    return options.filter((opt) => {
      const targets = [opt.label, opt.subLabel, opt.badge, ...(opt.keywords || [])];
      return multiTokenMatch(targets, search);
    });
  }, [options, search]);

  // Reset highlight saat filtered options berubah
  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length, search]);

  // Auto focus input saat dropdown dibuka
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Klik di luar dropdown untuk menutup
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || readOnly) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex] && !filteredOptions[highlightedIndex].disabled) {
          selectOption(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const selectOption = (option: SearchableOption) => {
    onChange(option.value, option);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', null);
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full', className)}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input untuk integrasi native form */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={stringValue}
          required={required}
        />
      )}

      {/* Trigger Button */}
      <div
        id={id}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        onClick={() => {
          if (!disabled && !readOnly) {
            setIsOpen((prev) => !prev);
          }
        }}
        className={cn(
          'border-input bg-background flex h-9 w-full items-center justify-between rounded-md border px-3 py-1 text-sm shadow-xs transition-colors outline-none cursor-pointer',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          disabled && 'cursor-not-allowed opacity-50 bg-slate-50',
          readOnly && 'cursor-default bg-slate-50',
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 truncate pr-2 text-left w-full">
          {renderTrigger ? (
            renderTrigger(selectedOption)
          ) : selectedOption ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-medium text-slate-800 truncate">
                {selectedOption.label}
              </span>
              {selectedOption.subLabel && (
                <span className="text-xs text-slate-400 truncate">
                  ({selectedOption.subLabel})
                </span>
              )}
              {selectedOption.badge && (
                <span className="ml-1 inline-flex items-center rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground select-none">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {clearable && selectedOption && !disabled && !readOnly && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-sm transition-colors"
              title="Hapus pilihan"
            >
              <X className="size-3.5" />
            </button>
          )}
          <ChevronDown
            className={cn(
              'size-4 text-slate-400 transition-transform duration-200',
              isOpen && 'rotate-180 text-slate-600'
            )}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg overflow-hidden animate-in fade-in-50 zoom-in-95',
            dropdownClassName
          )}
        >
          {/* Search Input Box */}
          <div className="flex items-center border-b border-slate-100 px-2.5 py-1.5 bg-slate-50/50">
            <Search className="size-4 shrink-0 text-slate-400 mr-2" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm placeholder:text-slate-400 outline-none h-7"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-sm"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            className={cn('overflow-y-auto p-1 divide-y divide-slate-50', maxDropdownHeight)}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === stringValue;
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      if (!opt.disabled) selectOption(opt);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      'flex items-center justify-between rounded-sm px-2.5 py-2 text-sm cursor-pointer transition-colors',
                      isHighlighted && 'bg-slate-100/80',
                      isSelected && 'bg-blue-50/60 font-medium text-blue-900',
                      opt.disabled && 'cursor-not-allowed opacity-50 bg-slate-50'
                    )}
                  >
                    {renderOption ? (
                      renderOption(opt, isSelected)
                    ) : (
                      <div className="flex flex-col text-left truncate mr-2">
                        <span className="truncate text-slate-900 font-medium">
                          {opt.label}
                        </span>
                        {opt.subLabel && (
                          <span className="text-xs text-slate-500 truncate">
                            {opt.subLabel}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      {opt.badge && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="size-4 text-blue-600 stroke-[2.5]" />
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-xs text-slate-400 italic">
                {emptyMessage}
              </div>
            )}
          </div>

          {/* Action Button di Bagian Bawah (misal: Tambah Customer Baru) */}
          {actionButton && (
            <div className="border-t border-slate-100 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  actionButton.onClick(search);
                }}
                className={cn(
                  'flex w-full items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100/70 transition-colors',
                  actionButton.className
                )}
              >
                {actionButton.label}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
