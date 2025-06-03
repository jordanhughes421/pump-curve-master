import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditBOMItemForm from '../EditBOMItemForm'; // Adjust path

// Define types locally
interface BOMCustomFieldData {
  id: number;
  name: string;
  value: string;
}

interface BOMItemData {
  id: number;
  partNumber: string;
  description: string;
  quantity: number;
  unit: string;
  supplier: string | null;
  customFields: BOMCustomFieldData[];
}

const mockInitialData: BOMItemData = {
  id: 1,
  partNumber: 'PN001',
  description: 'Original Description',
  quantity: 10,
  unit: 'pcs',
  supplier: 'Original Supplier',
  customFields: [
    { id: 101, name: 'Color', value: 'Red' },
    { id: 102, name: 'Material', value: 'Steel' },
  ],
};

const mockOnBOMItemUpdated = jest.fn();
const mockOnCancel = jest.fn();

// Mock fetch
global.fetch = jest.fn();

const mockFetch = (responseBody: any, ok: boolean = true, status: number = 200) => {
  return jest.fn().mockResolvedValueOnce({
    ok,
    status,
    json: async () => responseBody,
    statusText: ok ? 'OK' : 'Error',
  });
};


describe('EditBOMItemForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  const renderEditForm = (initialData = mockInitialData) => {
    render(
      <EditBOMItemForm
        initialData={initialData}
        onBOMItemUpdated={mockOnBOMItemUpdated}
        onCancel={mockOnCancel}
      />
    );
  };

  it('renders correctly with fields pre-filled from initialData', () => {
    renderEditForm();
    expect(screen.getByLabelText(/Part Number/i)).toHaveValue(mockInitialData.partNumber);
    expect(screen.getByLabelText(/Description/i)).toHaveValue(mockInitialData.description);
    expect(screen.getByLabelText(/Quantity/i)).toHaveValue(mockInitialData.quantity);
    expect(screen.getByLabelText(/Unit/i)).toHaveValue(mockInitialData.unit);
    expect(screen.getByLabelText(/Supplier/i)).toHaveValue(mockInitialData.supplier);

    // Check existing custom fields
    expect(screen.getByDisplayValue('Color')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Red')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Material')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Steel')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Delete/i })).toHaveLength(mockInitialData.customFields.length); // Delete buttons for existing CFs
  });

  it('modifies standard fields and submits correctly', async () => {
    (global.fetch as jest.Mock).mockImplementation(mockFetch({ ...mockInitialData, description: 'Updated Description' }));
    renderEditForm();

    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Updated Description' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/api/bom-items/${mockInitialData.id}`, expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          partNumber: mockInitialData.partNumber,
          description: 'Updated Description', // Changed field
          quantity: mockInitialData.quantity,
          unit: mockInitialData.unit,
          supplier: mockInitialData.supplier,
        }),
      }));
    });
    expect(mockOnBOMItemUpdated).toHaveBeenCalledTimes(1);
  });

  it('modifies an existing custom field and submits', async () => {
    // Main BOM item update
    (global.fetch as jest.Mock).mockImplementationOnce(mockFetch(mockInitialData)); 
    // Custom field update
    (global.fetch as jest.Mock).mockImplementationOnce(mockFetch({ id: 101, name: 'Color Updated', value: 'Blue' })); 

    renderEditForm();
    const colorNameInput = screen.getByDisplayValue('Color');
    fireEvent.change(colorNameInput, { target: { value: 'Color Updated' } });
    const colorValueInput = screen.getByDisplayValue('Red');
    fireEvent.change(colorValueInput, { target: { value: 'Blue' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/api/bom-items/${mockInitialData.id}`, expect.any(Object)); // Main update
      expect(fetch).toHaveBeenCalledWith(`/api/bom-custom-fields/${mockInitialData.customFields[0].id}`, expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'Color Updated', value: 'Blue' }),
      }));
    });
    expect(fetch).toHaveBeenCalledTimes(2); // Main item + 1 CF update
    expect(mockOnBOMItemUpdated).toHaveBeenCalledTimes(1);
  });

  it('deletes an existing custom field and submits', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(mockFetch(mockInitialData)); // Main BOM item update
    (global.fetch as jest.Mock).mockImplementationOnce(mockFetch({})); // CF Delete

    renderEditForm();
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[0]); // Delete "Color"

    // Verify UI change for deletion (e.g., strikethrough, or button text change to "Undo")
    expect(screen.getByDisplayValue('Color')).toHaveClass('line-through'); // Assuming this class is applied
    expect(deleteButtons[0]).toHaveTextContent('Undo'); // Button text changes


    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/api/bom-items/${mockInitialData.id}`, expect.any(Object));
      expect(fetch).toHaveBeenCalledWith(`/api/bom-custom-fields/${mockInitialData.customFields[0].id}`, expect.objectContaining({
        method: 'DELETE',
      }));
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(mockOnBOMItemUpdated).toHaveBeenCalledTimes(1);
  });

  it('adds a new custom field and submits', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(mockFetch(mockInitialData)); // Main BOM item update
    (global.fetch as jest.Mock).mockImplementationOnce(mockFetch({ id: 103, name: 'New CF', value: 'New Value' })); // New CF Add

    renderEditForm();
    fireEvent.click(screen.getByRole('button', { name: /Add New Custom Field/i }));
    
    const newNameInputs = await screen.findAllByPlaceholderText(/Field Name/i);
    const newValueInputs = await screen.findAllByPlaceholderText(/Field Value/i);
    // Assuming new inputs are added at the end
    fireEvent.change(newNameInputs[newNameInputs.length -1], { target: { value: 'New CF' } });
    fireEvent.change(newValueInputs[newValueInputs.length -1], { target: { value: 'New Value' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/api/bom-items/${mockInitialData.id}`, expect.any(Object));
      expect(fetch).toHaveBeenCalledWith(`/api/bom-items/${mockInitialData.id}/fields`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'New CF', value: 'New Value' }),
      }));
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(mockOnBOMItemUpdated).toHaveBeenCalledTimes(1);
  });

  it('handles a combination of custom field changes (modify, delete, add)', async () => {
    // Mock main PUT, then PUT for modified, DELETE for deleted, POST for new
    (global.fetch as jest.Mock)
        .mockImplementationOnce(mockFetch(mockInitialData)) // Main PUT
        .mockImplementationOnce(mockFetch({ id: 101, name: 'Color Modified', value: 'Purple' })) // Modified CF (Color)
        .mockImplementationOnce(mockFetch({})) // Deleted CF (Material)
        .mockImplementationOnce(mockFetch({ id: 103, name: 'Newly Added', value: 'Fresh' })); // New CF

    renderEditForm();

    // 1. Modify "Color" (ID: 101)
    fireEvent.change(screen.getByDisplayValue('Color'), { target: { value: 'Color Modified' } });
    fireEvent.change(screen.getByDisplayValue('Red'), { target: { value: 'Purple' } });

    // 2. Delete "Material" (ID: 102)
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    // Find the delete button for 'Material'. This assumes order or more specific selectors.
    // For this test, we'll assume the second delete button corresponds to "Material".
    fireEvent.click(deleteButtons[1]); 

    // 3. Add a new custom field
    fireEvent.click(screen.getByRole('button', { name: /Add New Custom Field/i }));
    const newNameInputs = await screen.findAllByPlaceholderText(/Field Name/i);
    const newValueInputs = await screen.findAllByPlaceholderText(/Field Value/i);
    fireEvent.change(newNameInputs[newNameInputs.length-1], { target: { value: 'Newly Added' } });
    fireEvent.change(newValueInputs[newValueInputs.length-1], { target: { value: 'Fresh' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/api/bom-items/${mockInitialData.id}`, expect.any(Object)); // Main
      expect(fetch).toHaveBeenCalledWith(`/api/bom-custom-fields/${mockInitialData.customFields[0].id}`, // Modified (Color)
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ name: 'Color Modified', value: 'Purple' }) })
      );
      expect(fetch).toHaveBeenCalledWith(`/api/bom-custom-fields/${mockInitialData.customFields[1].id}`, // Deleted (Material)
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(fetch).toHaveBeenCalledWith(`/api/bom-items/${mockInitialData.id}/fields`, // New
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Newly Added', value: 'Fresh' }) })
      );
    });
    expect(fetch).toHaveBeenCalledTimes(4); // Main + 3 CF operations
    expect(mockOnBOMItemUpdated).toHaveBeenCalledTimes(1);
  });
  
  it('handles main item update failure', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(mockFetch({ error: 'Update Failed' }, false, 500));
    renderEditForm();
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Attempted Update' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
        expect(screen.getByText(/Failed to update BOM item: Update Failed/i)).toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mockOnBOMItemUpdated).not.toHaveBeenCalled();
  });

  it('handles partial success (main item OK, one custom field operation fails)', async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(mockFetch(mockInitialData)) // Main PUT success
      .mockImplementationOnce(mockFetch({ error: 'CF Update Failed' }, false, 500)); // First CF operation (e.g., update) fails

    renderEditForm();
    fireEvent.change(screen.getByDisplayValue('Color'), { target: { value: 'Attempted CF Update' } }); // Modify first CF
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2); // Main item call + 1 CF call
      expect(screen.getByText(/BOM item updated, but some custom field operations failed:/i)).toBeInTheDocument();
      expect(screen.getByText(/- Failed to update custom field "Color"/i)).toBeInTheDocument();

    });
    expect(mockOnBOMItemUpdated).not.toHaveBeenCalled(); // Should not be called on partial failure
  });

  it('calls onCancel when Cancel button is clicked', () => {
    renderEditForm();
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
