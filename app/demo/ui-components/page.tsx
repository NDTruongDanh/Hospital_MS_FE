/**
 * Demo page for testing new UI components
 *
 * Access: http://localhost:3000/demo/ui-components
 *
 * This page demonstrates all the new components created for UI standardization.
 */

import { StatusBadge } from "@/components/ui/status-badge";
import { Spinner } from "@/components/ui/spinner";
import { Loading } from "@/components/ui/loading";
import {
  getAppointmentStatusConfig,
  getInvoiceStatusConfig,
  getUserRoleConfig,
  getScheduleStatusConfig,
} from "@/lib/constants/ui-mappings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Check, Clock, X, AlertTriangle } from "lucide-react";

export default function UIComponentsDemo() {
  return (
    <div className="page-shell py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">UI Components Demo</h1>
        <p className="text-muted-foreground mt-2">
          Test page for new standardized UI components
        </p>
      </div>

      {/* StatusBadge Demo */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>StatusBadge Component</CardTitle>
          <CardDescription>
            A versatile badge component with multiple variants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* All Variants */}
          <div>
            <h3 className="font-semibold mb-3">All Variants</h3>
            <div className="flex flex-wrap gap-2">
              <StatusBadge variant="default">Default</StatusBadge>
              <StatusBadge variant="secondary">Secondary</StatusBadge>
              <StatusBadge variant="destructive">Destructive</StatusBadge>
              <StatusBadge variant="outline">Outline</StatusBadge>
              <StatusBadge variant="success">Success</StatusBadge>
              <StatusBadge variant="warning">Warning</StatusBadge>
              <StatusBadge variant="info">Info</StatusBadge>
              <StatusBadge variant="purple">Purple</StatusBadge>
              <StatusBadge variant="cyan">Cyan</StatusBadge>
              <StatusBadge variant="orange">Orange</StatusBadge>
              <StatusBadge variant="pink">Pink</StatusBadge>
              <StatusBadge variant="amber">Amber</StatusBadge>
              <StatusBadge variant="emerald">Emerald</StatusBadge>
              <StatusBadge variant="gray">Gray</StatusBadge>
            </div>
          </div>

          <Separator />

          {/* With Icons */}
          <div>
            <h3 className="font-semibold mb-3">With Icons</h3>
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                variant="success"
                icon={<Check className="h-3 w-3" />}
              >
                Completed
              </StatusBadge>
              <StatusBadge variant="info" icon={<Clock className="h-3 w-3" />}>
                Scheduled
              </StatusBadge>
              <StatusBadge
                variant="destructive"
                icon={<X className="h-3 w-3" />}
              >
                Cancelled
              </StatusBadge>
              <StatusBadge
                variant="warning"
                icon={<AlertTriangle className="h-3 w-3" />}
              >
                Warning
              </StatusBadge>
            </div>
          </div>

          <Separator />

          {/* Sizes */}
          <div>
            <h3 className="font-semibold mb-3">Sizes</h3>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge variant="info" size="sm">
                Small
              </StatusBadge>
              <StatusBadge variant="info" size="default">
                Default
              </StatusBadge>
              <StatusBadge variant="info" size="lg">
                Large
              </StatusBadge>
            </div>
          </div>

          <Separator />

          {/* Using Mappings */}
          <div>
            <h3 className="font-semibold mb-3">
              Appointment Statuses (with mappings)
            </h3>
            <div className="flex flex-wrap gap-2">
              {["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"].map(
                (status) => {
                  const {
                    variant,
                    label,
                    icon: Icon,
                  } = getAppointmentStatusConfig(status);
                  return (
                    <StatusBadge
                      key={status}
                      variant={variant}
                      icon={Icon && <Icon className="h-3 w-3" />}
                    >
                      {label}
                    </StatusBadge>
                  );
                }
              )}
            </div>
          </div>

          <Separator />

          {/* Invoice Statuses */}
          <div>
            <h3 className="font-semibold mb-3">
              Invoice Statuses (with mappings)
            </h3>
            <div className="flex flex-wrap gap-2">
              {["UNPAID", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"].map(
                (status) => {
                  const { variant, label } = getInvoiceStatusConfig(status);
                  return (
                    <StatusBadge key={status} variant={variant}>
                      {label}
                    </StatusBadge>
                  );
                }
              )}
            </div>
          </div>

          <Separator />

          {/* User Roles */}
          <div>
            <h3 className="font-semibold mb-3">User Roles (with mappings)</h3>
            <div className="flex flex-wrap gap-2">
              {["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST", "PATIENT"].map(
                (role) => {
                  const { variant, label } = getUserRoleConfig(role);
                  return (
                    <StatusBadge key={role} variant={variant}>
                      {label}
                    </StatusBadge>
                  );
                }
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spinner Demo */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Spinner Component</CardTitle>
          <CardDescription>
            Loading spinners with different sizes and variants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sizes */}
          <div>
            <h3 className="font-semibold mb-3">Sizes</h3>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <Spinner size="xs" />
                <span className="text-xs text-muted-foreground">xs</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="sm" />
                <span className="text-xs text-muted-foreground">sm</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="default" />
                <span className="text-xs text-muted-foreground">default</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="lg" />
                <span className="text-xs text-muted-foreground">lg</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="xl" />
                <span className="text-xs text-muted-foreground">xl</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Variants */}
          <div>
            <h3 className="font-semibold mb-3">Variants</h3>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <Spinner variant="default" />
                <span className="text-xs text-muted-foreground">default</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner variant="secondary" />
                <span className="text-xs text-muted-foreground">secondary</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner variant="destructive" />
                <span className="text-xs text-muted-foreground">
                  destructive
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner variant="muted" />
                <span className="text-xs text-muted-foreground">muted</span>
              </div>
              <div className="flex flex-col items-center gap-2 bg-primary p-4 rounded">
                <Spinner variant="white" />
                <span className="text-xs text-primary-foreground">white</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* In Button */}
          <div>
            <h3 className="font-semibold mb-3">In Buttons</h3>
            <div className="flex gap-2">
              <Button disabled>
                <Spinner size="sm" variant="white" className="mr-2" />
                Loading...
              </Button>
              <Button variant="secondary" disabled>
                <Spinner size="sm" className="mr-2" />
                Processing...
              </Button>
              <Button variant="outline" disabled>
                <Spinner size="sm" className="mr-2" />
                Submitting...
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading Demo */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Loading Component</CardTitle>
          <CardDescription>
            Full loading state component with text and customization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default */}
          <div>
            <h3 className="font-semibold mb-3">Default Loading</h3>
            <div className="border rounded-lg p-4">
              <Loading />
            </div>
          </div>

          <Separator />

          {/* With Custom Text */}
          <div>
            <h3 className="font-semibold mb-3">With Custom Text</h3>
            <div className="border rounded-lg p-4">
              <Loading text="Đang tải dữ liệu..." />
            </div>
          </div>

          <Separator />

          {/* Small Size */}
          <div>
            <h3 className="font-semibold mb-3">Small Size</h3>
            <div className="border rounded-lg p-4">
              <Loading size="sm" text="Processing..." />
            </div>
          </div>

          <Separator />

          {/* Note about Full Screen */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Full Screen Mode</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Use{" "}
              <code className="bg-background px-1 py-0.5 rounded">
                fullScreen
              </code>{" "}
              prop for full page loading:
            </p>
            <code className="block bg-background p-2 rounded text-sm">
              {`<Loading fullScreen />`}
            </code>
            <p className="text-sm text-muted-foreground mt-2">
              This is commonly used in RoleGuard and page-level loading states.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
          <CardDescription>Copy-paste ready code snippets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">StatusBadge</h3>
            <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
              <code>{`import { StatusBadge } from "@/components/ui/status-badge";
import { Check } from "lucide-react";

<StatusBadge variant="success" icon={<Check className="h-3 w-3" />}>
  Completed
</StatusBadge>`}</code>
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">With UI Mappings</h3>
            <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
              <code>{`import { StatusBadge } from "@/components/ui/status-badge";
import { getAppointmentStatusConfig } from "@/lib/constants/ui-mappings";

const { variant, label, icon: Icon } = getAppointmentStatusConfig(status);

<StatusBadge variant={variant} icon={Icon && <Icon className="h-3 w-3" />}>
  {label}
</StatusBadge>`}</code>
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Loading State</h3>
            <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
              <code>{`import { Loading } from "@/components/ui/loading";

if (isLoading) {
  return <Loading text="Loading data..." />;
}`}</code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
