import * as THREE from "../libs/three.module.js";
import { OrbitRabbit } from "../libs/OrbitRabbit.js";
import { GLTFLoader } from "../libs/GLTFLoader.js";

const doctorbtn = document.getElementById("activesawer");

// Cena e câmera
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Clock
const clock = new THREE.Clock();

// Loaders
const tLoader = new THREE.TextureLoader();
const gLoader = new GLTFLoader();

// Chão
const floorTexture = tLoader.load("./textures/floor.jpeg");
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(10, 10);

const floorGeometry = new THREE.PlaneGeometry(50, 50);
const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: floorTexture,
    roughness: 0.9,
    metalness: 0.5
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -5
scene.add(floor);

// Luz ambiente
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

// Objetos
let grabpack = null;
let poppy = null
// Grabpack
gLoader.load("../models/grabpack.glb", (model) => {
    grabpack = model.scene;
    grabpack.position.y = 6;
    scene.add(grabpack);
});
gLoader.load("../models/poppy.glb", (model) => {
    poppy = model.scene;
    poppy.scale.set(2,2,2)
    poppy.position.y = 2;
    poppy.position.z = 3
    scene.add(poppy);
});


// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Movimento com OrbitRabbit
const movimento = OrbitRabbit(camera);

// Loop de animação
function animate() {
    requestAnimationFrame(animate);

    movimento.update();

    const delta = clock.getDelta();
    if (grabpack) {
        const offset = new THREE.Vector3(0, -1, -2);
        grabpack.position.copy(camera.position).add(offset.applyQuaternion(camera.quaternion));
        grabpack.quaternion.copy(camera.quaternion);
        grabpack.rotateY(Math.PI);

        // efeito de respiração
        const t = clock.getElapsedTime();
        const scaleFactor = 30 + Math.sin(t * 5) * 0.5;
        grabpack.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }


    renderer.render(scene, camera);
}


animate();
