//
// 応用プログラミング 第9,10回 自由課題 (ap0901.js)
// G38498-2023 山﨑凰
//
"use strict"; // 厳格モード

// ライブラリをモジュールとして読み込む
import * as THREE from "three";
import { GUI } from "ili-gui";
import { GLTFLoader } from "three/addons";

// 制御点の設定
const controlPoints = [
  [-20, 0],
  [0, 0],
  [0, -20],
  [20, -20],
  [20, 0],
  [10, 0],
  [10, 20],
  [0, 20],
  [-20, 20],
  [-20, 0],
];

const offset = { x: 0, z: 0 };

// テクスチャの読み込み
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load("cityTexture.png"); // テクスチャファイルを指定

// ビル
function makeBuilding(scene, x, z, type) {
  const height = [2, 2, 7, 4, 5];
  const bldgH = height[type] * 2;
  const geometry = new THREE.BoxGeometry(4, bldgH, 4);
  const material = new THREE.MeshLambertMaterial({ map: texture });
  const sideUvS = (type * 2 + 1) / 11;
  const sideUvE = (type * 2 + 2) / 11;
  const topUvS = (type * 2 + 2) / 11;
  const topUvE = (type * 2 + 3) / 11;
  const uvs = geometry.getAttribute("uv");
  for (let i = 0; i < 48; i += 4) {
      if (i < 16 || i > 22) {
          uvs.array[i] = sideUvS;
          uvs.array[i + 2] = sideUvE;
      } else {
          uvs.array[i] = topUvS;
          uvs.array[i + 2] = topUvE;
      }
  }
  const bldg = new THREE.Mesh(geometry, material);
  bldg.position.set(offset.x + x, bldgH / 2, offset.z + z);
  scene.add(bldg);
}

// モデルの読み込み
let xwing; // モデルを格納する変数
function loadModel(scene) {
  const loader = new GLTFLoader();
  loader.load(
    "xwing.glb", // モデルのファイルパス
    (gltf) => {
      xwing = gltf.scene;
      xwing.scale.set(2, 2, 2); // スケールの調整
      xwing.position.set(0, 10, 0); // 初期位置
      scene.add(xwing); // シーンに追加
    }
  );
}

// ３Ｄページ作成関数の定義
function init() {
  // 制御変数の定義
  const param = {
    axes: true, // 座標軸
    follow: false, // 追跡
  };

  // GUIコントローラの設定
  const gui = new GUI();
  gui.add(param, "axes").name("座標軸");
  gui.add(param, "follow").name("追跡");

  // シーン作成
  const scene = new THREE.Scene();

  // 座標軸の設定
  const axes = new THREE.AxesHelper(18);
  scene.add(axes);

  // カメラの作成
  const camera = new THREE.PerspectiveCamera(
    50, window.innerWidth / window.innerHeight, 0.1, 1000
  );

  // 初期カメラ位置
  const initialCameraPosition = new THREE.Vector3(30, 30, 40);
  camera.position.copy(initialCameraPosition);
  camera.lookAt(0, 0, 0);

  // 平面
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50), // サイズ調整
    new THREE.MeshLambertMaterial({ color: "green" })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(0, 0, 0);
  scene.add(plane);

  // 環境光
  {
    const light = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(light);
  }
  // スポットライト
  {
    const light = new THREE.PointLight(0xffffff, 3000);
    light.position.set(0, 40, 0);
    scene.add(light);
  }

  // コース作成
  const course = new THREE.CatmullRomCurve3(
    controlPoints.map((p) => new THREE.Vector3(offset.x + p[0], 0, offset.z + p[1]))
  );

  // 道を作成（サークルの連続で描画）
  const points = course.getPoints(200);
  points.forEach((point) => {
    const road = new THREE.Mesh(
      new THREE.CircleGeometry(1, 16),
      new THREE.MeshLambertMaterial({ color: "gray" })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(point.x, 0.01, point.z); // 平面の上に表示
    scene.add(road);
  });

  // モデルの読み込み
  loadModel(scene);

  // ビルの配置
  makeBuilding(scene, -5, 17, 3);
  makeBuilding(scene, -10, -20, 4);
  makeBuilding(scene, -5, -10, 2);
  makeBuilding(scene, 15, 15, 4);
  makeBuilding(scene, 25, -10, 3);
  makeBuilding(scene, 15, -10, 4);
  makeBuilding(scene, -10, 10, 2);
  makeBuilding(scene, 20, 20, 1);
  makeBuilding(scene, 5, 12, 2);
  makeBuilding(scene, -14, -13, 1);
  makeBuilding(scene, 20, 10, 3);
  makeBuilding(scene, 5, -2, 4);

  // キー入力用のフラグ
  const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false, // 上昇
    ShiftLeft: false // 下降
  };

  // キー入力イベントのリスナー設定
  function setupKeyControls() {
    window.addEventListener("keydown", (event) => {
      if (event.code in keys) keys[event.code] = true;
    });

    window.addEventListener("keyup", (event) => {
      if (event.code in keys) keys[event.code] = false;
    });
  }

  // レンダラの設定
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x204060);
  document.getElementById("output").appendChild(renderer.domElement);

  // キー入力の初期化
  setupKeyControls();

  // 移動速度と回転速度の設定
  const speed = 0.5; // 移動速度
  const rotationSpeed = 0.05; // 回転速度

  // 描画処理
  const cameraOffset = new THREE.Vector3(-10, 5, -20); // 後方に配置するオフセット
  function render() {
    // カメラの位置の切り替え
    if (param.follow && xwing) {
      // xwing の後方にカメラを配置
      const direction = new THREE.Vector3();
      xwing.getWorldDirection(direction);
      const targetPosition = new THREE.Vector3().copy(xwing.position).add(
        cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), xwing.rotation.y)
      );

      camera.position.lerp(targetPosition, 0.1); // スムーズに移動
      camera.lookAt(xwing.position); // モデルを注視
    } else {
      // GUIのfollowがオフの場合は初期位置に戻る
      camera.position.copy(initialCameraPosition);
      camera.lookAt(0, 0, 0); // 原点を注視
    }

    // 座標軸の表示制御
    axes.visible = param.axes;

    // モデルの移動処理
    if (xwing) {
      // 前後移動（Z方向）
      if (keys.ArrowDown) {
        xwing.position.z -= Math.cos(xwing.rotation.y) * speed;
        xwing.position.x -= Math.sin(xwing.rotation.y) * speed;
      }
      if (keys.ArrowUp) {
        xwing.position.z += Math.cos(xwing.rotation.y) * speed;
        xwing.position.x += Math.sin(xwing.rotation.y) * speed;
      }

      // 左右回転（Y軸回り）
      if (keys.ArrowLeft) xwing.rotation.y += rotationSpeed;
      if (keys.ArrowRight) xwing.rotation.y -= rotationSpeed;

      // 上下移動（Y方向）
      if (keys.Space) xwing.position.y += speed; // 上昇
      if (keys.ShiftLeft) xwing.position.y -= speed; // 下降
    }

    renderer.render(scene, camera);
    // 次のフレームでの描画要請
    requestAnimationFrame(render);
  }
  // 描画開始
  render();
}
init();
