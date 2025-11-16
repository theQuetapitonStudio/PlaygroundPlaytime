import * as THREE from "../libs/three.module.js";
import { OrbitRabbit } from "../libs/OrbitRabbit.js";
import { GLTFLoader } from "../libs/GLTFLoader.js";

// Cena e câmera
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.03)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Loaders
const tLoader = new THREE.TextureLoader();
const gLoader = new GLTFLoader();

// clock

let clock = new THREE.Clock()

// Chão
const floorTexture = tLoader.load("./textures/floor.jpeg");
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(20, 20);

const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
});

const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -5;
boost(floor)
scene.add(floor);

const ambient = new THREE.AmbientLight(0x303030, 0.35);
scene.add(ambient);

const hemi = new THREE.HemisphereLight(0x87CEFA, 0x101014, 0.5);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xffffff, 1);
key.position.set(6, 12, 6);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
scene.add(key);

const rimL = new THREE.DirectionalLight(0x7fffd4, 0.45);
rimL.position.set(-8, 6, -4);
scene.add(rimL);

const rimR = new THREE.DirectionalLight(0xffaaaa, 0.45);
rimR.position.set(8, 6, -4);
scene.add(rimR);

const rimBack = new THREE.DirectionalLight(0xffffff, 0.3);
rimBack.position.set(0, 8, -12);
scene.add(rimBack);

const spot1 = new THREE.SpotLight(0xffe6b3, 0.8, 30, Math.PI / 8, 0.6, 1);
spot1.position.set(0, 9, 0);
spot1.target.position.set(0, 0, 6);
spot1.castShadow = true;
scene.add(spot1);
scene.add(spot1.target);

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
createWall(0, 0, -45, 100, 30, 2);
createWall(0, 0, 45, 100, 30, 2);
createWall(-45, 0, 0, 2, 30, 100);
createWall(45, 0, 0, 2, 30, 100);

const collidables = [...walls, floor];

// Raycaster para colisão
const raycaster = new THREE.Raycaster();
const collisionDistance = 1;

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

// OrbitRabbit
const movimento = OrbitRabbit(camera);

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
let handscanner;
let handscannerMixer;
let handscannerAction;

let bluehand
let sodamachine

// --- VARS DA ANIMAÇÃO SUAVE ---
let bluehandFlying = false;
let bluehandTargetPos = new THREE.Vector3();
let bluehandTargetQuat = new THREE.Quaternion();

// ---- LOADERS ----

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
    sodamachine = gltf.scene
    sodamachine.scale.set(7,7,7)
    sodamachine.position.set(25,-4.5,-40)
    boost(sodamachine)
    scene.add(sodamachine)
    collidables.push(sodamachine)
});

gLoader.load("./models/blue_hand.glb", (gltf) => {
    bluehand = gltf.scene
    bluehand.scale.set(5,5,5)
    bluehand.position.set(10,-4,0)
    bluehand.rotation.x += 1.5
    boost(bluehand)
    scene.add(bluehand)
    collidables.push(bluehand)
});

// ---- HANDSCANNER ----
function handscannerp1(scene, collidables, camera) {

    let handscanner = null;
    let mixer = null;
    let action = null;

    gLoader.load("./models/bluehandscanner.glb", (gltf) => {

        handscanner = gltf.scene;
        handscanner.scale.set(5, 5, 5);
        handscanner.position.y = 11;
        handscanner.position.z = -40;
        scene.add(handscanner);
        collidables.push(handscanner);

        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(handscanner);
            action = mixer.clipAction(gltf.animations[0]);  
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
        }

    });

    function playAnim() {
        if (!action) return;
        action.stop();
        action.reset();
        action.play();
    }

    const mouse = new THREE.Vector2();
    const clickRay = new THREE.Raycaster();

    document.addEventListener("click", (e) => {
        if (!handscanner) return;

        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        clickRay.setFromCamera(mouse, camera);
        const hits = clickRay.intersectObject(handscanner, true);

        if (hits.length > 0) {

            playAnim();

            // inicia voo suave
            if (bluehand) {

                handscanner.getWorldPosition(bluehandTargetPos);
                handscanner.getWorldQuaternion(bluehandTargetQuat);

                // ajuste fino pra ficar certinha
               bluehandTargetPos.y += 0.5;
bluehandTargetPos.z += 1; // empurra pra trás
bluehandTargetPos.x += 0.2; // pequeno ajuste lateral pra encaixar perfeito

setTimeout(() => {
    movesodamachine(sodamachine, scene)
}, 5000)
                bluehandFlying = true;
            }
        }

    });

    const clock = new THREE.Clock();

    return {
        update() {
            if (mixer) mixer.update(clock.getDelta());
        }
    };
}
function movesodamachine(sodamachine, cena) {
    if (sodamachine) {
        function anim() {
            let dt = clock.getDelta()
            sodamachine.scale.x -= 1.5 * dt
        sodamachine.scale.y -= 1.5 * dt
        sodamachine.scale.z -= 1.5 * dt
        sodamachine.rotation.x -= 1.5 * dt
        sodamachine.rotation.y -= 1.5 * dt
        sodamachine.rotation.z -= 1.5 * dt
        sodamachine.position.y -= 0.5
        setTimeout(() => {
            if (scene) {
                scene.remove(sodamachine)
                return
            }
        }, 5000)
        requestAnimationFrame(anim)
        }
        anim()
    }
}


// --- GRABPACK WALKING ---
let walking = false;
let walkStartTime = 0;

let grabpackBaseY = -1;
let prevCamPos = new THREE.Vector3();
let prevCamRot = new THREE.Euler();

function animateGrabpackWalking() {
    if (!grabpack) return;

    const camMoved =
        !camera.position.equals(prevCamPos) ||
        camera.rotation.y !== prevCamRot.y;

    const now = performance.now();
    const t = now * 0.004;

    const active = camMoved ? 1 : 0;

    const targetY =
        grabpackBaseY +
        Math.sin(t * 2.3) * 0.07 * active;

    const targetRotX =
        -0.03 * active +
        Math.sin(t * 3.2) * 0.015 * active;

    const smooth = 0.12;

    grabpack.position.y += (targetY - grabpack.position.y) * smooth;
    grabpack.rotation.x += (targetRotX - grabpack.rotation.x) * smooth;

    if (!camMoved) {
        const restSmooth = 0.1;
        grabpack.position.y += (grabpackBaseY - grabpack.position.y) * restSmooth;
        grabpack.rotation.x += (0 - grabpack.rotation.x) * restSmooth;
    }

    prevCamPos.copy(camera.position);
    prevCamRot.copy(camera.rotation);
}

let prevYaw = 0;
let prevPitch = 0;
let rotOffsetX = 0;
let rotOffsetZ = 0;

function animateGrabpackRotation() {
    if (!grabpack) return;

    const yaw = movimento.state.yaw;
    const pitch = movimento.state.pitch;

    const yawDelta = (yaw - prevYaw) * 50;
    const pitchDelta = (pitch - prevPitch) * 50;

    const active = (Math.abs(yawDelta) + Math.abs(pitchDelta)) > 0.0001 ? 1 : 0;

    const tiltAmount = 0.02 * active;
    const upDownAmount = 0.02 * active;

    const targetZ = -yawDelta * tiltAmount;
    const targetX = pitchDelta * upDownAmount;

    const smooth = 0.1;

    rotOffsetZ += (targetZ - rotOffsetZ) * smooth;
    rotOffsetX += (targetX - rotOffsetX) * smooth;

    grabpack.rotation.z = rotOffsetZ;
    grabpack.rotation.x += rotOffsetX * 0.5;

    if (!active) {
        rotOffsetZ *= 0.85;
        rotOffsetX *= 0.85;
    }

    prevYaw = yaw;
    prevPitch = pitch;
}

const handscannerSystem = handscannerp1(scene, collidables, camera);

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ANIMATE
function animate() {
    requestAnimationFrame(animate);

    movimento.update();
    animateGrabpackWalking();
    animateGrabpackRotation();
    handscannerSystem.update();

    // --- ANIMAÇÃO SUAVE DO BLUEHAND ---
    if (bluehandFlying && bluehand) {
        const lerpSpeed = 0.05;

        bluehand.position.lerp(bluehandTargetPos, lerpSpeed);
        bluehand.quaternion.slerp(bluehandTargetQuat, lerpSpeed);

        // quando chegar perto, para
        if (bluehand.position.distanceTo(bluehandTargetPos) < 0.05) {
            bluehandFlying = false;
        }
    }
    renderer.render(scene, camera);
}
animate();