'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/firebase';

const SavedRoomsPage = () => {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [subscription, setSubscription] = useState('free');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          await fetchRooms(currentUser.uid);
          await fetchSubscription(currentUser.uid);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false); // Stop loading once the data is fetched
        }
      } else {
        setUser(null);
        setLoading(false);
        router.push('/sign-in');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchRooms = async (userId) => {
    const q = query(collection(db, 'rooms'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    setRooms(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchSubscription = async (userId) => {
    const userDoc = await getDocs(query(collection(db, 'users'), where('userId', '==', userId)));
    if (!userDoc.empty) {
      setSubscription(userDoc.docs[0].data().subscription || 'free');
    }
  };

  const viewRoom = (room) => {
    router.push({
      pathname: '/room-generation',
      query: { loadedRoom: JSON.stringify(room) },
    });
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (!user) {
    return null; // Prevent rendering while redirecting
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Your Saved Rooms</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-2">{room.name}</h2>
            <div className="relative h-48 mb-4">
              <Image
                src={room.previewImage || '/placeholder.svg'}
                alt={room.name}
                layout="fill"
                objectFit="cover"
                className="rounded"
              />
            </div>
            <p className="text-gray-600 mb-2">
              Created: {new Date(room.createdAt?.seconds * 1000).toLocaleDateString()}
            </p>
            <button
              onClick={() => viewRoom(room)}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors duration-300"
            >
              View Room
            </button>
          </div>
        ))}
      </div>
      <p className="mt-6 text-lg">
        Subscription status: {subscription === 'free' ? 'Free (1 room)' : 'Premium (5 rooms)'}
      </p>
    </div>
  );
};

export default SavedRoomsPage;
