// src/components/editor/sub/FontSelect.tsx
'use client'

import React, { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { FixedSizeList as List } from 'react-window'
import { useFontManager } from '@/hooks/useFontManager'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Virtualized list item component
const FontItem = memo(({ index, style, data }: {
  index: number;
  style: React.CSSProperties;
  data: {
    fonts: string[];
    selectedFont: string;
    onSelect: (font: string) => void;
    searchTerm: string;
    loadedFonts: Set<string>;
  }
}) => {
  const { fonts, selectedFont, onSelect, searchTerm, loadedFonts } = data;
  const font = fonts[index];

  const handleSelect = useCallback(() => {
    onSelect(font);
  }, [font, onSelect]);

  // Highlight search term
  const highlightedFont = useMemo(() => {
    if (!searchTerm) return font;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return font.replace(regex, '<mark class="bg-transparent text-white">$1</mark>');
  }, [font, searchTerm]);

  // Get font style for the font item
  const getFontStyle = useCallback(() => {
    const isLoaded = loadedFonts.has(font);
    return {
      fontFamily: isLoaded ? `'${font}', sans-serif` : 'inherit',
      fontSize: '14px',
      fontWeight: 400,
    };
  }, [font, loadedFonts]);

  return (
    <div
      style={style}
      className={cn(
        "flex items-center px-2 py-1.5 text-sm cursor-pointer rounded-sm hover:bg-neutral-700",
        selectedFont === font && "bg-neutral-700"
      )}
      onClick={handleSelect}
    >
      <span
        dangerouslySetInnerHTML={{ __html: highlightedFont }}
        className="flex-1"
        style={getFontStyle()}
      />
      <Check
        className={cn(
          'ml-auto h-4 w-4 flex-shrink-0',
          selectedFont === font ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
});

FontItem.displayName = 'FontItem';

interface FontSelectProps {
  value?: string;
  onSelect?: (font: string) => void;
}

export const FontSelect = memo(({ value: controlledValue, onSelect }: FontSelectProps) => {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const [hasAutoScrolled, setHasAutoScrolled] = useState(false);
  const listRef = useRef<any>(null);

  const { fonts, loading, error, loadFont, retryFetch } = useFontManager();

  // Use controlled value if provided, otherwise use internal state
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  // Update internal value when controlled value changes
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized filtered fonts
  const filteredFonts = useMemo(() => {
    if (!debouncedSearchTerm) return fonts;

    const lowercaseSearch = debouncedSearchTerm.toLowerCase();
    return fonts.filter(font =>
      font.toLowerCase().includes(lowercaseSearch)
    );
  }, [fonts, debouncedSearchTerm]);

  // Load fonts for visible items when dropdown opens
  useEffect(() => {
    if (open && filteredFonts.length > 0) {
      // Only auto-scroll to selected font on first open, not when searching
      if (value && listRef.current && !hasAutoScrolled && !searchTerm) {
        const selectedIndex = filteredFonts.findIndex(font => font === value);
        if (selectedIndex !== -1) {
          // Small delay to ensure the list is rendered
          setTimeout(() => {
            listRef.current?.scrollToItem(selectedIndex, 'start');
            setHasAutoScrolled(true);
          }, 50);
        }
      }

      // Load first 20 fonts when dropdown opens for better UX
      const fontsToLoad = filteredFonts.slice(0, 20);
      
      const loadBatchFonts = async () => {
        for (const font of fontsToLoad) {
          if (!loadedFonts.has(font)) {
            try {
              await loadFont(font);
              setLoadedFonts(prev => new Set(prev).add(font));
            } catch (error) {
              console.warn(`Failed to load font: ${font}`);
            }
          }
        }
      };

      loadBatchFonts();
    }

    // Reset auto-scroll flag when dropdown closes
    if (!open) {
      setHasAutoScrolled(false);
    }
  }, [open, filteredFonts, loadFont, loadedFonts, value, hasAutoScrolled, searchTerm]);

  // Load fonts in background without causing re-renders
  const loadFontsInBackground = useCallback((startIndex: number, stopIndex: number) => {
    const fontsToLoad = filteredFonts.slice(startIndex, stopIndex + 1);
    
    // Use a timeout to avoid blocking the scroll
    setTimeout(() => {
      fontsToLoad.forEach(async (font) => {
        if (!loadedFonts.has(font)) {
          try {
            await loadFont(font);
            // Use functional update to avoid stale closure
            setLoadedFonts(prev => {
              const newSet = new Set(prev);
              newSet.add(font);
              return newSet;
            });
          } catch (error) {
            console.warn(`Failed to load font: ${font}`);
          }
        }
      });
    }, 0);
  }, [filteredFonts, loadFont, loadedFonts]);

  // Memoized font selection handler
  const handleFontSelect = useCallback(async (selectedFont: string) => {
    const newValue = selectedFont === value ? '' : selectedFont;
    
    // Update internal state if not controlled
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    
    // Call external handler if provided
    if (onSelect) {
      onSelect(newValue);
    }
    
    setOpen(false);
    setSearchTerm(''); // Clear search when selecting

    // Load font dynamically
    try {
      await loadFont(selectedFont);
      setLoadedFonts(prev => {
        const newSet = new Set(prev);
        newSet.add(selectedFont);
        return newSet;
      });

      // Update preview if exists
      const preview = document.getElementById('font-preview');
      if (preview) {
        preview.style.fontFamily = `'${selectedFont}', sans-serif`;
      }
    } catch (error) {
      console.warn(`Failed to load font: ${selectedFont}`);
    }
  }, [value, loadFont, onSelect, controlledValue]);

  // Memoized search handler
  const handleSearch = useCallback((search: string) => {
    setSearchTerm(search);
  }, []);

  // Stable list data that doesn't change on every loadedFonts update
  const listData = useMemo(() => ({
    fonts: filteredFonts,
    selectedFont: value,
    onSelect: handleFontSelect,
    searchTerm: debouncedSearchTerm,
    loadedFonts,
  }), [filteredFonts, value, handleFontSelect, debouncedSearchTerm, loadedFonts]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-neutral-300 text-sm font-normal"
          disabled={loading}
          style={{
            fontFamily: value && loadedFonts.has(value) ? `'${value}', sans-serif` : 'inherit'
          }}
        >
          {loading ? 'Loading fonts...' : (value || 'Select font')}
          <ChevronsUpDown className="opacity-50 ml-2 h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={20}
        className="-mt-3 w-[200px] p-0"
      >
        <Command className="bg-neutral-800">
          <CommandInput
            placeholder="Search font..."
            className="h-9"
            value={searchTerm}
            onValueChange={handleSearch}
          />
          <CommandList className="max-h-[300px] overflow-hidden">
            {loading ? (
              <CommandEmpty>Loading fonts...</CommandEmpty>
            ) : error ? (
              <div className="p-4 text-center">
                <div className="text-red-400 text-sm mb-2">{error}</div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={retryFetch}
                  className="text-xs"
                >
                  Retry
                </Button>
              </div>
            ) : filteredFonts.length === 0 ? (
              <CommandEmpty>
                {searchTerm ? `No fonts found for "${searchTerm}"` : 'No fonts found.'}
              </CommandEmpty>
            ) : (
              <div className="pl-1 p-1">
                <List
                  ref={listRef}
                  width=""
                  height={Math.min(filteredFonts.length * 32, 280)}
                  itemCount={filteredFonts.length}
                  itemSize={32}
                  itemData={listData}
                  className="MyScrollbar"
                  onItemsRendered={({ visibleStartIndex, visibleStopIndex }) => {
                    // Load fonts for visible items without blocking scroll
                    loadFontsInBackground(visibleStartIndex, visibleStopIndex);
                  }}
                >
                  {FontItem}
                </List>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

FontSelect.displayName = 'FontSelect';