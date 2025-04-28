let scaling = 0.26;

function checkScaling() {
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let widthScaling = windowWidth / 2546;
    let heightScaling = windowHeight / 3218;
    if (widthScaling < heightScaling) {
        scaling = widthScaling;
    } else {
        scaling = heightScaling;
    }
    // console.log(scaling);
}
checkScaling();


const canvas = document.getElementById("xiaoyuan");

let scene, camera, renderer;
let body, headGroup, head;
let targetRotation = {
    groupX: 0,
    groupY: 0,
    groupZ: 0,
    headX: 0,
    headY: 0,
    headZ: 0
};
let isActionPlaying = false; // 控制是否可以press朝向
let isPressing = false; // 是否按着
let isReturning = false; // 是否正在归位中

let returnStartTime = 0;
let returnDuration = 500; // 归零时间 500ms

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isTickling = false;
let tickleStartTime = 0;
let laughSound;

let pressTimer = null;

let jumpOffset = 0;

let facePlane;
const textureLoader = new THREE.TextureLoader();

// 创建Plane
function createFacePlane() {
    const faceTexture = textureLoader.load('assets/default.png');
    const faceMaterial = new THREE.MeshBasicMaterial({
        map: faceTexture,
        transparent: true,
        side: THREE.DoubleSide // 双面可见，防止旋转后消失
    });

    const faceGeometry = new THREE.PlaneGeometry(0.18, 0.1);
    facePlane = new THREE.Mesh(faceGeometry, faceMaterial);

    facePlane.position.set(0, 0.15, 0.5);
    head.add(facePlane);
}

// 眨眼
let nextBlinkTime = (Date.now() + getRandomBlinkInterval()) / 1000;
let blinking = false;
let blinkStartTime = 0;

function getRandomBlinkInterval() {
    return 5000 + Math.random() * 3000; // 每5~8秒眨一次
}


init();
animate();

// 预加载表情图片
const faceTextures = {
    default: textureLoader.load('assets/default.png'),
    greet: textureLoader.load('assets/wink.png'),
    laugh: textureLoader.load('assets/laugh.png'),
    smile: textureLoader.load('assets/smile.png')
};


// 初始化xiaoyuan
function init() {
    laughSound = new Audio('assets/giggling-6799.mp3');
    scene = new THREE.Scene();
    scene.background = new THREE.Color("black");

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1, 3);

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 2, 3);
    scene.add(light);

    // fac959
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    // const yellow = new THREE.AmbientLight(0xfac959, 0.1);
    // scene.add(yellow);

    const loader = new THREE.GLTFLoader();

    loader.load('assets/hunban-body.glb', function (gltf) {
        body = gltf.scene;
        body.position.set(0, 0.5, 0);
        scene.add(body);
    });

    const headOffset = new THREE.Group();
    loader.load('assets/hunban-head.glb', function (gltf) {
        headGroup = new THREE.Group();
        head = gltf.scene;
        head.position.set(0, 0, 0);
        headGroup.position.set(0, 0.5, 0);
        headOffset.position.set(0, 0.6, 0);
        headGroup.add(headOffset);
        headOffset.add(head);
        scene.add(headGroup);

        // console.log("head position in group:", head.position);
        createFacePlane();
    });

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousedown', onPressStart);
    window.addEventListener('mouseup', onPressEnd);

    window.addEventListener('touchstart', onPressStart);
    window.addEventListener('touchend', onPressEnd);
}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);

    // 根据窗口比例，调整camera视角大小
    if (camera) {
        if (width < 600) {
            camera.fov = 60; // 小屏幕，比如手机，视角开大一点
        } else {
            camera.fov = 45; // 大屏幕，正常
        }
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

}

function smoothStep(progress) {
    return progress * progress * (3 - 2 * progress);
}


// xiaoyuan的动画循环
function animate() {
    requestAnimationFrame(animate);
    const time = Date.now() * 0.001; // 当前时间，秒


    // 眨眼
    if (!isActionPlaying && !blinking && time > nextBlinkTime) {
        // console.log("canBlink")
        // 开始眨眼
        blinking = true;
        blinkStartTime = time;
    }

    if (blinking) {
        const blinkElapsed = time - blinkStartTime;

        if (blinkElapsed < 0.5) {
            // 正在眨眼
            const blinkProgress = blinkElapsed / 0.5; // 0 ~ 1之间
            const scaleY = 1 - 0.6 * Math.sin(blinkProgress * Math.PI);
            facePlane.scale.set(1, scaleY, 1);
        } else {
            // 眨眼结束
            facePlane.scale.set(1, 1, 1);
            blinking = false;
            nextBlinkTime = (Date.now() + getRandomBlinkInterval()) / 1000; // 安排下一次眨眼
            // console.log("blink");
        }
    }


    if (body) {
        // ✨ 呼吸上下浮动
        const baseY = 0.5; // 身体默认y位置（你原来设置的是0.5）
        const breathingHeight = 0.02; // 浮动幅度（上下2cm）
        const breathingSpeed = 2; // 呼吸速度（越小越慢，一次呼吸大概3秒）

        const breathing = Math.sin(time * breathingSpeed) * breathingHeight;
        body.position.y = baseY + breathing + jumpOffset; // ✨ 头跟随身体呼吸，有弹性

        if (headGroup) {
            const targetHeadY = body.position.y // 头相对于身体的标准高度
            headGroup.position.y += (targetHeadY - headGroup.position.y) * 0.05;
            // 0.05是弹性跟随速度，越小越软
        }
    }

    if (isReturning) {
        const returnSpeed = 0.04; // 控制归零的快慢，越小越慢
        const timeElapsed = (Date.now() - returnStartTime) / returnDuration; // 归零进行到多少了
        const progress = Math.min(timeElapsed, 1);
        const eased = smoothStep(progress);

        targetRotation.groupX *= (1 - eased);
        targetRotation.groupY *= (1 - eased);
        targetRotation.groupZ *= (1 - eased);
        targetRotation.headX *= (1 - eased);
        targetRotation.headY *= (1 - eased);
        targetRotation.headZ *= (1 - eased);

        if (progress >= 1) {
            isReturning = false; // 归零完成
        }
    }

    if (isTickling) {
        const now = Date.now();
        const elapsed = (now - tickleStartTime) / 1000; // 秒数
        const tickleDuration = 1.0;

        let intensity = 1.0;
        facePlane.material.map = faceTextures.laugh;
        facePlane.scale.set(1.5, 1, 1);
        // is 后开始减速
        if (elapsed > tickleDuration) {
            const fadeElapsed = elapsed - tickleDuration;
            const fadeDuration = 1.0; 
            intensity = Math.max(0, 1 - fadeElapsed / fadeDuration); 
            if (intensity === 0) {
                isTickling = false; 
                laughSound.pause();
                resetTargetRotation();

                const targetVec = new THREE.Vector3(0, 0.5, 0);
                body.position.lerp(targetVec, 0.1); 
            }
        }

        if (elapsed > 1.65) {
            facePlane.material.map = faceTextures.default;
            facePlane.scale.set(1, 1, 1);
        }

        headGroup.rotation.z = Math.sin((now - tickleStartTime) * 0.05 * (0.4 * intensity + 0.6)) * 0.07 *
            intensity;
        headGroup.rotation.x = Math.sin((now - tickleStartTime) * 0.03 * (0.4 * intensity + 0.6)) * 0.08 *
            intensity;

        head.rotation.z = Math.sin((now - tickleStartTime) * 0.08 * (0.4 * intensity + 0.6)) * 0.05 * intensity;
        head.rotation.x = Math.sin((now - tickleStartTime) * 0.06 * (0.4 * intensity + 0.6)) * 0.03 * intensity;

        body.position.z = Math.sin((now - tickleStartTime) * 0.08 * (0.4 * intensity + 0.6)) * 0.05 * intensity;
        body.position.x = Math.sin((now - tickleStartTime) * 0.06 * (0.4 * intensity + 0.6)) * 0.04 * intensity;
    }

    if (headGroup) {
        // headGroup围绕body的中心转动（x/y/z）
        headGroup.rotation.x += (targetRotation.groupX - headGroup.rotation.x) * 0.1;
        headGroup.rotation.y += (targetRotation.groupY - headGroup.rotation.y) * 0.1;
        headGroup.rotation.z += (targetRotation.groupZ - headGroup.rotation.z) * 0.1;
    }

    if (head) {
        // head局部动作（以head自己的原点转动）
        head.rotation.x += (targetRotation.headX - head.rotation.x) * 0.1;
        head.rotation.y += (targetRotation.headY - head.rotation.y) * 0.1;
        head.rotation.z += (targetRotation.headZ - head.rotation.z) * 0.1;
    }
    renderer.render(scene, camera);
}


// 按钮触发动作
function triggerAction(type) {
    if (isActionPlaying) return; // 如果正在播放，不允许再次点击

    // 归零
    isReturning = true;
    returnStartTime = Date.now();

    // 归零时间 0.5s
    setTimeout(() => {
        isReturning = false;
        startAction(type);
    }, 500); 
}

function startAction(type) {
    isActionPlaying = true;

    let startTime = Date.now();
    let actionDuration = 1200; // 默认
    if (type === 'greet') {
        actionDuration = 1100;
    } else if (type === 'happy') {
        actionDuration = 1400;
    } else if (type === 'think') {
        actionDuration = 3000;
    } else if (type === 'sad') {
        actionDuration = 3000;
    }

    // 设置不同动作
    function updateAction() {
        const elapsed = (Date.now() - startTime); // 0~1之间
        const progress = elapsed / actionDuration; // 0 ~ 1之间

        if (type === 'greet') {
            if (progress < 0.35) {
                // 蓄力
                const subProgress = progress / 0.35; 
                const eased = Math.sin((subProgress * Math.PI) / 2);
                targetRotation.groupZ = 0.45 * eased; 
                targetRotation.groupX = -0.25 * eased; 
                headGroup.rotation.z = 0.45 * eased; 
                headGroup.rotation.x = -0.25 * eased; 
            } else if (progress < 0.5) {
                // 向右
                const subProgress = (progress - 0.32) / (0.5 - 0.32); 
                const eased = Math.sin((subProgress * Math.PI) / 2);
                headGroup.rotation.z = 0.45 - 0.65 * eased;
                headGroup.rotation.x = -0.25 + 0.45 * eased;
                targetRotation.groupZ = 0.45 - 0.65 * eased;
                targetRotation.groupX = -0.25 + 0.45 * eased;
            } else {
                // 停在右边
                targetRotation.groupZ = -0.2;
                targetRotation.groupX = 0.2;
            }
            // 换表情 wink
            if (progress > 0.99) {
                targetRotation.groupZ = 0;
                targetRotation.groupX = 0;
                if (facePlane) {
                    facePlane.material.map = faceTextures.default;
                    facePlane.scale.set(1, 1, 1);
                    facePlane.material.needsUpdate = true;
                }
            } else if (progress > 0.45) {
                facePlane.material.map = faceTextures.greet;
                facePlane.scale.set(1.01, 1, 1);
            }
        } else if (type === 'happy') {
            // 换表情
            facePlane.material.map = faceTextures.smile;
            facePlane.scale.set(1.3, 0.6, 1);

            targetRotation.groupZ = 0.3 * Math.sin(progress * Math.PI * 4);
            if (progress > 0.95) {
                if (facePlane) {
                    facePlane.material.map = textureLoader.load('assets/default.png'); // 笑脸图片
                    facePlane.scale.set(1, 1, 1);
                    facePlane.material.needsUpdate = true;
                }
            }
        } else if (type === 'jump') {
            // 换表情
            facePlane.material.map = faceTextures.smile;
            facePlane.scale.set(1.3, 0.6, 1);
            // happy：跳跃两次
            let jumpHeight = 0.7; // 主跳高度
            let smallJumpHeight = 0.4; // 次跳高度

            if (progress < 0.7) {
                const subProgress = progress / 0.7;
                if (subProgress < 0.4) {
                    const down = Math.sin(subProgress * Math.PI) * 0.1;
                    jumpOffset = -down;
                } else {
                    const upProgress = (subProgress - 0.4) * 2;
                    const height = jumpHeight * Math.sin(upProgress * Math.PI);
                    jumpOffset = height;
                }
            } else {
                const subProgress = (progress - 0.7) / 0.3; 
                const height = smallJumpHeight * Math.sin(subProgress * Math.PI);
                jumpOffset = height;
            }


            // 头部滞后跟随
            const bodyYTarget = 0.5 + jumpOffset;;
            const headY = headGroup.position.y;
            const diff = bodyYTarget - headY;
            headGroup.position.y += diff * 0.29; // 越小越滞后
            headGroup.rotation.x = -diff * 0.05; // 根据上下差值微微抬头低头（增强调性）

            // 动作快结束时，加一点小弹动
            if (progress > 0.9) {
                const t = (progress - 0.9) / 0.1; // 0~1
                const bounce = Math.sin(t * Math.PI * 3) * (1 - t) * 0.02; // 小幅度弹动，幅度逐渐减小
                jumpOffset += bounce;
            }

            // 恢复表情
            if (progress > 0.95) {
                if (facePlane) {
                    facePlane.material.map = faceTextures.default;
                    facePlane.scale.set(1, 1, 1);
                    facePlane.material.needsUpdate = true;
                }
            }
        } else if (type === 'sad') {
            if (facePlane && facePlane.scale) {
                if (progress < 0.15) {
                    // 眼睛放大再回缩
                    const expand = progress < 0.075 ? (progress / 0.075) : (1 - (progress - 0.075) / 0.075);
                    const scaleFactor = 1 + expand * 0.3; 
                    facePlane.scale.set(1, 1 * scaleFactor, 1);
                } else if (progress >= 0.15 && progress < 0.3) {
                    // 停顿，眼睛恢复正常
                    facePlane.scale.set(1, 1, 1);
                    targetRotation.headX = 0;
                    targetRotation.headY = 0;
                } else if (progress >= 0.3 && progress < 0.54) {
                    // 慢慢向右下方低头
                    facePlane.scale.set(1, 1, 1);
                    const moveProgress = (progress - 0.3) / 0.24; 
                    targetRotation.headX = 0.2 * moveProgress;
                    targetRotation.headY = 0.12 * moveProgress;
                    targetRotation.groupX = 0.3 * moveProgress;
                    targetRotation.groupY = 0.1 * moveProgress;
                    targetRotation.groupZ = -0.1 * moveProgress;
                } else {
                    // 摇头+眨眼
                    const shakeProgress = (progress - 0.54) / 0.46;
                    const shake = Math.sin(shakeProgress * Math.PI * 3) * 0.08; // 摆动2次
                    targetRotation.headY = 0.12 + shake; 
                    targetRotation.headX = 0.2; 
                    targetRotation.groupX = 0.3;
                    targetRotation.groupY = 0.1;
                    targetRotation.groupZ = -0.1;
                }
            }
        } else if (type === 'think') {
            if (progress < 0.08) {
                // 眨眼
                const blinkProgress = progress / 0.08;
                const scaleY = 1 - 0.5 * Math.sin(blinkProgress * Math.PI);
                facePlane.scale.set(1, scaleY, 1);
            } else if (progress >= 0.08 && progress < 0.09) {
                targetRotation.headY = 0;
                targetRotation.headX = 0;
            } else if (progress >= 0.09 && progress < 0.17) {
                const blinkProgress = (progress - 0.09) / 0.08;
                const scaleY = 1 - 0.5 * Math.sin(blinkProgress * Math.PI);
                facePlane.scale.set(1, scaleY, 1);
            } else if (progress >= 0.17 && progress < 0.38) {
                targetRotation.headY = 0;
                targetRotation.headX = 0;
            } else {
                // 头微微歪斜
                const moveProgress = (progress - 0.38) / 0.62; // 从0到1
                targetRotation.headX = -0.2 * moveProgress;
                targetRotation.headY = 0.1 * moveProgress;
            }
        }

        if (elapsed < actionDuration) {
            requestAnimationFrame(updateAction);
        } else {
            isActionPlaying = false;
        }
    }
    updateAction();
}

// 挠痒痒
function triggerTickle() {
    if (isTickling) return;

    isTickling = true;
    tickleStartTime = Date.now();

    playSound(laughSound);
}

// 目光跟随
// 光
let flashingLaser = document.getElementById("flashingLaser");

flashingLaser.style.width = `${scaling*15/0.19}px`;
flashingLaser.style.height = `${scaling*15/0.19}px`;
flashingLaser.style.borderRadius = `${scaling*7.5/0.19}px`;

let flashingLaserScale = 1;
let flashingLaserOpacity = 0;
let flashingLaserGrowing = true;
let flashingLaserAnimaId = null;

const LASER_MAX_SCALE = 1.4;
const LASER_MIN_SCALE = 1.0;
const LASER_SCALE_SPEED_UP = 0.01;
const LASER_SCALE_SPEED_DOWN = 0.02;

function animateLaser() {
    if (flashingLaserGrowing) {
        flashingLaserScale += LASER_SCALE_SPEED_UP;
        flashingLaserOpacity += LASER_SCALE_SPEED_UP*3;
        if (flashingLaserScale >= LASER_MAX_SCALE) flashingLaserGrowing = false;
    } else {
        flashingLaserScale -= LASER_SCALE_SPEED_DOWN;
        flashingLaserOpacity -= LASER_SCALE_SPEED_DOWN*3;
        if (flashingLaserScale <= LASER_MIN_SCALE) flashingLaserGrowing = true;
    }

    flashingLaser.style.transform = `scale(${flashingLaserScale})`;
    flashingLaser.style.opacity = flashingLaserOpacity;

    flashingLaserAnimaId = requestAnimationFrame(animateLaser);
}

// 点击后的判断
function onPressStart(event) {
    if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
        return;
    }
    if (isActionPlaying) return;

    resetTargetRotation();

    const { x: clientX, y: clientY } = getClientPosition(event);

    // 更新鼠标坐标（归一化）
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersectsBody = raycaster.intersectObject(body, true);
    const intersectsHead = raycaster.intersectObject(headGroup, true);

    if (intersectsBody.length > 0 || intersectsHead.length > 0) {
        pressTimer = setTimeout(() => {
            triggerTickle();
        }, 200);
    } else {
        isPressing = true;
        flashingLaser.style.opacity = 1;
        animateLaser();
        flashingLaser.style.left = `${clientX - flashingLaser.offsetWidth / 2}px`;
        flashingLaser.style.top = `${clientY - flashingLaser.offsetHeight / 2}px`;
        flashingLaser.style.zIndex = 19;
        window.addEventListener('mousemove', updateHeadDirection);
        window.addEventListener('touchmove', updateHeadDirection);
    }
}

function onPressEnd(event) {
    isPressing = false;

    cancelAnimationFrame(flashingLaserAnimaId);
    flashingLaser.style.opacity = 0;

    window.removeEventListener('mousemove', updateHeadDirection);
    window.removeEventListener('touchmove', updateHeadDirection);
    if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
    }
}

function updateHeadDirection(event) {
    if (!isPressing) return;

    const { x: clientX, y: clientY } = getClientPosition(event);

    flashingLaser.style.left = `${clientX - flashingLaser.offsetWidth / 2}px`;
    flashingLaser.style.top = `${clientY - flashingLaser.offsetHeight / 2}px`;

    const x = (clientX / window.innerWidth) * 2 - 1;
    const y = -(clientY / window.innerHeight) * 2 + 1;
    targetRotation.headY = x * 0.3;
    targetRotation.headX = -y * 0.2;
}

function getClientPosition(event) {
    if (event.type.startsWith('touch')) {
        return {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
    } else {
        return {
            x: event.clientX,
            y: event.clientY
        };
    }
}

function playSound(sound) {
    if (sound) {
        sound.currentTime = 0;
        sound.play();
    }
}

function resetTargetRotation() {
    targetRotation = {
        groupX: 0,
        groupY: 0,
        groupZ: 0,
        headX: 0,
        headY: 0,
        headZ: 0
    };
}
