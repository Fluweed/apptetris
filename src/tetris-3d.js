import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Physics, RigidBody } from "@react-three/rapier";
import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

const GRID_WIDTH = 12;
const GRID_DEPTH = 12;
const CUBE_SIZE = 1;
const FALL_SPEED = 0.04;

const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"];

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const TETRIS_PIECES = [
  // I piece
  [
    [[0, 0], [0, 1], [0, 2], [0, 3]],
    [[0, 0], [1, 0], [2, 0], [3, 0]],
  ],
  // O piece
  [
    [[0, 0], [1, 0], [0, 1], [1, 1]],
  ],
  // T piece
  [
    [[0, 0], [1, 0], [2, 0], [1, 1]],
    [[1, 0], [0, 1], [1, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[0, 0], [0, 1], [1, 1], [0, 2]],
  ],
  // L piece
  [
    [[0, 0], [0, 1], [0, 2], [1, 2]],
    [[0, 0], [1, 0], [2, 0], [0, 1]],
    [[0, 0], [1, 0], [1, 1], [1, 2]],
    [[0, 0], [1, 0], [2, 0], [2, 1]],
  ],
  // J piece
  [
    [[1, 0], [1, 1], [1, 2], [0, 2]],
    [[0, 0], [1, 0], [2, 0], [2, 1]],
    [[0, 0], [1, 0], [0, 1], [0, 2]],
    [[0, 0], [1, 0], [2, 0], [0, 1]],
  ],
  // S piece
  [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],
  // Z piece
  [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[1, 0], [0, 1], [1, 1], [0, 2]],
  ],
];

const getRandomPiece = () => {
  const piece = TETRIS_PIECES[Math.floor(Math.random() * TETRIS_PIECES.length)];
  const rotation = Math.floor(Math.random() * piece.length);
  return piece[rotation].map(([x, y]) => ({ position: [x, y], color: getRandomColor() }));
};

const Tetris3D = () => {
  const [cubes, setCubes] = useState([]);
  const [currentPiece, setCurrentPiece] = useState(null);
  const [position, setPosition] = useState([GRID_WIDTH / 2 - CUBE_SIZE / 2, 10, GRID_DEPTH / 2 - CUBE_SIZE / 2]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  const handleKeyDown = (event) => {
    if (!currentPiece) return;
    switch (event.key) {
      case "a":
        moveLeft();
        break;
      case "d":
        moveRight();
        break;
      case "w":
        moveForward();
        break;
      case "s":
        moveBackward();
        break;
      case " ":
        dropPiece();
        break;
      default:
        break;
    }
  };

  const moveLeft = () => {
    setPosition((pos) => {
      const newPos = [Math.max(pos[0] - CUBE_SIZE, 0), pos[1], pos[2]];
      const collision = currentPiece.some(({ position: [x, y] }) =>
        cubes.some(cube =>
          Math.abs(cube.position[0] - (newPos[0] + x * CUBE_SIZE)) < CUBE_SIZE &&
          Math.abs(cube.position[1] - (newPos[1] + y * CUBE_SIZE)) < CUBE_SIZE &&
          Math.abs(cube.position[2] - newPos[2]) < CUBE_SIZE
        )
      );
      return collision ? pos : newPos;
    });
  };

  const moveRight = () => {
    setPosition((pos) => {
      const newPos = [Math.min(pos[0] + CUBE_SIZE, GRID_WIDTH - CUBE_SIZE), pos[1], pos[2]];
      const collision = currentPiece.some(({ position: [x, y] }) =>
        cubes.some(cube =>
          Math.abs(cube.position[0] - (newPos[0] + x * CUBE_SIZE)) < CUBE_SIZE &&
          Math.abs(cube.position[1] - (newPos[1] + y * CUBE_SIZE)) < CUBE_SIZE &&
          Math.abs(cube.position[2] - newPos[2]) < CUBE_SIZE
        )
      );
      return collision ? pos : newPos;
    });
  };

  const moveForward = () => {
    setPosition((pos) => {
      const newPos = [pos[0], pos[1], Math.max(pos[2] - CUBE_SIZE, 0)];
      const collision = currentPiece.some(({ position: [x, y] }) =>
        cubes.some(cube =>
          Math.abs(cube.position[0] - (newPos[0] + x * CUBE_SIZE)) < CUBE_SIZE &&
          Math.abs(cube.position[1] - (newPos[1] + y * CUBE_SIZE)) < CUBE_SIZE &&
          Math.abs(cube.position[2] - newPos[2]) < CUBE_SIZE
        )
      );
      return collision ? pos : newPos;
    });
  };

  const moveBackward = () => {
    setPosition((pos) => {
      const newPos = [pos[0], pos[1], Math.min(pos[2] + CUBE_SIZE, GRID_DEPTH - CUBE_SIZE)];
      const collision = currentPiece.some(({ position: [x, y] }) =>
        cubes.some(cube =>
          Math.abs(cube.position[0] - (newPos[0] + x * CUBE_SIZE)) < CUBE_SIZE &&
          Math.abs(cube.position[1] - (newPos[1] + y * CUBE_SIZE)) < CUBE_SIZE &&
          Math.abs(cube.position[2] - newPos[2]) < CUBE_SIZE
        )
      );
      return collision ? pos : newPos;
    });
  };

  const dropPiece = () => {
    setPosition((pos) => {
      const newPos = [pos[0], pos[1] - 1, pos[2]];
      const collision = currentPiece.some(({ position: [x, y] }) =>
        cubes.some(cube =>
          Math.abs(cube.position[0] - (newPos[0] + x * CUBE_SIZE)) < CUBE_SIZE &&
          Math.abs(cube.position[1] - (newPos[1] + y * CUBE_SIZE)) < CUBE_SIZE &&
          Math.abs(cube.position[2] - newPos[2]) < CUBE_SIZE
        )
      );
      return collision ? pos : newPos;
    });
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", () => setIsPortrait(window.innerHeight > window.innerWidth));
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", () => setIsPortrait(window.innerHeight > window.innerWidth));
    };
  }, [currentPiece]);

  const checkForMatches = (cubes) => {
    const visited = new Set();
    const matches = [];
  
    const dfs = (cube, group) => {
      const { position, color } = cube;
      visited.add(cube);
      group.push(cube);
  
      for (const neighbor of cubes) {
        if (!visited.has(neighbor) && neighbor.color === color) {
          const dx = Math.abs(neighbor.position[0] - position[0]);
          const dy = Math.abs(neighbor.position[1] - position[1]);
          const dz = Math.abs(neighbor.position[2] - position[2]);
  
          if ((dx === CUBE_SIZE && dy === 0 && dz === 0) || 
              (dx === 0 && dy === CUBE_SIZE && dz === 0) || 
              (dx === 0 && dy === 0 && dz === CUBE_SIZE)) {
            dfs(neighbor, group);
          }
        }
      }
    };
  
    for (const cube of cubes) {
      if (!visited.has(cube)) {
        const group = [];
        dfs(cube, group);
        if (group.length >= 3) matches.push(...group);
      }
    }
  
    return matches;
  };

  const removeMatches = (matches) => {
    setCubes((prevCubes) => {
      let remainingCubes = prevCubes.filter(cube => !matches.includes(cube));
  
      remainingCubes = remainingCubes.map(cube => {
        const cubesBelow = matches.filter(match =>
          match.position[0] === cube.position[0] &&
          match.position[2] === cube.position[2] &&
          match.position[1] < cube.position[1]
        );
  
        if (cubesBelow.length > 0) {
          const dropDistance = cubesBelow.length * CUBE_SIZE;
          return { ...cube, position: [cube.position[0], cube.position[1] - dropDistance, cube.position[2]] };
        }
        
        return cube;
      });
  
      return remainingCubes;
    });
  
    setScore((prevScore) => prevScore + matches.length);
  
    setTimeout(() => {
      setCubes((prevCubes) => {
        const newMatches = checkForMatches(prevCubes);
        if (newMatches.length > 0) {
          removeMatches(newMatches);
        }
        return prevCubes;
      });
    }, 100);
  };

  useEffect(() => {
    const storedHighScore = localStorage.getItem("highScore");
    if (storedHighScore) setHighScore(parseInt(storedHighScore));
  }, []);
  
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("highScore", score);
    }
  }, [score]);

  return (
    <div style={{ display: "flex", flexDirection: isPortrait ? "column" : "row", alignItems: "center", justifyContent: "center", height: "100vh", background: "black" }}>
      <div style={{ color: "white", marginBottom: isPortrait ? "20px" : "0", marginRight: isPortrait ? "0" : "20px" }}>
        <h1>Score: {score}</h1>
        <h1>High Score: {highScore}</h1>
      </div>
      <Canvas camera={{ position: [GRID_WIDTH / 2, 10, GRID_DEPTH / 2 + 15], fov: 70 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <OrbitControls enablePan={false} enableZoom={false} target={[GRID_WIDTH / 2, -5, GRID_DEPTH / 2]} />
        <Physics gravity={[0, 0, 0]}>
          <GameContent 
            cubes={cubes} 
            currentPiece={currentPiece} 
            position={position} 
            setCubes={setCubes} 
            setCurrentPiece={setCurrentPiece} 
            setPosition={setPosition} 
            checkForMatches={checkForMatches} 
            removeMatches={removeMatches} 
            setScore={setScore}
          />
        </Physics>
      </Canvas>
        {isPortrait && (
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "20px",
              display: "grid",
              gridTemplateColumns: "50px 50px 50px",
              gridTemplateRows: "50px 50px 50px",
              gap: "10px",
              alignItems: "center",
              justifyItems: "center",
            }}
           >
    <div></div>
    <button onClick={moveForward} style={{ width: "50px", height: "50px" }}>↑</button>
    <div></div>
    <button onClick={moveLeft} style={{ width: "50px", height: "50px" }}>←</button>
    <div></div>
    <button onClick={moveRight} style={{ width: "50px", height: "50px" }}>→</button>
    <div></div>
    <button onClick={moveBackward} style={{ width: "50px", height: "50px" }}>↓</button>
    <div></div>
  </div>
)}

      {isPortrait && (
        <button onClick={dropPiece} style={{ position: "absolute", bottom: "20px", right: "20px", width: "50px", height: "50px" }}>⏬</button>
      )}
    </div>
  );
};

const GameContent = ({ cubes, currentPiece, position, setCubes, setCurrentPiece, setPosition, checkForMatches, removeMatches, setScore }) => {
  const currentPieceRef = useRef();
  
  useFrame(() => {
    if (currentPiece) {
      setPosition((pos) => {
        const newY = pos[1] - FALL_SPEED;
        return [pos[0], newY, pos[2]];
      });

      const hasCollision = currentPiece.some(({ position: [x, y] }) =>
        cubes.some(cube =>
          Math.abs(cube.position[0] - (position[0] + x * CUBE_SIZE)) < CUBE_SIZE &&
          Math.abs(cube.position[1] - (position[1] + y * CUBE_SIZE)) < CUBE_SIZE &&
          Math.abs(cube.position[2] - position[2]) < CUBE_SIZE
        )
      );

      if (position[1] <= -9.5 || hasCollision) {
        const newCubes = currentPiece.map(({ position: [x, y], color }) => ({
          position: [position[0] + x * CUBE_SIZE, position[1] + y * CUBE_SIZE, position[2]],
          color,
        }));
        setCubes((prev) => [...prev, ...newCubes]);
        const matches = checkForMatches([...cubes, ...newCubes]);
        if (matches.length > 0) {
          removeMatches(matches);
        }
        setCurrentPiece(null);
        setPosition([GRID_WIDTH / 2 - CUBE_SIZE / 2, 10, GRID_DEPTH / 2 - CUBE_SIZE / 2]);
      }
    } else {
      setCurrentPiece(getRandomPiece());
    }
  });

  useEffect(() => {
    if (cubes.some(cube => cube.position[1] >= 10)) {
      alert("Game Over");
      setCubes([]);
      setCurrentPiece(null);
      setPosition([GRID_WIDTH / 2 - CUBE_SIZE / 2, 10, GRID_DEPTH / 2 - CUBE_SIZE / 2]);
      setScore(0);
    }
  }, [cubes]);

  return (
    <>
      <RigidBody type="fixed">
        <mesh position={[GRID_WIDTH / 2 - CUBE_SIZE / 2, -10.01, GRID_DEPTH / 2 - CUBE_SIZE / 2]}>
          <boxGeometry args={[GRID_WIDTH, 0.1, GRID_DEPTH]} />
          <meshStandardMaterial color="white" />
        </mesh>
      </RigidBody>
      {cubes.map((cube, index) => (
        <RigidBody key={index} type="fixed" position={cube.position}>
          <mesh>
            <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
            <meshStandardMaterial color={cube.color} />
            <lineSegments>
              <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)]} />
              <lineBasicMaterial attach="material" color="cyan" linewidth={2} />
            </lineSegments>
          </mesh>
        </RigidBody>
      ))}
      {currentPiece && currentPiece.map(({ position: [x, y], color }, index) => (
        <RigidBody key={index} ref={currentPieceRef} type="dynamic" position={[position[0] + x * CUBE_SIZE, position[1] + y * CUBE_SIZE, position[2]]}>
          <mesh>
            <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
            <meshStandardMaterial color={color} />
            <lineSegments>
              <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)]} />
              <lineBasicMaterial attach="material" color="cyan" linewidth={2} />
            </lineSegments>
          </mesh>
        </RigidBody>
      ))}
    </>
  );
};

export default Tetris3D;
