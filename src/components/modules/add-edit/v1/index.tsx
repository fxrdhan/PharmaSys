import Input from "@/components/modules/input";
import Button from "@/components/modules/button";
import DescriptiveTextarea from "@/components/modules/descriptive-textarea";
import { useConfirmDialog } from "@/components/modules/dialog-box";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";
import type { AddEditModalProps } from "@/types";
import { Transition, TransitionChild } from "@headlessui/react";
import React, { useState, useEffect, Fragment, useRef } from "react";

const AddEditModal: React.FC<AddEditModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData = null,
    onDelete,
    isLoading = false,
    isDeleting = false,
    entityName = "Kategori",
    initialNameFromSearch,
}) => {
    useConfirmDialog();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const nameInputRef = useRef<HTMLInputElement>(null);
    const isEditMode = Boolean(initialData);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setDescription(initialData.description || "");
            } else if (initialNameFromSearch) {
                setName(initialNameFromSearch);
                setDescription("");
            } else {
                setName("");
                setDescription("");
            }
            setTimeout(() => {
                nameInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, initialData, initialNameFromSearch]);

    const handleSave = async () => {
        if (!name.trim()) {
            alert(`Nama ${entityName.toLowerCase()} tidak boleh kosong.`);
            return;
        }
        await onSubmit({ id: initialData?.id, name, description });
    };

    const handleDelete = () => {
        if (initialData && onDelete) {
            onDelete(initialData.id);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <Transition show={isOpen} as={Fragment}>
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
                <TransitionChild
                    as={Fragment}
                    enter="transition-opacity duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        aria-hidden="true"
                        onClick={handleBackdropClick}
                    />
                </TransitionChild>

                <TransitionChild
                    as={Fragment}
                    enter="transition-all duration-200 ease-out"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="transition-all duration-200 ease-in"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-semibold">
                                {isEditMode
                                    ? `Edit ${entityName}`
                                    : `Tambah ${entityName} Baru`}
                            </h2>
                            <Button
                                variant="text"
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700 p-1"
                            >
                                <FaTimes size={20} />
                            </Button>
                        </div>
                        <div className="p-6 space-y-4">
                            <Input
                                ref={nameInputRef}
                                label={`Nama ${entityName}`}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={`Masukkan nama ${entityName.toLowerCase()}`}
                                required
                                readOnly={isLoading || isDeleting}
                            />

                            <DescriptiveTextarea
                                label="Deskripsi"
                                name="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Masukkan deskripsi singkat"
                                readOnly={isLoading || isDeleting}
                                textareaClassName="text-sm min-h-[80px] resize-none"
                                rows={3}
                                showInitially={!!(initialData?.description || description)}
                            />
                        </div>
                        <div className="flex justify-between p-4 border-t">
                            <div>
                                {isEditMode && onDelete ? (
                                    <Button
                                        type="button"
                                        variant="danger"
                                        onClick={handleDelete}
                                        isLoading={isDeleting}
                                        disabled={isLoading || isDeleting}
                                    >
                                        Hapus
                                    </Button>
                                ) : (
                                    <Button type="button" variant="outline" onClick={onClose}>
                                        Batal
                                    </Button>
                                )}
                            </div>
                            <div>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={handleSave}
                                    isLoading={isLoading}
                                    disabled={isLoading || !name.trim()}
                                >
                                    Simpan
                                </Button>
                            </div>
                        </div>
                    </div>
                </TransitionChild>
            </div>
        </Transition>,
        document.body
    );
};

export default AddEditModal;