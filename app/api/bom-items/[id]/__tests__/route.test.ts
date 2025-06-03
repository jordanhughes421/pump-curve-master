import { PUT, DELETE } from '../route'; // Adjust path as needed
import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { NextResponse } from 'next/server';

// Mock Prisma Client
const prismaMock = mockDeep<PrismaClient>();
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: prismaMock,
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, { status }) => ({ body, status })),
  },
}));

describe('API Route: /api/bom-items/[id]', () => {
  const bomItemId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    (NextResponse.json as jest.Mock).mockClear();
  });

  describe('PUT', () => {
    const updateData = { partNumber: 'UpdatedPN', description: 'Updated Desc', quantity: 20, unit: 'm', supplier: 'NewSup' };
    const existingBOMItem = { id: bomItemId, partNumber: 'OldPN', description: 'Old Desc', quantity: 10, unit: 'pcs', supplier: 'OldSup', customFields: [] };

    it('should update and return the BOM item', async () => {
      const updatedDbItem = { ...existingBOMItem, ...updateData };
      prismaMock.bOMItem.update.mockResolvedValue(updatedDbItem as any);

      const request = new Request(`http://localhost/api/bom-items/${bomItemId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const response = await PUT(request, { params: { id: String(bomItemId) } });

      expect(prismaMock.bOMItem.update).toHaveBeenCalledWith({
        where: { id: bomItemId },
        data: updateData,
        include: { customFields: true },
      });
      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedDbItem);
    });

    it('should return 404 if BOM item not found for update', async () => {
      prismaMock.bOMItem.update.mockRejectedValue({ code: 'P2025' } as any); // Simulate Prisma record not found

      const request = new Request(`http://localhost/api/bom-items/${bomItemId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const response = await PUT(request, { params: { id: String(bomItemId) } });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'BOM item not found' });
    });

    it('should return 400 if no update data is provided', async () => {
      const request = new Request(`http://localhost/api/bom-items/${bomItemId}`, {
        method: 'PUT',
        body: JSON.stringify({}), // Empty data
      });
      const response = await PUT(request, { params: { id: String(bomItemId) } });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'No update data provided' });
    });
    
    it('should return 400 if BOM item ID is invalid', async () => {
        const request = new Request(`http://localhost/api/bom-items/invalid`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
        const response = await PUT(request, { params: { id: 'invalid' } });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid BOM item ID' });
    });
  });

  describe('DELETE', () => {
    it('should recursively delete the BOM item, its children, and associated custom fields', async () => {
      // Mock initial findUnique to confirm item exists
      prismaMock.bOMItem.findUnique.mockResolvedValue({ id: bomItemId, partNumber: 'TestItem' } as any);
      
      // Mock children finding
      // Level 1 children
      prismaMock.bOMItem.findMany
        .mockResolvedValueOnce([{ id: 2 }, { id: 3 }] as any) // Children of bomItemId (1)
        // Level 2 children (children of item 2)
        .mockResolvedValueOnce([{ id: 4 }] as any)            // Children of item 2
        .mockResolvedValueOnce([])                            // Children of item 4 (none)
        // Level 2 children (children of item 3)
        .mockResolvedValueOnce([])                            // Children of item 3 (none)
      
      // Mock custom field deletions (expected for each item: 4, 2, 3, 1)
      prismaMock.bOMCustomField.deleteMany.mockResolvedValue({ count: 1 } as any); // For item 4
      prismaMock.bOMCustomField.deleteMany.mockResolvedValue({ count: 1 } as any); // For item 2
      prismaMock.bOMCustomField.deleteMany.mockResolvedValue({ count: 0 } as any); // For item 3
      prismaMock.bOMCustomField.deleteMany.mockResolvedValue({ count: 2 } as any); // For item 1
      
      // Mock BOM item deletions (expected for each item: 4, 2, 3, 1)
      prismaMock.bOMItem.delete.mockResolvedValue({ id: 4 } as any);
      prismaMock.bOMItem.delete.mockResolvedValue({ id: 2 } as any);
      prismaMock.bOMItem.delete.mockResolvedValue({ id: 3 } as any);
      prismaMock.bOMItem.delete.mockResolvedValue({ id: bomItemId } as any);


      const request = new Request(`http://localhost/api/bom-items/${bomItemId}`, { method: 'DELETE' });
      const response = await DELETE(request, { params: { id: String(bomItemId) } });

      expect(prismaMock.bOMItem.findUnique).toHaveBeenCalledWith({ where: { id: bomItemId } });
      
      // Verify recursive calls
      // Children of 1: [2, 3]
      // Children of 2: [4]
      // Children of 4: []
      // Children of 3: []
      
      // Deletions should happen in order: 4 (child of 2), then 2, then 3, then 1 (root)
      // Custom fields for 4
      expect(prismaMock.bOMCustomField.deleteMany).toHaveBeenCalledWith({ where: { bomItemId: 4 } });
      expect(prismaMock.bOMItem.delete).toHaveBeenCalledWith({ where: { id: 4 } });
      // Custom fields for 2
      expect(prismaMock.bOMCustomField.deleteMany).toHaveBeenCalledWith({ where: { bomItemId: 2 } });
      expect(prismaMock.bOMItem.delete).toHaveBeenCalledWith({ where: { id: 2 } });
      // Custom fields for 3
      expect(prismaMock.bOMCustomField.deleteMany).toHaveBeenCalledWith({ where: { bomItemId: 3 } });
      expect(prismaMock.bOMItem.delete).toHaveBeenCalledWith({ where: { id: 3 } });
      // Custom fields for 1 (original item)
      expect(prismaMock.bOMCustomField.deleteMany).toHaveBeenCalledWith({ where: { bomItemId: bomItemId } });
      expect(prismaMock.bOMItem.delete).toHaveBeenCalledWith({ where: { id: bomItemId } });
      
      expect(prismaMock.bOMCustomField.deleteMany).toHaveBeenCalledTimes(4);
      expect(prismaMock.bOMItem.delete).toHaveBeenCalledTimes(4);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'BOM item and its children deleted successfully' });
    });

    it('should return 404 if BOM item not found for deletion', async () => {
      prismaMock.bOMItem.findUnique.mockResolvedValue(null); // Item does not exist

      const request = new Request(`http://localhost/api/bom-items/${bomItemId}`, { method: 'DELETE' });
      const response = await DELETE(request, { params: { id: String(bomItemId) } });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'BOM item not found' });
      expect(prismaMock.bOMItem.delete).not.toHaveBeenCalled();
    });
    
    it('should return 400 if BOM item ID is invalid for deletion', async () => {
        const request = new Request(`http://localhost/api/bom-items/invalid`, { method: 'DELETE' });
        const response = await DELETE(request, { params: { id: 'invalid' } });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid BOM item ID' });
    });
  });
});
