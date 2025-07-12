import { AgGridReact } from "ag-grid-react";
import { ColDef, RowClickedEvent, RowClassParams, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { useMemo } from "react";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface DataGridProps<T = unknown> {
  rowData: T[];
  columnDefs: ColDef<T>[];
  onRowClicked?: (event: RowClickedEvent<T>) => void;
  getRowStyle?: (params: RowClassParams<T>) => Record<string, unknown> | undefined;
  height?: string | number;
  className?: string;
  noDataMessage?: string;
  searchQuery?: string;
}

export default function DataGrid<T = unknown>({
  rowData,
  columnDefs,
  onRowClicked,
  getRowStyle,
  height = '500px',
  className = '',
  noDataMessage,
  searchQuery
}: DataGridProps<T>) {
  const defaultColDef: ColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: false,
    editable: false,
  }), []);

  const overlayTemplate = useMemo(() => {
    if (noDataMessage) {
      return `
        <div class="text-center text-gray-500 py-10">
          ${noDataMessage}
        </div>
      `;
    }
    
    return `
      <div class="text-center text-gray-500 py-10">
        ${searchQuery
          ? `Tidak ada data dengan pencarian "${searchQuery}"`
          : "Tidak ada data yang ditemukan"}
      </div>
    `;
  }, [noDataMessage, searchQuery]);

  return (
    <div 
      className={`ag-theme-alpine w-full ${className}`}
      style={{ 
        height,
        minHeight: height,
        border: '1px solid #e2e8f0',
        borderRadius: '8px'
      }}
    >
      <AgGridReact<T>
        theme="legacy"
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onRowClicked={onRowClicked}
        getRowStyle={getRowStyle}
        suppressCellFocus={true}
        rowSelection={{
          mode: 'singleRow',
          enableClickSelection: false
        }}
        rowClass="cursor-pointer hover:bg-blue-50"
        headerHeight={45}
        rowHeight={50}
        animateRows={true}
        suppressMovableColumns={true}
        domLayout="normal"
        overlayNoRowsTemplate={overlayTemplate}
        onGridReady={(params) => {
          setTimeout(() => {
            params.api.sizeColumnsToFit();
            params.api.resetRowHeights();
          }, 100);
        }}
      />
    </div>
  );
}