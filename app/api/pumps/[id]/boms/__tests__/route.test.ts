import { POST, GET } from '../route'; // Adjust path as necessary
import { prismaMock } from '../../../../../__mocks__/prismaClient'; // Adjust path to your mock
import { NextResponse } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({ body, init, status: init?.status || 200 })),
  },
}));

describe('/api/pumps/[id]/boms', () => {
  const id = '1';
  const idInt = parseInt(id, 10);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should create a new BOM and return 201', async () => {
      const mockPump = { id: idInt, name: 'Test Pump' };
      const mockBOM = { id: 1, name: 'New BOM Name', pumpModelId: idInt, items: [], customFields: [] };
      const requestBody = { name: 'New BOM Name' };

      prismaMock.pumpModel.findUnique.mockResolvedValue(mockPump);
      prismaMock.bOM.create.mockResolvedValue(mockBOM);

      const request = new Request(`http://localhost/api/pumps/${id}/boms`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, { params: { id } });

      expect(prismaMock.pumpModel.findUnique).toHaveBeenCalledWith({ where: { id: idInt } });
      expect(prismaMock.bOM.create).toHaveBeenCalledWith({
        data: { name: requestBody.name, pumpModelId: idInt },
      });
      expect(NextResponse.json).toHaveBeenCalledWith(mockBOM, { status: 201 });
    });

    it('should return 400 if name is missing', async () => {
      const request = new Request(`http://localhost/api/pumps/${id}/boms`, {
        method: 'POST',
        body: JSON.stringify({}), // Missing name
      });
      await POST(request, { params: { id } });
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'BOM name is required' }, { status: 400 });
    });

    it('should return 404 if pump not found', async () => {
      prismaMock.pumpModel.findUnique.mockResolvedValue(null);
      const request = new Request(`http://localhost/api/pumps/${id}/boms`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Test BOM' }),
      });
      await POST(request, { params: { id } });
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Pump not found' }, { status: 404 });
    });
     it('should return 400 if pumpId is invalid', async () => {
      const request = new Request(`http://localhost/api/pumps/invalid/boms`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Test BOM' }),
      });
      await POST(request, { params: { id: 'invalid' } });
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid Pump ID' }, { status: 400 });
    });
  });

  describe('GET', () => {
    it('should return a list of BOMs for a pump and status 200', async () => {
      const mockPump = { id: idInt, name: 'Test Pump' };
      const mockBOMs = [
        { id: 1, name: 'BOM A', pumpModelId: idInt },
        { id: 2, name: 'BOM B', pumpModelId: idInt },
      ];
      prismaMock.pumpModel.findUnique.mockResolvedValue(mockPump);
      prismaMock.bOM.findMany.mockResolvedValue(mockBOMs);

      const request = new Request(`http://localhost/api/pumps/${id}/boms`);
      const response = await GET(request, { params: { id } });

      expect(prismaMock.pumpModel.findUnique).toHaveBeenCalledWith({ where: { id: idInt } });
      expect(prismaMock.bOM.findMany).toHaveBeenCalledWith({
        where: { pumpModelId: idInt },
        orderBy: { createdAt: 'desc' },
      });
      expect(NextResponse.json).toHaveBeenCalledWith(mockBOMs);
      // @ts-ignore
      expect(response.status).toBe(200); 
    });

    it('should return an empty list if no BOMs found and status 200', async () => {
      const mockPump = { id: idInt, name: 'Test Pump' };
      prismaMock.pumpModel.findUnique.mockResolvedValue(mockPump);
      prismaMock.bOM.findMany.mockResolvedValue([]);
      
      const request = new Request(`http://localhost/api/pumps/${id}/boms`);
      await GET(request, { params: { id } });
      
      expect(NextResponse.json).toHaveBeenCalledWith([]);
    });

    it('should return 404 if pump not found', async () => {
      prismaMock.pumpModel.findUnique.mockResolvedValue(null);
      const request = new Request(`http://localhost/api/pumps/${id}/boms`);
      await GET(request, { params: { id } });
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Pump not found' }, { status: 404 });
    });

    it('should return 400 if pumpId is invalid', async () => {
      const request = new Request(`http://localhost/api/pumps/invalid/boms`);
      await GET(request, { params: { id: 'invalid' } });
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid Pump ID' }, { status: 400 });
    });
  });
});
