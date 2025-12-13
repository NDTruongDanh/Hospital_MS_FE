"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Department, DepartmentRequest } from "@/interfaces/hr";
import { useRouter } from "next/navigation";
import { DoctorSearchSelect } from "@/components/appointment/DoctorSearchSelect";
import { Spinner } from "@/components/ui/spinner";

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Department name is required")
    .max(255, "Name must be less than 255 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  headDoctorId: z.string().optional(),
  location: z
    .string()
    .max(255, "Location must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  phoneExtension: z
    .string()
    .regex(/^\d*$/, "Phone extension must be numeric")
    .max(20, "Phone extension must be less than 20 characters")
    .optional()
    .or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type DepartmentFormValues = z.infer<typeof formSchema>;

interface DepartmentFormProps {
  initialData?: Department;
  onSubmit: (data: DepartmentRequest) => void;
  isLoading: boolean;
}

export default function DepartmentForm({
  initialData,
  onSubmit,
  isLoading,
}: DepartmentFormProps) {
  const router = useRouter();
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      headDoctorId: initialData?.headDoctorId || "",
      location: initialData?.location || "",
      phoneExtension: initialData?.phoneExtension || "",
      status: initialData?.status || "ACTIVE",
    },
  });

  const handleSubmit = (values: DepartmentFormValues) => {
    // If headDoctorId is "none" or empty, set it to undefined
    const submitData: DepartmentRequest = {
      ...values,
      headDoctorId:
        values.headDoctorId === "none" || !values.headDoctorId
          ? undefined
          : values.headDoctorId,
    };
    onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department Name</FormLabel>
                <FormControl>
                  <Input placeholder="Cardiology" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="headDoctorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Head Doctor</FormLabel>
                <DoctorSearchSelect
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Search active doctor"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Building A, Floor 2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneExtension"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Extension</FormLabel>
                <FormControl>
                  <Input placeholder="1234" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Department description..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Spinner size="sm" className="mr-2" />}
            {initialData ? "Update Department" : "Create Department"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
