// External variables and methods (for you to import)
import { emitter, showInfo, render, scaleSvgToTarget } from "../../__common__/utils";
import fabric from "../fabric";
import { canvas, exportCanvasConfig } from "../canvas";
import lib from "../lib";
import { panel } from "../component/sidebar";
import Cropper from "cropperjs";
// cropper css
import "cropperjs/dist/cropper.min.css";


  let cropper;
  let imageContainer;
  let shouldStripBackground = false;
 
  const hdMultiplier = 4;
  let scale = 1;
  let refs = null;

  const resizeImage = (image, maxWidth, maxHeight, callback) => {
    let imageWidth = image.naturalWidth;
    let imageHeight = image.naturalHeight;
    scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
    const targetWidth = imageWidth * scale;
    const targetHeight = imageHeight * scale;

    if (imageWidth <= targetWidth && imageHeight <= targetHeight) {
      callback(image);
    } else {
      const imgCanvas = document.createElement('canvas');
      const context = imgCanvas.getContext('2d');
      imgCanvas.width = targetWidth;
      imgCanvas.height = targetHeight;

      const tempCanvas = document.createElement('canvas');
      const tempContext = tempCanvas.getContext('2d');
      imageWidth = Math.round(imageWidth / 2);
      imageHeight = Math.round(imageHeight / 2);
      tempCanvas.width = imageWidth;
      tempCanvas.height = imageHeight;

      tempContext.drawImage(image, 0, 0, imageWidth, imageHeight);
      while (imageWidth / 2 > targetWidth) {
        tempContext.drawImage(
          tempCanvas,
          0,
          0,
          imageWidth,
          imageHeight,
          0,
          0,
          imageWidth / 2,
          imageHeight / 2
        );
        imageWidth = Math.round(imageWidth / 2);
        imageHeight = Math.round(imageHeight / 2);
      }
      context.drawImage(tempCanvas, 0, 0, imageWidth, imageHeight, 0, 0, imgCanvas.width, imgCanvas.height);

      const newImage = new Image();
      newImage.crossOrigin = "anonymous";
      newImage.onload = () => {
        callback(newImage);
        imgCanvas.remove();
      };
      newImage.src = imgCanvas.toDataURL('image/jpeg', 0.92);
    }
  };

  const openFileInput = () => {
    const input = document.createElement('input');
    // 接受多个文件 
    input.multiple = true;
    input.type = 'file';
    input.accept = '.gif,.png,.jpg,.jpeg,.webp,.avif,.svg';
    input.style.display = 'none';
    input.addEventListener('change', (event) => {
      const files = event.target.files;
      handleFiles(files);
      input.remove();
    });
    document.body.appendChild(input);
    input.click();
  };

  const initCropper = (image) => {
    function updateSizeDisplay() {
      const data = cropper.getData(true);
      refs.cropSize.innerHTML = `${image.naturalWidth}×${image.naturalHeight} → ${data.width}×${data.height }`;
    }
    
    cropper = new Cropper(image, {
      autoCropArea: 1,
      toggleDragModeOnDblclick: false,
      zoomOnWheel: false,
      ready: () => {
        updateSizeDisplay();
      },
      cropmove: () => {
        updateSizeDisplay();
      }
    });
  };

  const handleImageLoad = (imageSrc) => {
    imageContainer.style.height = '300px';
    imageContainer.style.maxHeight = '80vh';
    
    // 添加加载状态
    imageContainer.innerHTML = `
      <div class="flex items-center justify-center h-full">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    `;
    
    const imageElement = new Image();
    imageElement.crossOrigin = "anonymous";
    imageElement.onload = () => {
      const windowWidth = document.documentElement.clientWidth;
      const windowHeight = document.documentElement.clientHeight;
      scale = imageElement.naturalWidth > windowWidth || imageElement.naturalHeight > windowHeight ? hdMultiplier : 1;
      resizeImage(imageElement, windowWidth * hdMultiplier, windowHeight * hdMultiplier, (resizedImage) => {
        resizedImage.style.maxWidth = imageContainer.offsetWidth + 'px';
        resizedImage.style.maxHeight = imageContainer.offsetHeight + 'px';
        resizedImage.style.opacity = '0';
        resizedImage.style.transition = 'opacity 0.3s ease-in-out';
        
        imageContainer.innerHTML = '';
        imageContainer.appendChild(resizedImage);
        
        // 使用 requestAnimationFrame 确保样式已应用
        requestAnimationFrame(() => {
          resizedImage.style.opacity = '1';
          initCropper(resizedImage);
        });

        refs.crop.style.display = '';
        refs.buttons.style.display = '';
      });
    };
    
    imageElement.onerror = () => {
      imageContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-slate-400">
          <i class="vicon-error text-2xl mb-2"></i>
          <p>图片加载失败</p>
        </div>
      `;
    };
    
    imageElement.src = imageSrc;
  };

  const addToCanvas = (() => {
    let lastAddTime = 0; // 记录上次添加的时间
    let offset = 0; // 记录累计偏移量

    // 加一个参数，用来判断是否是点击 apply 按钮添加的，如果是，并且当前选中的 object 是 shapeimage 的话，则提示用户是要替换图片还是添加图片
    return function(image, type = 'image', isFromApply = false) {
        // 如果是从 apply 按钮添加的,并且当前选中的对象是 shapeimage
        if (isFromApply && canvas.getActiveObject()?.type === 'shapeimage') {
            const activeObject = canvas.getActiveObject();
            // 弹出确认框让用户选择是替换还是添加
            if (confirm('是否要替换当前选中的图片?')) {
                // 替换图片
                activeObject.replaceImage(image, {
                    resetSize: false,
                    center: true,
                    keepZoomLevel: false,
                });
                return;
            }
        }

        let width = 100;
        let height = 100;
        if(type === 'image'){
            width = image.naturalWidth;
            height = image.naturalHeight;
        }
        width = Math.min(width, exportCanvasConfig.width / 2);
        height = Math.min(height, exportCanvasConfig.height / 2);
        let scale = 1 / hdMultiplier;
        if (scale * width < exportCanvasConfig.width / 4 || scale * height < exportCanvasConfig.height / 4) {
            scale = Math.max(exportCanvasConfig.width / 4 / width, exportCanvasConfig.height / 4 / height);
        }

        let left = (exportCanvasConfig.width - width * scale) / 2;
        let top = (exportCanvasConfig.height - height * scale) / 2;
        let now = Date.now();

        // 如果 100 秒内连续添加图片，累积偏移量
        if (lastAddTime && (now - lastAddTime < 100 * 1000)) {
            offset += 10;  // 每次偏移量增加 10
        } else {
            offset = 0; // 超过 100 秒，重置偏移量
        }

        left += offset;
        top += offset;

        // 确保不会超出边界
        left = Math.min(Math.max(left, 30), exportCanvasConfig.width - 30);
        top = Math.min(Math.max(top, 30), exportCanvasConfig.height - 30);

        lastAddTime = now; // 更新上次添加时间

        if(type === 'image'){
            const fabricImage = new fabric.Shapeimage(image, {
                scaleX: scale,
                scaleY: scale,
                left: left,
                top: top,
                sourceType: 'imageUrl',
            });
            canvas.add(fabricImage);
            fabricImage.setCoords(); // 让 fabric.js 重新计算坐标
            canvas.setActiveObject(fabricImage);
            canvas.requestRenderAll();
        }
        if(type === 'svg'){
            const scaledSvgString = scaleSvgToTarget(image, exportCanvasConfig.width, exportCanvasConfig.height);
            fabric.loadSVGFromString(scaledSvgString, (objects, options) => {
              let svgGroup = fabric.util.groupSVGElements(objects, options);
  
              const canvasWidth = exportCanvasConfig.width;
              const canvasHeight = exportCanvasConfig.height;
          
              // 🟢 直接让 SVG 占满画布（最大可见尺寸）
              const svgWidth = svgGroup.width;
              const svgHeight = svgGroup.height;
          
              // 计算放大倍数
              const maxScaleX = canvasWidth / svgWidth;
              const maxScaleY = canvasHeight / svgHeight;
              const maxScale = Math.min(maxScaleX, maxScaleY);
          
              // 这里不要再额外除以 2（除非你想要额外留白）
              const finalScale = maxScale/2;
          
              svgGroup.set({
                scaleX: finalScale,
                scaleY: finalScale
              }).setCoords();
          
              // 计算放大后的边界
              const bound = svgGroup.getBoundingRect(true, true);
          
              // 居中
              svgGroup.set({
                left: (canvasWidth - bound.width) / 2 - bound.left,
                top: (canvasHeight - bound.height) / 2 - bound.top
              }).setCoords();
          
              // 放到画布
              canvas.add(svgGroup);
              canvas.setActiveObject(svgGroup)
                .calcOffset()
                .requestRenderAll();
    
            });
        }
    };
})();



  // 如果是多图的话，不需要裁剪，直接添加到画布上
  const handleFile = (file, multiple = false) => {
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }

    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      if (/\.(svg|gif|png|webp|avif|jpe?g)$/i.test(file.name)) {
        if (/\.svg$/i.test(file.name)) {
          addToCanvas(fileReader.result, 'svg');
          
        } else if (shouldStripBackground) {
        } else {
          if (multiple) {
            // 直接添加到画布上
            const image = new Image();
            image.crossOrigin = "anonymous";
            image.onload = () => {
              addToCanvas(image );
            };
            image.src = fileReader.result;
          } else {
            handleImageLoad(fileReader.result);
          }
        }
      }
    };
    if (/\.svg$/i.test(file.name)) {
      fileReader.readAsText(file);
    } else {
      fileReader.readAsDataURL(file);
    }
  };

  const handleFiles = (files, multiple) => {
    // 只允许 .gif,.png,.jpg,.jpeg,.webp,.avif,.svg
    files = Array.from(files).filter(file => /\.(gif|png|jpe?g|webp|avif|svg)$/i.test(file.name));
    if (files.length > 1) {
      for (let i = 0; i < files.length; i++) {
        handleFile(files[i], true);
      }
    } else if (files.length === 1) {
      if(multiple){
        handleFile(files[0], true);
      }else{
        handleFile(files[0]);
      }
    }
  };

  function renderUI() {
    if (refs) {
      return;
    }

    refs = render('', (d, e, f, _if) => {
      return [
        `<div data-id="wrapper" class="text-sm h-full overflow-auto">
          ${
            render.section('upload', [
              `<div data-id="uploadContainer"
              class="text-center py-4 border-dashed border-2 border-slate-200 rounded-lg bg-white">
                <p>${lib.word(2009, '<a href="javascript:;" data-id="browseBtn" class="text-purple-500">' + lib.word(2004) + '</a>')}</p> <p class="text-xs mt-2 text-slate-500">${lib.word(1315)}</p>
              </div>`
            ])
          }
          ${
            render.section('crop', [
              render.titleRow('裁剪', 'cropSize'),
              render.row('', 'imageContainer', 'cropImage w-full'),
            ])
          }
          ${
            render.buttons([
              { id: 'cancelButton', text: lib.word(1032), className: 'btn-secondary' },
              { id: 'cropButton', text: lib.word(1033), className: 'btn-primary' }
            ], 'buttons')
          }
        </div>
          `,
      ];
    }, panel.content);


    const { browseBtn, cancelButton,cropButton, uploadContainer } = refs;
    imageContainer = refs.imageContainer;
    imageContainer.crossOrigin = 'anonymous';
    

    // 拖拽上传图片
    uploadContainer.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.stopPropagation();
      uploadContainer.classList.add('border-purple-500');
    });
    uploadContainer.addEventListener('dragleave', (event) => {
      event.preventDefault();
      event.stopPropagation();
      uploadContainer.classList.remove('border-purple-500');
    });
    uploadContainer.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();
      uploadContainer.classList.remove('border-purple-500');
      let files = event.dataTransfer.files;
      handleFiles(files);
    });


    browseBtn.addEventListener('click', () => {
      openFileInput();
      return false;
    });

    cancelButton.addEventListener('click', () => {
      panel.hide();
    });
    cropButton.addEventListener('click', () => {
      if (!cropper) {
        showInfo('请先上传图片');
        return;
      }
      const croppedCanvas = cropper.getCroppedCanvas();
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        addToCanvas(image, 'image', true);
      };
      image.src = croppedCanvas.toDataURL('image/png', 0.92);
    });

  }


  const init = (showFileInput = true) => {
    renderUI();
    refs.crop.style.display = 'none';
    refs.imageContainer.style.height = 'auto';
    refs.buttons.style.display = 'none';
    panel.show('upload-image', refs.wrapper, '添加图片');
    if (showFileInput) {
      openFileInput();
    }
  };

emitter.on('operation:upload-image:init', () => {
  init();
});

emitter.on('operation:upload-image:drop', (files) => {
  handleFiles(files, true);
});
emitter.on('operation:upload-image:url', (url) => {
  init(false);  // 传入 false 表示不打开文件选择对话框
  handleImageLoad(url);
});



