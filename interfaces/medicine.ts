// Medicine entity - matches backend API
export interface Medicine {
  id: string;
  name: string;
  activeIngredient: string | null;
  unit: string;
  description: string | null;
  quantity: number;
  concentration?: string | null;
  packaging: string | null;
  purchasePrice: number;
  sellingPrice: number;
  expiresAt: string; // ISO date string
  manufacturer?: string | null;
  sideEffects?: string | null;
  storageConditions?: string | null;
  categoryId: string | null;
  categoryName: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// List params for API
export interface MedicineListParams {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  categoryId?: string;
}

// Paginated response
export interface MedicineListResponse {
  content: Medicine[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// Create medicine request
export interface CreateMedicineRequest {
  name: string;
  activeIngredient?: string;
  unit: string;
  description?: string;
  quantity: number;
  concentration?: string;
  packaging?: string;
  purchasePrice: number;
  sellingPrice: number;
  expiresAt: string;
  manufacturer?: string;
  sideEffects?: string;
  storageConditions?: string;
  categoryId?: string;
}

// Update medicine request
export interface UpdateMedicineRequest {
  name?: string;
  activeIngredient?: string | null;
  unit?: string;
  description?: string | null;
  quantity?: number;
  concentration?: string | null;
  packaging?: string | null;
  purchasePrice?: number;
  sellingPrice?: number;
  expiresAt?: string;
  manufacturer?: string | null;
  sideEffects?: string | null;
  storageConditions?: string | null;
  categoryId?: string | null;
}
