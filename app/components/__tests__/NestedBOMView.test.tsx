import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NestedBOMView from '../NestedBOMView'; // Adjust path as necessary

// Define types locally for the test, mirroring the component's types
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
  children: BOMItemData[];
}

const mockPumpId = 1;
const mockOnEditItem = jest.fn();
const mockOnAddItem = jest.fn();
const mockOnDeleteItem = jest.fn();

const sampleBOMData: BOMItemData[] = [
  {
    id: 1,
    partNumber: 'TOP001',
    description: 'Top Level Item 1',
    quantity: 1,
    unit: 'pc',
    supplier: 'Supplier A',
    customFields: [{ id: 101, name: 'Color', value: 'Red' }],
    children: [
      {
        id: 2,
        partNumber: 'SUB001',
        description: 'Sub Level Item 1.1',
        quantity: 2,
        unit: 'pcs',
        supplier: 'Supplier B',
        customFields: [],
        children: [],
      },
    ],
  },
  {
    id: 3,
    partNumber: 'TOP002',
    description: 'Top Level Item 2',
    quantity: 5,
    unit: 'kg',
    supplier: 'Supplier C',
    customFields: [],
    children: [],
  },
];

// Mock fetch
global.fetch = jest.fn();

const mockFetch = (data: any, ok: boolean = true, status: number = 200) => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: async () => data,
    statusText: ok ? 'OK' : 'Error',
  });
};

describe('NestedBOMView Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockFetch({}, true); // Mock a pending fetch
    render(
      <NestedBOMView
        pumpId={mockPumpId}
        bomUpdateKey={0}
        onEditItem={mockOnEditItem}
        onAddItem={mockOnAddItem}
        onDeleteItem={mockOnDeleteItem}
      />
    );
    expect(screen.getByText(/Loading Bill of Materials.../i)).toBeInTheDocument();
  });

  it('fetches and displays a nested BOM structure correctly', async () => {
    mockFetch(sampleBOMData);
    render(
      <NestedBOMView
        pumpId={mockPumpId}
        bomUpdateKey={0}
        onEditItem={mockOnEditItem}
        onAddItem={mockOnAddItem}
        onDeleteItem={mockOnDeleteItem}
      />
    );

    // Wait for loading to disappear
    await waitFor(() => expect(screen.queryByText(/Loading Bill of Materials.../i)).not.toBeInTheDocument());

    // Check top-level items
    expect(screen.getByText(/TOP001 - Top Level Item 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Quantity:/i)).toBeInTheDocument(); // Check one instance
    expect(screen.getByText(/1 pc/i)).toBeInTheDocument();
    expect(screen.getByText(/Supplier A/i)).toBeInTheDocument();
    expect(screen.getByText(/Color:/i)).toBeInTheDocument();
    expect(screen.getByText(/Red/i)).toBeInTheDocument();

    expect(screen.getByText(/TOP002 - Top Level Item 2/i)).toBeInTheDocument();
    expect(screen.getByText(/5 kg/i)).toBeInTheDocument();

    // Check nested item (SUB001)
    // Its text might be constructed with partNumber and description together
    expect(screen.getByText((content, element) => {
        return element?.textContent === 'SUB001 - Sub Level Item 1.1';
      })).toBeInTheDocument();
    expect(screen.getByText(/2 pcs/i)).toBeInTheDocument();
    
    // Check for buttons for each item (3 items total in sampleBOMData including child)
    expect(screen.getAllByRole('button', { name: /Edit/i })).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: /Add Child/i })).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: /Delete/i })).toHaveLength(3);
  });

  it('displays an error message if the API call fails', async () => {
    mockFetch({ error: 'Failed to fetch' }, false, 500);
    render(
      <NestedBOMView
        pumpId={mockPumpId}
        bomUpdateKey={0}
        onEditItem={mockOnEditItem}
        onAddItem={mockOnAddItem}
        onDeleteItem={mockOnDeleteItem}
      />
    );
    await waitFor(() => expect(screen.getByText(/Error:/i)).toBeInTheDocument());
    expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
  });

  it('displays a message when the BOM is empty', async () => {
    mockFetch([]); // Empty array response
    render(
      <NestedBOMView
        pumpId={mockPumpId}
        bomUpdateKey={0}
        onEditItem={mockOnEditItem}
        onAddItem={mockOnAddItem}
        onDeleteItem={mockOnDeleteItem}
      />
    );
    await waitFor(() => expect(screen.getByText(/No Bill of Materials data found/i)).toBeInTheDocument());
  });

  it('calls onEditItem with correct item when Edit button is clicked', async () => {
    mockFetch(sampleBOMData);
    render(
      <NestedBOMView
        pumpId={mockPumpId}
        bomUpdateKey={0}
        onEditItem={mockOnEditItem}
        onAddItem={mockOnAddItem}
        onDeleteItem={mockOnDeleteItem}
      />
    );
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    
    const editButtons = screen.getAllByRole('button', { name: /Edit/i });
    fireEvent.click(editButtons[0]); // Click edit for TOP001
    
    expect(mockOnEditItem).toHaveBeenCalledTimes(1);
    expect(mockOnEditItem).toHaveBeenCalledWith(sampleBOMData[0]);
  });

  it('calls onAddItem with correct parentId when Add Child button is clicked', async () => {
    mockFetch(sampleBOMData);
    render(
      <NestedBOMView
        pumpId={mockPumpId}
        bomUpdateKey={0}
        onEditItem={mockOnEditItem}
        onAddItem={mockOnAddItem}
        onDeleteItem={mockOnDeleteItem}
      />
    );
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    
    const addChildButtons = screen.getAllByRole('button', { name: /Add Child/i });
    fireEvent.click(addChildButtons[0]); // Click Add Child for TOP001 (id: 1)
    
    expect(mockOnAddItem).toHaveBeenCalledTimes(1);
    expect(mockOnAddItem).toHaveBeenCalledWith(sampleBOMData[0].id);
  });

  it('calls onDeleteItem with correct itemId when Delete button is clicked after confirmation', async () => {
    window.confirm = jest.fn(() => true); // Mock window.confirm to return true
    mockFetch(sampleBOMData);
    render(
      <NestedBOMView
        pumpId={mockPumpId}
        bomUpdateKey={0}
        onEditItem={mockOnEditItem}
        onAddItem={mockOnAddItem}
        onDeleteItem={mockOnDeleteItem}
      />
    );
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[0]); // Click Delete for TOP001 (id: 1)
    
    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteItem).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteItem).toHaveBeenCalledWith(sampleBOMData[0].id);
  });
  
  it('does not call onDeleteItem if confirmation is cancelled', async () => {
    window.confirm = jest.fn(() => false); // Mock window.confirm to return false
    mockFetch(sampleBOMData);
    render(
      <NestedBOMView
        pumpId={mockPumpId}
        bomUpdateKey={0}
        onEditItem={mockOnEditItem}
        onAddItem={mockOnAddItem}
        onDeleteItem={mockOnDeleteItem}
      />
    );
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[0]);
    
    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteItem).not.toHaveBeenCalled();
  });


  it('re-fetches data when bomUpdateKey prop changes', async () => {
    mockFetch(sampleBOMData); // Initial fetch
    const { rerender } = render(
      <NestedBOMView
        pumpId={mockPumpId}
        bomUpdateKey={0}
        onEditItem={mockOnEditItem}
        onAddItem={mockOnAddItem}
        onDeleteItem={mockOnDeleteItem}
      />
    );
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    mockFetch([{ ...sampleBOMData[0], description: 'Updated Data' }]); // Data for second fetch
    rerender(
      <NestedBOMView
        pumpId={mockPumpId}
        bomUpdateKey={1} // Changed key
        onEditItem={mockOnEditItem}
        onAddItem={mockOnAddItem}
        onDeleteItem={mockOnDeleteItem}
      />
    );
    
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    // Optionally, check if the UI updates with 'Updated Data'
    await waitFor(() => expect(screen.getByText(/TOP001 - Updated Data/i)).toBeInTheDocument());
  });
});
