import { useState, useEffect, useCallback, useRef } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";

const MainLayout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const isLockedRef = useRef(isLocked);

    useEffect(() => {
        isLockedRef.current = isLocked;
    }, [isLocked]);

    const expandSidebar = useCallback(() => {
        if (!isLocked) {
            setSidebarCollapsed(false);
        }
    }, [isLocked]);

    const collapseSidebarFunc = useCallback(() => {
        if (!isLocked) {
            setSidebarCollapsed(true);
        }
    }, [isLocked]);

    const toggleLock = useCallback(() => {
        setIsLocked((prevIsLocked) => {
            const newLockState = !prevIsLocked;
            if (newLockState && sidebarCollapsed) {
                setSidebarCollapsed(false);
            }
            return newLockState;
        });
    }, [sidebarCollapsed]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isLockedRef.current) {
                setSidebarCollapsed(true);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex h-screen bg-gray-100 text-gray-800">
            <Sidebar
                collapsed={sidebarCollapsed}
                isLocked={isLocked}
                toggleLock={toggleLock}
                expandSidebar={expandSidebar}
                collapseSidebar={collapseSidebarFunc}
            />

            <div className="flex flex-col flex-1 overflow-hidden">
                <Navbar sidebarCollapsed={sidebarCollapsed} />

                <main className="flex-1 overflow-y-auto p-4 text-gray-800">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
