"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  User,
  Heart,
  Phone,
  Link2,
} from "lucide-react";
import { useState } from "react";
import MyDatePicker from "@/app/admin/_components/MyDatePicker";
import {
  Patient,
  BloodType,
  Gender,
  RelationshipType,
} from "@/interfaces/patient";
import { patientFormSchema, PatientFormValues } from "@/lib/schemas/patient";
import { TagInput } from "@/components/ui/tag-input";
import { useEffect } from "react";
import { AccountSearchSelect } from "@/components/ui/account-search-select";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Re-export for convenience
export { patientFormSchema, type PatientFormValues };

interface PatientFormProps {
  initialData?: Patient | null;
  onSubmit: (data: PatientFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
  confirmOnCancel?: boolean;
}

const bloodTypes: BloodType[] = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];
const genders: { value: Gender; label: string }[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];
const relationships: { value: RelationshipType; label: string }[] = [
  { value: "SPOUSE", label: "Spouse" },
  { value: "PARENT", label: "Parent" },
  { value: "CHILD", label: "Child" },
  { value: "SIBLING", label: "Sibling" },
  { value: "FRIEND", label: "Friend" },
  { value: "OTHER", label: "Other" },
];

export function PatientForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  confirmOnCancel = true,
}: PatientFormProps) {
  const { user } = useAuth();
  const [healthInfoOpen, setHealthInfoOpen] = useState(true);
  const [emergencyOpen, setEmergencyOpen] = useState(true);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      fullName: initialData?.fullName ?? "",
      email: initialData?.email || "",
      phoneNumber: initialData?.phoneNumber ?? "",
      dateOfBirth: initialData?.dateOfBirth ?? "",
      gender: (initialData?.gender as Gender) || undefined,
      address: initialData?.address || "",
      identificationNumber: initialData?.identificationNumber || "",
      healthInsuranceNumber: initialData?.healthInsuranceNumber || "",
      bloodType: (initialData?.bloodType as BloodType) || undefined,
      allergies: initialData?.allergies
        ? initialData.allergies
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      relativeFullName: initialData?.relativeFullName || "",
      relativePhoneNumber: initialData?.relativePhoneNumber || "",
      relativeRelationship:
        (initialData?.relativeRelationship as RelationshipType) || undefined,
      accountId: initialData?.accountId || "",
    },
    shouldUnregister: false, // Ensure fields are not unregistered when unmounted (e.g., hidden tabs)
  });

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [form.formState.isDirty]);

  const handleCancel = () => {
    if (confirmOnCancel && form.formState.isDirty) {
      const confirmed = confirm(
        "Bạn có chắc chắn muốn hủy? Các thay đổi chưa lưu sẽ mất."
      );
      if (!confirmed) return;
    }
    onCancel();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          // Log details to help debug empty error objects
          console.group("Form Validation Failed");
          console.error("Errors object:", JSON.stringify(errors, null, 2));
          console.error(
            "Current values:",
            JSON.stringify(form.getValues(), null, 2)
          );
          console.groupEnd();

          toast.error("Please check the form for errors");

          // Manually focus the first error
          const firstError = Object.keys(errors)[0];
          if (firstError) {
            const element = document.querySelector(`[name="${firstError}"]`);
            if (element) {
              (element as HTMLElement).scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }
        })}
        className="space-y-6"
      >
        {/* Basic Information */}
        <div className="form-section-card">
          <div className="form-section-card-title">
            <User className="h-5 w-5 text-sky-500" />
            Personal Information
          </div>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="form-label form-label-required">
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="form-grid">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label form-label-required">
                      Date of Birth
                    </FormLabel>
                    <FormControl>
                      <MyDatePicker
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) =>
                          field.onChange(date?.toISOString().split("T")[0])
                        }
                        disabled={(date) => date > new Date()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label form-label-required">
                      Gender
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {genders.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="form-grid">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label form-label-required">
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="form-full-width">
                  <FormLabel className="form-label">Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="form-grid">
              <FormField
                control={form.control}
                name="identificationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">ID Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter ID number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="healthInsuranceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">
                      Health Insurance Number
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter insurance number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Health Information - Collapsible */}
        <Collapsible open={healthInfoOpen} onOpenChange={setHealthInfoOpen}>
          <div className="form-section-card">
            <CollapsibleTrigger asChild>
              <div className="form-section-card-title cursor-pointer hover:text-sky-600 transition-colors">
                <Heart className="h-5 w-5 text-rose-500" />
                Health Information
                <div className="ml-auto">
                  {healthInfoOpen ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-4 pt-4">
                <div className="form-grid">
                  <FormField
                    control={form.control}
                    name="bloodType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label">Blood Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select blood type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bloodTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allergies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label">Allergies</FormLabel>
                        <FormControl>
                          <TagInput
                            value={field.value || []}
                            onChange={field.onChange}
                            placeholder="Add allergy and press Enter"
                            suggestions={[
                              "Penicillin",
                              "Peanut",
                              "Seafood",
                              "Dust",
                              "NSAIDs",
                            ]}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Emergency Contact - Collapsible */}
        <Collapsible open={emergencyOpen} onOpenChange={setEmergencyOpen}>
          <div className="form-section-card">
            <CollapsibleTrigger asChild>
              <div className="form-section-card-title cursor-pointer hover:text-sky-600 transition-colors">
                <Phone className="h-5 w-5 text-emerald-500" />
                Emergency Contact
                <div className="ml-auto">
                  {emergencyOpen ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="relativeFullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label">Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="form-grid">
                  <FormField
                    control={form.control}
                    name="relativeRelationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label">
                          Relationship
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {relationships.map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="relativePhoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label">
                          Contact Phone
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Account Linking (Optional) */}
        <Collapsible defaultOpen={false}>
          <div className="form-section-card">
            <CollapsibleTrigger asChild>
              <div className="form-section-card-title cursor-pointer hover:text-sky-600 transition-colors">
                <Link2 className="h-5 w-5 text-violet-500" />
                Account Linking (Optional)
                <div className="ml-auto">
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label">
                        Link to Account
                      </FormLabel>
                      <FormControl>
                        <AccountSearchSelect
                          value={field.value || null}
                          onChange={field.onChange}
                          onAccountSelect={(account) => {
                            // Auto-fill email from account
                            if (account) {
                              form.setValue("email", account.email);
                            }
                          }}
                          // Receptionists can only link PATIENT accounts
                          roleFilter={
                            user?.role !== "ADMIN" ? "PATIENT" : undefined
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="px-6 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white border-0"
          >
            {isLoading && <Spinner size="sm" className="mr-2" />}
            {initialData ? "Update Patient" : "Create Patient"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
