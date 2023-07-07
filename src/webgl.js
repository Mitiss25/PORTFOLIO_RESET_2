import * as THREE from 'three';
import fragment from './shaders/fragment.glsl';
import vertex from './shaders/vertex.glsl';
import imagesLoaded from 'imagesloaded';
import FontFaceObserver from 'fontfaceobserver';
// import LocomotiveScroll from 'locomotive-scroll';
import Lenis from '@studio-freight/lenis'
import gsap from 'gsap';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';




THREE.ColorManagement.enabled = false
var cursor = document.querySelector('.cursor');
var cursor2 = document.querySelector('.cursor2');

export default class Sketch {
    constructor(options){
        this.time = 0;
        this.scene = new THREE.Scene();
        this.container = options.dom;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.camera = new THREE.PerspectiveCamera( 70, this.width / this.height, 100, 2000);
        this.camera.position.z = 600;
        this.camera.fov = 2*Math.atan((this.height/2)/600)*(180/Math.PI);

        this.renderer = new THREE.WebGLRenderer({
            antialias:true,
            alpha: true
        });
        this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace
        this.renderer.setSize(this.width,this.height);
        var canvasElement = this.renderer.domElement;
        canvasElement.classList.add('webgl_pages');
        this.container.appendChild( canvasElement );

        // const fontOpen = new Promise(resolve => {
        //     new FontFaceObserver("Open sans").load().then(() => {
        //         resolve();
        //     });
        // });

        const fontNewake = new Promise (resolve => {
            new FontFaceObserver("Newake").load().then(() => {
                resolve();
            });
        });

        const fontPoppins = new Promise (resolve => {
            new FontFaceObserver("Poppins").load().then(() => {
                resolve();
            });
        });

        const preloadImages = new Promise ((resolve, reject) => {
            imagesLoaded(document.querySelectorAll('.display_container a img'), {background: true}, resolve);
        });


        this.scroll = new Lenis({
            content: document.querySelector('html'),
            lerp: 0.5
        });

        let allDone = [ fontNewake, fontPoppins, preloadImages]
        this.images = [...document.querySelectorAll('.display_container a img')];
        this.currentScroll = 0;
        this.scrollSpeed = 0;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.lastScrollTop = 0;
        this.delta = 10;
        this.timer = null;

        Promise.all(allDone).then(() => {

            console.log(this.scroll);
            this.composerPass();
            this.addImages();
            this.scroll.on('scroll', (e) => {
                this.currentScroll = e.animatedScroll;
                console.log(this.currentScroll, e.isScrolling, e);
            });
            this.mouseMovement();
            this.resize();
            this.setupResize();
            this.render();
        })

        
    }

    composerPass(){
        this.composer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
        this.scroll.raf(this.time);
  
        //custom shader pass
        var counter = 0.0;
        this.myEffect = {
          uniforms: {
            "tDiffuse": { value: null },
            "scrollSpeed": { value: null },
          },
          vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix 
              * modelViewMatrix 
              * vec4( position, 1.0 );
          }
          `,
          fragmentShader: `
          uniform sampler2D tDiffuse;
          varying vec2 vUv;
          uniform float scrollSpeed;
          void main(){
            vec2 newUV = vUv;
            float area = smoothstep(.4,0.,vUv.y);
            area = pow(area,4.);
            newUV.x -= (vUv.x - 0.5)*0.5*area*scrollSpeed;
            gl_FragColor = texture2D( tDiffuse, newUV);
          //   gl_FragColor = vec4(area,0.,0.,1.);
          }
          `
        }
  
        this.customPass = new ShaderPass(this.myEffect);
        this.customPass.renderToScreen = true;
  
        this.composer.addPass(this.customPass);
      }  

    mouseMovement() {

        window.addEventListener('mousemove', (event) => {
            var rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ( ( event.clientX - rect.left ) / ( rect.right - rect.left ) ) * 2 - 1;
            this.mouse.y = - ( ( event.clientY - rect.top ) / ( rect.bottom - rect.top) ) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera); // Déplacer cette ligne ici
            const intersects = this.raycaster.intersectObjects(this.scene.children); // Déplacer cette ligne ici

        if (intersects.length > 0){
            let obj = intersects[0].object;
            obj.material.uniforms.hover.value = intersects[0].uv;
        }
        }, false);

        
    }

    addImages() {

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: {value:0},
                uImage: {value: 0},
                hover: {value: new THREE.Vector2(0.5,0.5)},
                hoverState: {value: 1}
            },
            side: THREE.DoubleSide,
            fragmentShader: fragment,
            vertexShader: vertex
        });

        this.materials = [];

        this.imageStore = this.images.map( img => {
            const bounds = img.getBoundingClientRect();
            console.log('bounds', bounds)
            let geometry = new THREE.PlaneGeometry(bounds.width, bounds.height, 10,10);
            let texture = new THREE.Texture(img);
            console.log(img, texture.image.src);
            texture.needsUpdate = true;
            // let material = new THREE.MeshBasicMaterial({
            //     map: texture
            // });

            let material = this.material.clone();
            img.addEventListener('mouseenter', () => {
                console.log('enter');
                gsap.to(material.uniforms.hoverState,{
                    duration: 1,
                    value: 1
                });
            });
            img.addEventListener('mouseout', () => {
                console.log('exit');
                gsap.to(material.uniforms.hoverState,{
                    duration: 1,
                    value: 0
                });
            });
            this.materials.push(material);
            material.uniforms.uImage.value = texture;

            let mesh = new THREE.Mesh(geometry,material);
            this.scene.add(mesh);

            return {
                img: img,
                mesh: mesh,
                top: bounds.top,
                left: bounds.left,
                width: bounds.width,
                height: bounds.height,
            }
        })
    }

    setPosition(){
        this.imageStore.forEach(o=>{
            o.mesh.position.y = this.currentScroll - o.top + this.height/2 - o.height/2;
            o.mesh.position.x = o.left - this.width/2 + o.width/2;
        })
    }

    setupResize(){
        window.addEventListener('resize', this.resize.bind(this));
    }

    resize(){
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer.setSize( this.width, this.height )
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
    }

    addObjects(){

        this.geometry = new THREE.PlaneGeometry(100,100,10,10);
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: {value:0},
                posterTexture: {value: new THREE.TextureLoader().load(poster)}
            },
            side: THREE.DoubleSide,
            fragmentShader: fragment,
            vertexShader: vertex
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material)

        this.scene.add(this.mesh);
    }

    render(){
        this.time+=0.05;
        // this.setPosition();
        if (this.timer !== null) {
            clearTimeout(this.timer);
        }
    
        this.timer = setTimeout(() => {
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollSpeed = Math.abs(currentScrollTop - this.lastScrollTop) / this.delta;
        this.scrollSpeed = scrollSpeed/50;
        this.lastScrollTop = currentScrollTop;
        }, this.delta);

        // console.log('scroll speed', window.pageYOffset, this.timer, this.scrollSpeed);
        this.materials.forEach(m=>{
            m.uniforms.time.value = this.time;
        })

        this.scroll.raf();

        this.setPosition();
        this.customPass.uniforms.scrollSpeed.value = this.scrollSpeed;
        // this.renderer.render (this.scene,this.camera);
        this.composer.render();
        window.requestAnimationFrame(this.render.bind(this));
       
    }
}

new Sketch({
    dom: document.querySelector('.canvas_wrapper')
});

