//
// 応用プログラミング 第9,10回 自由課題 (ap0901.js)
// G38498-2023 山﨑凰
//
"use strict"; // 厳格モード

// ライブラリをモジュールとして読み込む
import * as THREE from "three";
import { GUI } from "ili-gui";

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

// ３Ｄページ作成関数の定義
function init() {
  // 制御変数の定義
  const param = {
    axes: true, // 座標軸
  };

  // GUIコントローラの設定
  const gui = new GUI();
  gui.add(param, "axes").name("座標軸");

  // シーン作成
  const scene = new THREE.Scene();

  // 座標軸の設定
  const axes = new THREE.AxesHelper(18);
  scene.add(axes);

  // カメラの作成
  const camera = new THREE.PerspectiveCamera(
    50, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(30,30,40);
  camera.lookAt(0,0,0);

  // 平面
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50), // サイズ調整
    new THREE.MeshLambertMaterial({ color: "green" })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(0, 0, 0);
  scene.add(plane)

  // 環境光
  {
    const light = new THREE.AmbientLight(0xffffff, 0.8);
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
      new THREE.CircleGeometry(1, 16), // サークルの半径を調整
      new THREE.MeshLambertMaterial({ color: "gray" })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(point.x, 0.01, point.z); // 平面の上に表示
    scene.add(road);
  });

  // レンダラの設定
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x204060);
  document.getElementById("output").appendChild(renderer.domElement);

  // 描画処理
  function render() {
    axes.visible = param.axes; // 座標軸の表示制御
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  // 描画関数
  function render() {
    // 座標軸の表示
    axes.visible = param.axes;
    // 描画
    renderer.render(scene, camera);
    // 次のフレームでの描画要請
    requestAnimationFrame(render);
  }

  // 描画開始
  render();
}

init();