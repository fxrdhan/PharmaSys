import Button from "@/components/button";
import SearchBar from "@/components/search-bar";
import PageTitle from "@/components/page-title";
import Pagination from "@/components/pagination";
import { useState, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ItemListSkeleton } from "@/components/table";
import { FaPlus } from "react-icons/fa";
import { Card } from "@/components/card";
import type { Item as ItemDataType, UnitConversion } from "@/types";
import AddItemPortal from "@/components/add-edit/v2";
import { useMasterDataManagement } from "@/handlers/masterData";
import { getSearchState } from "@/utils/search";
import DataGrid from "@/components/data-grid";
import { ColDef, RowClickedEvent, RowClassParams } from "ag-grid-community";

function ItemList() {
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(
    null,
  ) as React.RefObject<HTMLInputElement>;
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const {
    search,
    setSearch,
    debouncedSearch,
    currentPage,
    itemsPerPage,
    data: items,
    totalItems: totalItemsState,
    totalPages,
    isLoading: isLoadingState,
    isError: isErrorState,
    queryError: errorState,
    handlePageChange,
    handleItemsPerPageChange,
  } = useMasterDataManagement("items", "Item", {
    realtime: true,
    searchInputRef,
    isCustomModalOpen: isAddItemModalOpen,
    locationKey: location.key,
  });

  const [editingItemId, setEditingItemId] = useState<string | undefined>(
    undefined,
  );
  const [currentSearchQueryForModal, setCurrentSearchQueryForModal] = useState<
    string | undefined
  >(undefined);
  const [modalRenderId, setModalRenderId] = useState(0);

  const openAddItemModal = (itemId?: string, searchQuery?: string) => {
    // Set the data for the modal
    setEditingItemId(itemId);
    setCurrentSearchQueryForModal(searchQuery);

    // Ensure the modal is not in a closing state and is open
    setIsClosing(false);
    setIsAddItemModalOpen(true);

    // Force re-mount of the modal component by updating its key
    setModalRenderId((prevId) => prevId + 1);
  };

  const closeAddItemModal = () => {
    setIsClosing(true); // Trigger fade-out animation
    setTimeout(() => {
      setIsAddItemModalOpen(false); // Close modal after animation
      setIsClosing(false); // Reset closing state
      setEditingItemId(undefined);
      setCurrentSearchQueryForModal(undefined);
    }, 100); // Adjust timeout to match animation duration
  };

  const handleItemEdit = (item: ItemDataType) => {
    openAddItemModal(item.id);
  };

  const handleItemKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (items.length > 0) {
        const firstItem = items[0] as ItemDataType;
        openAddItemModal(firstItem.id);
      } else if (debouncedSearch.trim() !== "") {
        openAddItemModal(undefined, debouncedSearch);
      }
    }
  };

  const columnDefs: ColDef<ItemDataType>[] = useMemo(
    () => [
      {
        headerName: "Nama Item",
        field: "name",
        width: 200,
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => params.value || "-",
      },
      {
        headerName: "Kode",
        field: "code",
        width: 120,
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => params.value || "-",
      },
      {
        headerName: "Barcode",
        field: "barcode",
        width: 120,
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => params.value || "-",
      },
      {
        headerName: "Kategori",
        width: 120,
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => params.data?.category?.name || "-",
      },
      {
        headerName: "Jenis",
        width: 120,
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => params.data?.type?.name || "-",
      },
      {
        headerName: "Satuan",
        width: 100,
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => params.data?.unit?.name || "-",
      },
      {
        headerName: "Satuan Turunan",
        width: 140,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const conversions = params.data?.unit_conversions;
          if (conversions && conversions.length > 0) {
            return conversions
              .map((uc: UnitConversion) => uc.unit?.name || "N/A")
              .join(", ");
          }
          return "-";
        },
      },
      {
        headerName: "Harga Pokok",
        field: "base_price",
        width: 140,
        sortable: true,
        filter: "agNumberColumnFilter",
        cellClass: "text-right",
        cellRenderer: (params: any) => {
          if (params.value != null) {
            return params.value.toLocaleString("id-ID", {
              style: "currency",
              currency: "IDR",
            });
          }
          return "-";
        },
      },
      {
        headerName: "Harga Jual",
        field: "sell_price",
        width: 140,
        sortable: true,
        filter: "agNumberColumnFilter",
        cellClass: "text-right",
        cellRenderer: (params: any) => {
          if (params.value != null) {
            return params.value.toLocaleString("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            });
          }
          return "-";
        },
      },
      {
        headerName: "Stok",
        field: "stock",
        width: 80,
        sortable: true,
        filter: "agNumberColumnFilter",
        cellClass: "text-center",
        cellRenderer: (params: any) => params.value?.toString() || "0",
      },
    ],
    [],
  );

  const onRowClicked = (event: RowClickedEvent<ItemDataType>) => {
    const item = event.data as ItemDataType;
    handleItemEdit(item);
  };

  const getRowStyle = (params: RowClassParams<ItemDataType>) => {
    const isFirstItem = params.node.rowIndex === 0 && debouncedSearch;
    if (isFirstItem) {
      return { backgroundColor: "rgb(209 250 229 / 0.5)" }; // emerald-100/50
    }
    return undefined;
  };

  // Debug log untuk melihat perubahan data
  console.log("Current items state:", {
    length: items.length,
    isLoading: isLoadingState,
    isError: isErrorState,
    currentPage,
    totalItems: totalItemsState,
    items: items.slice(0, 2), // Show first 2 items for debugging
  });

  return (
    <>
      <Card
        className={
          isLoadingState
            ? "opacity-75 transition-opacity duration-300 flex-1 flex flex-col"
            : "flex-1 flex flex-col"
        }
      >
        <div className="mb-6">
          <PageTitle title="Daftar Item" />
        </div>
        <div className="flex items-center">
          <SearchBar
            inputRef={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleItemKeyDown}
            placeholder="Cari nama atau kode item..."
            className="grow"
            searchState={getSearchState(search, debouncedSearch, items)}
          />
          <Button
            variant="primary"
            withGlow
            className="flex items-center ml-4 mb-4"
            onClick={() => openAddItemModal(undefined, debouncedSearch)}
          >
            <FaPlus className="mr-2" />
            Tambah Item Baru
          </Button>
        </div>
        {isErrorState && (
          <div className="text-center p-6 text-red-500">
            Error:{" "}
            {errorState instanceof Error
              ? errorState.message
              : "Gagal memuat data"}
          </div>
        )}
        {!isErrorState && (
          <>
            {isLoadingState && items.length === 0 ? (
              <ItemListSkeleton rows={8} />
            ) : (
              <>
                <DataGrid<ItemDataType>
                  rowData={items as ItemDataType[]}
                  columnDefs={columnDefs}
                  onRowClicked={onRowClicked}
                  getRowStyle={getRowStyle}
                  searchQuery={debouncedSearch}
                  noDataMessage={
                    debouncedSearch
                      ? `Tidak ada item dengan nama "${debouncedSearch}"`
                      : "Tidak ada data item yang ditemukan"
                  }
                />
                {/* Debug info */}
                <div className="text-xs text-gray-500 mt-2">
                  Debug: {items.length} items loaded, Loading:{" "}
                  {isLoadingState.toString()}, Error: {isErrorState.toString()}
                </div>
              </>
            )}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItemsState}
              itemsPerPage={itemsPerPage}
              itemsCount={items.length}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </>
        )}
      </Card>
      <AddItemPortal
        key={`${
          editingItemId ?? "new"
        }-${currentSearchQueryForModal ?? ""}-${modalRenderId}`}
        isOpen={isAddItemModalOpen}
        onClose={closeAddItemModal}
        itemId={editingItemId}
        initialSearchQuery={currentSearchQueryForModal}
        isClosing={isClosing}
        setIsClosing={setIsClosing}
      />
    </>
  );
}

export default ItemList;
