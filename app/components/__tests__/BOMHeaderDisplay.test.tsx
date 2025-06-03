import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BOMHeaderDisplay from '../BOMHeaderDisplay'; // Adjust path
import { BOM, BOMHeaderCustomField } from '@/lib/types'; // Adjust path

const mockBom: BOM = {
  id: 1,
  name: 'Main BOM',
  pumpModelId: 101,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  items: [],
  customFields: [
    { id: 1, name: 'Color', value: 'Red', bomId: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 2, name: 'Material', value: 'Steel', bomId: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
};

const mockFetch = global.fetch as jest.Mock;

const defaultProps = {
  bom: mockBom,
  onDataChange: jest.fn(),
};

const renderComponent = (props: Partial<typeof defaultProps> = {}) => {
  return render(<BOMHeaderDisplay {...defaultProps} {...props} />);
};

describe('BOMHeaderDisplay', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    (defaultProps.onDataChange as jest.Mock).mockClear();
    (global.confirm as jest.Mock).mockReturnValue(true);
  });

  it('displays BOM name and existing custom fields', () => {
    renderComponent();
    expect(screen.getByText(`BOM Details: ${mockBom.name}`)).toBeInTheDocument();
    expect(screen.getByText('Color:')).toBeInTheDocument();
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Material:')).toBeInTheDocument();
    expect(screen.getByText('Steel')).toBeInTheDocument();
  });

  it('displays "no BOM selected" message if bom is null', () => {
    renderComponent({ bom: null });
    expect(screen.getByText('No BOM selected or BOM data not available.')).toBeInTheDocument();
  });

  it('adds a new custom field', async () => {
    renderComponent();
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 3, name: 'Weight', value: '10kg' }) });

    fireEvent.change(screen.getByPlaceholderText('Field Name'), { target: { value: 'Weight' } });
    fireEvent.change(screen.getByPlaceholderText('Field Value'), { target: { value: '10kg' } });
    fireEvent.click(screen.getByText('Add Field'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(`/api/boms/${mockBom.id}/custom-fields`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Weight', value: '10kg' }),
      }));
      expect(defaultProps.onDataChange).toHaveBeenCalledTimes(1);
    });
  });
  
  it('shows error if adding new custom field fails', async () => {
    renderComponent();
    mockFetch.mockResolvedValueOnce({ 
        ok: false, 
        json: async () => ({error: "Failed to add"}),
        statusText: "Server Error"
    });

    fireEvent.change(screen.getByPlaceholderText('Field Name'), { target: { value: 'Weight' } });
    fireEvent.change(screen.getByPlaceholderText('Field Value'), { target: { value: '10kg' } });
    fireEvent.click(screen.getByText('Add Field'));

    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to add/i)).toBeInTheDocument();
    });
  });

  it('edits an existing custom field', async () => {
    renderComponent();
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]); // Edit "Color"

    expect(screen.getByDisplayValue('Color')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Red')).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('Color'), { target: { value: 'Color Updated' } });
    fireEvent.change(screen.getByDisplayValue('Red'), { target: { value: 'Blue' } });
    
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1, name: 'Color Updated', value: 'Blue' }) });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(`/api/boms/${mockBom.id}/custom-fields/1`, expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'Color Updated', value: 'Blue' }),
      }));
      expect(defaultProps.onDataChange).toHaveBeenCalledTimes(1);
    });
  });
  
  it('cancels editing a custom field', async () => {
    renderComponent();
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]); // Edit "Color"

    expect(screen.getByDisplayValue('Color')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));

    // Form should disappear, original text shown
    expect(screen.getByText('Color:')).toBeInTheDocument();
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Color')).not.toBeInTheDocument();
  });


  it('deletes a custom field', async () => {
    renderComponent();
    mockFetch.mockResolvedValueOnce({ ok: true });
    
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]); // Delete "Color"

    expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this custom field?');
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(`/api/boms/${mockBom.id}/custom-fields/1`, expect.objectContaining({
        method: 'DELETE',
      }));
      expect(defaultProps.onDataChange).toHaveBeenCalledTimes(1);
    });
  });
});
