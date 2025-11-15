import * as THREE from "../libs/three.module.js";
import { OrbitRabbit } from "../libs/OrbitRabbit.js";
import { GLTFLoader } from "../libs/GLTFLoader.js";

// Cena e câmera
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.05)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
window.camera = camera;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Loaders
const tLoader = new THREE.TextureLoader();
const gLoader = new GLTFLoader();

// Chão
const floorTexture = tLoader.load("./textures/floor.jpeg");
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(20, 20);

const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: 0.9,
    metalness: 0.5
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -5;
scene.add(floor);

// Luz ambiente
const ambient = new THREE.AmbientLight(0x808080, 1);
scene.add(ambient);

const rim1 = new THREE.DirectionalLight(0x4fb3ff, 0.5);
rim1.position.set(5, 6, -6);
scene.add(rim1);

const rim2 = new THREE.DirectionalLight(0xffb47a, 0.3);
rim2.position.set(0, 8, -15);
scene.add(rim2);

const key = new THREE.DirectionalLight(0xffe7d6, 1.3);
key.position.set(-10, 15, 10);
key.castShadow = true;
key.shadow.mapSize.set(512, 512);
scene.add(key);


function boost(obj) {
    obj.traverse(c => {
        if (c.isMesh && c.material) {
            c.castShadow = true;
            c.receiveShadow = true;
            c.material.metalness = 0.45;
            c.material.roughness = 0.35;
        }
    });
}

// Paredes
const walls = [];
function createWall(x, y, z, w, h, d) {
    const wallGeometry = new THREE.BoxGeometry(w, h, d);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x808080});
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(x, y, z);
    scene.add(wall);
    walls.push(wall);
}
createWall(0, 0, -45, 100, 30, 2); // fundo
createWall(0, 0, 45, 100, 30, 2);  // frente
createWall(-45, 0, 0, 2, 30, 100); // esquerda
createWall(45, 0, 0, 2, 30, 100);  // direita

// Array de obstáculos (para colisão)
const collidables = [...walls, floor];

// Raycaster para colisão
const raycaster = new THREE.Raycaster();
const collisionDistance = 1;

// Função de colisão
function isColliding(pos) {
    const directions = [
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(1, 0, 0)
    ];

    for (let dir of directions) {
        raycaster.set(pos, dir);
        const intersects = raycaster.intersectObjects(collidables, true);
        if (intersects.length > 0 && intersects[0].distance < collisionDistance) {
            return true;
        }
    }
    return false;
}

// Movimento com OrbitRabbit
const movimento = OrbitRabbit(camera);

// Sobrescrevendo o update do movimento para colisão
const originalUpdate = movimento.update.bind(movimento);
movimento.update = function() {
    const oldPos = camera.position.clone();
    originalUpdate();
    if (isColliding(camera.position)) {
        camera.position.copy(oldPos);
    }
};

// Models
let gatedoor;
let grabpack;

// Gatedoor
gLoader.load("./models/pp1gate.glb", (gltf) => {
    gatedoor = gltf.scene;
    gatedoor.scale.set(5,5,5);
    gatedoor.position.y = -5;
    gatedoor.position.z = -42;
    gatedoor.rotation.y = 4.7;
    boost(gatedoor)
    scene.add(gatedoor);
    collidables.push(gatedoor);
});

// Grabpack
gLoader.load("./models/grabpack.glb", (gltf) => {
    grabpack = gltf.scene;
    grabpack.scale.set(30, 30, 30);
    grabpack.position.set(0, -1, -2);
    grabpack.rotation.set(0, 3.1, 0);
    boost(grabpack)
    scene.add(camera)
    camera.add(grabpack)
});

gLoader.load("./models/pp4box1.glb", (gltf) => {
    let pp4box1 = gltf.scene
    pp4box1.scale.set(7,7,7)
    pp4box1.position.set(-25,-5,-39)
    boost(pp4box1)
    scene.add(pp4box1)
    collidables.push(pp4box1)
});

gLoader.load("./models/mommy-soda-machine.glb", (gltf) => {
    let sodamachine = gltf.scene
    sodamachine.scale.set(7,7,7)
    sodamachine.position.set(25,-4.5,-40)
    boost(sodamachine)
    scene.add(sodamachine)
    collidables.push(sodamachine)
});

// --- Animação do grabpack ao andar ---
let walking = false;
let walkStartTime = 0;
// --- Animação suave do grabpack baseada em movimento e rotação ---
let grabpackBaseY = -1; // posição inicial
let prevCamPos = new THREE.Vector3();
let prevCamRot = new THREE.Euler();

function animateGrabpackWalking() {
    if (!grabpack) return;

    // detecta se a câmera se moveu ou rotacionou
    const moved = !camera.position.equals(prevCamPos) || 
                  camera.rotation.y !== prevCamRot.y;

    if (moved) {
        const t = performance.now() / 200; // velocidade da animação

        const targetY = grabpackBaseY + Math.sin(t) * 0.2;
        grabpack.position.y += (targetY - grabpack.position.y) * 0.1;

        const targetRotX = Math.sin(t) * 0.05;
        grabpack.rotation.x += (targetRotX - grabpack.rotation.x) * 0.1;
    } else {
        // volta suavemente para posição base
        grabpack.position.y += (grabpackBaseY - grabpack.position.y) * 0.1;
        grabpack.rotation.x += (0 - grabpack.rotation.x) * 0.1;
    }

    // guarda posição e rotação para próxima verificação
    prevCamPos.copy(camera.position);
    prevCamRot.copy(camera.rotation);
}


// --- Detecta tecla de movimento ---
document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW','KeyA','KeyS','KeyD'].includes(e.code)) {
        walking = true;
        walkStartTime = performance.now();
    }
});

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});



// Loop de animação
function animate() {
    requestAnimationFrame(animate);
    movimento.update();
    animateGrabpackWalking(); // atualiza animação do grabpack
    renderer.render(scene, camera);
}
animate();
