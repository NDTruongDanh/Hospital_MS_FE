"use client";

import { useState, useMemo } from "react";
import {
  FlaskConical,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  TestTube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ListPageHeader } from "@/components/ui/list-page-header";
import { FilterPills } from "@/components/ui/filter-pills";
import {
  useLabTests,
  useCreateLabTest,
  useUpdateLabTest,
  useDeleteLabTest,
} from "@/hooks/queries/useLab";
import {
  LabTest,
  LabTestCategory,
  LabTestCreateRequest,
} from "@/services/lab.service";

const categoryLabels: Record<LabTestCategory, string> = {
  LAB: "Laboratory Test",
  IMAGING: "Diagnostic Imaging",
  PATHOLOGY: "Pathology",
};

const categoryColors: Record<LabTestCategory, string> = {
  LAB: "bg-blue-100 text-blue-800",
  IMAGING: "bg-purple-100 text-purple-800",
  PATHOLOGY: "bg-orange-100 text-orange-800",
};

export default function LabTestsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<LabTestCategory | "ALL">(
    "ALL"
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<LabTestCreateRequest>>({
    code: "",
    name: "",
    category: "LAB",
    description: "",
    price: 0,
    unit: "",
    normalRange: "",
    isActive: true,
  });

  const { data, isLoading } = useLabTests({ page: 0, size: 100 });
  const createMutation = useCreateLabTest();
  const updateMutation = useUpdateLabTest();
  const deleteMutation = useDeleteLabTest();
  const labTests: LabTest[] = data?.content || [];
  const totalTests = labTests.length;

  const filteredTests = labTests.filter((test) => {
    const matchesSearch =
      test.name.toLowerCase().includes(search.toLowerCase()) ||
      test.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "ALL" || test.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Stats for FilterPills
  const labCount = useMemo(
    () => labTests.filter((t) => t.category === "LAB").length,
    [labTests]
  );
  const imagingCount = useMemo(
    () => labTests.filter((t) => t.category === "IMAGING").length,
    [labTests]
  );
  const pathologyCount = useMemo(
    () => labTests.filter((t) => t.category === "PATHOLOGY").length,
    [labTests]
  );
  const activeCount = useMemo(
    () => labTests.filter((t) => t.isActive).length,
    [labTests]
  );

  const handleOpenCreate = () => {
    setFormData({
      code: "",
      name: "",
      category: "LAB",
      description: "",
      price: 0,
      unit: "",
      normalRange: "",
      isActive: true,
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (test: LabTest) => {
    setFormData({
      code: test.code,
      name: test.name,
      category: test.category,
      description: test.description || "",
      price: test.price,
      unit: test.unit || "",
      normalRange: test.normalRange || "",
      isActive: test.isActive,
    });
    setEditingTest(test);
  };

  const handleSubmit = async () => {
    if (editingTest) {
      await updateMutation.mutateAsync({ id: editingTest.id, data: formData });
      setEditingTest(null);
    } else {
      await createMutation.mutateAsync(formData as LabTestCreateRequest);
      setIsCreateOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    setDeleteConfirm(null);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <ListPageHeader
        title="Lab Test Types"
        description="Manage catalog of lab tests and diagnostic imaging"
        theme="teal"
        icon={<TestTube className="h-6 w-6 text-white" />}
        stats={[
          { label: "Total Tests", value: totalTests },
          { label: "Active", value: activeCount },
          { label: "Lab Tests", value: labCount },
          { label: "Imaging", value: imagingCount },
        ]}
        primaryAction={{
          label: "Add Test Type",
          onClick: handleOpenCreate,
          icon: <Plus className="h-4 w-4 mr-2" />,
        }}
      />

      {/* Quick Filter Pills */}
      <FilterPills
        filters={[
          { id: "ALL", label: "All", count: totalTests },
          { id: "LAB", label: "Laboratory", count: labCount },
          { id: "IMAGING", label: "Imaging", count: imagingCount },
          { id: "PATHOLOGY", label: "Pathology", count: pathologyCount },
        ]}
        activeFilter={categoryFilter}
        onFilterChange={(id) =>
          setCategoryFilter(id as LabTestCategory | "ALL")
        }
      />

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table Card */}
      <Card className="border-2 border-slate-200 shadow-md rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Test Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Normal Range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredTests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <TestTube className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No test types found</h3>
                    <p className="text-muted-foreground">
                      {search
                        ? "Try adjusting your search"
                        : "Get started by adding a new test type"}
                    </p>
                    {!search && (
                      <Button onClick={handleOpenCreate} className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Test Type
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-mono text-sm">
                      {test.code}
                    </TableCell>
                    <TableCell className="font-medium">{test.name}</TableCell>
                    <TableCell>
                      <Badge className={categoryColors[test.category]}>
                        {categoryLabels[test.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPrice(test.price)}</TableCell>
                    <TableCell>{test.unit || "-"}</TableCell>
                    <TableCell>{test.normalRange || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={test.isActive ? "default" : "secondary"}>
                        {test.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(test)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirm(test.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={isCreateOpen || !!editingTest}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingTest(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTest ? "Edit test type" : "Add new test type"}
            </DialogTitle>
            <DialogDescription>
              {editingTest
                ? "Update test type information"
                : "Enter information for new test type"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Test Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="e.g., CBC, XRAY_CHEST"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData({ ...formData, category: v as LabTestCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAB">Laboratory Test</SelectItem>
                    <SelectItem value="IMAGING">Diagnostic Imaging</SelectItem>
                    <SelectItem value="PATHOLOGY">Pathology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Test Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Complete Blood Count, Chest X-Ray"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  placeholder="e.g., mg/dL, cells/μL"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="normalRange">Normal Range</Label>
              <Input
                id="normalRange"
                value={formData.normalRange}
                onChange={(e) =>
                  setFormData({ ...formData, normalRange: e.target.value })
                }
                placeholder="e.g., 4.5-11.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Detailed description of the test..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingTest(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingTest ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this test type? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
