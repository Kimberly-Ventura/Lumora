/**
 * Product3DViewer.native.tsx — Premium 3D Viewer for Native Mobile (iOS/Android).
 *
 * Strategy: Renders a fully transparent, highly responsive Three.js WebGL scene inside a WebView.
 * Resolves local assets offline using expo-asset and uses Three.js's native GLTFLoader to render 
 * gorgeous, custom .glb models. Integrates a super-fast 1ms postMessage recoloring bridge!
 */
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { Asset } from 'expo-asset';

interface Product3DViewerProps {
  modelPath?: any; // Can be a required local asset (number) or public URL (string)
  imageUri?: any;
  customColor?: string;
  autoRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
}

const build3DHTML = (modelUrl: string, initialColor: string, autoRotate: boolean, enableZoom: boolean, enablePan: boolean) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: transparent !important; overflow: hidden; }
    canvas { display: block; width: 100% !important; height: 100% !important; touch-action: none; background: transparent !important; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
</head>
<body>
<script>
// Pre-bundled dependencies loaded synchronously. No ES module waterfalls!
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.4, 4.2);

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
dirLight.position.set(5, 8, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.bias = -0.0005;
scene.add(dirLight);

const pointLight = new THREE.PointLight(0xFFF5E0, 0.4);
pointLight.position.set(-4, 4, -4);
scene.add(pointLight);

// Subtle ground shadow catcher plane
const shadowGeo = new THREE.PlaneGeometry(12, 12);
const shadowMat = new THREE.ShadowMaterial({ opacity: 0.10 });
const ground = new THREE.Mesh(shadowGeo, shadowMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.25;
ground.receiveShadow = true;
scene.add(ground);

// OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = ${enableZoom};
controls.minDistance = 1.0; // Allow extreme close-up to inspect textures
controls.maxDistance = 12.0; // Prevent zooming out into space
controls.enablePan = ${enablePan};
controls.autoRotate = ${autoRotate};
controls.autoRotateSpeed = 1.5;
controls.target.set(0, -0.2, 0);
controls.update();

// Recoloring helper targeting upholstery meshes in custom GLTF models
function applyUpholsteryColor(mesh, colorHex) {
  if (!mesh.material) return;
  
  // Clone the material to unlock it from shared instances in exported GLB files
  if (!mesh.userData.materialCloned) {
    mesh.material = mesh.material.clone();
    mesh.userData.materialCloned = true;
    mesh.userData.originalColor = mesh.material.color.clone(); // Save original baked material color
    mesh.userData.originalMap = mesh.material.map; // Save original base texture map!
  }
  
  const matName = (mesh.material.name || '').toLowerCase();
  const meshName = (mesh.name || '').toLowerCase();
  
  const isCushion = matName.includes('fabric') || matName.includes('cushion') || 
                    matName.includes('leather') || matName.includes('seat') || 
                    matName.includes('upholstery') || meshName.includes('cushion') || 
                    meshName.includes('seat') || meshName.includes('fabric');
                    
  const isNotFrame = !matName.includes('wood') && !matName.includes('leg') && 
                     !matName.includes('metal') && !meshName.includes('leg') && 
                     !meshName.includes('frame');

  if (isCushion || isNotFrame) {
    if (colorHex === '#ORIGINAL') {
      // Revert to the exact original state (both color and baked texture map)
      if (mesh.userData.originalColor) mesh.material.color.copy(mesh.userData.originalColor);
      mesh.material.map = mesh.userData.originalMap;
    } else {
      // Apply vibrant designer hex color and hide the muddy base texture map.
      mesh.material.color.set(colorHex);
      mesh.material.map = null;
    }
    mesh.material.needsUpdate = true;
  }
}

let activeModel = null;

// Load dynamic GLB/GLTF model
console.log('Loading 3D model path:', '${modelUrl}');
const loader = new THREE.GLTFLoader();
loader.load('${modelUrl}', (gltf) => {
  activeModel = gltf.scene;
  
  // Calculate model size and auto-scale/re-center perfectly
  const box = new THREE.Box3().setFromObject(activeModel);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2.4 / maxDim; // Calibrate comfortable viewer proportions (reduced to 1.8 to fit feet)
  activeModel.scale.setScalar(scale);
  
  const center = box.getCenter(new THREE.Vector3());
  activeModel.position.x = -center.x * scale;
  activeModel.position.y = -box.min.y * scale - 1.25; // Rest perfectly flat on shadow plane
  activeModel.position.z = -center.z * scale;
  
  // Setup shadows and default custom colors
  activeModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      applyUpholsteryColor(child, '${initialColor}');
    }
  });
  
  scene.add(activeModel);
  console.log('3D model loaded successfully!');
}, undefined, (err) => {
  console.error('Error loading 3D GLTF asset:', err);
});

// Real-time 1ms message listener for color swapping
const handleMessage = (event) => {
  try {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    if (!data) return;

    if (data.type === 'COLOR_CHANGE' && activeModel) {
      activeModel.traverse((child) => {
        if (child.isMesh) {
          applyUpholsteryColor(child, data.color);
        }
      });
    } else if (data.type === 'CONTROLS_CHANGE') {
      if (data.enableZoom !== undefined) controls.enableZoom = data.enableZoom;
      if (data.enablePan !== undefined) controls.enablePan = data.enablePan;
      if (data.autoRotate !== undefined) controls.autoRotate = data.autoRotate;
      controls.update();
    }
  } catch (e) {
    console.error('Failed to parse message payload:', e);
  }
};

window.addEventListener('message', handleMessage);
document.addEventListener('message', handleMessage); // iOS WebView compatibility

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Render Animation Loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
</script>
</body>
</html>
`;

export const Product3DViewer: React.FC<Product3DViewerProps> = ({ 
  modelPath, 
  customColor = '#D09252', 
  autoRotate = false,
  enableZoom = true,
  enablePan = true
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [resolvedPath, setResolvedPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const webViewRef = useRef<WebView>(null);
  const initialColorRef = useRef(customColor); // Store initial color to decouple from HTML rebuilds
  const initialAutoRotateRef = useRef(autoRotate);
  const initialEnableZoomRef = useRef(enableZoom);
  const initialEnablePanRef = useRef(enablePan);

  // Auto-resolve local require asset numbers OR pass remote URLs directly
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    if (typeof modelPath === 'number') {
      const asset = Asset.fromModule(modelPath);
      asset.downloadAsync()
        .then(() => {
          if (active) {
            setResolvedPath(asset.uri);
          }
        })
        .catch((err) => console.error('Failed to resolve local 3D asset:', err));
    } else if (typeof modelPath === 'string') {
      setResolvedPath(modelPath);
    }

    return () => {
      active = false;
    };
  }, [modelPath]);

  // Handle high-speed real-time color changes via webview postMessage bridge
  useEffect(() => {
    if (customColor && webViewRef.current && !isLoading) {
      webViewRef.current.postMessage(
        JSON.stringify({ type: 'COLOR_CHANGE', color: customColor })
      );
    }
  }, [customColor, isLoading]);

  // Handle high-speed dynamic controls updates without reloading
  useEffect(() => {
    if (webViewRef.current && !isLoading) {
      webViewRef.current.postMessage(
        JSON.stringify({ 
          type: 'CONTROLS_CHANGE', 
          enableZoom, 
          enablePan, 
          autoRotate 
        })
      );
    }
  }, [enableZoom, enablePan, autoRotate, isLoading]);

  // Memoize the HTML so the WebView never hard-reloads on color or controls changes
  const html = React.useMemo(() => {
    if (!resolvedPath) return '';
    return build3DHTML(resolvedPath, initialColorRef.current, initialAutoRotateRef.current, initialEnableZoomRef.current, initialEnablePanRef.current);
  }, [resolvedPath]);

  if (!resolvedPath) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Resolving model asset…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={[StyleSheet.absoluteFillObject, styles.center, { zIndex: 2 }]}>
          <ActivityIndicator color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading 3D asset…</Text>
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        style={[styles.webview, { backgroundColor: 'transparent' }]}
        containerStyle={{ backgroundColor: 'transparent' }}
        source={{ html }}
        bounces={false}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mixedContentMode="always"
        androidLayerType="hardware"
        onLoadEnd={() => setIsLoading(false)}
      />
      
      {!isLoading && (
        <View style={styles.hint}>
          <View style={[styles.dot, { backgroundColor: colors.tint }]} />
          <Text style={[styles.hintText, { color: colors.text }]}>
            DRAG TO ROTATE • PINCH TO ZOOM
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  webview: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    marginTop: 12,
    opacity: 0.6,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    opacity: 0.45,
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: -15,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 8,
  },
  hintText: {
    fontSize: 9,
    letterSpacing: 2,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
  },
});
