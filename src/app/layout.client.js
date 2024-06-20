'use client';

import { useEffect } from 'react';
import { getToken, onMessageListener } from './firebase';

export default function ClientSideLogic() {
  useEffect(() => {
    getToken();

    onMessageListener()
      .then(payload => {
        console.log('Message received. ', payload);
        // Mesaj alındığında yapılacak işlemler
      })
      .catch(err => console.log('failed: ', err));
  }, []);

  return null;
}
