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

describe('API Route: /api/bom-custom-fields/[fieldId]', () => {
  const fieldId = 1;
  const existingField = { id: fieldId, name: 'Color', value: 'Red', bomItemId: 100 };

  beforeEach(() => {
    jest.clearAllMocks();
    (NextResponse.json as jest.Mock).mockClear();
  });

  describe('PUT', () => {
    const updateData = { name: 'Material', value: 'Steel' };

    it('should update and return the BOMCustomField', async () => {
      const updatedDbField = { ...existingField, ...updateData };
      prismaMock.bOMCustomField.update.mockResolvedValue(updatedDbField as any);

      const request = new Request(`http://localhost/api/bom-custom-fields/${fieldId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const response = await PUT(request, { params: { fieldId: String(fieldId) } });

      expect(prismaMock.bOMCustomField.update).toHaveBeenCalledWith({
        where: { id: fieldId },
        data: updateData,
      });
      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedDbField);
    });
    
    it('should allow partial update (only name)', async () => {
        const partialUpdateData = { name: 'New Name' };
        const updatedDbField = { ...existingField, ...partialUpdateData };
        prismaMock.bOMCustomField.update.mockResolvedValue(updatedDbField as any);
  
        const request = new Request(`http://localhost/api/bom-custom-fields/${fieldId}`, {
          method: 'PUT',
          body: JSON.stringify(partialUpdateData),
        });
        const response = await PUT(request, { params: { fieldId: String(fieldId) } });
  
        expect(prismaMock.bOMCustomField.update).toHaveBeenCalledWith({
          where: { id: fieldId },
          data: partialUpdateData,
        });
        expect(response.status).toBe(200);
        expect(response.body).toEqual(updatedDbField);
      });

      it('should allow partial update (only value)', async () => {
        const partialUpdateData = { value: 'New Value' };
        const updatedDbField = { ...existingField, ...partialUpdateData };
        prismaMock.bOMCustomField.update.mockResolvedValue(updatedDbField as any);
  
        const request = new Request(`http://localhost/api/bom-custom-fields/${fieldId}`, {
          method: 'PUT',
          body: JSON.stringify(partialUpdateData),
        });
        const response = await PUT(request, { params: { fieldId: String(fieldId) } });
  
        expect(prismaMock.bOMCustomField.update).toHaveBeenCalledWith({
          where: { id: fieldId },
          data: partialUpdateData,
        });
        expect(response.status).toBe(200);
        expect(response.body).toEqual(updatedDbField);
      });

    it('should return 404 if BOMCustomField not found for update', async () => {
      prismaMock.bOMCustomField.update.mockRejectedValue({ code: 'P2025' } as any); // Simulate Prisma record not found

      const request = new Request(`http://localhost/api/bom-custom-fields/${fieldId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const response = await PUT(request, { params: { fieldId: String(fieldId) } });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Custom field not found' });
    });

    it('should return 400 if no update data (name or value) is provided', async () => {
      const request = new Request(`http://localhost/api/bom-custom-fields/${fieldId}`, {
        method: 'PUT',
        body: JSON.stringify({}), // Empty data
      });
      const response = await PUT(request, { params: { fieldId: String(fieldId) } });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'No update data provided (name or value required)' });
    });
    
    it('should return 400 if name is an empty string', async () => {
        const request = new Request(`http://localhost/api/bom-custom-fields/${fieldId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: '' }), 
        });
        const response = await PUT(request, { params: { fieldId: String(fieldId) } });
  
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Custom field name cannot be empty' });
      });

    it('should return 400 if fieldId is invalid', async () => {
      const request = new Request(`http://localhost/api/bom-custom-fields/invalid`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const response = await PUT(request, { params: { fieldId: 'invalid' } });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid custom field ID' });
    });
  });

  describe('DELETE', () => {
    it('should delete the BOMCustomField', async () => {
      prismaMock.bOMCustomField.findUnique.mockResolvedValue(existingField as any); // Item exists
      prismaMock.bOMCustomField.delete.mockResolvedValue(existingField as any);

      const request = new Request(`http://localhost/api/bom-custom-fields/${fieldId}`, { method: 'DELETE' });
      const response = await DELETE(request, { params: { fieldId: String(fieldId) } });

      expect(prismaMock.bOMCustomField.findUnique).toHaveBeenCalledWith({ where: { id: fieldId } });
      expect(prismaMock.bOMCustomField.delete).toHaveBeenCalledWith({ where: { id: fieldId } });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Custom field deleted successfully' });
    });

    it('should return 404 if BOMCustomField not found for deletion', async () => {
      prismaMock.bOMCustomField.findUnique.mockResolvedValue(null); // Item does not exist

      const request = new Request(`http://localhost/api/bom-custom-fields/${fieldId}`, { method: 'DELETE' });
      const response = await DELETE(request, { params: { fieldId: String(fieldId) } });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Custom field not found' });
      expect(prismaMock.bOMCustomField.delete).not.toHaveBeenCalled();
    });

    it('should return 400 if fieldId is invalid for deletion', async () => {
      const request = new Request(`http://localhost/api/bom-custom-fields/invalid`, { method: 'DELETE' });
      const response = await DELETE(request, { params: { fieldId: 'invalid' } });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid custom field ID' });
    });
  });
});
