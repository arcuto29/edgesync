'use client';

import { Search, Plus, Bell } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-8">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className={`relative transition-all duration-300 ${searchFocused ? 'w-80' : 'w-64'}`}>
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search trades, symbols, notes..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="h-10 w-full rounded-xl bg-secondary/50 border border-border/50 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground transition-all duration-300 focus:bg-secondary focus:border-primary/30"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border/50 bg-background/50 px-1.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:text-white hover:bg-secondary/50 transition-all duration-200">
          <Bell className="h-[18px] w-[18px]" />
        </button>

        {/* New Trade button */}
        <button className="flex items-center gap-2 rounded-xl bg-primary/90 hover:bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:shadow-[0_0_20px_-5px] hover:shadow-primary/30">
          <Plus className="h-4 w-4" />
          <span>New Trade</span>
        </button>
      </div>
    </header>
  );
}
