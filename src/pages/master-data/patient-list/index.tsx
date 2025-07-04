import GenericDetailModal from "@/components/add-edit/v3";
import SearchBar from "@/components/search-bar";
import Button from "@/components/button";
import Pagination from "@/components/pagination";
import PageTitle from "@/components/page-title";
import blankProfilePicture from "@/assets/blank-profile-picture.png";

import { FaPlus } from "react-icons/fa";
import { Card } from "@/components/card";
import { PatientListSkeleton } from "@/components/table";
import { useState, useRef } from "react";
import { StorageService } from "@/utils/storage";
import { useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useMutation } from "@tanstack/react-query";
import type {
  Patient as PatientType,
  FieldConfig as FieldConfigPatient,
} from "@/types";
import { useMasterDataManagement } from "@/handlers/masterData";

const PatientList = () => {
  const [, setNewPatientImage] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(
    null,
  ) as React.RefObject<HTMLInputElement>;
  const location = useLocation();

  const {
    handlePageChange,
    itemsPerPage,
    isAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    setIsAddModalOpen,
    editingItem,
    setEditingItem,
    handleItemsPerPageChange,
    search,
    setSearch,
    debouncedSearch,
    currentPage,
    queryClient,
    openConfirmDialog,
    totalItems,
    queryError,
    data: patientsData,
    isLoading,
    isError,
    isFetching,
    handleKeyDown,
    handleEdit,
  } = useMasterDataManagement("patients", "Pasien", {
    realtime: true,
    searchInputRef,
    locationKey: location.key,
  });

  const patients = patientsData || [];
  const currentTotalItems = totalItems || 0;
  const selectedPatient = editingItem as PatientType | null;

  const updatePatient = async (updatedData: Partial<PatientType>) => {
    if (!selectedPatient || !selectedPatient.id) {
      console.error(
        "Tidak dapat memperbarui: selectedPatient atau ID-nya hilang.",
      );
      return;
    }
    const { ...dataToUpdate } = updatedData;

    const { error } = await supabase
      .from("patients")
      .update(dataToUpdate)
      .eq("id", selectedPatient.id);
    if (error) throw error;
  };

  const createPatient = async (newPatient: Partial<PatientType>) => {
    const dataToInsert = { ...newPatient };
    const { data, error } = await supabase
      .from("patients")
      .insert([dataToInsert])
      .select();
    if (error) throw error;
    return data[0];
  };

  const updatePatientMutation = useMutation<void, Error, Partial<PatientType>>({
    mutationFn: updatePatient,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      if (selectedPatient) {
        setEditingItem((prev) => (prev ? { ...prev, ...variables } : null));
      }
    },
    onError: (error) => {
      console.error("Error updating patient:", error);
      alert(`Gagal memperbarui pasien: ${error.message}`);
    },
  });

  const createPatientMutation = useMutation<
    PatientType,
    Error,
    Partial<PatientType>
  >({
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setIsAddModalOpen(false);
    },
    onError: (error) => {
      console.error("Error creating patient:", error);
      alert(`Gagal membuat pasien baru: ${error.message}`);
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", patientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setIsEditModalOpen(false);
      setEditingItem(null);
    },
    onError: (error: Error) => {
      console.error("Error deleting patient:", error);
      alert(`Gagal menghapus pasien: ${error.message}`);
    },
  });

  const updatePatientImageMutation = useMutation<
    string | undefined,
    Error,
    { entityId: string; file: File }
  >({
    mutationFn: async ({
      entityId,
      file,
    }: {
      entityId: string;
      file: File;
    }) => {
      const { data: patientData } = await supabase
        .from("patients")
        .select("image_url")
        .eq("id", entityId)
        .single();

      if (patientData?.image_url) {
        const oldPath = StorageService.extractPathFromUrl(
          patientData.image_url,
          "patients",
        );
        if (oldPath) {
          await StorageService.deleteEntityImage("patients", oldPath);
        }
      }

      const { publicUrl } = await StorageService.uploadEntityImage(
        "patients",
        entityId,
        file,
      );

      const { error } = await supabase
        .from("patients")
        .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", entityId);
      if (error) throw error;
      return publicUrl;
    },
    onSuccess: (newImageUrl) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      if (newImageUrl && selectedPatient) {
        setEditingItem((prev) =>
          prev ? { ...prev, image_url: newImageUrl } : null,
        );
      }
    },
    onError: (error) => console.error("Error updating patient image:", error),
  });

  const openPatientDetail = (patient: PatientType) => {
    handleEdit(patient);
  };

  const openAddPatientModal = () => {
    setIsAddModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  const handleDelete = (patient: PatientType) => {
    openConfirmDialog({
      title: "Konfirmasi Hapus",
      message: `Apakah Anda yakin ingin menghapus pasien "${patient.name}"? Tindakan ini tidak dapat diurungkan.`,
      variant: "danger",
      confirmText: "Hapus",
      onConfirm: () => deletePatientMutation.mutate(patient.id),
    });
  };

  const patientFields: FieldConfigPatient[] = [
    { key: "name", label: "Nama Pasien", type: "text", editable: true },
    {
      key: "gender",
      label: "Jenis Kelamin",
      type: "text",
      editable: true,
      isRadioDropdown: true,
      options: [
        { id: "Laki-laki", name: "Laki-laki" },
        { id: "Perempuan", name: "Perempuan" },
      ],
    },
    { key: "birth_date", label: "Tanggal Lahir", type: "date", editable: true },
    { key: "address", label: "Alamat", type: "textarea", editable: true },
    { key: "phone", label: "Telepon", type: "tel", editable: true },
    { key: "email", label: "Email", type: "email", editable: true },
  ];


  const emptyPatientData = {
    name: "",
    gender: "",
    birth_date: "",
    address: "",
    phone: "",
    email: "",
    image_url: null,
  };

  const totalPages = Math.ceil(currentTotalItems / itemsPerPage);

  return (
    <Card>
      <PageTitle title="Daftar Pasien" />

      <div className="mt-6 flex items-center">
        <SearchBar
          inputRef={searchInputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Cari nama pasien..."
          className="grow"
        />
        <Button
          variant="primary"
          withGlow
          className="flex items-center ml-4 mb-4"
          onClick={openAddPatientModal}
        >
          <FaPlus className="mr-2" />
          Tambah Pasien Baru
        </Button>
      </div>
      {isError && !isLoading && (
        <div className="text-center text-red-500">
          Error: {queryError?.message || "Gagal memuat data"}
        </div>
      )}

      <div
        className={`${
          isFetching ? "opacity-50 transition-opacity duration-300" : ""
        }`}
      >
        {!isError && (
          <>
            {isLoading && (!patients || patients.length === 0) ? (
              <PatientListSkeleton rows={8} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {patients && patients.length > 0 ? (
                  patients
                    .filter(
                      (patient): patient is PatientType =>
                        typeof patient === "object" &&
                        patient !== null &&
                        "name" in patient &&
                        "id" in patient,
                    )
                    .map((patient, index) => (
                      <div
                        key={patient.id}
                        onClick={() => openPatientDetail(patient)}
                        className={`bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow duration-200 ${
                          index === 0 && debouncedSearch
                            ? "ring-2 ring-emerald-400 bg-emerald-50"
                            : "hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <img
                              src={patient.image_url || blankProfilePicture}
                              alt={`Foto ${patient.name}`}
                              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  blankProfilePicture;
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {patient.name}
                            </h3>
                            <div className="mt-1 space-y-1">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">
                                  Jenis Kelamin:
                                </span>{" "}
                                {patient.gender || "-"}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">
                                  Tanggal Lahir:
                                </span>{" "}
                                {patient.birth_date
                                  ? new Date(
                                      patient.birth_date,
                                    ).toLocaleDateString("id-ID")
                                  : "-"}
                              </p>
                              <p className="text-sm text-gray-600 truncate">
                                <span className="font-medium">Alamat:</span>{" "}
                                {patient.address || "-"}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Telepon:</span>{" "}
                                {patient.phone || "-"}
                              </p>
                              <p className="text-sm text-gray-600 truncate">
                                <span className="font-medium">Email:</span>{" "}
                                {patient.email || "-"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="col-span-full text-center text-gray-500 py-10">
                    {debouncedSearch
                      ? `Tidak ada pasien dengan kata kunci "${debouncedSearch}"`
                      : "Belum ada data pasien."}
                  </div>
                )}
              </div>
            )}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={currentTotalItems}
              itemsPerPage={itemsPerPage}
              itemsCount={patients?.length || 0}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </>
        )}
      </div>

      <GenericDetailModal
        title={selectedPatient ? `${selectedPatient.name}` : ""}
        data={(selectedPatient as unknown) as Record<string, string | number | boolean | null> || {}}
        fields={patientFields}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={async (
          updatedData: Record<string, string | number | boolean | null>,
        ) => {
          if (selectedPatient) {
            await updatePatientMutation.mutateAsync(updatedData);
          }
          return Promise.resolve();
        }}
        onFieldSave={async (key: string, value: unknown) => {
          if (selectedPatient && selectedPatient.id) {
            const dataToUpdate: Partial<PatientType> = {
              id: selectedPatient.id,
              [key]: value,
            };
            await updatePatientMutation.mutateAsync(dataToUpdate);
          }
        }}
        onDeleteRequest={() => {
          if (selectedPatient) handleDelete(selectedPatient);
        }}
        deleteButtonLabel="Hapus Pasien"
        imageUrl={selectedPatient?.image_url || undefined}
        defaultImageUrl={blankProfilePicture}
        onImageSave={async (data: { entityId?: string; file: File }) => {
          const idToUse = data.entityId || selectedPatient?.id;
          if (idToUse) {
            await updatePatientImageMutation.mutateAsync({
              entityId: idToUse,
              file: data.file,
            });
          }
        }}
        imageUploadText="Unggah Foto Pasien"
        imageNotAvailableText="Foto pasien belum diunggah"
        mode="edit"
        imageAspectRatio="square"
      />

      <GenericDetailModal
        title="Tambah Pasien Baru"
        data={emptyPatientData}
        fields={patientFields}
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSave={async (newPatientData) => {
          await createPatientMutation.mutateAsync(newPatientData);
          return Promise.resolve();
        }}
        initialNameFromSearch={debouncedSearch}
        onImageSave={async (data: { entityId?: string; file: File }) => {
          if (data.entityId) {
            await updatePatientImageMutation.mutateAsync({
              entityId: data.entityId,
              file: data.file,
            });
          } else {
            setNewPatientImage(URL.createObjectURL(data.file));
          }
        }}
        imageUploadText="Unggah Foto Pasien (Opsional)"
        imageNotAvailableText="Foto pasien belum diunggah"
        mode="add"
        imageAspectRatio="square"
      />
    </Card>
  );
};

export default PatientList;
