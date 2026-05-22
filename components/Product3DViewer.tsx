import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { Product360Viewer } from './Product360Viewer';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

interface Product3DViewerProps {
  modelPath?: any;
  imageUri?: any;
  customColor?: string;
  autoRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  snapshotTrigger?: number;
}

const COLOR_TO_IMAGE_MAP: Record<string, any> = {
  '#C8B195': require('@/assets/images/verona_sofa_clean.png'),
  '#D09252': require('@/assets/images/armchair_clean.png'),
  '#A06E50': require('@/assets/images/rustic_chair_clean.png'),
  '#E5C158': require('@/assets/images/nova_lamp_clean.png'),
  '#8E9AA6': require('@/assets/images/lounge_chair_clean.png'),
  '#D2C3B2': require('@/assets/images/dining-table.png'),
};

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

const shadowGeo = new THREE.PlaneGeometry(12, 12);
const shadowMat = new THREE.ShadowMaterial({ opacity: 0.10 });
const ground = new THREE.Mesh(shadowGeo, shadowMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.25;
ground.receiveShadow = true;
scene.add(ground);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = ${enableZoom};
controls.minDistance = 1.0; // Allow extreme close-up to inspect textures
controls.maxDistance = 12.0;
controls.enablePan = ${enablePan};
controls.autoRotate = ${autoRotate};
controls.autoRotateSpeed = 1.5;
controls.target.set(0, -0.2, 0);
controls.update();

function applyUpholsteryColor(mesh, colorHex) {
  if (!mesh.material) return;
  if (!mesh.userData.materialCloned) {
    mesh.material = mesh.material.clone();
    mesh.userData.materialCloned = true;
    mesh.userData.originalColor = mesh.material.color.clone();
    mesh.userData.originalMap = mesh.material.map;
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
      if (mesh.userData.originalColor) mesh.material.color.copy(mesh.userData.originalColor);
      mesh.material.map = mesh.userData.originalMap;
    } else {
      mesh.material.color.set(colorHex);
      mesh.material.map = null;
    }
    mesh.material.needsUpdate = true;
  }
}

let activeModel = null;
const loader = new THREE.GLTFLoader();
loader.load('${modelUrl}', (gltf) => {
  activeModel = gltf.scene;
  const box = new THREE.Box3().setFromObject(activeModel);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2.4 / maxDim;
  activeModel.scale.setScalar(scale);
  const center = box.getCenter(new THREE.Vector3());
  activeModel.position.x = -center.x * scale;
  activeModel.position.y = -box.min.y * scale - 1.25;
  activeModel.position.z = -center.z * scale;
  
  activeModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      applyUpholsteryColor(child, '${initialColor}');
    }
  });
  scene.add(activeModel);
}, undefined, (err) => {
  console.error('Error loading 3D GLTF asset:', err);
});

const handleMessage = (event) => {
  try {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    if (data && data.type === 'COLOR_CHANGE' && activeModel) {
      activeModel.traverse((child) => {
        if (child.isMesh) {
          applyUpholsteryColor(child, data.color);
        }
      });
    }
  } catch (e) {
    console.error(e);
  }
};

window.addEventListener('message', handleMessage);
document.addEventListener('message', handleMessage);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

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
  imageUri,
  autoRotate = true,
  enableZoom = true,
  enablePan = true,
  snapshotTrigger = 0
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [resolvedPath, setResolvedPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initialColorRef = useRef(customColor);
  const initialAutoRotateRef = useRef(autoRotate);
  const initialEnableZoomRef = useRef(enableZoom);
  const initialEnablePanRef = useRef(enablePan);

  useEffect(() => {
    let active = true;
    if (!modelPath) return;

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

  useEffect(() => {
    if (customColor && iframeRef.current && !isLoading) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ type: 'COLOR_CHANGE', color: customColor }),
        '*'
      );
    }
  }, [customColor, isLoading]);

  useEffect(() => {
    if (snapshotTrigger > 0 && iframeRef.current && !isLoading) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ type: 'SNAPSHOT' }),
        '*'
      );
    }
  }, [snapshotTrigger]);

  useEffect(() => {
    if (iframeRef.current && !isLoading) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ 
          type: 'CONTROLS_CHANGE', 
          enableZoom, 
          enablePan, 
          autoRotate 
        }),
        '*'
      );
    }
  }, [enableZoom, enablePan, autoRotate, isLoading]);

  if (!modelPath) {
    const resolvedImage = imageUri || COLOR_TO_IMAGE_MAP[customColor] || require('@/assets/images/armchair_clean.png');
    return (
      <View style={styles.container}>
        <Product360Viewer imageUri={resolvedImage} />
      </View>
    );
  }

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
      
      <iframe
        ref={iframeRef}
        style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
        src={`/3dviewer.html?model=${encodeURIComponent(resolvedPath)}&color=${encodeURIComponent(initialColorRef.current)}&autoRotate=${initialAutoRotateRef.current}&enableZoom=${initialEnableZoomRef.current}&enablePan=${initialEnablePanRef.current}`}
        onLoad={() => setIsLoading(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    position: 'relative',
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
});
