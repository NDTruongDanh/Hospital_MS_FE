"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePatients } from "@/hooks/queries/usePatient";
import {
  PatientFiltersBar,
  PatientFilters,
} from "../../admin/patients/_components";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutGrid,
  List,
  Eye,
  Users,
  Search,
  Activity,
  Phone,
  Mail,
  Calendar,
  Droplets,
  ChevronRight,
} from "lucide-react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { format } from "date-fns";
import { Patient, PatientListParams, Gender, BloodType } from "@/interfaces/patient";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";

type ViewMode = "table" | "grid";

// Generate consistent color based on name
function getAvatarColor(name: string): string {
  const colors = [
    "from-cyan-400 to-teal-500",
    "from-blue-400 to-indigo-500",
    "from-purple-400 to-pink-500",
    "from-rose-400 to-red-500",
    "from-orange-400 to-amber-500",
    "from-emerald-400 to-green-500",
    "from-teal-400 to-cyan-500",
    "from-indigo-400 to-purple-500",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

// Calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Gender display helper
function getGenderDisplay(gender: Gender | null | undefined): { label: string; color: string } {
  if (!gender) return { label: "-", color: "" };
  if (gender === "MALE") return { label: "Nam", color: "bg-blue-100 text-blue-700" };
  if (gender === "FEMALE") return { label: "Nữ", color: "bg-pink-100 text-pink-700" };
  return { label: gender, color: "bg-slate-100 text-slate-700" };
}

export default function DoctorPatientsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("ALL");
  const [bloodTypeFilter, setBloodTypeFilter] = useState<string>("ALL");

  const debouncedSearch = useDebounce(search, 300);

  const params: PatientListParams = {
    page,
    size: pageSize,
    search: debouncedSearch || undefined,
    gender: genderFilter !== "ALL" ? (genderFilter as Gender) : undefined,
    bloodType: bloodTypeFilter !== "ALL" ? (bloodTypeFilter as BloodType) : undefined,
    sort: "fullName,asc",
  };

  const { data, isLoading } = usePatients(params);

  const patients = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const handleViewPatient = useCallback(
    (id: string) => {
      router.push(`/doctor/patients/${id}`);
    },
    [router]
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 p-6 text-white shadow-lg">
        {/* Background decoration */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          {/* Left: Title */}
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Danh sách Bệnh nhân</h1>
              <p className="mt-1 text-cyan-100">
                Quản lý thông tin bệnh nhân trong hệ thống
              </p>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="hidden md:flex gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-cyan-100 text-sm">
                <Activity className="h-4 w-4" />
                Tổng số
              </div>
              <div className="text-2xl font-bold">{totalElements}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-3 border">
        {/* View Toggle */}
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === "table"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="h-4 w-4" />
            Bảng
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === "grid"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Lưới
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="h-9 rounded-lg pl-9 bg-white"
          />
        </div>

        {/* Gender Filter */}
        <Select
          value={genderFilter}
          onValueChange={(val) => {
            setGenderFilter(val);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[120px] h-9 bg-white">
            <SelectValue placeholder="Giới tính" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            <SelectItem value="MALE">Nam</SelectItem>
            <SelectItem value="FEMALE">Nữ</SelectItem>
          </SelectContent>
        </Select>

        {/* Blood Type Filter */}
        <Select
          value={bloodTypeFilter}
          onValueChange={(val) => {
            setBloodTypeFilter(val);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[100px] h-9 bg-white">
            <SelectValue placeholder="Nhóm máu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            <SelectItem value="A+">A+</SelectItem>
            <SelectItem value="A-">A-</SelectItem>
            <SelectItem value="B+">B+</SelectItem>
            <SelectItem value="B-">B-</SelectItem>
            <SelectItem value="AB+">AB+</SelectItem>
            <SelectItem value="AB-">AB-</SelectItem>
            <SelectItem value="O+">O+</SelectItem>
            <SelectItem value="O-">O-</SelectItem>
          </SelectContent>
        </Select>

        {/* Page Size */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-slate-500">Hiển thị:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              setPageSize(Number(val));
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[70px] h-9 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {viewMode === "table" ? (
        /* Table View */
        <Card className="shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Bệnh nhân</TableHead>
                  <TableHead>Giới tính</TableHead>
                  <TableHead>Nhóm máu</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Ngày đăng ký</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient: Patient, index: number) => {
                  const gender = getGenderDisplay(patient.gender);
                  return (
                    <TableRow
                      key={patient.id}
                      className={`hover:bg-cyan-50/50 transition-colors cursor-pointer ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      }`}
                      onClick={() => handleViewPatient(patient.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {/* Avatar with image support */}
                          {patient.profileImageUrl ? (
                            <img
                              src={patient.profileImageUrl}
                              alt={patient.fullName}
                              className="h-10 w-10 rounded-full object-cover shadow-md flex-shrink-0"
                            />
                          ) : (
                            <div
                              className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarColor(
                                patient.fullName
                              )} flex items-center justify-center text-white font-semibold text-sm shadow-md flex-shrink-0`}
                            >
                              {patient.fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-slate-900">
                              {patient.fullName}
                            </div>
                            {patient.dateOfBirth && (
                              <div className="text-sm text-slate-500">
                                {calculateAge(patient.dateOfBirth)} tuổi
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {gender.label !== "-" ? (
                          <Badge className={`${gender.color} border-0`}>
                            {gender.label}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {patient.bloodType ? (
                          <Badge className="bg-red-100 text-red-700 border-0">
                            <Droplets className="h-3 w-3 mr-1" />
                            {patient.bloodType}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {patient.phoneNumber && (
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Phone className="h-3 w-3" />
                              {patient.phoneNumber}
                            </div>
                          )}
                          {patient.email && (
                            <div className="flex items-center gap-1 text-sm text-slate-500 truncate max-w-[180px]">
                              <Mail className="h-3 w-3" />
                              {patient.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {patient.createdAt ? (
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(patient.createdAt), "dd/MM/yyyy")}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPatient(patient.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {patients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <Users className="h-12 w-12 text-slate-300" />
                        <p className="text-lg font-medium">Không tìm thấy bệnh nhân</p>
                        <p className="text-sm">Thử thay đổi bộ lọc tìm kiếm</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Grid View */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient: Patient) => {
            const gender = getGenderDisplay(patient.gender);
            return (
              <Link
                key={patient.id}
                href={`/doctor/patients/${patient.id}`}
                className="block group"
              >
                <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-cyan-300 hover:-translate-y-0.5">
                  {/* Decorative gradient bar */}
                  <div className="h-1.5 bg-gradient-to-r from-cyan-400 via-teal-500 to-emerald-500" />
                  
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar with image support */}
                      {patient.profileImageUrl ? (
                        <img
                          src={patient.profileImageUrl}
                          alt={patient.fullName}
                          className="h-14 w-14 rounded-full object-cover shadow-lg flex-shrink-0"
                        />
                      ) : (
                        <div
                          className={`h-14 w-14 rounded-full bg-gradient-to-br ${getAvatarColor(
                            patient.fullName
                          )} flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0`}
                        >
                          {patient.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 group-hover:text-cyan-600 transition-colors truncate">
                          {patient.fullName}
                        </h3>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          {gender.label !== "-" && (
                            <Badge className={`${gender.color} border-0 text-xs`}>
                              {gender.label}
                            </Badge>
                          )}
                          {patient.dateOfBirth && (
                            <Badge variant="outline" className="text-xs">
                              {calculateAge(patient.dateOfBirth)} tuổi
                            </Badge>
                          )}
                          {patient.bloodType && (
                            <Badge className="bg-red-100 text-red-700 border-0 text-xs">
                              {patient.bloodType}
                            </Badge>
                          )}
                        </div>

                        <div className="mt-3 space-y-1">
                          {patient.phoneNumber && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="h-3 w-3 text-slate-400" />
                              {patient.phoneNumber}
                            </div>
                          )}
                          {patient.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-500 truncate">
                              <Mail className="h-3 w-3 text-slate-400" />
                              {patient.email}
                            </div>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
          {patients.length === 0 && (
            <div className="col-span-full">
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-12">
                  <Users className="h-12 w-12 text-slate-300" />
                  <p className="text-lg font-medium text-slate-700">Không tìm thấy bệnh nhân</p>
                  <p className="text-sm text-slate-500">Thử thay đổi bộ lọc tìm kiếm</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalElements > 0 && (
        <div className="flex justify-center">
          <DataTablePagination
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={setPage}
            infoText={`Hiển thị ${page * pageSize + 1}-${Math.min(
              (page + 1) * pageSize,
              totalElements
            )} / ${totalElements} bệnh nhân`}
          />
        </div>
      )}
    </div>
  );
}
