"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface DataTableRowAction {
  /** Action label */
  label: string;
  /** Action icon - defaults based on label if not provided */
  icon?: React.ReactNode;
  /** onClick handler */
  onClick?: () => void;
  /** href for navigation */
  href?: string;
  /** Is destructive action (Delete) */
  destructive?: boolean;
  /** Show separator before this item */
  separator?: boolean;
}

export interface DataTableRowActionsProps {
  /** Row data identifier (for unique keys) */
  rowId: string;
  /** Actions to display */
  actions: DataTableRowAction[];
  /** Optional: Custom className */
  className?: string;
}

export function DataTableRowActions({
  rowId,
  actions,
  className,
}: DataTableRowActionsProps) {
  const router = useRouter();

  const getDefaultIcon = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes("view") || lowerLabel.includes("details")) {
      return Eye;
    }
    if (lowerLabel.includes("edit")) {
      return Pencil;
    }
    if (lowerLabel.includes("delete") || lowerLabel.includes("remove")) {
      return Trash2;
    }
    return Eye;
  };

  const handleAction = (action: DataTableRowAction) => {
    if (action.href) {
      router.push(action.href);
    } else if (action.onClick) {
      action.onClick();
    }
  };

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action, index) => {
            const Icon = action.icon || getDefaultIcon(action.label);
            const isDestructive =
              action.destructive ||
              action.label.toLowerCase().includes("delete");

            const menuItem = (
              <DropdownMenuItem
                key={`${rowId}-${index}`}
                onClick={() => handleAction(action)}
                className={
                  isDestructive ? "text-destructive focus:text-destructive" : ""
                }
              >
                {typeof Icon === "function" ? (
                  <Icon className="mr-2 h-4 w-4" />
                ) : (
                  Icon
                )}
                {action.label}
              </DropdownMenuItem>
            );

            if (action.separator && index > 0) {
              return (
                <div key={`separator-${rowId}-${index}`}>
                  <DropdownMenuSeparator />
                  {menuItem}
                </div>
              );
            }

            return menuItem;
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
