import * as THREE from 'three';
import { Sphere } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

const scene = new THREE.Scene();



// Start of the code
THREE.ColorManagement.enabled = false
scene.background = new THREE.Color( '#E3E3CD' );


/**
 * Particles
 */
// Geometry
const particlesGeometry = new THREE.BufferGeometry();
const count = 200
const positions = new Float32Array(count * 3)

for(let i = 0; i < count * 3; i++) 
{
    positions[i] = (Math.random() - 0.5) * 10 
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)) 

// Material
const particlesMaterial = new THREE.PointsMaterial()
particlesMaterial.size = 0.02
particlesMaterial.sizeAttenuation = true
particlesMaterial.color = new THREE.Color('#292828')

// Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particles)

// Créer une caméra
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
scene.add(camera);



// Canvas
const canvas = document.querySelector('canvas.webgl')

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}





// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height)
// After instantiating the renderer
renderer.outputColorSpace = THREE.LinearSRGBColorSpace

document.addEventListener('mousemove', animateParticles)

let mouseX = 0
let mouseY = 0

function animateParticles(event) {
    mouseY = event.clientY
    mouseX = event.clientX
}
/**
 * Animate
 */
 const clock = new THREE.Clock()

 const tick = () =>

 {
    const elapsedTime = 3*Math.sin(clock.getElapsedTime())

    //update
    particles.rotation.x = -mouseY * (elapsedTime * 0.00008)
    particles.rotation.y = -mouseX * (elapsedTime * 0.00008)
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
 }
 
 tick()



const controls = new OrbitControls( camera, renderer.domElement );

