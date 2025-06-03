import { PUT, DELETE, GET } from '../route'; // Adjust path
import { prismaMock } from '../../../../../__mocks__/prismaClient'; // Adjust path
import { NextResponse } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({ body, init, status: init?.status || 200 })),
  },
}));

describe('/api/bom-items/[id]', () => {
  const itemId = '1';
  const itemIdInt = parseInt(itemId, 10);
  const mockBOMItem = { 
    id: itemIdInt, 
    partNumber: 'PN001', 
    description: 'Test Item', 
    quantity: 10, 
    unit: 'pcs',
    bomId: 1,
    customFields: [],
    children: [], // Added to match type
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return BOMItem details if found', async () => {
      prismaMock.bOMItem.findUnique.mockResolvedValue(mockBOMItem);
      const request = new Request(`http://localhost/api/bom-items/${itemId}`);
      await GET(request, { params: { id: itemId } });

      expect(prismaMock.bOMItem.findUnique).toHaveBeenCalledWith({
        where: { id: itemIdInt },
        include: { customFields: true },
      });
      expect(NextResponse.json).toHaveBeenCalledWith(mockBOMItem);
    });

    it('should return 404 if BOMItem not found', async () => {
      prismaMock.bOMItem.findUnique.mockResolvedValue(null);
      const request = new Request(`http://localhost/api/bom-items/${itemId}`);
      await GET(request, { params: { id: itemId } });
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'BOMItem not found' }, { status: 404 });
    });
  });

  describe('PUT', () => {
    const updateData = { partNumber: 'PN002', quantity: 20 };
    it('should update BOMItem and return updated data', async () => {
      const updatedBOMItem = { ...mockBOMItem, ...updateData };
      // For PUT, Prisma's update operation itself will throw if not found,
      // unless we add a specific findUnique check before updating. The current route code does not.
      prismaMock.bOMItem.update.mockResolvedValue(updatedBOMItem);
      
      const request = new Request(`http://localhost/api/bom-items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const response = await PUT(request, { params: { id: itemId } });

      expect(prismaMock.bOMItem.update).toHaveBeenCalledWith({
        where: { id: itemIdInt },
        data: updateData,
      });
      expect(NextResponse.json).toHaveBeenCalledWith(updatedBOMItem);
    });

    it('should return 400 if no data provided for update', async () => {
        const request = new Request(`http://localhost/api/bom-items/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({}),
        });
        await PUT(request, { params: { id: itemId } });
        expect(NextResponse.json).toHaveBeenCalledWith({ error: 'No data provided for update' }, { status: 400 });
    });
    
    it('should return 400 for invalid itemId', async () => {
      const request = new Request('http://localhost/api/bom-items/invalid', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      await PUT(request, { params: { id: 'invalid' } });
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid BOMItem ID' }, { status: 400 });
    });

     it('should handle Prisma P2025 error (record not found) on update', async () => {
      prismaMock.bOMItem.update.mockRejectedValue({ code: 'P2025' });
      const request = new Request(`http://localhost/api/bom-items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      await PUT(request, { params: { id: itemId } });
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'BOMItem not found' }, { status: 404 });
    });
  });

  describe('DELETE', () => {
    it('should delete BOMItem and its custom fields, then return 200', async () => {
      // Mock findUnique to simulate the item exists and has children that need parentId nullified
      prismaMock.bOMItem.findUnique.mockResolvedValue({ ...mockBOMItem, children: [{id: 2, partNumber: "child"}] });
      prismaMock.bOMItem.updateMany.mockResolvedValue({ count: 1 }); // For nullifying parentId of children
      prismaMock.bOMCustomField.deleteMany.mockResolvedValue({ count: 0 }); // For item's custom fields
      prismaMock.bOMItem.delete.mockResolvedValue(mockBOMItem); // For deleting the item itself

      const request = new Request(`http://localhost/api/bom-items/${itemId}`, { method: 'DELETE' });
      const response = await DELETE(request, { params: { id: itemId } });
      
      expect(prismaMock.bOMItem.findUnique).toHaveBeenCalledWith({ where: { id: itemIdInt }, include: { children: true } });
      expect(prismaMock.bOMItem.updateMany).toHaveBeenCalledWith({ where: { parentId: itemIdInt }, data: { parentId: null } });
      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(prismaMock.bOMCustomField.deleteMany).toHaveBeenCalledWith({ where: { bomItemId: itemIdInt } });
      expect(prismaMock.bOMItem.delete).toHaveBeenCalledWith({ where: { id: itemIdInt } });
      expect(NextResponse.json).toHaveBeenCalledWith({ message: 'BOMItem deleted successfully' }, { status: 200 });
    });

    it('should return 404 if BOMItem to delete not found', async () => {
      prismaMock.bOMItem.findUnique.mockResolvedValue(null); // Item does not exist
      const request = new Request(`http://localhost/api/bom-items/${itemId}`, { method: 'DELETE' });
      await DELETE(request, { params: { id: itemId } });
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'BOMItem not found' }, { status: 404 });
    });

    it('should return 400 for invalid itemId', async () => {
      const request = new Request('http://localhost/api/bom-items/invalid', { method: 'DELETE' });
      await DELETE(request, { params: { id: 'invalid' } });
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid BOMItem ID' }, { status: 400 });
    });
  });
});
