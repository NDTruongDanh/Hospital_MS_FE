import { Category, CategoryRequest } from "@/interfaces/category";
import api from "@/config/axios";
import { USE_MOCK } from "@/lib/mocks/toggle";
import { mockCategories } from "@/lib/mocks/data/categories";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Keep for mock fallback
export let categoriesDB = [...mockCategories];

export interface CategoryListResponse {
  content: Category[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const categoryService = {
  getList: async (params?: { page?: number; size?: number; sort?: string; search?: string }) => {
    if (USE_MOCK) {
        await delay(500);
        let data = [...categoriesDB];

        // Simulate search
        if (params?.search) {
        const lowerSearch = params.search.toLowerCase();
        data = data.filter(cat => cat.name.toLowerCase().includes(lowerSearch));
        }
        
        // Simulate pagination
        const page = params?.page || 0;
        const size = params?.size || 10;
        const totalElements = data.length;
        const totalPages = Math.ceil(totalElements / size);
        const paginatedData = data.slice(page * size, (page + 1) * size);

        return {
        data: {
            content: paginatedData,
            page,
            size,
            totalElements,
            totalPages,
            last: (page + 1) >= totalPages
        }
        };
    }

    const apiParams: any = {
        page: params?.page || 0,
        size: params?.size || 10,
    };

    if (params?.search) {
        // RSQL filter
        apiParams.filter = `name==*${params.search}*`;
    }

    if (params?.sort) {
        apiParams.sort = params.sort;
    }

    const res = await api.get<{ data: CategoryListResponse }>("/medicines/categories", { params: apiParams }); // Controller uses GET / (listCategories) which is RSQL enabled
    // The previous GenericController implementation returned ApiResponse<PageResponse<CategoryResponse>>.
    // The Typescript generic <{ data: CategoryListResponse }> implies res.data IS { data: CategoryListResponse } ? 
    // No, "api.get<T>" means res.data is T.
    // If backend returns ApiResponse, then T should be ApiResponse.
    // If backend returns ApiResponse<PageResponse<CategoryResponse>>, then
    // res.data.code = 1000
    // res.data.data = PageResponse...
    // So we must return res.data.data
    // BUT, line 65 was: return res.data; 
    // And interface CategoryListResponse matches PageResponse structure (content, page, size...).
    // So res.data.data IS the CategoryListResponse.
    return (res.data as any).data; 
  },

  getById: async (id: string) => {
    if (USE_MOCK) {
        await delay(300);
        const category = categoriesDB.find((c) => c.id === id);
        if (!category) throw new Error("Category not found");
        return { data: category };
    }
    const res = await api.get(`/medicines/categories/${id}`);
    return (res.data as any).data;
  },

  create: async (data: CategoryRequest) => {
    if (USE_MOCK) {
        await delay(500);
        const newCategory: Category = {
        id: `cat-${Math.random().toString(36).substring(2, 9)}`,
        name: data.name,
        description: data.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        };
        categoriesDB.push(newCategory);
        return { data: newCategory };
    }
    const res = await api.post("/medicines/categories", data);
    return (res.data as any).data;
  },

  update: async (id: string, data: Partial<CategoryRequest>) => {
    if (USE_MOCK) {
        await delay(500);
        const index = categoriesDB.findIndex((c) => c.id === id);
        if (index === -1) throw new Error("Category not found");
        
        categoriesDB[index] = { ...categoriesDB[index], ...data, updatedAt: new Date().toISOString() };
        return { data: categoriesDB[index] };
    }
    const res = await api.put(`/medicines/categories/${id}`, data);
    return (res.data as any).data;
  },

  delete: async (id: string) => {
    if (USE_MOCK) {
        await delay(500);
        const index = categoriesDB.findIndex((c) => c.id === id);
        if (index === -1) {
        console.warn(`Category with id ${id} not found for deletion.`);
        return;
        }
        categoriesDB.splice(index, 1);
        return; 
    }
    await api.delete(`/medicines/categories/${id}`);
  },
};