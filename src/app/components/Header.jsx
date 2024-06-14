'use client';

import React,{useState,useEffect} from 'react';
import { UserAuth } from '../context/AuthContext';

const Header = () => {
    const { user, googleSignIn, logOut } = UserAuth();
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        const checkAuthentication = async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
            setLoading(false);
        }
        checkAuthentication();
    }
    , [user]);


    return (
        <header className="bg-white shadow-md">
            <div className="container mx-auto p-4 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">ITS</h1>
                <nav>
                <ul className="flex space-x-4">
                        {loading ? null : !user ? (
                            <>
                                <li>
                                    <button
                                        onClick={handleSignIn}
                                        className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-900 text-white font-semibold rounded-lg transition duration-200 transform hover:scale-105"
                                    >
                                        Giriş Yap
                                    </button>
                                </li>
                            </>
                        ) : ( 
                            <>
                            <li className="flex items-center">
                                <span className="text-gray-800 font-semibold mx-auto">{user.displayName}</span>
                                </li>
                            <li>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition duration-200 transform hover:scale-105"
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
