import { POST } from '../route'; // Adjust path
import { prismaMock } from '../../../../../../__mocks__/prismaClient'; // Adjust path
import { NextResponse } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({ body, init, status: init?.status || 200 })),
  },
}));

describe('/api/boms/[bomId]/custom-fields', () => {
  const bomId = '1';
  const bomIdInt = parseInt(bomId, 10);
  const mockBOM = { id: bomIdInt, name: 'Test BOM' };
  const mockCustomField = { id: 1, name: 'CF Name', value: 'CF Value', bomId: bomIdInt };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should create a new BOMHeaderCustomField and return 201', async () => {
      const requestBody = { name: 'CF Name', value: 'CF Value' };
      prismaMock.bOM.findUnique.mockResolvedValue(mockBOM); // BOM exists
      prismaMock.bOMHeaderCustomField.create.mockResolvedValue(mockCustomField);

      const request = new Request(`http://localhost/api/boms/${bomId}/custom-fields`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      const response = await POST(request, { params: { bomId } });

      expect(prismaMock.bOM.findUnique).toHaveBeenCalledWith({ where: { id: bomIdInt } });
      expect(prismaMock.bOMHeaderCustomField.create).toHaveBeenCalledWith({
        data: { ...requestBody, bomId: bomIdInt },
      });
      expect(NextResponse.json).toHaveBeenCalledWith(mockCustomField, { status: 201 });
    });

    it('should return 400 if name or value is missing', async () => {
      const request = new Request(`http://localhost/api/boms/${bomId}/custom-fields`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Only Name' }), // Missing value
      });
      await POST(request, { params: { bomId } });
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Custom field name and value are required' }, { status: 400 });
    });
    
    it('should allow empty string for value', async () => {
      const requestBody = { name: 'CF Name', value: '' };
      prismaMock.bOM.findUnique.mockResolvedValue(mockBOM);
      prismaMock.bOMHeaderCustomField.create.mockResolvedValue({ ...mockCustomField, value: '' });
       const request = new Request(`http://localhost/api/boms/${bomId}/custom-fields`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      await POST(request, { params: { bomId } });
      expect(prismaMock.bOMHeaderCustomField.create).toHaveBeenCalledWith({
        data: { ...requestBody, bomId: bomIdInt },
      });
      expect(NextResponse.json).toHaveBeenCalledWith(expect.objectContaining({ value: '' }), { status: 201 });
    });


    it('should return 404 if BOM not found', async () => {
      prismaMock.bOM.findUnique.mockResolvedValue(null);
      const request = new Request(`http://localhost/api/boms/${bomId}/custom-fields`, {
        method: 'POST',
        body: JSON.stringify({ name: 'CF Name', value: 'CF Value' }),
      });
      await POST(request, { params: { bomId } });
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'BOM not found' }, { status: 404 });
    });

    it('should return 400 for invalid bomId', async () => {
      const request = new Request('http://localhost/api/boms/invalid/custom-fields', {
        method: 'POST',
        body: JSON.stringify({ name: 'CF Name', value: 'CF Value' }),
      });
      await POST(request, { params: { bomId: 'invalid' } });
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid BOM ID' }, { status: 400 });
    });
  });
});
