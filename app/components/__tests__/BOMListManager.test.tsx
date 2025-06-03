import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BOMListManager, { BOMListManagerProps } from '../BOMListManager'; // Adjust path
import { BOM, GetBOMsResponse } from '@/lib/types'; // Adjust path

const mockPumpId = '1';
const mockBoms: GetBOMsResponse = [
  { id: 1, name: 'BOM Alpha', pumpModelId: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), items:[], customFields:[] },
  { id: 2, name: 'BOM Beta', pumpModelId: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), items:[], customFields:[]  },
];

const mockNewBom: BOM = { 
    id: 3, name: 'BOM Gamma', pumpModelId: 1, 
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), 
    items: [], customFields: [] 
};

const mockFetch = global.fetch as jest.Mock;

const defaultProps: BOMListManagerProps = {
  pumpId: mockPumpId,
  onSelectBOM: jest.fn(),
  selectedBomId: null,
  onBomCreated: jest.fn(),
  onBomUpdated: jest.fn(),
};

const renderComponent = (props: Partial<BOMListManagerProps> = {}) => {
  return render(<BOMListManager {...defaultProps} {...props} />);
};

describe('BOMListManager', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    (defaultProps.onSelectBOM as jest.Mock).mockClear();
    (defaultProps.onBomCreated as jest.Mock).mockClear();
    (defaultProps.onBomUpdated as jest.Mock).mockClear();
    (global.confirm as jest.Mock).mockReturnValue(true); // Default confirm to true
  });

  it('fetches and displays a list of BOMs', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBoms,
    });
    renderComponent();

    expect(mockFetch).toHaveBeenCalledWith(`/api/pumps/${mockPumpId}/boms`);
    await waitFor(() => {
      expect(screen.getByText('BOM Alpha (ID: 1)')).toBeInTheDocument();
      expect(screen.getByText('BOM Beta (ID: 2)')).toBeInTheDocument();
    });
  });

  it('handles error when fetching BOMs', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to fetch' }),
      statusText: 'Server Error'
    });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Error loading BOMs: Failed to fetch/i)).toBeInTheDocument();
    });
  });

  it('allows selecting a BOM', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockBoms });
    renderComponent();
    await waitFor(() => screen.getByText('BOM Alpha (ID: 1)'));

    // Simulate clicking on a BOM name to select (since it's a list of spans now)
    fireEvent.click(screen.getByText('BOM Alpha (ID: 1)'));
    expect(defaultProps.onSelectBOM).toHaveBeenCalledWith('1');
  });

  it('creates a new BOM', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockBoms }); // Initial fetch
    renderComponent();
    await waitFor(() => screen.getByPlaceholderText('New BOM Name'));

    mockFetch.mockResolvedValueOnce({ // For create
      ok: true,
      json: async () => mockNewBom,
    });
    mockFetch.mockResolvedValueOnce({ // For re-fetch after create
      ok: true,
      json: async () => [...mockBoms, {id: mockNewBom.id, name: mockNewBom.name}],
    });
    
    fireEvent.change(screen.getByPlaceholderText('New BOM Name'), { target: { value: 'BOM Gamma' } });
    fireEvent.click(screen.getByText('Create New BOM'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(`/api/pumps/${mockPumpId}/boms`, expect.objectContaining({ method: 'POST' }));
      expect(defaultProps.onBomCreated).toHaveBeenCalledWith(mockNewBom);
      // onSelectBOM is called during re-fetch with the new BOM ID
      expect(defaultProps.onSelectBOM).toHaveBeenCalledWith(mockNewBom.id.toString()); 
      expect(screen.getByText('BOM Gamma (ID: 3)')).toBeInTheDocument();
    });
  });

  it('edits a BOM name', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockBoms });
    renderComponent({ selectedBomId: '1' });
    await waitFor(() => screen.getByText('BOM Alpha (ID: 1)'));

    // Click edit button for BOM Alpha
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]); 

    const inputField = screen.getByDisplayValue('BOM Alpha');
    fireEvent.change(inputField, { target: { value: 'BOM Alpha Updated' } });

    const updatedBomData = { ...mockBoms[0], name: 'BOM Alpha Updated' };
    mockFetch.mockResolvedValueOnce({ // For PUT
      ok: true,
      json: async () => updatedBomData,
    });
    mockFetch.mockResolvedValueOnce({ // For re-fetch
      ok: true,
      json: async () => [updatedBomData, mockBoms[1]],
    });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(`/api/boms/1`, expect.objectContaining({ method: 'PUT' }));
      expect(screen.getByText('BOM Alpha Updated (ID: 1)')).toBeInTheDocument();
      expect(defaultProps.onBomUpdated).toHaveBeenCalledWith({id: 1, name: 'BOM Alpha Updated'});
    });
  });


  it('deletes a BOM', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockBoms });
    renderComponent({ selectedBomId: '1' }); // BOM Alpha is selected
    await waitFor(() => screen.getByText('BOM Alpha (ID: 1)'));

    mockFetch.mockResolvedValueOnce({ ok: true }); // For DELETE
    mockFetch.mockResolvedValueOnce({ // For re-fetch
      ok: true,
      json: async () => [mockBoms[1]], // BOM Alpha removed
    });
    
    // Click delete for BOM Alpha
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete BOM ID 1? This will delete the BOM and all its items.');

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(`/api/boms/1`, expect.objectContaining({ method: 'DELETE' }));
      expect(screen.queryByText('BOM Alpha (ID: 1)')).not.toBeInTheDocument();
      expect(defaultProps.onSelectBOM).toHaveBeenCalledWith(null); // Since selected BOM was deleted
    });
  });
  
  it('does not call onSelectBOM(null) if a non-selected BOM is deleted', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockBoms });
    renderComponent({ selectedBomId: '2' }); // BOM Beta is selected
    await waitFor(() => screen.getByText('BOM Alpha (ID: 1)'));

    mockFetch.mockResolvedValueOnce({ ok: true }); // For DELETE
    mockFetch.mockResolvedValueOnce({ // For re-fetch
      ok: true,
      json: async () => [mockBoms[1]], // BOM Alpha removed
    });
    
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]); // Delete BOM Alpha

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(`/api/boms/1`, expect.objectContaining({ method: 'DELETE' }));
      expect(screen.queryByText('BOM Alpha (ID: 1)')).not.toBeInTheDocument();
      // onSelectBOM should have been called with '2' during the re-fetch if it was still the selected one
      expect(defaultProps.onSelectBOM).toHaveBeenCalledWith('2'); 
    });
    // Verify it wasn't called with null
    expect((defaultProps.onSelectBOM as jest.Mock).mock.calls.find(call => call[0] === null)).toBeUndefined();
  });

});
