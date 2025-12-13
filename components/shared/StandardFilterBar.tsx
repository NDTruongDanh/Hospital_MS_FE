"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface FilterOption {
  value: string;
  label: string;
}

export interface StandardFilterBarProps {
  /** Search input value */
  searchValue: string;
  /** Search input onChange handler */
  onSearchChange: (value: string) => void;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Filter options - array of {value, label} */
  filterOptions?: Array<{
    key: string;
    label: string;
    value: string;
    options: FilterOption[];
    placeholder?: string;
  }>;
  /** Filter values - object with filter keys and values */
  filterValues?: Record<string, string>;
  /** Filter onChange handler */
  onFilterChange?: (key: string, value: string) => void;
  /** Show clear button */
  showClear?: boolean;
  /** Clear all filters handler */
  onClear?: () => void;
  /** Has active filters */
  hasActiveFilters?: boolean;
  /** Optional: Action buttons (Add, Export, etc.) */
  actions?: React.ReactNode;
  /** Optional: Custom className */
  className?: string;
}

export function StandardFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filterOptions = [],
  filterValues = {},
  onFilterChange,
  showClear = true,
  onClear,
  hasActiveFilters = false,
  actions,
  className,
}: StandardFilterBarProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-10"
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
                onClick={() => onSearchChange("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Filter Selects & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Selects */}
            {filterOptions.map((filter) => (
              <Select
                key={filter.key}
                value={filterValues[filter.key] || "all"}
                onValueChange={(value) => onFilterChange?.(filter.key, value)}
              >
                <SelectTrigger className="h-10 min-w-[130px]">
                  <SelectValue
                    placeholder={filter.placeholder || filter.label}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {filter.label}</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}

            {/* Clear Button */}
            {showClear && hasActiveFilters && onClear && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-10 px-3 text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}

            {/* Action Buttons */}
            {actions}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
