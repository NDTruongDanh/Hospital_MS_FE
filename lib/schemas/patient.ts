import { z } from "zod";

// Patient form validation schema - matches backend PatientRequest DTO
export const patientFormSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name cannot exceed 100 characters"), // Backend: @NotBlank, @Size(max = 100)
  email: z
    .union([z.string().email("Invalid email format"), z.literal("")])
    .optional(), // Backend: @Email (optional) - restored logic to match backend
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^(0|\+84)\d{9}$/,
      "Phone must start with 0 or +84 followed by 9 digits"
    ),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required") // Backend: @NotNull
    .refine(
      (val) => {
        if (!val) return false;
        const d = new Date(val);
        return !isNaN(d.getTime()) && d < new Date();
      },
      { message: "Date of birth must be valid and in the past" } // Backend: @Past
    ),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    required_error: "Gender is required",
  }), // Backend: @NotNull - REQUIRED
  address: z
    .string()
    .max(255, "Address cannot exceed 255 characters")
    .optional(),
  identificationNumber: z
    .union([
      z.string().regex(/^\d{12}$/, "ID number must be exactly 12 digits"),
      z.literal(""),
    ])
    .optional(), // Backend: @Pattern(regexp = "^\\d{12}$")
  healthInsuranceNumber: z
    .string()
    .max(20, "Health insurance number cannot exceed 20 characters")
    .optional(), // Backend: @Size(max = 20)
  bloodType: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional(),
  allergies: z.array(z.string()).optional(), // Backend: @Size(max = 100)
  relativeFullName: z
    .string()
    .max(100, "Contact name cannot exceed 100 characters")
    .optional(), // Backend: @Size(max = 100)
  relativePhoneNumber: z
    .union([
      z
        .string()
        .regex(
          /^(0|\+84)\d{9}$/,
          "Contact phone must start with 0 or +84 followed by 9 digits"
        ),
      z.literal(""),
    ])
    .optional(), // Backend: @Pattern(regexp = "^(0|\\+84)(\\d{9})$")
  relativeRelationship: z
    .enum(["SPOUSE", "PARENT", "CHILD", "SIBLING", "FRIEND", "OTHER"])
    .optional(),
  accountId: z.string().optional(),
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
