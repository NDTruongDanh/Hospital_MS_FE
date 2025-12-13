"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import Link from "next/link";

export interface RowAction {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "destructive";
  separator?: boolean;
}

export interface StandardRowActionsProps {
  /** Actions to display */
  actions: RowAction[];
  /** Optional: Custom className */
  className?: string;
  /** Optional: Align dropdown menu */
  align?: "start" | "end" | "center";
}

export function StandardRowActions({
  actions,
  className,
  align = "end",
}: StandardRowActionsProps) {
  // If 2 or fewer actions, show as buttons
  if (actions.length <= 2) {
    return (
      <div className={`flex items-center gap-2 ${className || ""}`}>
        {actions.map((action, index) => {
          const Icon =
            action.icon ||
            (action.label === "View"
              ? Eye
              : action.label === "Edit"
                ? Edit
                : Trash2);
          const isDestructive =
            action.variant === "destructive" ||
            action.label.toLowerCase().includes("delete");

          if (action.href) {
            return (
              <Button
                key={index}
                variant={isDestructive ? "ghost" : "ghost"}
                size="icon"
                className={
                  isDestructive
                    ? "h-8 w-8 text-destructive hover:bg-destructive/10"
                    : "h-8 w-8"
                }
                asChild
              >
                <Link href={action.href}>
                  {typeof Icon === "function" ? (
                    <Icon className="h-4 w-4" />
                  ) : (
                    Icon
                  )}
                  <span className="sr-only">{action.label}</span>
                </Link>
              </Button>
            );
          }

          return (
            <Button
              key={index}
              variant={isDestructive ? "ghost" : "ghost"}
              size="icon"
              onClick={action.onClick}
              className={
                isDestructive
                  ? "h-8 w-8 text-destructive hover:bg-destructive/10"
                  : "h-8 w-8"
              }
            >
              {typeof Icon === "function" ? <Icon className="h-4 w-4" /> : Icon}
              <span className="sr-only">{action.label}</span>
            </Button>
          );
        })}
      </div>
    );
  }

  // If more than 2 actions, use DropdownMenu
  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align}>
          {actions.map((action, index) => {
            const Icon =
              action.icon ||
              (action.label === "View"
                ? Eye
                : action.label === "Edit"
                  ? Edit
                  : Trash2);
            const isDestructive =
              action.variant === "destructive" ||
              action.label.toLowerCase().includes("delete");

            if (action.separator && index > 0) {
              return (
                <div key={`separator-${index}`}>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    asChild={!!action.href}
                    onClick={action.onClick}
                    className={
                      isDestructive
                        ? "text-destructive focus:text-destructive"
                        : ""
                    }
                  >
                    {action.href ? (
                      <Link href={action.href}>
                        {typeof Icon === "function" ? (
                          <Icon className="mr-2 h-4 w-4" />
                        ) : (
                          Icon
                        )}
                        {action.label}
                      </Link>
                    ) : (
                      <>
                        {typeof Icon === "function" ? (
                          <Icon className="mr-2 h-4 w-4" />
                        ) : (
                          Icon
                        )}
                        {action.label}
                      </>
                    )}
                  </DropdownMenuItem>
                </div>
              );
            }

            return (
              <DropdownMenuItem
                key={index}
                asChild={!!action.href}
                onClick={action.onClick}
                className={
                  isDestructive ? "text-destructive focus:text-destructive" : ""
                }
              >
                {action.href ? (
                  <Link href={action.href}>
                    {typeof Icon === "function" ? (
                      <Icon className="mr-2 h-4 w-4" />
                    ) : (
                      Icon
                    )}
                    {action.label}
                  </Link>
                ) : (
                  <>
                    {typeof Icon === "function" ? (
                      <Icon className="mr-2 h-4 w-4" />
                    ) : (
                      Icon
                    )}
                    {action.label}
                  </>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
