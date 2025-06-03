import { POST } from '../route'; // Adjust path as needed
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

describe('API Route: /api/bom-items/[bomItemId]/fields', () => {
  const bomItemId = 1;
  const mockBOMItem = { id: bomItemId, partNumber: 'PN123' };

  beforeEach(() => {
    jest.clearAllMocks();
    (NextResponse.json as jest.Mock).mockClear();
  });

  describe('POST', () => {
    const customFieldData = { name: 'Color', value: 'Red' };

    it('should create and return a BOMCustomField', async () => {
      prismaMock.bOMItem.findUnique.mockResolvedValue(mockBOMItem as any);
      const createdField = { id: 10, bomItemId, ...customFieldData };
      prismaMock.bOMCustomField.create.mockResolvedValue(createdField as any);

      const request = new Request(`http://localhost/api/bom-items/${bomItemId}/fields`, {
        method: 'POST',
        body: JSON.stringify(customFieldData),
      });
      const response = await POST(request, { params: { bomItemId: String(bomItemId) } });

      expect(prismaMock.bOMItem.findUnique).toHaveBeenCalledWith({ where: { id: bomItemId } });
      expect(prismaMock.bOMCustomField.create).toHaveBeenCalledWith({
        data: {
          name: customFieldData.name,
          value: customFieldData.value,
          bomItemId: bomItemId,
        },
      });
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdField);
    });

    it('should return 404 if BOMItem not found', async () => {
      prismaMock.bOMItem.findUnique.mockResolvedValue(null);

      const request = new Request(`http://localhost/api/bom-items/${bomItemId}/fields`, {
        method: 'POST',
        body: JSON.stringify(customFieldData),
      });
      const response = await POST(request, { params: { bomItemId: String(bomItemId) } });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'BOM item not found' });
    });

    it('should return 400 for missing required fields (name)', async () => {
      const incompleteData = { value: 'SomeValue' }; // Missing name
      prismaMock.bOMItem.findUnique.mockResolvedValue(mockBOMItem as any);


      const request = new Request(`http://localhost/api/bom-items/${bomItemId}/fields`, {
        method: 'POST',
        body: JSON.stringify(incompleteData),
      });
      const response = await POST(request, { params: { bomItemId: String(bomItemId) } });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing required custom field data: name and value' });
    });
    
    it('should return 400 for missing required fields (value)', async () => {
        const incompleteData = { name: 'SomeName' }; // Missing value
        prismaMock.bOMItem.findUnique.mockResolvedValue(mockBOMItem as any);
  
        const request = new Request(`http://localhost/api/bom-items/${bomItemId}/fields`, {
          method: 'POST',
          body: JSON.stringify(incompleteData),
        });
        const response = await POST(request, { params: { bomItemId: String(bomItemId) } });
  
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Missing required custom field data: name and value' });
      });

    it('should return 400 if bomItemId is invalid', async () => {
      const request = new Request(`http://localhost/api/bom-items/invalid/fields`, {
        method: 'POST',
        body: JSON.stringify(customFieldData),
      });
      const response = await POST(request, { params: { bomItemId: 'invalid' } });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid BOM item ID' });
    });
  });
});
