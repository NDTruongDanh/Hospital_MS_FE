import { z } from "zod";

// Patient form validation schema
export const patientFormSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be less than 15 digits")
    .regex(/^[0-9+\-\s]+$/, "Invalid phone number format"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  address: z
    .string()
    .max(255, "Address must be less than 255 characters")
    .optional(),
  identificationNumber: z
    .string()
    .max(20, "ID number must be less than 20 characters")
    .optional(),
  healthInsuranceNumber: z
    .string()
    .max(30, "Insurance number must be less than 30 characters")
    .optional(),
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  allergies: z.array(z.string()).optional(),
  relativeFullName: z
    .string()
    .max(100, "Contact name must be less than 100 characters")
    .optional(),
  relativePhoneNumber: z
    .string()
    .max(15, "Contact phone must be less than 15 digits")
    .regex(/^[0-9+\-\s]*$/, "Invalid phone number format")
    .optional()
    .or(z.literal("")),
  relativeRelationship: z
    .enum(["SPOUSE", "PARENT", "CHILD", "SIBLING", "FRIEND", "OTHER"])
    .optional(),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;

// Patient search/filter schema
export const patientSearchSchema = z.object({
  search: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  bloodType: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional(),
  page: z.number().min(1).optional().default(1),
  size: z.number().min(1).max(100).optional().default(10),
  sort: z.string().optional(),
});

export type PatientSearchValues = z.infer<typeof patientSearchSchema>;
