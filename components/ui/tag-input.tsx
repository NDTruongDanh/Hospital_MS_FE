"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  suggestions?: string[];
  className?: string;
};

export function TagInput({
  value,
  onChange,
  placeholder,
  disabled,
  suggestions,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    if (value.includes(clean)) return;
    onChange([...value, clean]);
    setInputValue("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2 rounded-md border px-3 py-2">
        {value.length === 0 ? (
          <span className="text-sm text-muted-foreground">No allergies</span>
        ) : (
          value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))
        )}
        <Input
          value={inputValue}
          disabled={disabled}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Add allergy and press Enter"}
          className="border-0 px-0 py-1 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>Gợi ý:</span>
          {suggestions.map((s) => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant="outline"
              className="h-7 rounded-full px-2"
              onClick={() => addTag(s)}
              disabled={disabled}
            >
              {s}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
