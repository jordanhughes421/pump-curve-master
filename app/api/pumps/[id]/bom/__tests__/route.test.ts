import { GET, POST } from '../route'; // Adjust path as needed
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
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


describe('API Route: /api/pumps/[id]/bom', () => {
  const pumpId = 1;
  const mockPump = { id: pumpId, name: 'Test Pump' };

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
    (NextResponse.json as jest.Mock).mockClear();
  });

  describe('GET', () => {
    it('should fetch and return nested BOM items with custom fields', async () => {
      const mockBOMItems = [
        { id: 1, pumpModelId: pumpId, parentId: null, partNumber: 'Top1', description: 'Top Level 1', quantity: 1, unit: 'pc', customFields: [{ id: 10, name: 'CF1', value: 'Val1' }], children: [] },
        { id: 2, pumpModelId: pumpId, parentId: null, partNumber: 'Top2', description: 'Top Level 2', quantity: 2, unit: 'pc', customFields: [], children: [] },
      ];
      const childOfTop1 = { id: 3, pumpModelId: pumpId, parentId: 1, partNumber: 'Child1', description: 'Child of Top1', quantity: 3, unit: 'pc', customFields: [], children: [] };

      prismaMock.pumpModel.findUnique.mockResolvedValue(mockPump as any);
      // Top-level items
      prismaMock.bOMItem.findMany
        .mockResolvedValueOnce(mockBOMItems as any) // First call for top-level items
        .mockResolvedValueOnce([childOfTop1] as any)    // Children of Top1
        .mockResolvedValueOnce([]);                   // Children of Top2
      // Children of Child1 (for full recursion test)
      prismaMock.bOMItem.findMany.mockResolvedValueOnce([]);


      const request = new Request(`http://localhost/api/pumps/${pumpId}/bom`);
      const response = await GET(request, { params: { id: String(pumpId) } });

      expect(prismaMock.pumpModel.findUnique).toHaveBeenCalledWith({ where: { id: pumpId } });
      expect(prismaMock.bOMItem.findMany).toHaveBeenCalledWith({
        where: { pumpModelId: pumpId, parentId: null },
        include: { customFields: true },
      });
      // Check recursive calls for children
      expect(prismaMock.bOMItem.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { parentId: mockBOMItems[0].id } }));
      expect(prismaMock.bOMItem.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { parentId: mockBOMItems[1].id } }));
      expect(prismaMock.bOMItem.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { parentId: childOfTop1.id } }));


      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].partNumber).toBe('Top1');
      expect(response.body[0].customFields[0].name).toBe('CF1');
      expect(response.body[0].children[0].partNumber).toBe('Child1');
      expect(response.body[1].children).toEqual([]);
    });

    it('should return an empty array if pump has no BOM items', async () => {
      prismaMock.pumpModel.findUnique.mockResolvedValue(mockPump as any);
      prismaMock.bOMItem.findMany.mockResolvedValue([]); // No BOM items

      const request = new Request(`http://localhost/api/pumps/${pumpId}/bom`);
      const response = await GET(request, { params: { id: String(pumpId) } });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 404 if pump not found', async () => {
      prismaMock.pumpModel.findUnique.mockResolvedValue(null);

      const request = new Request(`http://localhost/api/pumps/${pumpId}/bom`);
      const response = await GET(request, { params: { id: String(pumpId) } });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Pump not found' });
    });
    
    it('should return 400 if pump ID is invalid', async () => {
      const request = new Request(`http://localhost/api/pumps/invalid/bom`);
      const response = await GET(request, { params: { id: 'invalid' } });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid pump ID' });
    });
  });

  describe('POST', () => {
    const newItemData = { partNumber: 'NewPart', description: 'New Desc', quantity: 10, unit: 'pcs', supplier: 'SupplierX' };

    it('should create and return a top-level BOM item', async () => {
      prismaMock.pumpModel.findUnique.mockResolvedValue(mockPump as any);
      const createdBOMItem = { id: 100, pumpModelId: pumpId, parentId: null, ...newItemData, customFields: [] };
      prismaMock.bOMItem.create.mockResolvedValue(createdBOMItem as any);

      const request = new Request(`http://localhost/api/pumps/${pumpId}/bom`, {
        method: 'POST',
        body: JSON.stringify(newItemData),
      });
      const response = await POST(request, { params: { id: String(pumpId) } });

      expect(prismaMock.pumpModel.findUnique).toHaveBeenCalledWith({ where: { id: pumpId } });
      expect(prismaMock.bOMItem.create).toHaveBeenCalledWith({
        data: { ...newItemData, pumpModelId: pumpId, parentId: null, quantity: 10 },
        include: { customFields: true },
      });
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdBOMItem);
    });

    it('should create and return a child BOM item if parentId is provided', async () => {
      const parentId = 1;
      const newItemWithParent = { ...newItemData, parentId };
      prismaMock.pumpModel.findUnique.mockResolvedValue(mockPump as any);
      prismaMock.bOMItem.findUnique.mockResolvedValue({ id: parentId, pumpModelId: pumpId } as any); // Parent exists
      const createdChildBOMItem = { id: 101, pumpModelId: pumpId, parentId, ...newItemData, customFields: [] };
      prismaMock.bOMItem.create.mockResolvedValue(createdChildBOMItem as any);

      const request = new Request(`http://localhost/api/pumps/${pumpId}/bom`, {
        method: 'POST',
        body: JSON.stringify(newItemWithParent),
      });
      const response = await POST(request, { params: { id: String(pumpId) } });
      
      expect(prismaMock.bOMItem.findUnique).toHaveBeenCalledWith({ where: { id: parentId } });
      expect(prismaMock.bOMItem.create).toHaveBeenCalledWith({
        data: { ...newItemData, pumpModelId: pumpId, parentId: parentId, quantity: 10 },
        include: { customFields: true },
      });
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdChildBOMItem);
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = { partNumber: 'Test' }; // Missing description, quantity, unit
       prismaMock.pumpModel.findUnique.mockResolvedValue(mockPump as any);

      const request = new Request(`http://localhost/api/pumps/${pumpId}/bom`, {
        method: 'POST',
        body: JSON.stringify(incompleteData),
      });
      const response = await POST(request, { params: { id: String(pumpId) } });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing required BOM item fields' });
    });
    
    it('should return 404 if pump not found for POST', async () => {
        prismaMock.pumpModel.findUnique.mockResolvedValue(null);
        const request = new Request(`http://localhost/api/pumps/${pumpId}/bom`, {
            method: 'POST',
            body: JSON.stringify(newItemData),
        });
        const response = await POST(request, { params: { id: String(pumpId) } });
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Pump not found' });
    });

    it('should return 400 if parent BOM item not found when parentId is provided', async () => {
        const parentId = 999; // Non-existent parent
        const newItemWithInvalidParent = { ...newItemData, parentId };
        prismaMock.pumpModel.findUnique.mockResolvedValue(mockPump as any);
        prismaMock.bOMItem.findUnique.mockResolvedValue(null); // Parent does not exist

        const request = new Request(`http://localhost/api/pumps/${pumpId}/bom`, {
            method: 'POST',
            body: JSON.stringify(newItemWithInvalidParent),
        });
        const response = await POST(request, { params: { id: String(pumpId) } });

        expect(prismaMock.bOMItem.findUnique).toHaveBeenCalledWith({ where: { id: parentId } });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Parent BOM item not found' });
    });
  });
});
