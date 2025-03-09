"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserAuth } from "../context/AuthContext";
import { onMessageListener } from "../firebase"; // Firebase onMessageListener import edin
import {
  MdClose,
  MdMenu,
  MdDashboard,
  MdSettings,
  MdNotificationsNone,
  MdKeyboardArrowRight,
  MdKeyboardArrowDown,
  MdFolder,
  MdFolderOpen,
  MdKeyboardArrowLeft,
  MdArchive,
  MdAccountBalance,
} from "react-icons/md";
import { useSidebar } from "../context/SidebarContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { checkUpcomingPayments } from "../../utils/notificationUtils";
import { getToken } from "../firebase";
import { toast } from "react-toastify";
import { useTheme } from "next-themes";
import { MdLightMode, MdDarkMode } from "react-icons/md";

const Header = () => {
  const { user, googleSignIn, logOut } = UserAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const { isSidebarOpen, setSidebarOpen } = useSidebar();
  const [projects, setProjects] = useState([]);
  const [expandedProjects, setExpandedProjects] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [projectCategories, setProjectCategories] = useState({});
  const pathname = usePathname();
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [archivedCategoryName, setArchivedCategoryName] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleSignIn = async () => {
    try {
      await googleSignIn();
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleNavigation = () => {
    if (user) {
      router.push("/projects");
    } else {
      router.push("/");
    }
  };

  useEffect(() => {
    const checkAuthentication = async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      setLoading(false);
    };
    checkAuthentication();
  }, [user]);

  useEffect(() => {
    if (user) {
      const projectsCollection = collection(db, "projects");
      const q = query(
        projectsCollection,
        where("userId", "==", user.uid),
        where("isArchived", "==", false)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const projectsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projectsList);
      });

      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      projects.forEach((project) => {
        const categoriesCollection = collection(db, "categories");
        const q = query(
          categoriesCollection,
          where("projectId", "==", project.id)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const categoriesList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setProjectCategories((prev) => ({
            ...prev,
            [project.id]: categoriesList,
          }));
        });
        return () => unsubscribe();
      });
    }
  }, [user, projects]);

  useEffect(() => {
    if (pathname) {
      const { projectId, categoryId } = getPathIds(pathname);

      if (pathname.startsWith("/projects")) {
        setExpandedProjects(true);

        if (projectId) {
          setExpandedCategories({
            [projectId]: true,
          });
          setActiveProjectId(projectId);
          setActiveCategoryId(categoryId);
        } else {
          setExpandedCategories({});
          setActiveProjectId(null);
          setActiveCategoryId(null);
        }
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (user && pathname.startsWith("/archive")) {
      const projectsCollection = collection(db, "projects");
      const q = query(
        projectsCollection,
        where("userId", "==", user.uid),
        where("isArchived", "==", true)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const projectsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setArchivedProjects(projectsList);
      });

      return () => unsubscribe();
    }
  }, [user, pathname]);

  useEffect(() => {
    const fetchArchivedCategoryName = async () => {
      if (pathname.startsWith("/archive")) {
        const parts = pathname.split("/").filter(Boolean);
        if (parts.length === 3) {
          try {
            const categoryRef = doc(db, "categories", parts[2]);
            const categorySnap = await getDoc(categoryRef);
            if (categorySnap.exists()) {
              setArchivedCategoryName(categorySnap.data().name);
            }
          } catch (error) {
            console.error("Error fetching category:", error);
          }
        } else {
          setArchivedCategoryName(null);
        }
      }
    };

    fetchArchivedCategoryName();
  }, [pathname]);

  useEffect(() => {
    if (!user) return;

    // Bildirimleri veritabanından dinle
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter((n) => !n.read).length);
    });

    // Her 2 saatte bir yaklaşan ödemeleri kontrol et
    const checkInterval = setInterval(async () => {
      const upcomingPayments = await checkUpcomingPayments(user.uid);

      // Yeni bildirimleri veritabanına ekle
      for (const payment of upcomingPayments) {
        await addDoc(collection(db, "notifications"), {
          ...payment,
          userId: user.uid,
        });
      }
    }, 2 * 60 * 60 * 1000); // 2 saat

    return () => {
      unsubscribe();
      clearInterval(checkInterval);
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      const setupNotifications = async () => {
        try {
          const token = await getToken(user.uid);
          setNotificationsEnabled(!!token);
        } catch (error) {
          console.error("Bildirim kurulumu hatası:", error);
        }
      };

      setupNotifications();
    }
  }, [user]);

  const getPathIds = (path) => {
    const parts = path.split("/");
    return {
      projectId: parts[2] || null,
      categoryId: parts[3] || null,
    };
  };

  const handleOutsideClick = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleProjectClick = (projectId) => {
    router.push(`/projects/${projectId}`);
    setExpandedCategories((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const handleCategoryClick = (projectId, categoryId) => {
    router.push(`/projects/${projectId}/${categoryId}`);
    setActiveCategoryId(categoryId);
  };

  const handleArchiveClick = () => {
    router.push("/archive");
    setExpandedProjects(false);
    setExpandedCategories({});
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      // Bildirimi okundu olarak işaretle
      const notificationRef = doc(db, "notifications", notification.id);
      await updateDoc(notificationRef, {
        read: true,
      });
    }

    // Bildirimle ilgili sayfaya yönlendir
    if (notification.type === "payment") {
      router.push(
        `/projects/${notification.projectId}/${notification.categoryId}`
      );
      setShowDropdown(false);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      // Önce tarayıcı desteğini kontrol et
      if (!("Notification" in window)) {
        toast.error("Tarayıcınız bildirimleri desteklemiyor!");
        return;
      }

      // Mevcut izin durumunu kontrol et
      if (Notification.permission === "denied") {
        toast.error(
          "Bildirim izni reddedildi. Lütfen tarayıcı ayarlarından izin verin."
        );
        return;
      }

      // Service Worker desteğini kontrol et
      if (!("serviceWorker" in navigator)) {
        toast.error("Tarayıcınız Service Worker'ı desteklemiyor!");
        return;
      }

      // FCM token al
      const token = await getToken(user.uid);

      if (token) {
        setNotificationsEnabled(true);
        toast.success("Bildirimler başarıyla etkinleştirildi!");
      } else {
        toast.error("Bildirimler etkinleştirilemedi. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error("Bildirim izni hatası:", error);
      toast.error("Bildirim izni alınamadı: " + error.message);
    }
  };

  const renderSidebarContent = () => (
    <nav className="space-y-2">
      <div className="space-y-1">
        <button
          onClick={() => {
            router.push("/projects");
            setExpandedProjects(!expandedProjects);
          }}
          className={`w-full flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 
            rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800
            transition-all duration-200 group relative
            ${isSidebarOpen ? "" : "justify-center"}
            ${
              pathname.startsWith("/projects") && !pathname.includes("archive")
                ? "bg-gray-50/50 dark:bg-gray-800/50"
                : ""
            }
          `}
        >
          <MdDashboard
            className={`flex-shrink-0 ${
              pathname.startsWith("/projects") && !pathname.includes("archive")
                ? "text-blue-500"
                : ""
            }`}
            size={24}
          />
          {isSidebarOpen && (
            <>
              <span
                className={`ml-3 font-medium ${
                  pathname.startsWith("/projects") &&
                  !pathname.includes("archive")
                    ? "text-gray-900 dark:text-white"
                    : ""
                }`}
              >
                Projeler
              </span>
              <span className="ml-auto">
                {expandedProjects ? (
                  <MdKeyboardArrowDown
                    size={20}
                    className="text-gray-500 dark:text-gray-400"
                  />
                ) : (
                  <MdKeyboardArrowRight
                    size={20}
                    className="text-gray-500 dark:text-gray-400"
                  />
                )}
              </span>
            </>
          )}
        </button>

        {isSidebarOpen && expandedProjects && (
          <div className="ml-4 space-y-1">
            {projects.length === 0 ? (
              <div className="ml-8 px-4 py-3 text-xs text-gray-500">
                <div className="flex items-center text-gray-400">
                  <span className="font-normal">Henüz proje yok</span>
                </div>
              </div>
            ) : (
              projects.map((project) => {
                const isCurrentProject = project.id === activeProjectId;
                return (
                  <div key={project.id} className="space-y-1">
                    <button
                      onClick={() => handleProjectClick(project.id)}
                      className={`w-full flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg
                        ${isCurrentProject ? "bg-gray-50 dark:bg-gray-800" : ""}
                      `}
                    >
                      {expandedCategories[project.id] ? (
                        <MdFolderOpen
                          size={20}
                          className={
                            isCurrentProject
                              ? "text-blue-500 dark:text-blue-400 mr-2"
                              : "text-gray-500 dark:text-gray-400 mr-2"
                          }
                        />
                      ) : (
                        <MdFolder
                          size={20}
                          className={
                            isCurrentProject
                              ? "text-blue-500 dark:text-blue-400 mr-2"
                              : "text-gray-500 dark:text-gray-400 mr-2"
                          }
                        />
                      )}
                      <span
                        className={`truncate ${
                          isCurrentProject
                            ? "text-gray-900 dark:text-gray-100 font-medium"
                            : ""
                        }`}
                      >
                        {project.name}
                      </span>
                      <span className="ml-auto">
                        {expandedCategories[project.id] ? (
                          <MdKeyboardArrowDown
                            size={18}
                            className="text-gray-400"
                          />
                        ) : (
                          <MdKeyboardArrowRight
                            size={18}
                            className="text-gray-400"
                          />
                        )}
                      </span>
                    </button>

                    {expandedCategories[project.id] && (
                      <div className="space-y-1">
                        {!projectCategories[project.id] ||
                        projectCategories[project.id].length === 0 ? (
                          <div className="ml-8 px-4 py-3 text-xs text-gray-500">
                            <div className="flex items-center text-gray-400">
                              <span className="font-normal">
                                Henüz kategori yok
                              </span>
                            </div>
                          </div>
                        ) : (
                          projectCategories[project.id].map((category) => {
                            const isCurrentCategory =
                              category.id === activeCategoryId;
                            return (
                              <button
                                key={category.id}
                                onClick={() =>
                                  handleCategoryClick(project.id, category.id)
                                }
                                className={`
                                  w-full flex items-center pl-10 py-2 text-gray-500 
                                  hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm group
                                  ${
                                    isCurrentCategory
                                      ? "bg-gray-50 dark:bg-gray-800"
                                      : ""
                                  }
                                `}
                              >
                                <div className="flex-shrink-0 w-5 flex items-center">
                                  <div
                                    className={`
                                      w-2 h-2 rounded-full
                                      transition-all duration-200
                                      ${
                                        isCurrentCategory
                                          ? "bg-blue-500 dark:bg-blue-400 ring-2 ring-blue-100"
                                          : "bg-gray-400 dark:bg-gray-400"
                                      }
                                    `}
                                  />
                                </div>
                                <span
                                  className={`
                                    truncate transition-colors
                                    ${
                                      isCurrentCategory
                                        ? "text-gray-900 dark:text-gray-100 font-medium"
                                        : "group-hover:text-gray-900 dark:group-hover:text-gray-100"
                                    }
                                  `}
                                >
                                  {category.name}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        <button
          onClick={() => router.push("/accounting")}
          className={`w-full flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 
            rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800
            transition-all duration-200 group relative
            ${isSidebarOpen ? "" : "justify-center"}
            ${
              pathname.startsWith("/accounting")
                ? "bg-gray-50/50 dark:bg-gray-800/50"
                : ""
            }
          `}
        >
          <MdAccountBalance
            className={`flex-shrink-0 ${
              pathname.startsWith("/accounting") ? "text-blue-500" : ""
            }`}
            size={24}
          />
          {isSidebarOpen && (
            <span
              className={`ml-3 font-medium ${
                pathname.startsWith("/accounting")
                  ? "text-gray-700 dark:text-gray-200"
                  : ""
              }`}
            >
              Muhasebe
            </span>
          )}
        </button>
      </div>

      <div className="absolute bottom-4 left-0 right-0 px-4">
        <button
          onClick={handleArchiveClick}
          className={`w-full flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 
            rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800
            transition-all duration-200 group relative
            ${isSidebarOpen ? "" : "justify-center"}
            ${
              pathname === "/archive" ? "bg-gray-50/50 dark:bg-gray-800/50" : ""
            }`}
        >
          <MdArchive
            className={`flex-shrink-0 ${
              pathname === "/archive" ? "text-blue-500" : ""
            }`}
            size={24}
          />
          {isSidebarOpen && (
            <span
              className={`ml-3 font-medium ${
                pathname === "/archive"
                  ? "text-gray-700 dark:text-gray-200"
                  : ""
              }`}
            >
              Arşiv
            </span>
          )}
        </button>
      </div>
    </nav>
  );

  const getCurrentPageTitle = () => {
    const parts = pathname.split("/").filter(Boolean);
    const segments = [];

    if (parts.length === 0) {
      segments.push({ title: "Ana Sayfa", path: "/" });
    } else {
      parts.forEach((part, index) => {
        let path = "/" + parts.slice(0, index + 1).join("/");
        let title = "";

        switch (part) {
          case "projects":
            title = "Projeler";
            break;
          case "archive":
            title = "Arşiv";
            break;
          case "accounting":
            title = "Muhasebe Yönetimi";
            break;
          default:
            if (index === 1 && parts[0] === "projects") {
              const project = projects.find((p) => p.id === part);
              title = project ? project.name : part;
            } else if (index === 2 && parts[0] === "projects") {
              const categories = projectCategories[parts[1]] || [];
              const category = categories.find((c) => c.id === part);
              title = category ? category.name : part;
            } else if (index === 1 && parts[0] === "archive") {
              const project = archivedProjects.find((p) => p.id === part);
              title = project ? project.name : part;
            } else if (index === 2 && parts[0] === "archive") {
              title = archivedCategoryName || part;
            }
        }

        segments.push({ title, path });
      });
    }

    return segments;
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <>
      {user && (
        <aside
          className={`
            fixed left-0 top-0 h-full bg-white dark:bg-gray-900 
            border-r border-gray-200 dark:border-gray-700 shadow-sm
            transition-all duration-300 ease-in-out z-20
            ${isSidebarOpen ? "w-64" : "w-20"}
          `}
        >
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <span
                onClick={() => router.push("/projects")}
                className={`font-semibold text-xl 
                  transition-all duration-300 ease-in-out
                  cursor-pointer hover:text-gray-600 dark:text-white dark:hover:text-gray-300
                  ${
                    isSidebarOpen
                      ? "opacity-100 w-auto"
                      : "opacity-0 w-0 overflow-hidden"
                  }`}
              >
                MYS
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isSidebarOpen ? (
                <MdKeyboardArrowLeft
                  size={24}
                  className="text-gray-600 dark:text-gray-300"
                />
              ) : (
                <MdMenu
                  size={24}
                  className="text-gray-600 dark:text-gray-300"
                />
              )}
            </button>
          </div>

          <div className="p-4">{renderSidebarContent()}</div>
        </aside>
      )}

      <header
        className={`
          fixed top-0 right-0 bg-white dark:bg-gray-900 
          border-b border-gray-200 dark:border-gray-700 z-10 
          transition-all duration-300 ease-in-out
          ${user ? (isSidebarOpen ? "left-64" : "left-20") : "left-0"}
        `}
      >
        <div className="px-6 h-16 flex items-center justify-between">
          <h1
            className={`text-xl font-bold text-gray-800 
              transition-all duration-300 ease-in-out`}
          >
            {user && isSidebarOpen ? (
              <div className="flex items-center gap-2">
                {getCurrentPageTitle().map((segment, index) => (
                  <React.Fragment key={segment.path}>
                    {index > 0 && (
                      <span className="text-gray-400 font-normal dark:text-gray-300">
                        /
                      </span>
                    )}
                    <button
                      onClick={() => router.push(segment.path)}
                      className="hover:text-blue-600 transition-colors dark:text-gray-300 dark:hover:text-gray-100"
                    >
                      {segment.title}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <button
                onClick={handleNavigation}
                className="hover:text-gray-600 cursor-pointer dark:text-gray-300 dark:hover:text-gray-100"
              >
                MYS
              </button>
            )}
          </h1>
          <nav>
            <ul className="flex items-center space-x-4">
              {loading ? null : !user ? (
                <li>
                  <button
                    onClick={handleSignIn}
                    className="flex items-center gap-2 py-2 px-4 bg-white border-2 border-gray-200 
                    hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg 
                    transition-all duration-200 shadow-sm"
                  >
                    <img src="/google.svg" alt="Google" className="w-5 h-5" />
                    Google ile Giriş Yap
                  </button>
                </li>
              ) : (
                <>
                  <li className="relative">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <MdNotificationsNone className="h-6 w-6 text-gray-700" />
                      {!notificationsEnabled && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full">
                          <span className="sr-only">
                            Bildirimleri etkinleştir
                          </span>
                        </div>
                      )}
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    {showDropdown && (
                      <div
                        ref={dropdownRef}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg 
                        overflow-hidden z-20 transition-all duration-300 transform origin-top-right"
                      >
                        <div className="py-2">
                          <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">
                              Bildirimler
                            </h3>
                            {unreadCount > 0 && (
                              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                {unreadCount} yeni
                              </span>
                            )}
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="px-4 py-2 text-gray-700">
                                Henüz bildirim yok.
                              </div>
                            ) : (
                              notifications.map((notification) => (
                                <div
                                  key={notification.id}
                                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100
                                    ${
                                      notification.read
                                        ? "bg-white"
                                        : "bg-blue-50"
                                    }`}
                                  onClick={() =>
                                    handleNotificationClick(notification)
                                  }
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-semibold text-gray-900">
                                        {notification.title}
                                      </p>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {notification.body}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {new Date(
                                          notification.createdAt.toDate()
                                        ).toLocaleString("tr-TR")}
                                      </p>
                                    </div>
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          {!notificationsEnabled && (
                            <div className="px-4 py-2 border-b border-gray-200">
                              <button
                                onClick={requestNotificationPermission}
                                className="w-full text-left text-sm text-blue-600 hover:text-blue-800"
                              >
                                Bildirimleri etkinleştir
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                  <div className="h-6 w-px bg-gray-200 mx-2" />
                  <li className="hidden sm:block">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-8 h-8 rounded-full border-2 border-gray-200"
                      />
                      <span className="text-gray-700 font-medium">
                        {user.displayName}
                      </span>
                    </div>
                  </li>
                  <li>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 py-2 px-4 text-gray-700 hover:text-red-600 
                      font-medium rounded-lg transition-all duration-200 hover:bg-red-50 border-2 
                      border-transparent hover:border-red-100"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Çıkış Yap
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={toggleTheme}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      aria-label="Tema Değiştir"
                    >
                      {theme === "light" ? (
                        <MdDarkMode className="h-6 w-6 text-gray-700 dark:text-gray-200" />
                      ) : (
                        <MdLightMode className="h-6 w-6 text-gray-200" />
                      )}
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;
