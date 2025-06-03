import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddBOMItemForm from '../AddBOMItemForm'; // Adjust path

// Mock fetch
global.fetch = jest.fn();

const mockFetch = (responseBody: any, ok: boolean = true, status: number = 200) => {
  return jest.fn().mockResolvedValueOnce({
    ok,
    status,
    json: async () => responseBody,
    statusText: ok ? (status === 201 ? 'Created' : 'OK') : 'Error',
  });
};

const mockPumpId = 1;
const mockParentId = null;
const mockOnBOMItemAdded = jest.fn();
const mockOnCancel = jest.fn(); // Assuming a cancel button might be used

describe('AddBOMItemForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  const renderForm = (parentId: number | null = mockParentId) => {
    render(
      <AddBOMItemForm
        pumpId={mockPumpId}
        parentId={parentId}
        onBOMItemAdded={mockOnBOMItemAdded}
        // onCancel={mockOnCancel} // Add if form has a cancel button
      />
    );
  };

  it('renders correctly with all input fields', () => {
    renderForm();
    expect(screen.getByLabelText(/Part Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Unit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Supplier/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Custom Field/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add BOM Item/i })).toBeInTheDocument();
  });

  it('allows adding and removing custom field inputs', () => {
    renderForm();
    const addCustomFieldButton = screen.getByRole('button', { name: /Add Custom Field/i });

    fireEvent.click(addCustomFieldButton);
    expect(screen.getAllByPlaceholderText(/Field Name/i)).toHaveLength(1);
    expect(screen.getAllByPlaceholderText(/Field Value/i)).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Remove/i })).toBeInTheDocument();

    fireEvent.click(addCustomFieldButton);
    expect(screen.getAllByPlaceholderText(/Field Name/i)).toHaveLength(2);

    const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
    fireEvent.click(removeButtons[0]);
    expect(screen.getAllByPlaceholderText(/Field Name/i)).toHaveLength(1);
  });

  it('handles successful form submission (BOM Item + Custom Fields)', async () => {
    const newBOMItemId = 123;
    // Mock BOM Item creation
    (global.fetch as jest.Mock).mockImplementationOnce(
        mockFetch({ id: newBOMItemId, partNumber: 'PN123' }, true, 201) 
    );
    // Mock Custom Field 1 creation
    (global.fetch as jest.Mock).mockImplementationOnce(
        mockFetch({ id: 1, name: 'CF1', value: 'Val1' }, true, 201)
    );
    // Mock Custom Field 2 creation
    (global.fetch as jest.Mock).mockImplementationOnce(
        mockFetch({ id: 2, name: 'CF2', value: 'Val2' }, true, 201)
    );
    
    renderForm();

    fireEvent.change(screen.getByLabelText(/Part Number/i), { target: { value: 'PN123' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Test Desc' } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/Unit/i), { target: { value: 'pcs' } });

    // Add two custom fields
    const addCustomFieldButton = screen.getByRole('button', { name: /Add Custom Field/i });
    fireEvent.click(addCustomFieldButton);
    fireEvent.click(addCustomFieldButton);

    const nameInputs = screen.getAllByPlaceholderText(/Field Name/i);
    const valueInputs = screen.getAllByPlaceholderText(/Field Value/i);
    fireEvent.change(nameInputs[0], { target: { value: 'CF1' } });
    fireEvent.change(valueInputs[0], { target: { value: 'Val1' } });
    fireEvent.change(nameInputs[1], { target: { value: 'CF2' } });
    fireEvent.change(valueInputs[1], { target: { value: 'Val2' } });

    fireEvent.click(screen.getByRole('button', { name: /Add BOM Item/i }));

    await waitFor(() => {
      // BOM Item call
      expect(fetch).toHaveBeenCalledWith(`/api/pumps/${mockPumpId}/bom`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          partNumber: 'PN123',
          description: 'Test Desc',
          quantity: 10,
          unit: 'pcs',
          supplier: null, // or '' if that's the default
          pumpModelId: mockPumpId,
          parentId: mockParentId,
        }),
      }));
      // Custom Field 1 call
      expect(fetch).toHaveBeenCalledWith(`/api/bom-items/${newBOMItemId}/fields`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'CF1', value: 'Val1' }),
      }));
      // Custom Field 2 call
      expect(fetch).toHaveBeenCalledWith(`/api/bom-items/${newBOMItemId}/fields`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'CF2', value: 'Val2' }),
      }));
    });
    
    expect(fetch).toHaveBeenCalledTimes(3); // 1 for BOM item, 2 for custom fields
    expect(mockOnBOMItemAdded).toHaveBeenCalledTimes(1);
    // Check if form is cleared (e.g., part number field is empty)
    expect(screen.getByLabelText(/Part Number/i)).toHaveValue('');
    expect(screen.getByText(/added successfully!/i)).toBeInTheDocument();
  });

  it('handles BOM item creation failure', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(mockFetch({ error: 'Creation Failed' }, false, 500));
    renderForm();

    fireEvent.change(screen.getByLabelText(/Part Number/i), { target: { value: 'PN123' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Test Desc' } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/Unit/i), { target: { value: 'pcs' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Add BOM Item/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1); // Only the BOM item call
      expect(screen.getByText(/Creation Failed/i)).toBeInTheDocument();
    });
    expect(mockOnBOMItemAdded).not.toHaveBeenCalled();
  });

  it('handles partial success (BOM item OK, one custom field fails)', async () => {
    const newBOMItemId = 456;
    // Mock BOM Item creation (success)
    (global.fetch as jest.Mock).mockImplementationOnce(
        mockFetch({ id: newBOMItemId, partNumber: 'PN456' }, true, 201)
    );
    // Mock Custom Field 1 creation (success)
    (global.fetch as jest.Mock).mockImplementationOnce(
        mockFetch({ id: 1, name: 'CF1-OK', value: 'Val-OK' }, true, 201)
    );
    // Mock Custom Field 2 creation (failure)
    (global.fetch as jest.Mock).mockImplementationOnce(
        mockFetch({ error: 'CF2 Failed' }, false, 500)
    );

    renderForm();
    fireEvent.change(screen.getByLabelText(/Part Number/i), { target: { value: 'PN456' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Test Desc Partial' } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Unit/i), { target: { value: 'm' } });

    const addCustomFieldButton = screen.getByRole('button', { name: /Add Custom Field/i });
    fireEvent.click(addCustomFieldButton); // CF1
    fireEvent.click(addCustomFieldButton); // CF2

    const nameInputs = screen.getAllByPlaceholderText(/Field Name/i);
    const valueInputs = screen.getAllByPlaceholderText(/Field Value/i);
    fireEvent.change(nameInputs[0], { target: { value: 'CF1-OK' } });
    fireEvent.change(valueInputs[0], { target: { value: 'Val-OK' } });
    fireEvent.change(nameInputs[1], { target: { value: 'CF2-Fail' } });
    fireEvent.change(valueInputs[1], { target: { value: 'Val-Fail' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Add BOM Item/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(3); // 1 BOM, 2 CFs
      expect(screen.getByText(/BOM Item "PN456" was created, but some custom fields failed to save:/i)).toBeInTheDocument();
      expect(screen.getByText(/- Custom field "CF2-Fail": CF2 Failed/i)).toBeInTheDocument();
    });
    expect(mockOnBOMItemAdded).not.toHaveBeenCalled();
     // Form should not be cleared
    expect(screen.getByLabelText(/Part Number/i)).toHaveValue('PN456');
  });

  it('shows validation error for empty required fields and does not submit', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /Add BOM Item/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please fill in all required fields/i)).toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(mockOnBOMItemAdded).not.toHaveBeenCalled();
  });
  
  it('shows validation error for non-positive quantity', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/Part Number/i), { target: { value: 'PN_Q0' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Test Desc Q0' } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '0' } }); // Zero quantity
    fireEvent.change(screen.getByLabelText(/Unit/i), { target: { value: 'pcs' } });

    fireEvent.click(screen.getByRole('button', { name: /Add BOM Item/i }));

    await waitFor(() => {
      expect(screen.getByText(/Quantity must be a positive number/i)).toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  // Add a test for onCancel if a cancel button is implemented in the form
  // it('calls onCancel when Cancel button is clicked', () => {
  //   render(
  //     <AddBOMItemForm
  //       pumpId={mockPumpId}
  //       parentId={null}
  //       onBOMItemAdded={mockOnBOMItemAdded}
  //       onCancel={mockOnCancel} // Ensure onCancel is passed
  //     />
  //   );
  //   // Assuming a cancel button with text "Cancel" exists
  //   // fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
  //   // expect(mockOnCancel).toHaveBeenCalledTimes(1);
  // });
});
