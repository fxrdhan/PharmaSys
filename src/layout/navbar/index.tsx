import { useNavigate } from "react-router-dom";
import type { NavbarProps } from "@/types";
import { useState, useRef, useEffect } from "react";
import ImageUploader from "@/components/image-uploader";
import { useAuthStore } from "@/store/authStore";
import { usePresenceStore } from "@/store/presenceStore";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserCircle, FaPencilAlt, FaSignOutAlt, FaCog } from "react-icons/fa";
import DateTimeDisplay from "./live-datetime";

const Navbar = ({ sidebarCollapsed }: NavbarProps) => {
  const { user, logout } = useAuthStore();
  const { onlineUsers } = usePresenceStore();

  // Ensure at least 1 user is shown when logged in
  const displayOnlineUsers = user ? Math.max(1, onlineUsers) : onlineUsers;
  const [portalOpen, setPortalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const portalRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const [animatingPortal, setAnimatingPortal] = useState(false);

  const glowShadows = [
    "0 0 15px rgba(99, 102, 241, 0.7), 0 0 30px rgba(99, 102, 241, 0.5), 0 0 45px rgba(99, 102, 241, 0.3)",
    "0 0 20px rgba(245, 158, 11, 0.8), 0 0 40px rgba(239, 68, 68, 0.6), 0 0 60px rgba(236, 72, 153, 0.4)",
    "0 0 18px rgba(16, 185, 129, 0.8), 0 0 35px rgba(6, 182, 212, 0.6), 0 0 55px rgba(59, 130, 246, 0.4)",
    "0 0 22px rgba(139, 92, 246, 0.9), 0 0 45px rgba(217, 70, 239, 0.7), 0 0 65px rgba(245, 158, 11, 0.5)",
    "0 0 15px rgba(99, 102, 241, 0.7), 0 0 30px rgba(99, 102, 241, 0.5), 0 0 45px rgba(99, 102, 241, 0.3)",
  ];

  const glowTransition = {
    repeat: Infinity,
    duration: 4,
    ease: "easeInOut" as const,
  };

  const backgroundGradients = [
    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)",
    "linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)",
    "linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)",
    "linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #f59e0b 100%)",
    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)",
  ];

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setAnimatingPortal(true);
      setPortalOpen(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setAnimatingPortal(true);
    setPortalOpen(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    if (animatingPortal) {
      const timer = setTimeout(() => {
        setAnimatingPortal(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [animatingPortal]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        portalRef.current &&
        !portalRef.current.contains(event.target as Node)
      ) {
        setAnimatingPortal(true);
        setPortalOpen(false);
      }
    };
    if (portalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [portalOpen, portalRef]);

  const ProfileImage = ({ size = "small", className = "" }) => {
    const sizeClass =
      size === "small"
        ? "w-9 h-9"
        : size === "large"
          ? "w-32 h-32"
          : "w-24 h-24";
    const textSizeClass =
      size === "small" ? "text-sm" : size === "large" ? "text-3xl" : "text-2xl";

    return user?.profilephoto ? (
      <img
        src={user.profilephoto}
        alt="Profile"
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    ) : (
      <div
        className={`${sizeClass} rounded-full bg-linear-to-br from-primary to-primary/80 text-white flex items-center justify-center ${textSizeClass} ${className}`}
      >
        {user?.name ? (
          user.name.charAt(0).toUpperCase()
        ) : (
          <FaUserCircle
            className={
              size === "small"
                ? "text-base"
                : size === "large"
                  ? "text-3xl"
                  : ""
            }
          />
        )}
      </div>
    );
  };

  return (
    <nav className="bg-white px-6 py-3 sticky top-0 z-20">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex items-center h-8">
          <h1 className="flex items-center" style={{ minHeight: "2em" }}>
            <span
              className="text-2xl font-semibold text-gray-800"
              style={{
                display: "inline-block",
                verticalAlign: "top",
                lineHeight: "2em",
                height: "2em",
              }}
            >
              Pharma
            </span>
            <AnimatePresence>
              {sidebarCollapsed ? (
                <motion.span
                  key="sys_collapsed"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-2xl font-semibold text-gray-800"
                  style={{
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    verticalAlign: "top",
                    lineHeight: "2em",
                    height: "2em",
                  }}
                >
                  Sys
                </motion.span>
              ) : (
                <>
                  <motion.span
                    key="cy_part"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-2xl font-semibold text-gray-800"
                    style={{
                      display: "inline-block",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      verticalAlign: "top",
                      lineHeight: "2em",
                      height: "2em",
                    }}
                  >
                    cy
                  </motion.span>
                </>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  key="management_system_part"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="text-2xl font-semibold text-gray-800"
                  style={{
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    verticalAlign: "top",
                    lineHeight: "2em",
                    height: "2em",
                    marginLeft: "0.4rem",
                  }}
                >
                  Management System
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
              ←
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
              →
            </span>
          </button>
        </div>
        <div className="relative flex justify-end items-center space-x-3">
          <div
            className="flex items-center space-x-1.5 bg-primary/10 px-3 py-1.5 rounded-full text-sm text-primary transition-colors cursor-default ring-2 ring-primary/50"
            title={`${displayOnlineUsers} pengguna aktif`}
          >
            <span className="font-semibold">{displayOnlineUsers} Online</span>
          </div>

          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative w-12 h-12 flex items-center justify-center"
          >
            <button
              className="flex items-center space-x-3 p-1 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
              aria-expanded={portalOpen}
              aria-haspopup="true"
            >
              <div className="relative">
                <AnimatePresence>
                  {!portalOpen && (
                    <motion.div
                      initial={
                        animatingPortal
                          ? { opacity: 0, scale: 1.5 }
                          : { opacity: 1 }
                      }
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 2.5, y: -20, x: 20 }}
                      transition={{ duration: 0.25 }}
                      className="relative"
                    >
                      <motion.div
                        className="relative"
                        animate={{
                          boxShadow: glowShadows,
                        }}
                        transition={{
                          boxShadow: glowTransition,
                        }}
                        style={{
                          borderRadius: "50%",
                        }}
                      >
                        <ProfileImage
                          size="small"
                          className="transition-all duration-200"
                        />
                      </motion.div>
                      {/* <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div> */}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </button>

            <AnimatePresence>
              {portalOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/20 backdrop-blur-xs z-40"
                  />
                  <motion.div
                    ref={portalRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    initial={{
                      opacity: 0,
                      scale: 0.8,
                      transformOrigin: "top right",
                    }}
                    animate={{
                      opacity: 1,
                      scale: [0.8, 1.05, 1],
                      transformOrigin: "top right",
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.8,
                      transformOrigin: "top right",
                    }}
                    transition={{
                      duration: 0.3,
                      ease: "easeOut",
                      scale: {
                        times: [0, 0.6, 1],
                        duration: 0.3,
                      },
                    }}
                    className="fixed top-0 right-0 w-60 bg-white rounded-bl-2xl shadow-xl z-50 border border-gray-100 overflow-hidden backdrop-blur-xs"
                    style={{ marginTop: "0px" }}
                  >
                    <div className="p-4 pt-6">
                      <div className="flex flex-col items-center">
                        <div className="mb-4">
                          <motion.div
                            className="text-white px-4 py-1.5 rounded-full text-xs font-medium relative overflow-hidden"
                            initial={{
                              y: -20,
                              opacity: 0,
                              backgroundImage:
                                "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)",
                              boxShadow:
                                "0 0 15px rgba(99, 102, 241, 0.7), 0 0 30px rgba(99, 102, 241, 0.5), 0 0 45px rgba(99, 102, 241, 0.3)",
                            }}
                            animate={{
                              y: 0,
                              opacity: 1,
                              backgroundImage: backgroundGradients,
                              boxShadow: glowShadows,
                            }}
                            exit={{
                              y: -20,
                              opacity: 0,
                            }}
                            transition={{
                              y: { duration: 0.3, delay: 0.1, ease: "easeOut" },
                              opacity: {
                                duration: 0.3,
                                delay: 0.1,
                                ease: "easeOut",
                              },
                              backgroundImage: {
                                repeat: Infinity,
                                duration: 5,
                                ease: "easeInOut",
                                delay: 0.4,
                              },
                              boxShadow: {
                                ...glowTransition,
                                duration: 5,
                                delay: 0.4,
                              },
                            }}
                          >
                            <span className="flex items-center space-x-1.5">
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="font-bold">Pro Plan</span>
                            </span>
                          </motion.div>
                        </div>
                        <div className="relative group/upload">
                          <motion.div
                            initial={{
                              scale: 0.4,
                              y: -40,
                              x: 40,
                              opacity: animatingPortal ? 0 : 1,
                            }}
                            animate={{
                              scale: 1,
                              y: 0,
                              x: 0,
                              opacity: 1,
                            }}
                            exit={{
                              scale: 0.4,
                              y: -40,
                              x: 40,
                              opacity: 0,
                            }}
                            transition={{ duration: 0.25 }}
                          >
                            <ImageUploader
                              id="profile-upload"
                              className="w-32 h-32"
                              shape="full"
                              onImageUpload={async (file: File) => {
                                setIsUploading(true);
                                try {
                                  await useAuthStore
                                    .getState()
                                    .updateProfilePhoto(file);
                                } finally {
                                  setIsUploading(false);
                                }
                              }}
                              disabled={isUploading}
                              defaultIcon={
                                <FaPencilAlt className="text-white text-sm" />
                              }
                            >
                              <ProfileImage
                                size="large"
                                className="border-4 border-gray-100 group-hover/upload:border-gray/30 transition-all duration-200"
                              />
                            </ImageUploader>
                          </motion.div>
                          {isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 text-center">
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {user?.name || "User"}
                          </h3>
                          <p className="text-sm text-gray-500 mb-1">
                            {user?.role || "Staff"}
                          </p>
                          <p
                            className="text-xs text-gray-400 truncate max-w-[200px]"
                            title={user?.email || ""}
                          >
                            {user?.email || "Email tidak tersedia"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100"></div>

                    <div className="p-2">
                      <button
                        onClick={() => {
                          setPortalOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150 group"
                      >
                        <FaCog className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                        <span>Pengaturan Profil</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150 group"
                      >
                        <FaSignOutAlt className="text-red-500 group-hover:text-red-600 transition-colors" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
