import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";
// import CANNON from "cannon";
import * as CANNON from "cannon-es";
import { CubeTextureLoader } from "three";

// Sounds
const hitSound = new Audio("/sounds/hit.mp3");

const playSound = (collision) => {
	const impactStrength = collision.contact.getImpactVelocityAlongNormal();

	if (impactStrength > 1.0) {
		hitSound.volume = Math.random();
		hitSound.currentTime = 0;
		hitSound.play();
	}
};

//Texture
const cubeTextureLoader = new THREE.CubeTextureLoader();
const environmentMapTexture = cubeTextureLoader.load([
	"/textures/environmentMaps/0/px.png",
	"/textures/environmentMaps/0/nx.png",
	"/textures/environmentMaps/0/py.png",
	"/textures/environmentMaps/0/ny.png",
	"/textures/environmentMaps/0/pz.png",
	"/textures/environmentMaps/0/nz.png",
]);

//Physics
const world = new CANNON.World();
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
world.gravity.set(0, -9.82, 0);

// const concreteMaterial = new CANNON.Material("concrete");
// const plasticMaterial = new CANNON.Material("plastic");
const defaultMaterial = new CANNON.Material("default");

const defaultContactMaterial = new CANNON.ContactMaterial(
	defaultMaterial,
	defaultMaterial,
	{
		friction: 0.1,
		restitution: 0.7,
	}
);
world.addContactMaterial(defaultContactMaterial);
world.defaultContactMaterial = defaultContactMaterial;

// const sphereShape = new CANNON.Sphere(0.5);
// const sphereBody = new CANNON.Body({
// 	mass: 1,
// 	position: new CANNON.Vec3(0, 3, 0),
// 	shape: sphereShape,
// 	// material: defaultMaterial,
// });
// sphereBody.applyLocalForce(
// 	new CANNON.Vec3(150, 0, 0),
// 	new CANNON.Vec3(0, 0, 0)
// );
// world.addBody(sphereBody);

const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body();
// floorBody.material = defaultMaterial;
floorBody.mass = 0;
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);
floorBody.addShape(floorShape);
world.addBody(floorBody);

//Debugger
const gui = new dat.GUI();
const debugObject = {}; // sab is object peh call ho rhe h
debugObject.createSphere = () => {
	createSphere(Math.random() * 0.5, {
		x: (Math.random() - 0.5) * 3,
		y: 3,
		z: (Math.random() - 0.5) * 3,
	});
};
gui.add(debugObject, "createSphere");

debugObject.reset = () => {
	for (const object of objectToUpdate) {
		object.body.removeEventListener("collide", playSound);
		world.removeBody(object.body);

		scene.remove(object.mesh);
	}
};
gui.add(debugObject, "reset");

//Cursor
const cursor = {
	x: 0,
	y: 0,
};

window.addEventListener("mousemove", (event) => {
	cursor.x = event.clientX / sizes.width - 0.5;
	cursor.y = -(event.clientY / sizes.height - 0.5);
});

//Scene
const scene = new THREE.Scene();

//Objects
// const sphere = new THREE.Mesh(
// 	new THREE.SphereBufferGeometry(0.5, 32, 32),
// 	new THREE.MeshStandardMaterial({
// 		metalness: 0.3,
// 		roughness: 0.4,
// 		envMap: environmentMapTexture,
// 	})
// );
// sphere.castShadow = true;
// sphere.position.y = 0.5;

const plane = new THREE.Mesh(
	new THREE.PlaneBufferGeometry(10, 10),
	new THREE.MeshStandardMaterial({
		color: "#777777",
		metalness: 0.3,
		roughness: 0.4,
		envMap: environmentMapTexture,
	})
);

plane.rotation.x = -Math.PI * 0.5;
plane.receiveShadow = true;

// scene.add(sphere, plane);
scene.add(plane);

//Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0x00fffc, 0.2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.shadow.camera.far = 15;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

//sizes
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

window.addEventListener("resize", () => {
	//Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	//Update Camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	//Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener("dblclick", () => {
	if (!document.fullscreenElement) {
		canvas.requestFullscreen();
	} else {
		document.exitFullscreen();
	}
});

//Camera
const camera = new THREE.PerspectiveCamera(
	75,
	sizes.width / sizes.height,
	0.1,
	100
);
camera.position.x = 4;
camera.position.y = 4;
camera.position.z = 4;
// camera.lookAt(mesh.position);
scene.add(camera);

//Renderer
const canvas = document.querySelector(".webgl");
const renderer = new THREE.WebGLRenderer({
	// canvas: canvas
	canvas,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(sizes.width, sizes.height);
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.enabled = true;

//Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

//Utils
const objectToUpdate = [];

const sphereGeometry = new THREE.SphereBufferGeometry(1, 20, 20);
const sphereMaterial = new THREE.MeshStandardMaterial({
	metalness: 0.3,
	roughness: 0.4,
	envMap: environmentMapTexture,
});

const createSphere = (radius, position) => {
	//Three Js
	const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
	mesh.castShadow = true;
	mesh.scale.set(radius, radius, radius);
	mesh.position.copy(position);
	scene.add(mesh);

	//Cannon Js
	const shape = new CANNON.Sphere(radius);
	const body = new CANNON.Body({
		mass: 1,
		position: new CANNON.Vec3(0, 3, 0),
		shape: shape,
		material: defaultMaterial,
	});
	body.position.copy(position);
	body.addEventListener("collide", playSound);
	world.addBody(body);

	//Save in objects to Update
	objectToUpdate.push({
		mesh,
		body,
	});
};

createSphere(0.5, { x: 0, y: 3, z: 0 });

// //Clock
const clock = new THREE.Clock();
let oldElapsed = 0;

//Animation
const tick = () => {
	//clock sec
	const elapsedTime = clock.getElapsedTime();

	//Update phy

	// sphereBody.applyForce(new CANNON.Vec3(-0.5, 0, 0), sphereBody.position);
	const deltaTime = elapsedTime - oldElapsed;
	oldElapsed = elapsedTime;
	world.step(1 / 60, deltaTime, 3);

	for (const object of objectToUpdate) {
		object.mesh.position.copy(object.body.position);
	}
	//Update Three js world
	// sphere.position.copy(sphereBody.position);
	// sphere.position.x = sphereBody.position.x;
	// sphere.position.y = sphereBody.position.y;
	// sphere.position.z = sphereBody.position.z;

	//Update Objects

	//Update controls
	controls.update();

	//Renderer
	renderer.render(scene, camera);

	window.requestAnimationFrame(tick);
};

tick();
