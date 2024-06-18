'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserAuth } from '../context/AuthContext';
import { onMessageListener } from '../firebase'; // Firebase onMessageListener import edin
import { MdNotificationsNone } from 'react-icons/md';

const Header = () => {
    const { user, googleSignIn, logOut } = UserAuth();
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const router = useRouter();

    const handleSignIn = async () => {
        try {
            await googleSignIn();
        } catch (error) {
            console.error('Error signing in:', error);
        }
    }

    const handleSignOut = async () => {
        try {
            await logOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }

    const handleNavigation = () => {
        if (user) {
            router.push('/projects');
        } else {
            router.push('/');
        }
    }

    useEffect(() => {
        const checkAuthentication = async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
            setLoading(false);
        }
        checkAuthentication();
    }, [user]);

    useEffect(() => {
        onMessageListener()
            .then(payload => {
                setNotifications(prevNotifications => [
                    payload,
                    ...prevNotifications.slice(0, 2)
                ]);
            })
            .catch(err => console.log('failed: ', err));
    }, []);

    const handleOutsideClick = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowDropdown(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);

    return (
        <header className="bg-white shadow-md">
          <div className="container mx-auto p-4 flex justify-between items-center">
            <h1 
              className="text-3xl font-bold text-gray-800 cursor-pointer"
              onClick={handleNavigation}
            >
              ITS
            </h1>
            <nav>
              <ul className="flex items-center space-x-4 ">
                {loading ? null : !user ? (
                  <>
                    <li>
                      <button
                        onClick={handleSignIn}
                        className="py-2 px-4 bg-gray-700 hover:bg-gray-900 text-white font-semibold rounded-3xl transition duration-200 transform hover:scale-105"
                      >
                        Giriş Yap
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li className=" sm:hidden flex items-center justify-center">
                      <span className="text-gray-800 font-semibold mx-2">{user.displayName}</span>
                    </li>
                    <li className="relative">
                      <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="relative flex items-center justify-center"
                      >
                        <MdNotificationsNone className="h-8 w-8 sm:h-6 sm:w-6 text-gray-800 transform transition-transform duration-300 hover:translate-x-1" />
                      </button>
                      {showDropdown && (
                          <div ref={dropdownRef} className="absolute left-0  mt-2 w-80 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:mt-8 bg-white rounded-md shadow-lg overflow-hidden z-20 transition-all duration-300 transform origin-top-left">
                        <div className="py-2">
                            {notifications.length === 0 ? (
                              <div className="px-4 py-2 text-gray-700">
                                Henüz bildirim yok.
                              </div>
                            ) : (
                              notifications.map((notification, index) => (
                                <div key={index} className="px-4 py-2 text-gray-700 border-b border-gray-200">
                                  <p className="font-semibold">{notification.title}</p>
                                  <p>{notification.body}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                    <li>
                      <button
                        onClick={handleSignOut}
                        className="py-2 px-4 bg-red-700 hover:bg-red-700 text-white font-semibold rounded-3xl transition duration-200 transform hover:scale-105"
                      >
                        Çıkış Yap
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </nav>
          </div>
        </header>
      );
      
};

export default Header;
