// Corresponds to Prisma's BOMHeaderCustomField model
export interface BOMHeaderCustomField {
  id: number;
  name: string;
  value: string;
  bomId: number;
  createdAt: string; // Assuming ISO date string
  updatedAt: string; // Assuming ISO date string
}

// Corresponds to Prisma's BOMCustomField model (for BOM Items)
export interface BOMItemCustomField {
  id: number;
  name: string;
  value: string;
  bomItemId?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Corresponds to Prisma's BOMItem model
export interface BOMItem {
  id: number;
  bomId: number;
  partNumber: string;
  description: string;
  quantity: number;
  unit: string;
  supplier: string | null;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  customFields: BOMItemCustomField[]; // For item-specific custom fields
  children?: BOMItem[]; // For nested display
  parent?: BOMItem;
}

// Corresponds to Prisma's BOM model
export interface BOM {
  id: number;
  name: string;
  pumpModelId: number;
  createdAt: string;
  updatedAt: string;
  items: BOMItem[];
  customFields: BOMHeaderCustomField[]; // For BOM-level custom fields
}

// For PumpModel, simplified for this context
export interface PumpModel {
  id: number;
  name: string;
  // other fields as needed by UI
}

// Props for BOMListManager
export interface BOMListManagerProps {
  pumpId: string;
  onSelectBOM: (bomId: string | null) => void;
  selectedBomId: string | null;
  onBomCreated: (newBom: BOM) => void; // Callback when a new BOM is created
}

// Props for BOMHeaderDisplay
export interface BOMHeaderDisplayProps {
  bom: BOM | null; // Pass the full BOM object
  // bomId: string | null; // Alternative: pass bomId and fetch internally
}

// Props for NestedBOMView
export interface NestedBOMViewProps {
  bomId: string | null; // The ID of the BOM to display
                        // Items will be fetched based on this ID via /api/boms/[bomId]
}

// API Response Types (examples)
export interface GetBOMsResponse extends Array<Pick<BOM, 'id' | 'name' | 'pumpModelId' | 'createdAt' | 'updatedAt'>> {} // List of BOMs might be partial
export interface GetBOMByIdResponse extends BOM {}
export interface CreateBOMPayload {
  name: string;
}
export interface CreateBOMResponse extends BOM {}

// Generic type for API error responses
export interface ApiError {
  error: string;
}

// In lib/types.ts (add or merge)
export interface StandardPart {
  id: number;
  partNumber: string;
  description: string;
  defaultUnit: string;
  defaultSupplier?: string | null;
  parentId?: number | null;
  children?: StandardPart[]; // For hierarchical data
  createdAt: string; // Assuming ISO string from API
  updatedAt: string; // Assuming ISO string from API
  // Add any other fields that might come from the API, like bomItems count if added
}
