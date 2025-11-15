// OrbitRabbit.js
import * as THREE from './three.module.js';

export function OrbitRabbit(camera, options = {}) {
    const domElement = options.domElement || document;
    const speed = options.speed || 0.2;
    const rotateSpeed = options.rotateSpeed || 0.005;

    const state = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        yaw: 0,
        pitch: 0
    };

    let prevMouse = { x: 0, y: 0 };
    let isMouseDown = false;

    domElement.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW': state.forward = true; break;
            case 'ArrowDown':
            case 'KeyS': state.backward = true; break;
            case 'ArrowLeft':
            case 'KeyA': state.left = true; break;
            case 'ArrowRight':
            case 'KeyD': state.right = true; break;
        }
    });

    domElement.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW': state.forward = false; break;
            case 'ArrowDown':
            case 'KeyS': state.backward = false; break;
            case 'ArrowLeft':
            case 'KeyA': state.left = false; break;
            case 'ArrowRight':
            case 'KeyD': state.right = false; break;
            // Space e Shift ignorados
        }
    });

    domElement.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        prevMouse.x = e.clientX;
        prevMouse.y = e.clientY;
    });

    domElement.addEventListener('mouseup', () => { isMouseDown = false; });

    domElement.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        const dx = e.clientX - prevMouse.x;
        const dy = e.clientY - prevMouse.y;
        prevMouse.x = e.clientX;
        prevMouse.y = e.clientY;
        state.yaw -= dx * rotateSpeed;
        state.pitch -= dy * rotateSpeed;
        state.pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, state.pitch));
    });

    function update() {
        camera.rotation.order = "YXZ";
        camera.rotation.y = state.yaw;
        camera.rotation.x = state.pitch;

        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.y = 0; // mantém movimento apenas no plano XZ
        direction.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(camera.up, direction).normalize();

        if (state.forward) camera.position.addScaledVector(direction, speed);
        if (state.backward) camera.position.addScaledVector(direction, -speed);
        if (state.left) camera.position.addScaledVector(right, speed);
        if (state.right) camera.position.addScaledVector(right, -speed);
        // nada de up/down
    }

    return { update , state};
}
