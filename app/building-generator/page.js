'use client'

import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Box } from '@react-three/drei'


function Room({ position, color }) {
    return (
      <Box position={position} args={[1, 1, 1]}>
        <meshStandardMaterial color={color} />
      </Box>
    );
  }
  
  function Floor({ level, rooms }) {
    return (
      <group position={[0, level * 10, 0]}>
        {rooms.map((room, index) => (
          <Room key={index} position={room.position} color={room.color} />
        ))}
      </group>
    );
  }
  

export default function BuildingCreator() {
  const [floors, setFloors] = useState([
    {
      level: 0,
      rooms: [
        {
          id: 1,
          position: [0, 0, 0],
          color: '#FF0000',
        },
      ],
    },
  ])
  const [selectedRoom, setSelectedRoom] = useState({ floor: 0, index: 0 });
  const [isTopView, setIsTopView] = useState(false);

  const handleRoomMove = (floorLevel, roomIndex, newPosition) => {
    const newFloors = [...floors];
    newFloors[floorLevel].rooms[roomIndex].position = newPosition;
    setFloors(newFloors);
  };

  const handleRoomSelect = (floorLevel, roomIndex) => {
    setSelectedRoom({ floor: floorLevel, index: roomIndex });
  };

  const addFloor = () => {
    setFloors(prevFloors => [
      ...prevFloors,
      {
        level: prevFloors.length,
        rooms: [
          {
            id: Date.now(),
            position: [0, 0, 0],
            color: '#FF0000',
          },
        ],
      },
    ]);
  };

  const addRoom = () => {
    setFloors(prevFloors => {
      const newFloors = [...prevFloors];
      const currentFloor = newFloors[selectedRoom.floor];
      const newRoom = {
        id: Date.now(),
        position: [
          currentFloor.rooms[currentFloor.rooms.length - 1].position[0] + 15,
          0,
          0,
        ],
        color: '#00FF00',
      };
      currentFloor.rooms.push(newRoom);
      return newFloors;
    });
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-gray-100">
        <div className="flex gap-2">
          <button onClick={addFloor} className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Add Floor
          </button>
          <button onClick={addRoom} className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Add Room
          </button>
          <button onClick={() => setIsTopView(!isTopView)} className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            {isTopView ? 'Normal View' : 'Top View'}
          </button>
        </div>
      </div>
      <div className="flex-grow relative">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={isTopView ? [0, 100, 0] : [50, 50, 50]} rotation={isTopView ? [-Math.PI / 2, 0, 0] : [0, 0, 0]} />
          <OrbitControls />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} castShadow />
          {floors.map((floor) => (
            <Floor
              key={floor.level}
              level={floor.level}
              rooms={floor.rooms}
              onRoomMove={handleRoomMove}
              selectedRoom={selectedRoom}
              onRoomSelect={handleRoomSelect}
            />
          ))}
        </Canvas>
      </div>
    </div>
  )
}