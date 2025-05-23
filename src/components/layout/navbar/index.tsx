import { useNavigate } from 'react-router-dom';
import type { NavbarProps } from '@/types';
import { useState, useRef, useEffect } from 'react';
import { ImageUploader } from '@/components/modules';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserCircle, FaPencilAlt } from 'react-icons/fa';
import DateTimeDisplay from './live-datetime';

const Navbar = ({ sidebarCollapsed }: NavbarProps) => {
    const { user, logout } = useAuthStore();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const handleLogout = async () => {
        await logout();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen, dropdownRef]);

    return (
        <nav className="bg-white border-b px-6 py-3 sticky top-0 z-20">
            <div className="grid grid-cols-[1fr,auto,1fr] items-center">
                <div className="flex items-center h-8">
                    <h1 className="text-xl font-semibold text-gray-800 flex items-baseline" style={{ minHeight: '1.5em' }}>
                        <span>Pharma</span>
                        <AnimatePresence>
                            {!sidebarCollapsed && (
                                <motion.span
                                    key="space_after_pharma_part"
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden' }}
                                >
                                    &nbsp;
                                </motion.span>
                            )}
                        </AnimatePresence>
                        <span>Sys</span>
                        <AnimatePresence>
                            {!sidebarCollapsed && (
                                <motion.span
                                    key="tem_part"
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.2, delay: 0.05 }}
                                    style={{ display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden' }}
                                >
                                    tem
                                </motion.span>
                            )}
                            {!sidebarCollapsed && (
                                <motion.span
                                    key="app_part"
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.2, delay: 0.1 }}
                                    style={{ display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden' }}
                                >
                                    &nbsp;App
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </h1>
                </div>
                <div className="flex items-center justify-center space-x-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 pb-3 w-10 rounded-full group active:scale-90 transition-transform duration-100"
                        aria-label="Go Back"
                        title="Go Back"
                    >
                        <span className="text-gray-600 font-bold text-lg inline-block group-hover:text-primary group-hover:scale-120 transition duration-150">
                            &lt;
                        </span>
                    </button>

                    <DateTimeDisplay />

                    <button
                        onClick={() => navigate(1)}
                        className="p-2 pb-3 w-10 rounded-full group active:scale-90 transition-transform duration-100"
                        aria-label="Go Forward"
                        title="Go Forward"
                    >
                        <span className="text-gray-600 font-bold text-lg inline-block group-hover:text-primary group-hover:scale-120 transition duration-150">
                            &gt;
                        </span>
                    </button>
                </div>
                <div className="relative flex justify-end">
                    <button
                        className="flex items-center space-x-2"
                        onClick={toggleDropdown}
                        aria-expanded={dropdownOpen}
                        aria-haspopup="true"
                    >
                        {user?.profilephoto ? (
                            <img src={user.profilephoto} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                                {user?.name ? user.name.charAt(0).toUpperCase() : <FaUserCircle size={20} />}
                            </div>
                        )}
                        <span className="font-medium">{user?.name || 'User'}</span>
                    </button>

                    {dropdownOpen && (
                        <div
                            ref={dropdownRef}
                            className="absolute right-0 mt-10 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200 overflow-hidden"
                        >
                            <div className="p-4">
                                <div className="flex justify-center mb-3">
                                    <ImageUploader
                                        id="profile-upload"
                                        className="w-16 h-16"
                                        shape="full"
                                        onImageUpload={async (base64) => {
                                            setIsUploading(true);
                                            try {
                                                await useAuthStore.getState().updateProfilePhoto(base64);
                                            } finally {
                                                setIsUploading(false);
                                            }
                                        }}
                                        disabled={isUploading}
                                        defaultIcon={<FaPencilAlt className="text-white text-lg" />}
                                    >
                                        {user?.profilephoto ? (
                                            <img src={user.profilephoto} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-3xl">
                                                {user?.name ? user.name.charAt(0).toUpperCase() : <FaUserCircle />}
                                            </div>
                                        )}
                                    </ImageUploader>
                                </div>
                                <p className="text-center text-sm text-gray-700 font-medium truncate" title={user?.email || ''}>
                                    {user?.email || 'Email tidak tersedia'}
                                </p>
                            </div>
                            <div className="border-t border-gray-100"></div>
                            <div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;