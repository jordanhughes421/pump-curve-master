import { GET, PUT, DELETE } from '../route'; // Adjust path
import { prismaMock } from '../../../../../__mocks__/prismaClient'; // Adjust path
import { NextResponse } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({ body, init, status: init?.status || 200 })),
  },
}));

describe('/api/boms/[bomId]', () => {
  const bomId = '1';
  const bomIdInt = parseInt(bomId, 10);
  const mockBOM = { 
    id: bomIdInt, 
    name: 'Test BOM', 
    pumpModelId: 1, 
    items: [{id: 1, partNumber: "PN123", bomId: bomIdInt}], 
    customFields: [{id:1, name: "CF1", value: "Val1", bomId: bomIdInt}] 
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return BOM details if found', async () => {
      prismaMock.bOM.findUnique.mockResolvedValue(mockBOM);
      const request = new Request(`http://localhost/api/boms/${bomId}`);
      const response = await GET(request, { params: { bomId } });

      expect(prismaMock.bOM.findUnique).toHaveBeenCalledWith({
        where: { id: bomIdInt },
        include: { items: true, customFields: true },
      });
      expect(NextResponse.json).toHaveBeenCalledWith(mockBOM);
      // @ts-ignore
      expect(response.status).toBe(200);
    });

    it('should return 404 if BOM not found', async () => {
      prismaMock.bOM.findUnique.mockResolvedValue(null);
      const request = new Request(`http://localhost/api/boms/${bomId}`);
      await GET(request, { params: { bomId } });
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'BOM not found' }, { status: 404 });
    });

    it('should return 400 for invalid bomId', async () => {
      const request = new Request('http://localhost/api/boms/invalid');
      await GET(request, { params: { bomId: 'invalid' } });
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid BOM ID' }, { status: 400 });
    });
  });

  describe('PUT', () => {
    const updatedName = 'Updated BOM Name';
    it('should update BOM name and return updated BOM', async () => {
      const updatedBOM = { ...mockBOM, name: updatedName };
      prismaMock.bOM.findUnique.mockResolvedValue(mockBOM); // For existence check
      prismaMock.bOM.update.mockResolvedValue(updatedBOM);
      
      const request = new Request(`http://localhost/api/boms/${bomId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: updatedName }),
      });
      const response = await PUT(request, { params: { bomId } });

      expect(prismaMock.bOM.update).toHaveBeenCalledWith({
        where: { id: bomIdInt },
        data: { name: updatedName },
      });
      expect(NextResponse.json).toHaveBeenCalledWith(updatedBOM);
      // @ts-ignore
      expect(response.status).toBe(200);
    });

    it('should return 400 if name is missing', async () => {
      const request = new Request(`http://localhost/api/boms/${bomId}`, {
        method: 'PUT',
        body: JSON.stringify({}),
      });
      await PUT(request, { params: { bomId } });
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'BOM name is required for update' }, { status: 400 });
    });

    it('should return 404 if BOM to update not found', async () => {
      prismaMock.bOM.findUnique.mockResolvedValue(null);
      const request = new Request(`http://localhost/api/boms/${bomId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: updatedName }),
      });
      await PUT(request, { params: { bomId } });
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'BOM not found' }, { status: 404 });
    });
  });

  describe('DELETE', () => {
    it('should delete BOM and associated data, then return 200', async () => {
      prismaMock.bOM.findUnique.mockResolvedValue(mockBOM); // BOM exists
      prismaMock.bOMItem.findMany.mockResolvedValue([{id: 101, bomId: bomIdInt}]); // Simulate finding items to delete their custom fields

      const request = new Request(`http://localhost/api/boms/${bomId}`, { method: 'DELETE' });
      const response = await DELETE(request, { params: { bomId } });

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(prismaMock.bOMHeaderCustomField.deleteMany).toHaveBeenCalledWith({ where: { bomId: bomIdInt } });
      expect(prismaMock.bOMItem.findMany).toHaveBeenCalledWith({ where: { bomId: bomIdInt }, select: { id: true } });
      expect(prismaMock.bOMCustomField.deleteMany).toHaveBeenCalledWith({ where: { bomItemId: { in: [101] } } });
      expect(prismaMock.bOMItem.deleteMany).toHaveBeenCalledWith({ where: { bomId: bomIdInt } });
      expect(prismaMock.bOM.delete).toHaveBeenCalledWith({ where: { id: bomIdInt } });
      expect(NextResponse.json).toHaveBeenCalledWith({ message: 'BOM deleted successfully' }, { status: 200 });
    });
    
    it('should handle deletion when BOM has no items', async () => {
      const bomWithoutItems = { ...mockBOM, items: [] };
      prismaMock.bOM.findUnique.mockResolvedValue(bomWithoutItems);
      prismaMock.bOMItem.findMany.mockResolvedValue([]); // No items

      const request = new Request(`http://localhost/api/boms/${bomId}`, { method: 'DELETE' });
      await DELETE(request, { params: { bomId } });

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(prismaMock.bOMHeaderCustomField.deleteMany).toHaveBeenCalledWith({ where: { bomId: bomIdInt } });
      expect(prismaMock.bOMItem.findMany).toHaveBeenCalledWith({ where: { bomId: bomIdInt }, select: { id: true } });
      // bOMCustomField.deleteMany should not be called if no itemIds
      expect(prismaMock.bOMCustomField.deleteMany).not.toHaveBeenCalled(); 
      expect(prismaMock.bOMItem.deleteMany).not.toHaveBeenCalled(); // Or called with empty where if that's the behavior
      expect(prismaMock.bOM.delete).toHaveBeenCalledWith({ where: { id: bomIdInt } });
      expect(NextResponse.json).toHaveBeenCalledWith({ message: 'BOM deleted successfully' }, { status: 200 });
    });


    it('should return 404 if BOM to delete not found', async () => {
      prismaMock.bOM.findUnique.mockResolvedValue(null);
      const request = new Request(`http://localhost/api/boms/${bomId}`, { method: 'DELETE' });
      await DELETE(request, { params: { bomId } });
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'BOM not found' }, { status: 404 });
    });
  });
});
