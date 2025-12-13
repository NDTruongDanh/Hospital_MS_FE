"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { MOCK_USERS } from "@/services/auth.mock.service";
import { StatusBadge } from "@/components/ui/status-badge";
import { getUserRoleConfig } from "@/lib/constants/ui-mappings";

export function TestAccounts() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Card className="mt-6 border-dashed">
      <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            🧪 Test Accounts (Mock Mode)
            <Badge variant="outline" className="text-xs">
              Development Only
            </Badge>
          </CardTitle>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground mb-4">
            Click to copy credentials and test different user roles
          </p>
          {MOCK_USERS.map((user) => {
            const { variant, label } = getUserRoleConfig(user.role);

            return (
              <Card key={user.email} className="border">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {user.fullName}
                        </span>
                        <StatusBadge variant={variant} size="sm">
                          {label}
                        </StatusBadge>
                      </div>
                      {user.department && (
                        <p className="text-xs text-muted-foreground">
                          📍 {user.department}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Email:</p>
                      <div className="flex items-center gap-1">
                        <code className="flex-1 rounded bg-muted px-2 py-1 font-mono">
                          {user.email}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            copyToClipboard(user.email, `email-${user.email}`)
                          }
                        >
                          {copiedField === `email-${user.email}` ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-muted-foreground">Password:</p>
                      <div className="flex items-center gap-1">
                        <code className="flex-1 rounded bg-muted px-2 py-1 font-mono">
                          {user.password}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            copyToClipboard(user.password, `pass-${user.email}`)
                          }
                        >
                          {copiedField === `pass-${user.email}` ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="pt-2 text-xs text-muted-foreground border-t">
            💡 <strong>Tip:</strong> These accounts only work when{" "}
            <code className="rounded bg-muted px-1">USE_MOCK=true</code> in{" "}
            <code>lib/mocks/toggle.ts</code>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
