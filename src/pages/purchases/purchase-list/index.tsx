import Button from "@/components/modules/button";
import Pagination from "@/components/modules/pagination";
import SearchBar from "@/components/modules/search-bar";
import PageTitle from "@/components/modules/page-title";
import Badge from "@/components/modules/badge";
import Loading from "@/components/modules/loading";
import UploadInvoicePortal from "@/components/modules/invoice-uploader";

import {
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableHeader,
} from "@/components/modules/table";
import { useConfirmDialog } from "@/components/modules/dialog-box";
import { Card } from "@/components/modules/card";
import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FaPlus, FaEdit, FaTrash, FaEye, FaFileUpload } from "react-icons/fa";
import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from "@tanstack/react-query";
import { useFieldFocus } from '@/hooks/fieldFocus';
import { useSupabaseRealtime } from '@/hooks/supabaseRealtime';

interface Purchase {
    id: string;
    invoice_number: string;
    date: string;
    total: number;
    payment_status: string;
    payment_method: string;
    supplier: {
        name: string;
    };
}

const PurchaseList = () => {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showUploadPortal, setShowUploadPortal] = useState(false);
    const queryClient = useQueryClient();
    const { openConfirmDialog } = useConfirmDialog();
    const searchInputRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;
    const location = useLocation();

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ["purchases", currentPage, debouncedSearch, itemsPerPage],
        queryFn: () => fetchPurchases(currentPage, debouncedSearch, itemsPerPage),
        placeholderData: keepPreviousData,
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 250);
        return () => clearTimeout(timer);
    }, [search]);

    useFieldFocus({
        searchInputRef,
        isLoading,
        isFetching,
        debouncedSearch,
        currentPage,
        itemsPerPage,
        locationKey: location.key,
    });

    useSupabaseRealtime('purchases', ['purchases']);

    const fetchPurchases = async (
        page: number,
        searchTerm: string,
        limit: number
    ) => {
        try {
            let query = supabase.from("purchases").select(`
                    id,
                    invoice_number,
                    date,
                    total,
                    payment_status,
                    payment_method,
                    supplier_id,
                    supplier:suppliers(name)
                `);

            let countQuery = supabase
                .from("purchases")
                .select("id", { count: "exact" });

            if (searchTerm) {
                query = query.ilike("invoice_number", `%${searchTerm}%`);
                countQuery = countQuery.ilike("invoice_number", `%${searchTerm}%`);
            }

            const { count, error: countError } = await countQuery;
            if (countError) throw countError;

            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error } = await query
                .order("date", { ascending: false })
                .range(from, to);

            if (error) throw error;

            const transformedData =
                data?.map((item) => ({
                    ...item,
                    supplier: Array.isArray(item.supplier)
                        ? item.supplier[0]
                        : item.supplier,
                })) || [];
            return { purchases: transformedData, totalItems: count || 0 };
        } catch (error) {
            console.error("Error fetching purchases:", error);
            throw error;
        }
    };

    useEffect(() => {
        queryClient.invalidateQueries({ queryKey: ['purchases'] });
    }, [queryClient]);

    const purchases = data?.purchases || [];
    const totalItems = data?.totalItems || 0;

    const deletePurchaseMutation = useMutation({
        mutationFn: async (id: string) => {
            const { data: purchaseItems, error: itemsError } = await supabase
                .from("purchase_items")
                .select("item_id, quantity, unit")
                .eq("purchase_id", id);

            if (itemsError) throw itemsError;

            for (const item of purchaseItems || []) {
                const { data: itemData } = await supabase
                    .from("items")
                    .select("stock, base_unit, unit_conversions")
                    .eq("id", item.item_id)
                    .single();

                if (itemData) {
                    let quantityInBaseUnit = item.quantity;

                    if (item.unit !== itemData.base_unit) {
                        const unitConversion = itemData.unit_conversions?.find(
                            (uc: { unit_name: string; conversion_rate: number }) =>
                                uc.unit_name === item.unit
                        );

                        if (unitConversion) {
                            quantityInBaseUnit =
                                item.quantity / unitConversion.conversion_rate;
                        }
                    }

                    const newStock = Math.max(
                        0,
                        (itemData.stock || 0) - quantityInBaseUnit
                    );
                    await supabase
                        .from("items")
                        .update({ stock: newStock })
                        .eq("id", item.item_id);
                }
            }

            const { error } = await supabase.from("purchases").delete().eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchases"] });
        },
        onError: (error) => {
            console.error("Error deleting purchase:", error);
            alert(`Gagal menghapus pembelian: ${error.message}`);
        },
    });

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handleItemsPerPageChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleDelete = (purchase: Purchase) => {
        openConfirmDialog({
            title: "Konfirmasi Hapus",
            message: `Apakah Anda yakin ingin menghapus pembelian dengan nomor faktur "${purchase.invoice_number}"? Tindakan ini juga akan mengembalikan stok item yang terkait.`,
            variant: "danger",
            confirmText: "Hapus",
            onConfirm: () => {
                deletePurchaseMutation.mutate(purchase.id);
            },
        });
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "paid":
                return "success";
            case "partial":
                return "warning";
            case "unpaid":
                return "danger";
            default:
                return "secondary";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "paid":
                return "Lunas";
            case "partial":
                return "Sebagian";
            case "unpaid":
                return "Belum Bayar";
            default:
                return status;
        }
    };

    const getPaymentMethodLabel = (method: string) => {
        switch (method) {
            case "cash":
                return "Tunai";
            case "transfer":
                return "Transfer";
            case "credit":
                return "Kredit";
            default:
                return method;
        }
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <>
            <Card
                className={isFetching ? "opacity-75 transition-opacity duration-300" : ""}
            >
                <div className="mb-6">
                    <PageTitle title="Daftar Pembelian" />
                </div>
                <div className="flex justify-between items-center">
                    <SearchBar
                        inputRef={searchInputRef}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nomor faktur..."
                        className="flex-grow"
                    />
                    <div className="flex space-x-2 ml-4 mb-4">
                        <Button
                            variant="primary"
                            onClick={() => setShowUploadPortal(true)}
                        >
                            <FaFileUpload className="mr-2" />
                            Upload Faktur
                        </Button>
                        <Link to="/purchases/create" state={{ initialInvoiceNumber: debouncedSearch }}>
                            <Button variant="primary">
                                <FaPlus className="mr-2" />
                                Tambah Pembelian Baru
                            </Button>
                        </Link>
                    </div>
                </div>
                {isLoading ? (
                    <Loading message="Memuat data pembelian..." />
                ) : (
                    <>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeader>No. Faktur</TableHeader>
                                    <TableHeader>Tanggal</TableHeader>
                                    <TableHeader>Supplier</TableHeader>
                                    <TableHeader className="text-right">Total</TableHeader>
                                    <TableHeader className="text-center">
                                        Status Pembayaran
                                    </TableHeader>
                                    <TableHeader className="text-center">
                                        Metode Pembayaran
                                    </TableHeader>
                                    <TableHeader className="text-center">Aksi</TableHeader>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {purchases.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-gray-600">
                                            {debouncedSearch
                                                ? `Tidak ada pembelian dengan kata kunci "${debouncedSearch}"`
                                                : "Tidak ada data pembelian yang ditemukan"}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    purchases.map((purchase) => (
                                        <TableRow key={purchase.id}>
                                            <TableCell>{purchase.invoice_number}</TableCell>
                                            <TableCell>
                                                {new Date(purchase.date).toLocaleDateString("id-ID", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                {purchase.supplier?.name || "Tidak ada supplier"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {purchase.total.toLocaleString("id-ID", {
                                                    style: "currency",
                                                    currency: "IDR",
                                                })}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant={getStatusBadgeVariant(purchase.payment_status)}
                                                >
                                                    {getStatusLabel(purchase.payment_status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getPaymentMethodLabel(purchase.payment_method)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center space-x-2">
                                                    <Link to={`/purchases/view/${purchase.id}`}>
                                                        <Button variant="primary" size="sm">
                                                            <FaEye />
                                                        </Button>
                                                    </Link>
                                                    <Link to={`/purchases/edit/${purchase.id}`}>
                                                        <Button variant="secondary" size="sm">
                                                            <FaEdit />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(purchase)}
                                                        disabled={
                                                            deletePurchaseMutation.isPending &&
                                                            deletePurchaseMutation.variables === purchase.id
                                                        }
                                                    >
                                                        {deletePurchaseMutation.isPending &&
                                                            deletePurchaseMutation.variables === purchase.id ? (
                                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                                                        ) : (
                                                            <FaTrash />
                                                        )}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            itemsPerPage={itemsPerPage}
                            itemsCount={purchases.length}
                            onPageChange={handlePageChange}
                            onItemsPerPageChange={handleItemsPerPageChange}
                        />
                    </>
                )}
            </Card>

            <UploadInvoicePortal
                isOpen={showUploadPortal}
                onClose={() => setShowUploadPortal(false)}
            />
        </>
    );
};

export default PurchaseList;
