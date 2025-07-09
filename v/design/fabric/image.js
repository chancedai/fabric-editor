import { fabric } from 'fabric';
import { emitter, throttle } from "../../__common__/utils";

/**
 * 自定义支持圆角的矩形类，继承自 fabric.Rect。
 */
export class RoundedRectangle extends fabric.Rect {
  constructor(options = {}) {
    super(options);

    // 启用在缩放时改变尺寸
    this.changeSizeWhenScaleXY = true;

    // 是否禁用缓存缩放图像
    this.noScaleCache = false;

    // 是否在内部使用圆角
    this.roundInside = options.roundInside || false;

    // 剪裁父元素
    this.clipParent = undefined;
  }

  /**
   * 自定义渲染函数，支持圆角绘制（支持 roundInside 控制）
   * @param {CanvasRenderingContext2D} ctx 
   * @param {boolean} useAbsoluteCoords 
   * @param {boolean} skipFill 
   */
  _render(ctx, useAbsoluteCoords = false, skipFill = false) {
    if (this.width !== 1 || this.height !== 1) {
      const radiusX = this.rx ? Math.min(this.rx, this.width / 2) : 0;
      const radiusY = this.ry ? Math.min(this.ry, this.height / 2) : 0;
      const w = this.width;
      const h = this.height;
      const left = useAbsoluteCoords ? this.left : -w / 2;
      const top = useAbsoluteCoords ? this.top : -h / 2;
      const useRoundedCorners = radiusX !== 0 || radiusY !== 0;
      const bezier = 0.4477152502;

      ctx.beginPath();
      ctx.moveTo(left + radiusX, top);
      ctx.lineTo(left + w - radiusX, top);

      if (this.roundInside && useRoundedCorners) {
        ctx.bezierCurveTo(left + w - radiusX, top + bezier * radiusY, left + w - bezier * radiusX, top + radiusY, left + w, top + radiusY);
      } else if (useRoundedCorners) {
        ctx.bezierCurveTo(left + w - bezier * radiusX, top, left + w, top + bezier * radiusY, left + w, top + radiusY);
      }

      ctx.lineTo(left + w, top + h - radiusY);

      if (this.roundInside && useRoundedCorners) {
        ctx.bezierCurveTo(left + w - bezier * radiusX, top + h - radiusY, left + w - radiusX, top + h - bezier * radiusY, left + w - radiusX, top + h);
      } else if (useRoundedCorners) {
        ctx.bezierCurveTo(left + w, top + h - bezier * radiusY, left + w - bezier * radiusX, top + h, left + w - radiusX, top + h);
      }

      ctx.lineTo(left + radiusX, top + h);

      if (this.roundInside && useRoundedCorners) {
        ctx.bezierCurveTo(left + radiusX, top + h - bezier * radiusY, left + bezier * radiusX, top + h - radiusY, left, top + h - radiusY);
      } else if (useRoundedCorners) {
        ctx.bezierCurveTo(left + bezier * radiusX, top + h, left, top + h - bezier * radiusY, left, top + h - radiusY);
      }

      ctx.lineTo(left, top + radiusY);

      if (this.roundInside && useRoundedCorners) {
        ctx.bezierCurveTo(left + bezier * radiusX, top + radiusY, left + radiusX, top + bezier * radiusY, left + radiusX, top);
      } else if (useRoundedCorners) {
        ctx.bezierCurveTo(left, top + bezier * radiusY, left + bezier * radiusX, top, left + radiusX, top);
      }

      ctx.closePath();

      if (!skipFill) {
        this._renderPaintInOrder(ctx);
      }
    } else {
      ctx.fillRect(-0.5, -0.5, 1, 1);
    }
  }

  /**
   * 转换为对象（用于 JSON 序列化）
   */
  toObject(additionalProps = []) {
    return {
      ...super.toObject([...RoundedRectangle.needInitFields || [], ...additionalProps]),
      roundInside: this.roundInside
    };
  }

  /**
   * 拷贝样式（用于克隆、粘贴等）
   */
  copyStyle() {
    return {
      ...super.copyStyle?.(),
      fill: this.get('fill'),
      stroke: this.get('stroke'),
      strokeWidth: this.get('strokeWidth'),
      strokeDashArray: [...(this.get('strokeDashArray') || [])],
      strokeDashType: this.get('strokeDashType'),
      strokeLineCap: this.get('strokeLineCap'),
      type: 'polygon' // 标记为多边形样式
    };
  }

  /**
   * 粘贴样式（从另一对象继承）
   * @param {Object} sourceStyle 
   */
  pasteStyle(sourceStyle) {
    let newStyle = {};

    switch (sourceStyle.type) {
      case 'polygon':
        newStyle = {
          fill: sourceStyle.fill,
          stroke: sourceStyle.stroke,
          strokeWidth: sourceStyle.strokeWidth,
          strokeDashArray: sourceStyle.strokeDashArray,
          strokeDashType: sourceStyle.strokeDashType,
          strokeLineCap: sourceStyle.strokeLineCap,
          openShadow: sourceStyle.openShadow,
          shadow: sourceStyle.shadow,
          opacity: sourceStyle.opacity
        };
        break;
      case 'svg':
      case 'grid':
        if (sourceStyle.fills?.[0]) {
          newStyle.fill = sourceStyle.fills[0].fill;
        }
        Object.assign(newStyle, {
          openShadow: sourceStyle.openShadow,
          shadow: sourceStyle.shadow,
          opacity: sourceStyle.opacity
        });
        break;
      case 'textbox':
        newStyle.opacity = sourceStyle.opacity;
        break;
      default:
        Object.assign(newStyle, {
          openShadow: sourceStyle.openShadow,
          shadow: sourceStyle.shadow,
          opacity: sourceStyle.opacity
        });
    }

    const center = this.getCenterPoint();
    this.setOptions(newStyle);
    this.setPositionByOrigin(center, 'center', 'center');
  }

  /**
   * 取消选中处理（用于剪裁组内交互）
   */
  onDeselect(event) {
    if (this.clipParent) {
      if (!event || event.object !== this.clipParent) {
        if (this.clipParent.isEditing) {
          this.clipParent.closeClipBounds(false);
        }
      }
    }
    return false;
  }
}
fabric.RoundedRectangle = RoundedRectangle;


/**
 * 计算将原始尺寸等比缩放以覆盖目标区域所需的最大缩放比例（Cover 模式）。
 *
 * @param {number} originalWidth - 原始宽度
 * @param {number} originalHeight - 原始高度
 * @param {number} targetWidth - 目标区域宽度
 * @param {number} targetHeight - 目标区域高度
 * @returns {number} - 缩放比例（>=1 表示放大，<1 表示缩小）
 */
function calculateCoverScale(originalWidth, originalHeight, targetWidth, targetHeight) {
  const scaleX = targetWidth / originalWidth;
  const scaleY = targetHeight / originalHeight;
  return Math.max(scaleX, scaleY);
}


/**
 * 移除图片 URL 中的 ?timestamp= 参数及其后续内容（如果存在）。
 * @param {string} imageUrl - 原始图片链接
 * @returns {string} - 移除 timestamp 参数后的链接
 */
function removeTimestampParam(imageUrl) {
  const timestampIndex = imageUrl.indexOf("?timestamp=");
  
  // 如果 URL 包含 ?timestamp=，截取其之前的部分
  if (timestampIndex > 0) {
    return imageUrl.slice(0, timestampIndex);
  }

  // 否则，返回原始 URL
  return imageUrl;
}

/**
 * 处理图片 URL，根据不同环境（中国/非中国）以及高清导出配置，对图片链接进行格式转换。
 * @param {string} imageUrl - 原始图片链接
 * @returns {string} - 处理后的图片链接
 */
function processImageUrl(imageUrl) {
  return imageUrl;
  // 如果 imageUrl 存在且长度大于 0
  if (imageUrl && imageUrl.length > 0) {

    // 判断当前是否是中国大陆环境
    if (fabric.IS_CN) {
      // 如果 URL 包含 @xxxw_xxxh_1l.src 格式（老格式）
      if (/@(\d+)w_(\d+)h_1l\.src/.exec(imageUrl)) {
        // 替换为阿里 OSS 图片处理格式
        imageUrl = imageUrl.replace(
          /@(\d+)w_(\d+)h_1l\.src/,
          "?x-oss-process=image/resize,lfit,h_$1,w_$2/format,src"
        );

        // 如果 URL 中含有 ?timestamp= 参数，转换为 &timestamp=
        if (/\?timestamp=/.test(imageUrl)) {
          imageUrl = imageUrl.replace(/\?timestamp=/, "&timestamp=");
        }
      }
    } else {
      // 非中国大陆环境：将 OSS 格式反向转换为 @xxxw_xxxh_1l.src 格式
      if (/\?x-oss-process=image\/resize,lfit,h_(\d+),w_(\d+)\/format,src/.exec(imageUrl)) {
        imageUrl = imageUrl.replace(
          /\?x-oss-process=image\/resize,lfit,h_(\d+),w_(\d+)\/format,src/,
          "@$1w_$2h_1l.src"
        );
      }

      // 如果存在 &timestamp=，替换为 ?timestamp=
      if (/\&timestamp=/.test(imageUrl)) {
        imageUrl = imageUrl.replace(/\&timestamp=/, "?timestamp=");
      }
    }

    // 如果启用了高清导出（即不需要加参数）
    if (fabric.fotorExportHD) {
      // 去除老格式参数
      if (/@(\d+)w_(\d+)h_1l\.src/.test(imageUrl)) {
        imageUrl = imageUrl.replace(/@(\d+)w_(\d+)h_1l\.src/, "");
      }

      // 去除阿里 OSS 格式参数
      if (/\?x-oss-process=image\/resize,lfit,h_(\d+),w_(\d+)\/format,src/.test(imageUrl)) {
        imageUrl = imageUrl.replace(
          /\?x-oss-process=image\/resize,lfit,h_(\d+),w_(\d+)\/format,src/,
          ""
        );
      }

      // 将 &timestamp= 变为 ?timestamp=
      if (/\&timestamp=/.test(imageUrl)) {
        imageUrl = imageUrl.replace(/\&timestamp=/, "?timestamp=");
      }
    }
  }

  return imageUrl;
}

/**
 * 生成标准化的图片 URL（含缩略图/大图处理参数），适配国内外 OSS/CDN。
 *
 * @param {string} imageUrl - 原始图片 URL
 * @param {boolean} isLarge - 是否为大图（true = 1200w，false = 150w）
 * @returns {string} - 带图像处理参数的图片 URL
 */
function buildProcessedImageUrl(imageUrl, isLarge) {
  return imageUrl;
  const isChinaRegion = fabric.IS_CN;

  // 空或无效链接，直接返回空字符串
  if (!imageUrl || imageUrl === "") {
    return "";
  }

  // 如果是 base64、svg 或 blob 数据源，原样返回
  if (
    imageUrl.includes("base64") ||
    imageUrl.endsWith(".svg") ||
    imageUrl.startsWith("blob")
  ) {
    return imageUrl;
  }

  // 预处理 URL（调用外部 B 函数，可能是路径清洗）
  // imageUrl = B(imageUrl);
  imageUrl = processImageUrl(imageUrl);

  let finalUrl = "";
  let timestampQuery = "";

  // 提取 timestamp 参数（如 timestamp=168888888）
  const timestampMatch = /timestamp=(\d+)/.exec(imageUrl);
  if (timestampMatch) {
    timestampQuery = timestampMatch[0];
  }

  // 是否已有图像处理参数，避免重复添加
  const hasImageProcessingParams =
    (isChinaRegion && imageUrl.includes("?x-oss-process=image")) ||
    (!isChinaRegion &&
      (imageUrl.includes("@1200w_1200h") || imageUrl.includes("@150w_150h")));

  // 或者是某些特殊路径，也视为已有处理参数
  const isProjectAsset =
    imageUrl.includes("assets/projects/pages/") ||
    imageUrl.includes("assets/projects/thumb/");

  if (hasImageProcessingParams || isProjectAsset) {
    return imageUrl; // 已有处理参数，直接返回
  }

  // 构建处理参数（根据区域 + 是否大图）
  const resizeParams = isLarge
    ? isChinaRegion
      ? "?x-oss-process=image/resize,lfit,h_1200,w_1200/format,src"
      : "@1200w_1200h_1l.src"
    : isChinaRegion
    ? "?x-oss-process=image/resize,lfit,h_150,w_150/format,src"
    : "@150w_150h_1e.src";

  // 去掉已有参数（避免重复添加）
  imageUrl = imageUrl.replace(/(\?.*)?$/g, "").replace(/(@.*)?$/g, "");

  // 拼接处理参数
  finalUrl = imageUrl + resizeParams;

  // 拼接 timestamp 参数（国内参数用 &，国外用 ?）
  if (resizeParams && timestampQuery) {
    finalUrl += isChinaRegion ? `&${timestampQuery}` : `?${timestampQuery}`;
  }

  return finalUrl;
}

const xe = {
  "SELECTION_CREATED": "selection:created",
  "SELECTION_CLEARD": "selection:cleared",
  "OBJECT_MODIFIED": "object:modified",
  "SVG_FILL_MODIFIED": "svg:fill_modified",
  "OBJECT_SELECTED": "object:selected",
  "OBJECT_SELECTED_BY_RIGHT_CLICK": "object:selected_by_right_click",
  "OBJECT_ROTATING": "object:rotating",
  "OBJECT_SCALING": "object:scaling",
  "OBJECT_MOVING": "object:moving",
  "OBJECT_ADDED": "object:added",
  "OBJECT_REMOVED": "object:removed",
  "SELECTED_UPDATE": "selection:updated",
  "SHOW_LOCK_SHAKE": "show_lock_shake",
  "MOUSE_DBCLICK": "mousedblclick",
  "MODIFIED": "modified",
  "MOUSE_UP": "mouse:up",
  "MOUSE_DOWN": "mouse:down",
  "MOUSE_STRAT_DRAG": "mouse:start_drag",
  "MOUSE_END_DRAG": "mouse:end_drag",
  "MOUSE_MOVE": "mouse:move",
  "MOUSE_OVER": "mouse:over",
  "MOUSE_OUT": "mouse:out",
  "MOUSE_DBLCLICK": "mouse:dblclick",
  "TEXT_CHANGED": "text:changed",
  "TEXT_SELECTION_CHANGED": "text:selection:changed",
  "TEXT_EDITING_ENTERED": "text:editing:entered",
  "TEXT_EDITING_EXITED": "text:editing:exited",
  "TEXT_SCALE_CHANGE": "text_scale_change",
  "TEXT_FONT_FAMILY_LOADED": "text_font_family_loaded",
  "TEXT_FONT_INFO_READY": "text_font_info_ready",
  "TEXT_FONT_LOAD_BY_OBJECTS": "text_font_load_by_objects",
  "FTIMAGE_SHOW_CLIP": "FTImage:showClip",
  "FTIMAGE_CLOSE_CLIP": "FTImage:closeClip",
  "FTGRIDLINE_STATUS_CHANGED": "FTGridline:statusChanged",
  "CANVAS_DRAGENTER": "dragenter",
  "CANVAS_DRAGLEAVE": "dragleave",
  "CANVAS_DRAGOVER": "dragover",
  "CANVAS_DROP": "drop",
  "BEFORE_RENDER": "before:render",
  "AFTER_RENDER": "after:render",
  "TOGGLE_PAGE": "toggle_page",
  "PAGE_LOADED": "page_loaded",
  "FTIMAGE_EXIT_EDIT": "FTimage_exit_edit",
  "CANCEL_COLOR_PICK": "cancel_Color_pick",
  "CHART_SCALE_CHANGE": "chart_scale_change",
  "IMAGECONTAINER_DRAG_START": "imagecontainer_drag_start",
  "IMAGECONTAINER_DRAGGING": "imagecontainer_dragging",
  "IMAGECONTAINER_DRAG_END": "imagecontainer_drag_end",
  "LEFT_MENU_TOGGLE": "left_menu_toggle",
  "FILTER_TXT_UPLOAD_SUCCESS": "filter_txt_upload_success",
  "FILTER_TXT_DRAW": "filter_txt_draw",
  "FILTER_TXT_DRAW_NEED": "filter_txt_draw_need",
  "MODIFIED_UI": "modified_ui",
  "IMAGE_STROKE_CHANGE": "image_stroke_change",
  "ADD_TEMPLATE_FAMILY_NAME": "add_template_family_name"
};
const f = {
  "i": {
      "RECT": "rect",
      "ELLIPSE": "ellipse",
      "SVG": "svg",
      "PATH": "path",
      "IMAGE": "image",
      "TEXTBOX": "textbox",
      "LINE": "line",
      "POLYGON": "polygon",
      "IMAGE_CONTAINER": "imageContainer",
      "IMAGE_CONTAINER_GROUP": "imageContainerGroup",
      "BACKGROUND": "background",
      "SELECTION": "activeSelection",
      "ARROW": "arrow",
      "POINTLINE": "pointLine",
      "GROUP": "group",
      "ELEMENT_GROUP": "elementGroup",
      "GRID": "grid",
      "WATERMARK": "watermark",
      "CHART": "chart",
      "TEXT_GROUP": "textGroup"
  },
  "k": {
      "TEXT_GROUP": "text_group"
  },
  "j": {
      "2": "GRID",
      "6": "IMAGE",
      "10": "GROUP_OBJECTS",
      "GROUP_OBJECTS": 10,
      "IMAGE": 6,
      "GRID": 2
  },
  "l": {
      "NONE": "",
      "VERTICAL_RL": "vertical-rl"
  },
  "m": {
      "PERSON": "person",
      "GENERAL": "general"
  },
  "a": {
      "SOLID": "solid",
      "LINEAR": "linear",
      "RADIAL": "radial"
  },
  "n": {
      "networkError": "Network Error",
      "code404": "Request failed with status code 404"
  },
  "h": {
      "0": "svip",
      "1": "free",
      "2": "vip",
      "svip": 0,
      "free": 1,
      "vip": 2
  },
  "e": {
      "PXBEE": "pxbee"
  },
  "d": {
      "SOURCE_TYPE_COLOR": "color",
      "SOURCE_TYPE_IMAGE": "imageUrl",
      "SOURCE_TYPE_SVG": "svgUrl"
  },
  "c": {
      "SC_CLOUD": "cloud",
      "SC_CUTOUT": "cutout",
      "SC_STOCK": "stock",
      "SC_STICKER": "sticker",
      "SC_STICKER_CCO": "sticker_cc0",
      "SC_STICKER_BG": "sticker_bg",
      "SC_BACKGROUND": "background",
      "SC_STICKER_LOGO": "sticker_logo",
      "SC_AI_OFFICIAL": "ai_official",
      "SC_AI_USER": "ai_user"
  },
  "b": {
      "GENERAL_CUTOUT_ALI": "generalCutoutAli",
      "PERSON_CUTOUT_ALI": "personCutoutAli",
      "INTELLIGENT_SKIN_BEAUTIFYING": "intelligent_skin_beautifying",
      "PHOTO_TO_CARTOON": "photo_to_cartoon"
  },
  "f": {
      "GUIDE_SHOW": "guide_show",
      "GUIDE_FILTER": "guide_filter",
      "GUIDE_CUTOUT": "guide_cutout",
      "GUIDE_IMAGE_STYLES": "guide_image_styles",
      "GUIDE_TEXT_EFFECTS": "guide_text_effects",
      "GUIDE_CLIP": "guide_clip",
      "GUIDE_ALL": "guide_all"
  },
  "g": {
      "GUIDE_CLIP_COLLAGE": "guide_clip_collage",
      "GUIDE_IMGTEMP_COLLAGE": "guide_imgtemp_collage",
      "GUIDE_DOWNLOAD_COLLAGE": "guide_download_collage",
      "GUIDE_ALL": "guide_all",
      "GUIDE_HOT_CLIP_COLLAGE": "guide_hot_clip_collage",
      "GUIDE_HOT_CLIP_EDIT_COLLAGE": "guide_hot_clip_edit_collage",
      "GUIDE_HOT_TEXT_EFFECTS_COLLAGE": "guide_hot_text_effects_collage"
  }
};
/**
 * 深度克隆对象
 * 创建对象的完整副本，包括嵌套对象和数组
 * 
 * @param {Object} object - 要克隆的对象
 * @returns {Object} 克隆后的对象副本
 */
export function deepClone(object) {
  return fabric.util.object.clone(object, true);
}
function fetchImageFallback(url) {
  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        let error = new Error(`HTTP error: ${response.status}`);
        error.message = response.status === 404 ? "code404" : "networkError";
        throw error;
      }
      return response.blob();
    })
    .then((blob) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // 若跨域加载
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
      });
    });
}

// 2. 判断插件是否启用
/**
 * 判断指定的插件功能是否启用。
 *
 * @param {string} featureKey - 插件功能的标识符（如 PluginType.IMAGE_FILTER）
 * @returns {boolean} - 是否启用该插件功能
 */
function isPluginFeatureEnabled(featureKey) {
  // 初始化插件对象
  fabric.Plugin ||= {};
  fabric.PluginEnable ||= {};

  // 如果是滤镜或色温/色调功能，并且 BigWrap 插件存在
  if (
    [PluginType.IMAGE_FILTER, PluginType.IMAGE_TEMPEREATURE_TINT].includes(featureKey) &&
    fabric.Plugin.BigWrap
  ) {
    // 返回该功能是否启用
    return !!fabric.PluginEnable[featureKey];
  }

  // 如果是描边功能，并且 cv 插件存在
  if (
    featureKey === PluginType.IMAGE_STROKE &&
    fabric.Plugin.cv &&
    fabric.PluginEnable[featureKey]
  ) {
    return true;
  }

  // 其他情况一律返回 false
  return false;
}

// 3. 简化对象合并
function mergeObjects(target, ...sources) {
  for (const source of sources) {
    if (!source) continue;
    const keys = Reflect.ownKeys(source);
    for (const key of keys) {
      const desc = Object.getOwnPropertyDescriptor(source, key);
      Object.defineProperty(target, key, desc);
    }
  }
  return target;
}

const EventType = {
  "CANVAS_INIT_DONE": "canvas_init_done",
  "ALIGNING_GUIDELINE_ENABLE": "aligning_guideline_enable",
  "CANVAS_SIZE_CHANGED": "canvas_size_changed",
  "DOCUMENT_SIZE_CHANGED": "document_size_changed",
  "CANVAS_ZOOM": "canvas_zoom",
  "CONTENT_CHANGED": "content_changed",
  "MINIMAP_VIEWPORT_CHANGED": "minimap_viewport_changed",
  "THUMB_CHANGED": "thumb_changed",
  "COLOR_PICKER_MOVE": "color_picker_move",
  "COLOR_PICKER_DOWN": "color_picker_down",
  "TOOLBAR_MORE_LIST_CHANGE": "toolbar_more_list_change",
  "COMMAND_CHANGED": "command_changed",
  "SYNC_STATUS_CHANGED": "sync_status_changed",
  "DOCUMENT_SIZE_CHANGED_AllTEMPLATE": "document_size_changed_alltemplate",
  "TEMPLATE_COLLECT_CLICK": "template_collect_click"
};

// 4. 图像效果类型（使用修改后的变量名）
const ImageEffectType = {
  EFFECT: 0,
  BRIGHTNESS: 1,
  SATURATION: 2,
  CONTRAST: 3,
  SHARPEN: 4,
  BLUR: 5,
  0: "EFFECT",
  1: "BRIGHTNESS",
  2: "SATURATION",
  3: "CONTRAST",
  4: "SHARPEN",
  5: "BLUR",
};

// 6. 合并对象属性（简化版）
// function mergeObjects(target, ...sources) {
//   for (const source of sources) {
//     if (!source) continue;
//     const keys = Reflect.ownKeys(source);
//     for (const key of keys) {
//       const desc = Object.getOwnPropertyDescriptor(source, key);
//       Object.defineProperty(target, key, desc);
//     }
//   }
//   return target;
// }

// 使用插件类型常量（修改后的变量名）
const PluginType = {
  IMAGE_FILTER: "image_filter",
  IMAGE_TEMPEREATURE_TINT: "image_tempereature_tint",
  IMAGE_STROKE: "image_stroke",
};

class EnhancedImage extends fabric.Image {
  constructor(source, options) {
    super(source, options);

    this.stateProperties = fabric.Object.prototype.stateProperties.concat(
      EnhancedImage.initialFields
    );

    this.sourceType = undefined;
    this.sourceChannel = undefined;
    this.imageUrl = undefined;
    this.filtersChanged = true;
    this.effectFilterId = undefined;
    this.effectFilterName = undefined;
    this.effectFilterGroupName = undefined;
    this.effectFilterStrength = undefined;
    this.effectFilterIsPro = undefined;
    this.effectFilterSize = undefined;
    this.effectFilterDefalStrength = undefined;
    this.filtert_txt = undefined;
    this.eventCanvasFilter = undefined;
    this.imageViewport = undefined;
    this.imageScale = 1;
    this.imageCanvasScale = 1;
    this.imageAngle = undefined;
    this.preImageScale = 1;
    this.originalImageSize = undefined;
    this.hdImageSize = undefined;
    this.initialViewSize = undefined;
    this.initialImageSize = undefined;
    this.resizeFilterType = undefined;
    this.effectId = 0;
    this.effectBrightness = 0;
    this.brightness = 0;
    this.saturation = 0;
    this.contrast = 0;
    this.sharpen = 0;
    this.blur = 0;
    this.tint = 0;
    this.tempereature = 0;
    this.stockPhotoInfo = undefined;
    this.saveStateProps = undefined;
    this._saveStateProperties = undefined;
    this.previousImageViewport = undefined;
    this.previousViewSize = undefined;
    this.previousIndex = undefined;
    this.clipChild = undefined;
    this.clipChildState = undefined;
    this.editingScale = undefined;
    this.editingAngle = undefined;
    this.editingClipScaleX = undefined;
    this.editingClipScaleY = undefined;
    this.editingClipScaleW = undefined;
    this.editingClipScaleH = undefined;
    this.isEditing = false;
    this.minScale = undefined;
    this.readyToRender = true;
    this.changeSizeWhenScaleXY = true;
    this.addImagTimeStamp = undefined;
    this._imageCacheCanvas = undefined;
    this.imageChanged = true;
    this.loadError = undefined;
    this.cutoutLoadindKey = undefined;
    this.cutoutKey = undefined;
    this.skinKey = undefined;
    this.carToonKey = undefined;
    this.originInfo = undefined;
    this.imgStyles = [];
    this.imgStylesKey = undefined;
    this.imgStylesVip = false;
    this.imgStrokeChange = true;
    this._imgStylesStash = undefined;
    this.maxStrokeWidth = 0;
    this._imageStrokeContours = [];
    this._imageStrokeContoursBaseSize = undefined;
    this._imageStrokeCanvas = undefined;
    this.strokeLineJoin = "round";
    this.noScaleCache = false;
    this.reloadNum = 3;
    this.dataVersion = "1.2";
    this.imageLoading = undefined;
    this.temperatureAndTintChanged = true;
    this.tintTemperatureCanvas = undefined;
    this.myTintTemperatureCanvas = undefined;
    this.thumbnail = undefined;
    this.cutoutUrl = undefined;
    this.cutoutUrlObj = undefined;
    this.skinUrl = undefined;
    this.needReplace = false;
    this.cutoutKeyTemplate = undefined;
    this.forceRenderImage = false;
    this.preTrimImageViewport = undefined;
    this.compatible(options);
    this.lockScalingFlip = true;
    this.filters = [];
    this._initField(options);

    if (!this.hdImageSize) {
      this.hdImageSize = { width: this.width, height: this.height };
    }

    if (
      this.stockPhotoInfo &&
      this.stockPhotoInfo.status &&
      this.stockPhotoInfo.status !== 0
    ) {
      this.loadErrorType = ErrorCode.NOT_FOUND;
      this.showLoadError(() => this.requestRenderCanvas());
    } else if (source && typeof source === "string" && source.length > 0) {
      this.imageUrl = source;
      fabric.util.loadImage(
        source,
        (img) => {
          this.cutoutLoadingKey = undefined;
          if (img) {
            const width = this.width || (options && options.width);
            const height = this.height || (options && options.height);
            this.setElement(img, { width, height });
            if (!(options && options.imageViewport)) {
              this._caculateBounds(img);
            }
          } else if (fabric.isLikelyNode) {
            this.showLoadError(() => this.requestRenderCanvas());
          } else {
            fetchImageFallback(source).catch((error) => {
              if (
                (error.message === ErrorCode.NOT_FOUND &&
                  (this.loadErrorType = ErrorCode.NOT_FOUND)) ||
                (error.message === ErrorCode.NETWORK_ERROR &&
                  (this.loadErrorType = ErrorCode.NETWORK_ERROR) &&
                  this.reloadAttempts > 0)
              ) {
                this.reloadAttempts--;
                return void this.reload();
              }
              this.showLoadError(() => this.requestRenderCanvas());
            });
          }

          this.applyStyles(this);
          this.requestRenderCanvas();
        },
        options,
        "anonymous"
      );
    } else if (source) {
      this.originalImageSize = {
        width: source.naturalWidth || source.width,
        height: source.naturalHeight || source.height,
      };
      this.applyStyles(options);
    }

    if (!this.isNormalSticker() && !fabric.isLikelyNode) {
      this.on("mousedblclick", ()=>{
        
        this._onDoubleClick.bind(this)
      });
      this.on("moving", this._onMoving.bind(this));
      this.on("scaling", this._onScaling.bind(this));
      this.on("mousedown", this._onMousedown.bind(this));
      this.on("mousedown", this._onClipMouseDown.bind(this));
      this.on("mouseup", this._onMouseup.bind(this));
    } else if (!fabric.isLikelyNode) {
      this.on("scaling", this._onScalingOther.bind(this));
    }

    if (!fabric.isLikelyNode) {
      emitter.on(
        EventType.FILTER_TEXT_UPLOAD_SUCCESS,
        (event) => {
          if (event && event.id === this.effectFilterId) {
            this.filterText = event.txt;
            this.temperatureAndTintChanged = true;
            this.filtersChanged = true;
            this.requestRenderCanvas();
          }
        }
      );

      emitter.on(
        EventType.IMAGE_STROKE_CHANGE,
        () => {
          if (this.hasImageStroke()) {
            this.setImageStrokeDirty();
            this.requestRenderCanvas();
          }
        }
      );
    }
  }

  static needInitFields = ["sourceType", "sourceChannel", "imageViewport", "imageAngle", "imageScale", "imageCanvasScale", "preImageScale", "originalImageSize", "hdImageSize", "initialViewSize", "initialImageSize", "effectId", "effectBrightness", "brightness", "saturation", "contrast", "sharpen", "blur", "stockPhotoInfo", "imageVip", "resizeFilterType", "cutoutKey", "skinKey", "carToonKey", "originInfo", "imgStyles", "imgStylesKey", "imgStylesVip", "strokeLineJoin", "tint", "tempereature", "effectFilterId", "effectFilterStrength", "effectFilterIsPro", "effectFilterSize", "effectFilterDefalStrength", "effectFilterName", "effectFilterGroupName", "cutoutUrl", "skinUrl", "cutoutKeyTemplate", "preTrimImageViewport"];
  static DEFAULT_BACKGROUND_COLOR = '#fff';

  _initField(initialData) {
    const self = this;

    // 如果传入的参数包含数据并且数据中有 "isUpImg" 字段
    if (initialData) {
      
      // 如果是图片来源为云端，更新 sourceChannel
      if (initialData.isUpImg) {
        initialData.sourceChannel = "cloud";
      }

      // 遍历需要初始化的字段，将其添加到当前实例
      self.constructor.needInitFields.forEach(function(field) {
        if (initialData.hasOwnProperty(field)) {
          // 对于 "imgStyles" 字段，进行特殊处理
          if (field === "imgStyles") {
            self.imgStyles = deepClone(initialData.imgStyles);
          } else {
            self[field] = initialData[field];
          }

          // 如果是 "stockPhotoInfo"，且有 original 字段，则删除 original
          if (field === "stockPhotoInfo" && self.stockPhotoInfo && self.stockPhotoInfo.original) {
            delete self.stockPhotoInfo.original;
          }
        }
      });

      // 处理 "isPersonCutouted" 字段
      if (initialData.hasOwnProperty("isPersonCutouted")) {
        self.cutoutKey = initialData.isPersonCutouted ? f.b.PERSON_CUTOUT_ALI : undefined;
        delete self.isPersonCutouted;
        delete initialData.isPersonCutouted;
      }

      // 处理 "openShadow" 和 "shadow" 字段
      if (!initialData.isFromContainerGroup && !(self.group && self.group.type === f.i.IMAGE_CONTAINER_GROUP)) {
        if (initialData.openShadow && initialData.shadow) {
          self.imgStyles.unshift({
            eId: u()(), // 随机生成一个 ID
            shadow: deepClone(initialData.shadow) // 将 shadow 数据进行某种转换
          });
          self.imgStylesKey = "s2";
          self.shadow = undefined;
        } else if (initialData.openShadow) {
          self.shadow = undefined;
        }
      }

      // 如果 originX 和 originY 都是 "center"，则调整坐标
      if (self.originX === "center" && self.originY === "center") {
        const point = self.getPointByOrigin("left", "top");
        self.left = point.x;
        self.top = point.y;
        self.originX = "left";
        self.originY = "top";
      }
    }
  }

  compatible(options) {
    if (
      options &&
      (!options.dataVersion || Number(options.dataVersion) <= 1.1)
    ) {
      options.strokeLineJoin = "round";
    }
  }

  _onDoubleClick(options) {
    // 1. 如果图片尚未准备好，则不处理双击事件
    if (!this.isImageReady()) return;
  
    // 2. 如果该对象被包含在一个 group 中
    if (this.group) {
      // 2.1 且图片来源为 URL 类型，表示为可裁剪图片
      if (this.sourceType === 'imageUrl') {
        // 2.2 触发自定义事件，通知外部显示裁剪框
        fabric.util.fire('FTImage:showClip', {
          object: this,
          clipCoords: mergeObjects({}, this.aCoords, {
            left: this.left,
            top: this.top,
            width: this.getScaledWidth(),
            height: this.getScaledHeight(),
            angle: this.angle,
            clipPath: this._clipExtraData(),
            centerPoint: this.getCenterPoint(),
          }),
        });
      }
      // 无需继续处理，直接返回
      return;
    }
  
    // 3. 如果当前图像已经处于裁剪状态（有原始裁剪区域）
    if (this.getOriginalRect()) {
      // 3.1 执行关闭裁剪框操作（true 表示来自双击行为）
      this.closeClipBounds(true);
    } else {
      // 4. 当前未裁剪状态 → 显示裁剪框
      this.showClipBounds();
  
      // 5. 同时通知其它 UI 元素关闭引导（如辅助线、提示）
      emitter.emit('monitor_guide_close', 'guide_all');
    }
  }
  

  /**
 * 当裁剪状态发生变化时触发
 * @param {boolean} isEditing - 当前是否处于编辑（裁剪）状态
 * @param {boolean} resetState - 是否重置为保存的状态属性
 */
onClipChanged(isEditing, resetState) {
  this.isEditing = isEditing;
  this.imageChanged = true;

  // 更新交互属性和控制点显示状态
  this._applyEditModeState(isEditing);

  // 如果需要，恢复保存过的状态属性
  if (resetState) {
    this._stateProperties = this._savedStateProperties;
  }

  // 通知数据已更改，是否触发外部事件取决于 resetState
  this._fireDataChanged(!resetState);
}

/**
 * 裁剪时附加的额外数据，留作扩展用（当前未实现）
 */
_clipExtraData() {
  return null;
}

/**
 * 根据当前是否处于编辑模式，设置交互属性状态
 * @param {boolean} isEditing - 是否处于裁剪模式
 */
_applyEditModeState(isEditing) {
  if (isEditing) {
    this._saveCurrentControlState();

    this.hasRotatingPoint = false;    // 裁剪时禁止旋转
    this.lockUniScaling = true;       // 锁定等比缩放
    this.isLock = false;              // 解锁整体对象
    this.setControlVisible("mbm", false); // 隐藏自定义控制点
  } else if (this._savedControlState) {
    // 还原保存的状态
    const { hasRotatingPoint, lockUniScaling, isLock } = this._savedControlState;

    this.hasRotatingPoint = hasRotatingPoint;
    this.lockUniScaling = lockUniScaling;
    this.isLock = isLock;
    this.setControlVisible("mbm", true); // 显示控制点
  }
}

/**
 * 保存当前图像对象的关键控制状态
 */
_saveCurrentControlState() {
  this._savedControlState = {
    hasRotatingPoint: this.hasRotatingPoint,
    lockUniScaling: this.lockUniScaling,
    isLock: this.isLock,
  };
}

/**
 * 判断对象是否应该缓存图像（含阴影时应缓存）
 * @returns {boolean}
 */
shouldCache() {
  return super.shouldCache() || this.hasShadow();
}

/**
 * 判断图像样式中是否存在有效阴影
 * @returns {boolean}
 */
hasShadow() {
  return this.imgStyles.some(style => {
    const shadow = style.shadow;
    return shadow &&
      (shadow.offsetX !== 0 || shadow.offsetY !== 0 || !x(shadow.color));
  });
}

willDrawShadow() {
  return this.hasShadow();
}


/**
 * 临时隐藏所有图像样式，并保存当前样式状态
 */
_hideImgStyles() {
  this._imgStylesBackup = {
    imgStyles: deepClone(this.imgStyles),
    imgStylesKey: this.imgStylesKey,
    imgStylesVip: this.imgStylesVip,
  };

  this.changeImgStyles({
    imgStyles: [],
    imgStylesKey: undefined,
    imgStylesVip: false,
  });
}

/**
 * 恢复之前隐藏的图像样式
 * @param {fabric.Point} [centerPoint] - 中心点，用于恢复时定位
 */
_showImgStyles(centerPoint) {
  if (this._imgStylesBackup) {
    this.changeImgStyles(deepClone(this._imgStylesBackup), {
      centerPoint,
    });

    this._imgStylesBackup = null;
  }
}


showClipBounds() {
  if (this.isEditing || !this.imageViewport) return;

  // 保存当前图层在 canvas 中的顺序索引
  this.previousIndex = this.canvas ? this.canvas._objects.indexOf(this) : undefined;

  // 保存状态和样式
  this.saveState();
  this._saveStateProperties = deepClone(this._stateProperties);
  this._hideImgStyles();

  // 创建裁剪框对象
  this.clipChild = new RoundedRectangle({
    width: this.width,
    height: this.height,
    left: this.left,
    top: this.top,
    angle: this.angle || 0,
    scaleX: this.scaleX,
    scaleY: this.scaleY,
    fill: "#00000000",
    centeredRotation: true,
    excludeFromExport: true,
  });
  this.clipChild.clipParent = this;

  // 设置裁剪框控件显示
  const controls = this._getControlsVisibility();
  this.clipChild.setControlsVisibility(
    this.checkDisableClipChild()
      ? { tl: false, tr: false, br: false, bl: false, ml: false, mt: false, mr: false, mb: false, mtr: false, mbm: false }
      : { ...controls, mtr: false, mbm: false }
  );

  // 设置控件图标样式
  this.clipChild.cornerStyleIcons = {
    ...this.clipChild.cornerStyleIcons,
    tl: "clip",
    tr: "clip",
    bl: "clip",
    br: "clip",
  };

  // 保存裁剪框状态
  this.clipChild.saveState();
  this.clipChildState = deepClone(this.clipChild.getSavedState());
  this.editingAngle = this.angle || 0;

  // 获取当前坐标及中心点
  const originalCoords = this.calcCoords(true);
  const center = this.getCenterPoint();

  // 根据 viewport 缩放图像
  this.editingScale = this.scaleX;
  const scaledWidthRatio = this.getScaledWidth() / this.imageViewport.width / this.scaleX;
  const scaledHeightRatio = this.getScaledHeight() / this.imageViewport.height / this.scaleY;
  this.width = scaledWidthRatio;
  this.height = scaledHeightRatio;

  const originalWidth = this.getScaledWidth();
  const originalHeight = this.getScaledHeight();
  this.scaleX *= this.imageCanvasScale;
  this.scaleY *= this.imageCanvasScale;
  const newScaledWidth = this.getScaledWidth();
  const newScaledHeight = this.getScaledHeight();

  const originalRect = this.getOriginalRect();
  const imageOffset = new fabric.Point(originalRect.x, originalRect.y);

  if (this.flipX) this.imageViewport.x = 1 - this.imageViewport.width - this.imageViewport.x;
  if (this.flipY) this.imageViewport.y = 1 - this.imageViewport.height - this.imageViewport.y;

  let leftOffset = imageOffset.x - this.imageViewport.x * originalWidth;
  let topOffset = imageOffset.y - this.imageViewport.y * originalHeight;

  if (this.imageAngle) {
    const rotationCenter = {
      x: this.imageViewport.x + this.imageViewport.width / 2,
      y: this.imageViewport.y + this.imageViewport.height / 2,
    };
    leftOffset -= (newScaledWidth - originalWidth) * rotationCenter.x;
    topOffset -= (newScaledHeight - originalHeight) * rotationCenter.y;
  }

  const combinedAngle = (this.angle || 0) + (this.imageAngle || 0);
  const rotatedPoint = fabric.util.rotatePoint(new fabric.Point(leftOffset, topOffset), center, fabric.util.degreesToRadians(combinedAngle));
  this.left = rotatedPoint.x;
  this.top = rotatedPoint.y;

  this.previousImageViewport = { ...this.imageViewport };
  this.imageViewport = { x: 0, y: 0, width: 1, height: 1 };

  this.onClipChanged(true);
  if (this.imageAngle) this.angle = combinedAngle;

  fabric.util.fire("FTImage:showClip", {
    object: this,
    clipCoords: {
      ...originalCoords,
      left: originalRect.x,
      top: originalRect.y,
      width: this.getClipArea().width,
      height: this.getClipArea().height,
      angle: this.angle,
      flipX: this.flipX,
      flipY: this.flipY,
      centerPoint: center,
      clipPath: this._clipExtraData(),
    },
  });

  this.rotate(combinedAngle);
  if (!this.group) this.setCoords();
  this.bringToFront();

  this.canvas.add(this.clipChild);
  this.clipChild.on("moving", this.updateClipReact.bind(this));
  this.clipChild.on("scaling", this._onClipScaling.bind(this));
  this.clipChild.on("mousedown", this._onClipMouseDown.bind(this));
}

// 判断图像是否接近 0 或 90 度，用于判断是否为正交角度
isPerpendicular() {
  const mod = (this.imageAngle || 0) % 90;
  return mod <= 1 || mod >= 89;
}

// 鼠标按下裁剪框的控制点时触发，用于初始化缩放相关的状态
_onClipMouseDown(e) {
  const { transform } = e;
  if (!this.clipChild || !this.isPerpendicular()) return;

  // 记录原始位置与角度
  const original = { left: this.left, top: this.top, angle: this.angle };

  // 如果存在编辑角度，先将主图还原到未旋转状态
  if (this.editingAngle) {
    const center = this.clipChild.getCenterPoint();
    const currentPoint = new fabric.Point(this.left, this.top);
    const rotatedPoint = fabric.util.rotatePoint(currentPoint, center, fabric.util.degreesToRadians(-this.editingAngle));

    this.set({ left: rotatedPoint.x, top: rotatedPoint.y, angle: this.getClipAngle() - this.editingAngle }).setCoords();
    this.clipChild.rotate(0).setCoords();
  }

  // 获取裁剪框相对位置和缩放状态
  const bounds = this.getBoundingRect(true, true);
  const { scaleX, scaleY, width, height, left, top } = this.clipChild;
  const scaledWidth = this.clipChild.getScaledWidth();
  const scaledHeight = this.clipChild.getScaledHeight();
  const offsetX = left - bounds.left;
  const offsetY = top - bounds.top;

  let newScaleX = scaleX;
  let newScaleY = scaleY;
  let newWidth = width;
  let newHeight = height;

  const corner = transform.corner;

  // 辅助函数：同时更新 X 和 Y 缩放比例，使用较小值保持裁剪框等比
  const adjustScale = (scaleW, scaleH) => {
    this.editingClipScaleX = Math.min(scaleW, scaleH);
    this.editingClipScaleY = Math.min(scaleW, scaleH);
  };

  // 根据操作角落调整缩放或尺寸
  switch (corner) {
    case "tl":
    case "bl":
      newScaleX = (scaledWidth + offsetX) / width;
      newScaleY = (scaledHeight + offsetY) / height;
      break;
    case "tr":
    case "br":
      newScaleX = (bounds.width - offsetX) / width;
      newScaleY = (scaledHeight + offsetY) / height;
      break;
    case "mt":
    case "mb":
      newHeight = (corner === "mt" ? offsetY + scaledHeight : bounds.height - offsetY) / scaleY;
      break;
    case "ml":
    case "mr":
      newWidth = (corner === "ml" ? offsetX + scaledWidth : bounds.width - offsetX) / scaleX;
      break;
  }

  adjustScale(newScaleX, newScaleY);
  this.editingClipScaleW = newWidth;
  this.editingClipScaleH = newHeight;

  // 恢复图像状态并重新应用角度旋转
  if (this.editingAngle) {
    this.setOptions(original);
    this.setCoords();
    this.clipChild.rotate(this.editingAngle).setCoords();
  }
}


  // 在缩放裁剪框时触发，确保裁剪区域保持在主图范围内，并防止非法缩放
_onClipScaling(e) {
  if (!this.clipChild) return;

  // 保存缩放前的主图缩放状态和中心点
  const prevScaleX = this.scaleX;
  const prevScaleY = this.scaleY;
  const center = this.getCenterPoint();

  // 临时增大主图缩放比，便于计算容差后的裁剪框是否越界
  this.scaleX = (this.getScaledWidth() + 3) / this.width;
  this.scaleY = (this.getScaledHeight() + 3) / this.height;
  this.setPositionByOrigin(center, "center", "center");
  this.setCoords();

  // 获取当前裁剪框变换后的各个顶点坐标
  const { transform } = e;
  const clipCoords = this.clipChild.getCoords(true, true);

  // 判断裁剪框是否完全在主图范围内
  const isContained = clipCoords.every(point => this.containsPoint(point, null, true));

  // 如果超出范围，恢复为上一次合法缩放状态
  if (!isContained && this.editingClipScaleX && this.editingClipScaleY && this.editingClipScaleW && this.editingClipScaleH) {
    const origin = this.clipChild.translateToOriginPoint(
      this.clipChild.getCenterPoint(),
      transform.originX,
      transform.originY
    );
    this.clipChild.set({
      scaleX: this.editingClipScaleX,
      scaleY: this.editingClipScaleY,
      width: this.editingClipScaleW,
      height: this.editingClipScaleH
    });
    this.clipChild.setPositionByOrigin(origin, transform.originX, transform.originY);
  }
  // 否则记录当前合法状态
  else if (!this.isPerpendicular()) {
    this.editingClipScaleX = this.clipChild.scaleX;
    this.editingClipScaleY = this.clipChild.scaleY;
    this.editingClipScaleW = this.clipChild.width;
    this.editingClipScaleH = this.clipChild.height;
  }

  // 恢复主图缩放和位置
  this.scaleX = prevScaleX;
  this.scaleY = prevScaleY;
  this.setPositionByOrigin(center, "center", "center");
  this.setCoords();
  this.updateClipReact();
}

// 更新裁剪框坐标信息事件（例如用于 UI 同步）
updateClipReact() {
  if (!this.clipChild) return;

  const originalRect = this.getOriginalRect();
  const coords = this.clipChild.calcCoords(true);
  const center = this.clipChild.getCenterPoint();

  fabric.util.fire('FTImage:showClip', {
    object: this,
    clipCoords: {
      ...coords,
      left: originalRect.x,
      top: originalRect.y,
      width: this.getClipArea().width,
      height: this.getClipArea().height,
      angle: this.clipChild.angle,
      flipX: this.flipX,
      flipY: this.flipY,
      centerPoint: center,
      clipPath: this._clipExtraData(),
    },
    isUpdate: true,
  });
}

// 关闭裁剪框并恢复图像视口等状态
closeClipBounds(applyChanges) {
  const originalRect = this.getOriginalRect();
  if (!originalRect || !this.isEditing || !this.imageViewport) return;

  const center = this.clipChild ? this.clipChild.getCenterPoint() : this.getCenterPoint();
  if (!applyChanges && this.clipChild) {
    this.clipChild.setOptions(this.clipChildState);
    this.clipChild.setCoords();
  }

  const previousCenter = this.getPreviousCenterPoint();
  const scale = this.getOriginClipInfo().scaleX;

  if (applyChanges) {
    const scaledWidth = this.getScaledWidth();
    const scaledHeight = this.getScaledHeight();

    const rotated = fabric.util.rotatePoint(
      new fabric.Point(this.left, this.top),
      previousCenter,
      fabric.util.degreesToRadians(-this.angle)
    );

    const offsetX = (originalRect.x - rotated.x) / scaledWidth;
    const offsetY = (originalRect.y - rotated.y) / scaledHeight;

    this.imageViewport.x = offsetX;
    this.imageViewport.y = offsetY;
    this.imageViewport.width = this.getClipArea().width / scaledWidth;
    this.imageViewport.height = this.getClipArea().height / scaledHeight;

    // 缩放 viewport 相对 canvas 比例
    const scaled = ((vp, scale) => {
      const width = vp.width * scale;
      const height = vp.height * scale;
      const x = vp.x + (vp.width - width) / 2;
      const y = vp.y + (vp.height - height) / 2;
      return {
        x: fabric.util.toFixed(x, 3),
        y: fabric.util.toFixed(y, 3),
        width: fabric.util.toFixed(width, 3),
        height: fabric.util.toFixed(height, 3),
      };
    })(this.imageViewport, this.imageCanvasScale);

    this.imageViewport = scaled;
    this.imageScale *= this.scaleX / this.imageCanvasScale / scale;

    if (this.flipX) this.imageViewport.x = 1 - this.imageViewport.width - this.imageViewport.x;
    if (this.flipY) this.imageViewport.y = 1 - this.imageViewport.height - this.imageViewport.y;

    if (this.group) this.group.dirty = true;
  } else {
    this.imageViewport = this.previousImageViewport;
    this.setOptions(this._saveStateProperties);
  }

  if (this.imageAngle) this.angle = (this.angle || 0) - this.imageAngle;
  this.scaleX = scale;
  this.scaleY = scale;

  const finalPoint = fabric.util.rotatePoint(
    new fabric.Point(originalRect.x, originalRect.y),
    previousCenter,
    fabric.util.degreesToRadians(this.angle)
  );

  this.left = finalPoint.x;
  this.top = finalPoint.y;
  this.width = originalRect.width;
  this.height = originalRect.height;

  if (this.clipChild) {
    this.clipChild.clipParent = null;
    this.canvas.remove(this.clipChild);
    this.clipChild = null;
  }

  this._showImgStyles(center);
  this.onClipChanged(false, applyChanges);
  if (this.previousIndex !== undefined) this.moveTo(this.previousIndex);

  Ve.getInstance().dispatchEvent(Pe.MONITOR_GUIDE, {
    type: f.g.GUIDE_HOT_CLIP_EDIT_COLLAGE,
  });

  fabric.util.fire('FTImage:closeClip', { object: this });
}

// 获取当前裁剪区域的宽高（已缩放）
getClipArea() {
  const clip = this.clipChild;
  return {
    width: clip ? clip.getScaledWidth() : 0,
    height: clip ? clip.getScaledHeight() : 0,
  };
}

// 获取裁剪框旋转前的左上角坐标及宽高
getOriginalRect() {
  const clip = this.clipChild;
  if (!clip) return null;
  const center = clip.getCenterPoint();
  const point = fabric.util.rotatePoint(new fabric.Point(clip.left, clip.top), center, fabric.util.degreesToRadians(-(clip.angle || 0)));
  return {
    x: point.x,
    y: point.y,
    width: clip.width,
    height: clip.height,
  };
}

// 获取当前裁剪框的中心点
getPreviousCenterPoint() {
  return this.clipChild?.getCenterPoint();
}

// 获取当前裁剪框信息（通常用于回退操作）
getOriginClipInfo() {
  return this.clipChild;
}


// 设置图像源（支持 data URL、本地图或远程 URL），并加载图像资源
setSrc(url, onLoaded, options) {
  if (/^data:image\//.test(url)) {
    this.showLoadError(() => this.requestRenderCanvas());
    return this;
  }

  // 如果不是素材图，加上处理后缀参数
  if (!this.stockPhotoInfo) {
    url = buildProcessedImageUrl(url, true);
  }

  this.imageUrl = url;
  this.src = url;
  this.addImagTimeStamp = performance.now();
  delete this.loadError;
  delete this.loadErrorType;
  this.imageLoading = true;
  this.sourceType = 'imageUrl';

  fabric.util.loadImage(
    url,
    (img) => {
      this.imageLoading = false;

      // 如果加载结果已不是当前请求的地址，忽略
      if (!this._isSameUrl(img.src, this.src)) return this;

      this.hnadleChangedImage(url);

      if (img) {
        if (this.guideCallback) {
          this.guideCallback(this);
          delete this.guideCallback;
        }

        delete this._imageCacheCanvas;
        this.requestRenderCanvas();

        // 如果设置了使用当前尺寸，保留当前尺寸
        const retainSize = options?.useCurrentSize
          ? { width: this.width, height: this.height }
          : null;

        const mergedOptions = options
          ? mergeObjects({}, options, { needDeleteElement: true })
          : { needDeleteElement: true };

        this.setElement(img, mergedOptions);

        // 恢复尺寸
        if (retainSize) {
          this.width = retainSize.width;
          this.height = retainSize.height;
        }

        if (!options?.imageViewport) {
          this._caculateBounds(img);
        }
      } else if (fabric.isLikelyNode) {
        this.showLoadError(() => this.requestRenderCanvas());
      } else {
        fetchImageFallback(url).catch((err) => {
          if (err.message === f.n.code404) this.loadErrorType = f.n.code404;
          if (err.message === f.n.networkError) {
            this.loadErrorType = f.n.networkError;
            if (this.reloadNum > 0) {
              this.reloadNum--;
              return this.reload();
            }
          }
          this.showLoadError(() => this.requestRenderCanvas());
        });
      }

      this.applyStyles(this);
      this.requestRenderCanvas();
      onLoaded && onLoaded(this, img);
    },
    this,
    'anonymous'
  );

  return this;
}

  // 重新加载图像资源
reload() {
  return new Promise((resolve, reject) => {
    const { width, height, imageUrl } = this;
    this.setSrc(imageUrl, resolve, { width, height });
  });
}


  // 处理图像源变化前的状态清除
hnadleChangedImage(newUrl) {
  if (
    this.beforeOption?.imgAddressBeforeChange &&
    this.beforeOption.imgAddressBeforeChange !== newUrl
  ) {
    this.cutoutLoadindKey = undefined;
  }
}

// 计算图像实际像素尺寸及 viewport
_caculateBounds(imgElement) {
  const containerWidth = this.width;
  const containerHeight = this.height;
  const imgWidth = imgElement.naturalWidth || imgElement.width;
  const imgHeight = imgElement.naturalHeight || imgElement.height;

  this.originalImageSize = { width: imgWidth, height: imgHeight };
  this._caculateViewport(containerWidth, containerHeight, imgWidth, imgHeight);
  this.setCoords();
}

// 根据容器与原图尺寸计算合适的 viewport 区域
_caculateViewport(containerWidth, containerHeight, imgWidth, imgHeight) {
  const scale = calculateCoverScale(containerWidth, containerHeight, imgWidth, imgHeight);
  const scaledWidth = scale * imgWidth;
  const scaledHeight = scale * imgHeight;

  this.initialImageSize = { width: scaledWidth, height: scaledHeight };
  this.initialViewSize = { width: this.width, height: this.height };

  const offsetX = (scaledWidth - containerWidth) / 2;
  const offsetY = (scaledHeight - containerHeight) / 2;

  this.imageViewport = {
    x: offsetX / scaledWidth,
    y: offsetY / scaledHeight,
    width: containerWidth / scaledWidth,
    height: containerHeight / scaledHeight,
  };
}

  setSource(e, a, n, i) {
    var r = this;
    (this.filtersChanged = !0),
      "color" !== a && this.saveState(),
      (i = i || {}),
      delete this.imageUrl,
      (this.skinKey = void 0),
      (this.carToonKey = void 0),
      (this.needReplace = !1),
      i &&
        "skill_face" !== i.optionType &&
        ((this.cutoutUrl = void 0), (this.cutoutKey = void 0)),
      i && "photo_car_toon" !== i.optionType && (this.carToonKey = void 0),
      i.fromCutout || this.resetOriginInfo(),
      this.isEditing && this.closeClipBounds(!1);
    var o = i.withoutStep || !1;
    if (
      (this.type === f.i.IMAGE && void 0 === this.sourceType && (o = !0),
      (this.loadError = null),
      (this.sourceType = a),
      a == f.d.SOURCE_TYPE_COLOR)
    )
      this._set("fill", e), n && n(this), this._fireDataChanged(o);
    else if (a == 'imageUrl') {
      var c = i,
        s = c.hdImageWidth,
        l = c.hdImageHeight,
        u = c.stockPhotoInfo;
      s && l && (this.hdImageSize = { width: s, height: l }),
        u && (this.stockPhotoInfo = u),
        this.setSrc(
          e,
          function (e, t) {
            n && n(r, t), r._fireDataChanged(o);
          },
          Object.assign({}, i, { crossOrigin: "anonymous" })
        ),
        this._set("fill", void 0);
    } else
      a == f.d.SOURCE_TYPE_SVG && this._set("fill", this.constructor.DEFAULT_BACKGROUND_COLOR);
    this.dirty = !0;
  }

  getImageLoadingImageViewport(e) {
    var t = this.width,
      a = this.height,
      n = e.naturalWidth || e.width,
      i = e.naturalHeight || e.height,
      r = calculateCoverScale(t, a, n, i),
      o = r * n,
      c = r * i;
    return {
      x: (o - t) / 2 / o,
      y: (c - a) / 2 / c,
      width: t / o,
      height: a / c,
    };
  }

  getDrawImageViewport() {
    return this.imageViewport;
  }

  changeImgStyles(e) {
    var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
      a = this.getCenterPoint();
    if (
      (this.set(e),
      (this.dirty = !0),
      e.imgStyles && Array.isArray(e.imgStyles))
    ) {
      var n = 0;
      e.imgStyles.forEach(function (e) {
        "object" === typeof e.stroke &&
          e.stroke.strokeWidth > n &&
          (n = e.stroke.strokeWidth);
      }),
        (this.maxStrokeWidth === n &&
          this.strokeWidth === 2 * this.maxStrokeWidth) ||
          (this.setImageStrokeDirty(),
          (this.maxStrokeWidth = n),
          (this.stroke = "#00000000"),
          (this.strokeWidth = 2 * n),
          t.notMove ||
            (this.setPositionByOrigin(t.centerPoint || a, "center", "center"),
            this.setCoords()));
    }
  }

  _resetInfo() {
    (this.filtersChanged = !0),
      (this.imageChanged = !0),
      (this.temperatureAndTintChanged = !0),
      this.setImageStrokeDirty();
  }

  _renderFill(e) {
    if (this.readyToRender) {
      var a = this.fill;
      a || (a = this.constructor.DEFAULT_BACKGROUND_COLOR);
      var n = this.width,
        i = this.height;
      if (
        (this.forceRenderImage && this.originalImageSize) ||
        (this.sourceType == 'imageUrl' &&
          this.imageViewport &&
          this.originalImageSize &&
          this.isImageReady()) ||
        (this.imageViewport && this.imageLoading && this.originalImageSize)
      ) {
        var r = this.getElement(),
          o = this.imageLoading ? r.width : this.originalImageSize.width,
          c = this.imageLoading ? r.height : this.originalImageSize.height;
        if (r && r.width > 0) {
          var l = this.imageLoading
              ? this.getImageLoadingImageViewport(r)
              : this.getDrawImageViewport(),
            u = l.x * o,
            h = l.y * c,
            d = l.width * o,
            p = l.height * c;
          if (
            (this.resizeFilterType &&
              this.resizeFilter &&
              ((d = Math.min(d, n * this._filterScalingX)),
              (p = Math.min(p, i * this._filterScalingY)),
              (u = Math.max(u, u * this._filterScalingX)),
              (h = Math.max(u, h * this._filterScalingY))),
            (r = this._renderCutout(r)),
            (r = this._renderFilterChange(r)),
            (r = this._renderTemperatureAndTint(r)),
            this._renderImageStroke(e, r, {
              imgX: u,
              imgY: h,
              imgW: d,
              imgH: p,
            }),
            (this.hasShadow() || this.needDrawWatermark()) &&
              (r = this._renderImageWithShadow(r)),
            fabric.isLikelyNode &&
              1 == fabric.fotorExportHD &&
              !this.shouldCache() &&
              this.originalImageSize)
          ) {
            var g = this.originalImageSize,
              m = g.width,
              v = g.height,
              b = fabric.util.createCanvasElement();
            (b.width = m),
              (b.height = v),
              b.getContext("2d").drawImage(r, u, h, d, p, 0, 0, m, v),
              e.save(),
              e.scale(n / m, i / v),
              e.drawImage(b, -m / 2, -v / 2, m, v),
              e.restore();
          } else r && e.drawImage(r, u, h, d, p, -n / 2, -i / 2, n, i);
          !fabric.isLikelyNode &&
            this.needReplace &&
            this._renderMask(e, {
              dx: -n / 2,
              dy: -i / 2,
              dw: this.width,
              dh: this.height,
            });
        } else
          (e.fillStyle = "transparent"),
            e.fillRect(-n / 2, -i / 2, this.width, this.height);
      } else
        this.sourceType == f.d.SOURCE_TYPE_COLOR &&
          ((e.fillStyle = a.toLive ? a.toLive(e, this) : a),
          e.fillRect(-n / 2, -i / 2, this.width, this.height));
    }
  }

  _releaseCanvas(e) {
    e instanceof HTMLCanvasElement &&
      e !== this.getElement() &&
      (function (e) {
        (e.width = 1), (e.height = 1);
        var t = e.getContext("2d");
        t && t.clearRect(0, 0, 1, 1);
      })(e);
  }

  _renderCutout(e) {
    if (this.cutoutUrlObj) {
      if (this.cutoutUrl) {
        var t = fabric.util.createCanvasElement(),
          a = e.width,
          n = e.height;
        (t.width = a), (t.height = n);
        var i = t.getContext("2d");
        return (
          i.drawImage(e, 0, 0, a, n),
          (i.globalCompositeOperation = "destination-in"),
          i.drawImage(this.cutoutUrlObj, 0, 0, a, n),
          this._releaseCanvas(e),
          t
        );
      }
      return e;
    }
    return e;
  }

  _renderFilterChange(e) {
    var t = this;
    if (
      isPluginFeatureEnabled(PluginType.IMAGE_FILTER) &&
      this.effectFilterId &&
      this.filtersChanged
    ) {
      var a;
      a = fabric.isLikelyNode
        ? fabric.EffectsManager.getEffectInfoById(this.effectFilterId)
        : Qe.effectFilterlist.find(function (e) {
            return e.id === t.effectFilterId;
          });
      var n = He.canvas(),
        i = new fabric.Plugin.BigWrap(n, 50, ""),
        r =
          this.effectFilterStrength >= 0
            ? this.effectFilterStrength
            : this.effectFilterDefalStrength;
      if (((e = this.handleImageWidth(e)), fabric.isLikelyNode)) {
        var o = fabric.util.createCanvasElement();
        (o.width = e.width),
          (o.height = e.height),
          o.getContext("2d").drawImage(e, 0, 0),
          i.set_image(o, e.width, e.height);
      } else i.set_image(e, e.width, e.height);
      var c = this.filtert_txt || (a && a.txt);
      return c
        ? (i.process_rule(
            "filterGenerator '"
              .concat(c, "' lutSize ")
              .concat(this.effectFilterSize, " strength ")
              .concat(r / 100),
            !0
          ),
          (this.filtersChanged = !1),
          (this.imageChanged = !0),
          (this.temperatureAndTintChanged = !0),
          fabric.isLikelyNode && n.__ctx__,
          (this.eventCanvasFilter = this.drawOurSelfCanvas(n, e.proportion)),
          this.eventCanvasFilter)
        : e;
    }
    return this.effectFilterId && this.eventCanvasFilter
      ? this.eventCanvasFilter
      : e;
  }

  _renderTemperatureAndTint(e) {
    if (this.temperatureAndTintChanged) {
      if (
        ((this.tintTemperatureCanvas = this.handleTintTemperature(e)),
        this.tintTemperatureCanvas)
      ) {
        this.temperatureAndTintChanged = !1;
        var t = this.drawOurSelfCanvas(
          this.tintTemperatureCanvas,
          this.tintTemperatureCanvas.proportion
        );
        return (this.myTintTemperatureCanvas = t), t;
      }
      return e;
    }
    return this.myTintTemperatureCanvas ? this.myTintTemperatureCanvas : e;
  }

  handleImageWidth(e) {
    var t =
      arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 4096;
    if (e.width > t || e.height > t) {
      var a, n, i;
      e.width > t &&
        ((a = t / e.width), (n = (t / e.width) * e.height), (i = t)),
        e.height > t &&
          ((a = t / e.height), (i = (t / e.height) * e.width), (n = t));
      var r = fabric.util.createCanvasElement();
      (r.width = i), (r.height = n);
      var o = r.getContext("2d");
      return o.drawImage(e, 0, 0, i, n), (r.proportion = a), r;
    }
    return e;
  }

  hasImageStroke() {
    return (
      !!(Array.isArray(this.imgStyles) && this.imgStyles.length > 0) &&
      this.imgStyles.filter(function (e) {
        return "object" === typeof e.stroke;
      }).length > 0
    );
  }

  _renderImageStroke(e, t, a) {
    var n = this,
      i = a.imgX,
      r = void 0 === i ? 0 : i,
      o = a.imgY,
      c = void 0 === o ? 0 : o,
      l = a.imgW,
      u = a.imgH,
      h = a.targetW,
      d = a.targetH,
      p = a.isRevert;
    if (Array.isArray(this.imgStyles) && this.imgStyles.length) {
      var g = this.imgStyles.filter(function (e) {
        return "object" === typeof e.stroke;
      });
      if ((p && (g = g.concat().reverse()), g.length)) {
        var f = h || this.width,
          m = d || this.height,
          v = A(600, 600, f, m),
          b = f * v,
          _ = m * v,
          y = b + 0,
          E = _ + 0;
        if (this.imgStrokeChange) {
          var C = fabric.util.createCanvasElement();
          (C.width = y), (C.height = E);
          var O = C.getContext("2d");
          O.drawImage(t, r, c, l, u, 0, 0, b + 0, _ + 0),
            (this._imageStrokeContours = we(O)),
            this._releaseCanvas(C),
            (this.imgStrokeChange = !1);
        }
        if (this._imageStrokeContours && this._imageStrokeContours.length) {
          var k = this._imageStrokeContoursBaseSize
            ? f / this._imageStrokeContoursBaseSize
            : 1;
          g.forEach(function (t) {
            var a = t.stroke.strokeWidth;
            a &&
              n._imageStrokeContours.forEach(function (i) {
                !(function (e, t, a) {
                  if (t && !(t.length < 3)) {
                    var n = a.offsetX || 0,
                      i = a.offsetY || 0,
                      r = a.scale || 1,
                      o = function (e) {
                        return n + e.x * r + -0.45;
                      },
                      c = function (e) {
                        return i + e.y * r + 0;
                      },
                      s = { x: o(t[0]), y: c(t[0]) };
                    e.save(),
                      (e.strokeStyle = a.stroke),
                      (e.lineWidth = 2 * a.strokeWidth),
                      (e.lineJoin = a.strokeLineJoin || "round"),
                      e.beginPath(),
                      e.moveTo(s.x, s.y);
                    for (var l = 1; l < t.length; l++)
                      e.lineTo(o(t[l]), c(t[l]));
                    e.closePath(), e.stroke(), e.restore();
                  }
                })(e, i, {
                  stroke: t.stroke.stroke,
                  strokeWidth: a,
                  strokeLineJoin: n.strokeLineJoin,
                  scale: 1 / v / k,
                  offsetX: -f / 2 / k,
                  offsetY: -m / 2 / k,
                });
              });
          });
        }
      }
    }
  }

  trimImageViewport() {
    var e = this.width,
      t = this.height,
      a = this.getElement();
    if (
      (a = this._renderCutout(a)) &&
      a.width > 0 &&
      this.originalImageSize &&
      this.imageViewport
    ) {
      var n = this.originalImageSize,
        i = n.width,
        r = n.height,
        o = this.getDrawImageViewport(),
        c = o.x * i,
        s = o.y * r,
        l = o.width * i,
        u = o.height * r;
      this.resizeFilterType &&
        this.resizeFilter &&
        (Object(ue.a)("imgW"),
        (l = Math.min(l, e * this._filterScalingX)),
        Object(ue.a)("imgH"),
        (u = Math.min(u, t * this._filterScalingY)),
        Object(ue.a)("imgX"),
        (c = Math.max(c, c * this._filterScalingX)),
        Object(ue.a)("imgY"),
        (s = Math.max(c, s * this._filterScalingY))),
        this._setTrimImageViewport(a, {
          imgX: c,
          imgY: s,
          imgW: l,
          imgH: u,
        });
    }
  }

  _setTrimImageViewport(e, t) {
    if (this.originalImageSize && this.imageViewport) {
      var a = t.imgX,
        n = void 0 === a ? 0 : a,
        i = t.imgY,
        r = void 0 === i ? 0 : i,
        o = t.imgW,
        c = t.imgH,
        l = t.targetW,
        u = t.targetH,
        h = (t.isRevert, this.imageViewport),
        d = this.originalImageSize.width || l || this.width,
        p = this.originalImageSize.height || u || this.height,
        g = A(600, 600, o, c);
      g > 1 && (g = 1);
      var f = o * g,
        m = c * g,
        v = fabric.util.createCanvasElement();
      (v.width = f), (v.height = m);
      var b = v.getContext("2d");
      b.drawImage(e, n, r, o, c, 0, 0, f, m);
      var _ = (function (e, t) {
        for (
          var a = e.canvas,
            n = a.width,
            i = a.height,
            r = e.getImageData(0, 0, n, i).data,
            o = r.length,
            c = 4 * n,
            s = 0,
            l = 0,
            u = n,
            h = i,
            d = 3;
          d < o;
          d += 4
        )
          if (r[d] > 10) {
            l = Math.ceil((d + 1) / c);
            break;
          }
        for (var p = o; p > 0; p -= 4)
          if (r[p] > 10) {
            h = Math.ceil((p + 1) / c);
            break;
          }
        for (var g = !1, f = 3; f < c; f += 4) {
          for (var m = f; m < o; m += c)
            if (r[m] > 10) {
              (s = Math.floor((m / 4) % n)), (g = !0);
              break;
            }
          if (g) break;
        }
        for (var v = !1, b = c - 1; b > 0; b -= 4) {
          for (var _ = b; _ < o; _ += c)
            if (r[_] > 10) {
              (u = Math.floor((_ / 4) % n)), (v = !0);
              break;
            }
          if (v) break;
        }
        return {
          x: s / t,
          y: l / t,
          width: (u - s) / t,
          height: (h - l) / t,
        };
      })(b, g);
      this._releaseCanvas(e), (v = null);
      var y = {
        x: h.x + _.x / d,
        y: h.y + _.y / p,
        width: _.width / d,
        height: _.height / p,
      };
      (this.preTrimImageViewport = mergeObjects({}, h)),
        this._adjustPositionAndSizeByVP(y);
    }
  }

  _adjustPositionAndSizeByVP(e) {
    if (this.originalImageSize && this.imageViewport) {
      var t = this.imageViewport,
        a =
          (this.originalImageSize.width,
          this.originalImageSize.height,
          this.calcOwnMatrix()),
        n = (this.width / t.width) * e.width,
        i = (this.height / t.height) * e.height,
        r = ((e.x - t.x) / (t.width - e.width)) * (this.width - n),
        o = ((e.y - t.y) / (t.height - e.height)) * (this.height - i),
        c = fabric.util.transformPoint({ x: r, y: o }, [
          a[0],
          a[1],
          a[2],
          a[3],
          0,
          0,
        ]);
      (this.imageViewport = mergeObjects({}, e)),
        (this.left += c.x),
        (this.top += c.y),
        (this.width = n),
        (this.height = i),
        this._fireDataChanged(),
        this.requestRenderCanvas();
    }
  }

  restoreTrim() {
    this.preTrimImageViewport &&
      (this._adjustPositionAndSizeByVP(this.preTrimImageViewport),
      (this.preTrimImageViewport = void 0));
  }

  _renderMultipleShadow(ctx) {
    // 缓存当前实例
    const self = this;
  
    // 如果存在 imgStyles 且为数组，且长度大于 0
    if (Array.isArray(this.imgStyles) && this.imgStyles.length) {
      // 过滤出带有 shadow 的样式对象
      const shadowStyles = this.imgStyles.filter(style => typeof style.shadow === "object");
  
      if (shadowStyles.length) {
        // 清除当前 canvas 的 shadow 设置
        this._removeShadow(ctx);
  
        // 对每一个带 shadow 的样式进行绘制
        shadowStyles.forEach((style, index) => {
          ctx.save(); // 保存当前 canvas 状态
  
          // 设置当前 shadow 样式
          self.shadow = new fabric.Shadow(style.shadow);
          self._setShadow(ctx, self);
  
          // 调用父类的 drawCacheOnCanvas 方法
          super.drawCacheOnCanvas(ctx);
  
          // 清除 shadow，恢复 canvas 状态
          self.shadow = undefined;
          ctx.restore();
        });
  
        // 已完成多重阴影绘制，提前退出函数
        return;
      }
    }
  
    // 没有多个阴影的情况，调用默认渲染逻辑
    super.drawCacheOnCanvas(ctx);
  }
  

  _renderMask(e, t) {
    var a = t.dx,
      n = t.dy,
      i = t.dw,
      r = t.dh;
    e.save(),
      (e.globalCompositeOperation = "source-atop"),
      (e.fillStyle = "rgba(0,0,0,0.3)"),
      e.fillRect(a, n, i, r),
      e.restore();
  }

  setImageStrokeDirty() {
    (this.imgStrokeChange = !0), (this.imageChanged = !0);
  }

  drawOurSelfCanvas(e, t) {
    var a = fabric.util.createCanvasElement(),
      n = e.width,
      i = e.height;
    return (
      t && ((n = e.width / t), (i = e.height / t)),
      (a.width = n),
      (a.height = i),
      a.getContext("2d").drawImage(e, 0, 0, n, i),
      this._releaseCanvas(e),
      a
    );
  }

  drawCacheOnCanvas(e) {
    e.save(),
      this._renderMultipleShadow(e),
      e.restore(),
      this._shouldRenderLoadingMask() && this._renderLoadingMask(e);
  }

  _render(ctx) {
    if (this.loadError) {
      // 如果加载图片出错，绘制错误图标
      this.renderLoadErrorIcon(ctx);
    } else {
      // 否则执行父类的 _render 方法
      super._render(ctx);
  
      // 如果当前对象未缓存并且应绘制 loading mask，则绘制它
      if (!this.shouldCache() && this._shouldRenderLoadingMask()) {
        this._renderLoadingMask(ctx);
      }
    }
  }
  

  _shouldRenderLoadingMask() {
    var e =
      this.canvas &&
      this.canvas.getIsLogin &&
      this.canvas.getIsLogin() &&
      this.srcIsBlob();
    return (
      this.sourceType === 'imageUrl' &&
      (this.cutoutLoadindKey || this.imageLoading || e)
    );
  }

  _renderLoadingMask(e) {
    var t = this.width,
      a = this.height,
      n = (((+new Date() / 2) % 360) * Math.PI) / 180,
      i = (((+new Date() / 4) % 360) * Math.PI) / 180,
      r = (this.canvas && this.canvas.getZoom()) || 1,
      o = Math.max(this.scaleX || 1, this.scaleY || 1),
      c = 12 / o / r,
      s = 2 / o / r;
    e.save(),
      (e.fillStyle = "rgba(210,210,210,".concat(
        0.2 + 0.4 * Math.sin(i / 2),
        ")"
      )),
      e.fillRect(-t / 2, -a / 2, t, a),
      (e.strokeStyle = "#4BD3FB"),
      (e.lineWidth = s),
      e.beginPath(),
      e.arc(0, 0, c, n, n + Math.PI),
      e.stroke(),
      e.restore(),
      this.canvas.requestRenderAll();
  }

  _renderImageWithShadow(e) {
    if (
      (this._imageCacheCanvas ||
        (this._imageCacheCanvas = fabric.util.createCanvasElement()),
      !this.originalImageSize ||
        (this.originalImageSize.width === this._imageCacheCanvas.width &&
          this.originalImageSize.height === this._imageCacheCanvas.height) ||
        ((this._imageCacheCanvas = fabric.util.createCanvasElement()),
        (this._imageCacheCanvas.width = this.originalImageSize.width),
        (this._imageCacheCanvas.height = this.originalImageSize.height),
        (this.imageChanged = !0)),
      this.imageChanged && this._imageCacheCanvas)
    ) {
      var t = this._imageCacheCanvas.getContext("2d");
      if (
        (t.clearRect(
          0,
          0,
          this._imageCacheCanvas.width,
          this._imageCacheCanvas.height
        ),
        t.drawImage(e, 0, 0),
        this.imageViewport && !this.isEditing)
      ) {
        var a = this.imageViewport,
          n = a.x,
          i = a.y,
          r = a.width,
          o = a.height;
        this.drawWatermark(t, {
          left: this._imageCacheCanvas.width * n,
          top: this._imageCacheCanvas.height * i,
          width: this._imageCacheCanvas.width * r,
          height: this._imageCacheCanvas.height * o,
        });
      }
      this.imageChanged = !1;
    }
    return this._imageCacheCanvas;
  }

  clearContent(e) {
    this.canvas && this.canvas.stateful && this.saveState(),
      this.isEditing && this.exitEditing(),
      delete this.loadError,
      delete this.loadErrorType,
      (this.imageVip = void 0),
      this.internalCleanContent(),
      this._fireDataChanged(e);
  }

  internalCleanContent() {
    (this.sourceType = void 0),
      (this.stockPhotoInfo = void 0),
      (this.cutoutKey = void 0),
      (this.skinKey = void 0),
      (this.carToonKey = void 0),
      (this.imgStyles = []),
      (this.imgStylesKey = void 0),
      (this.imgStylesVip = !1),
      (this.strokeWidth = 0);
  }

  handleImageBack(e) {
    var t = this;
    Object.keys(e).forEach(function (a) {
      t[a] = e[a];
    }),
      this.backEditOrigin(e);
  }

  _fireDataChanged(event) {
    super._fireDataChanged(event);
  }
  

  _onMoving(e) {
    var t = this.getOriginalRect();
    this.isEditing &&
      t &&
      (this._adjustPositionV2(), this._showOrHideGridlines(!0));
  }

  _adjustPositionV2() {
    var e = this.getPreviousCenterPoint(),
      t = fabric.util.rotatePoint(
        new fabric.Point(this.left, this.top),
        e,
        fabric.util.degreesToRadians(-this.angle)
      ),
      a = t.x,
      n = t.y;
    this.clipChild.rotate(-this.imageAngle);
    var i = this.clipChild.getBoundingRect(!0, !0);
    this.clipChild.rotate(this.editingAngle);
    var r = i.left - (this.getScaledWidth() - i.width),
      o = i.top - (this.getScaledHeight() - i.height),
      c = y(r, a, i.left),
      l = y(o, n, i.top);
    if (c != a || l != n) {
      var u = fabric.util.rotatePoint(
        new fabric.Point(c, l),
        e,
        fabric.util.degreesToRadians(this.angle)
      );
      this.set("left", u.x), this.set("top", u.y);
    }
  }

  _onMouseup(e) {
    this._showOrHideGridlines(!1);
  }

  _isChangeSizeCorner(e) {
    return "mr" == e || "mb" == e || "ml" == e || "mt" == e;
  }

  _beforeChangeSize() {
    (this.previousImageViewport = mergeObjects({}, this.imageViewport)),
      (this.previousViewSize = {
        width: this.width,
        height: this.height,
      }),
      (this.preImageScale = this.imageScale);
  }

  _onMousedown(e) {
    var t = e.transform,
      a = t && t.corner,
      n = this.getOriginalRect(),
      i = this.getPreviousCenterPoint();
    if (n && e && e.transform) {
      this.clipChild.rotate(-this.imageAngle);
      var r = this.clipChild.getBoundingRect(!0, !0);
      this.clipChild.rotate(this.editingAngle);
      var o = fabric.util.rotatePoint(
          new fabric.Point(this.left, this.top),
          i,
          fabric.util.degreesToRadians(-this.angle)
        ),
        c = 0,
        l = 0,
        u = this.width,
        h = this.height,
        d = this.getScaledWidth(),
        p = this.getScaledHeight(),
        g = r.left - o.x,
        f = r.top - o.y;
      "tl" === t.corner
        ? ((c = (d - g) / u), (l = (p - f) / h))
        : "tr" === t.corner
        ? ((c = (g + r.width) / u), (l = (p - f) / h))
        : "br" === t.corner
        ? ((c = (g + r.width) / u), (l = (f + r.height) / h))
        : "bl" === t.corner && ((c = (d - g) / u), (l = (f + r.height) / h)),
        (this.minScale = Math.max(c, l));
    } else
      this._isChangeSizeCorner(a) &&
        this.initialImageSize &&
        this._beforeChangeSize();
  }

  _onScaling(e) {
    this.imageChanged = !0;
    var t = e.transform,
      a = t && t.corner,
      n = this.getOriginalRect();
    if (this.isEditing && e && e.transform && n) {
      if (this.scaleX <= this.minScale || this.scaleY <= this.minScale) {
        var i = this.translateToOriginPoint(
          this.getCenterPoint(),
          t.originX,
          t.originY
        );
        (this.scaleX = this.minScale),
          (this.scaleY = this.minScale),
          this.setPositionByOrigin(i, t.originX, t.originY);
      } else this.editingScale = this.scaleX;
      this._showOrHideGridlines(!0);
    } else this._isChangeSizeCorner(a) && this._onSizeChanged(a);
  }

  _onScalingOther(e) {
    this.setImageStrokeDirty();
  }

  getClipAngle() {
    var e = this.editingAngle;
    return (
      this.isEditing || (e = this.angle), (this.imageAngle || 0) + (e || 0)
    );
  }

  _adjustRotatePosition() {
    var e = this.clipChild.getCenterPoint(),
      t = new fabric.Point(this.left, this.top),
      a = fabric.util.rotatePoint(
        t,
        e,
        fabric.util.degreesToRadians(this.getClipAngle() - this.angle)
      );
    this.set("left", a.x),
      this.set("top", a.y),
      this.set("angle", this.getClipAngle());
    var n = this.getScaledWidth(),
      i = this.getScaledHeight();
    this.clipChild.rotate(-this.imageAngle);
    var r = this.clipChild.getBoundingRect(!0, !0);
    this.clipChild.rotate(this.editingAngle);
    var o = fabric.util.rotatePoint(
        new fabric.Point(this.left, this.top),
        e,
        fabric.util.degreesToRadians(-this.angle)
      ),
      c = Math.abs((e.x - o.x) / n),
      l = Math.abs((e.y - o.y) / i),
      u = Math.min(c, 1 - c),
      h = Math.min(l, 1 - l),
      d = r.width / (n * u * 2),
      p = r.height / (i * h * 2),
      g = Math.max(d, p) * this.scaleX,
      f = this.originX,
      m = this.originY;
    (this.originX = c),
      (this.originY = l),
      this._setPositionByChangeOrigin(
        new fabric.Point(this.left, this.top),
        f,
        m,
        c,
        l
      ),
      g > this.editingScale && (this.scale(g), this.setCoords()),
      (this.originX = f),
      (this.originY = m),
      this._setPositionByChangeOrigin(
        new fabric.Point(this.left, this.top),
        c,
        l,
        f,
        m
      ),
      this.setCoords();
  }

  _setPositionByChangeOrigin(e, t, a, n, i) {
    var r = this.translateToGivenOrigin(e, t, a, n, i);
    this.angle &&
      (r = fabric.util.rotatePoint(
        r,
        e,
        fabric.util.degreesToRadians(this.angle)
      )),
      this.set("left", r.x),
      this.set("top", r.y);
  }

  _onSizeChanged(edge) {
    // 如果没有初始图片尺寸或视图窗口信息，直接跳过
    if (!this.initialImageSize || !this.imageViewport) return;
  
    // 当前画布的宽高
    const viewWidth = this.width;
    const viewHeight = this.height;
  
    // 原始图像的宽高比
    const aspectRatio = this.initialImageSize.width / this.initialImageSize.height;
  
    // 上一次的视图尺寸和图像可视区域
    const prevViewWidth = this.previousViewSize.width;
    const prevViewHeight = this.previousViewSize.height;
    const prevViewport = this.previousImageViewport;
  
    // 工具函数：限制数值在 [min, max] 范围内
    const clamp = (min, val, max) => Math.min(Math.max(val, min), max);
  
    // === 处理右边（middle-right）被拉伸 ===
    if (edge === "mr") {
      // 当前宽度相对于上次宽度的比例变化
      const scaleFactor = 1 + (viewWidth - prevViewWidth) / prevViewWidth;
  
      // 新的图像宽度
      const newWidth = prevViewport.width * scaleFactor;
  
      // 右边是否溢出边界（imageViewport.x + newWidth > 1）
      const newRightEdge = this.imageViewport.x + newWidth;
  
      if (newRightEdge > 1) {
        // 计算右边超出多少
        const overflow = newRightEdge - 1;
  
        // 可用的最大宽度（不越界）
        const adjustedWidth = 1 - this.imageViewport.x;
  
        // 计算高度，使其符合新宽度和图像比例
        const adjustedHeight = viewHeight / (viewWidth / adjustedWidth / aspectRatio);
  
        // 计算Y轴方向的偏移，让图像垂直居中
        const deltaY = (prevViewport.height - adjustedHeight) / 2;
  
        // 更新图像可视区域：y, height, width
        this.imageViewport.y = clamp(0, prevViewport.y + deltaY, 1);
        this.imageViewport.height = clamp(0, adjustedHeight, 1 - this.imageViewport.y);
        this.imageViewport.width = adjustedWidth;
  
        // 根据超出量缩放图像
        this.imageScale = this.preImageScale * newRightEdge;
      } else {
        // 没越界，直接设置新宽度
        this.imageViewport.width = newWidth;
      }
    }
  
    // === 处理左边（middle-left）被拉伸 ===
    else if (edge === "ml") {
      // 当前像素距离对应到图像坐标的单位宽度
      const scale = prevViewWidth / prevViewport.width;
  
      // 将视图宽度差转换为图像坐标偏移
      const deltaX = (viewWidth - prevViewWidth) / scale;
  
      // 新的X坐标（视图左移）
      const newX = prevViewport.x - deltaX;
  
      if (newX < 0) {
        // 如果左移越界，计算需要显示的图像宽度
        const adjustedWidth = 1 - newX;
  
        // 保持宽高比，重新计算高度
        const adjustedHeight = viewHeight / (viewWidth / this.imageViewport.width / aspectRatio);
  
        // 垂直方向保持居中
        const deltaY = (prevViewport.height - adjustedHeight) / 2;
  
        // 设置新Y坐标和高度，并将X固定为0
        this.imageViewport.y = clamp(0, prevViewport.y + deltaY, 1);
        this.imageViewport.height = clamp(0, adjustedHeight, 1 - this.imageViewport.y);
        this.imageViewport.x = 0;
  
        // 缩放图像
        this.imageScale = this.preImageScale * adjustedWidth;
      } else {
        // 没越界：更新X和宽度
        this.imageViewport.x = newX;
        this.imageViewport.width = prevViewport.width + (prevViewport.x - newX);
      }
    }
  
    // === 处理下边（middle-bottom）被拉伸 ===
    else if (edge === "mb") {
      // 当前高度相对于上次高度的比例变化
      const scaleFactor = 1 + (viewHeight - prevViewHeight) / prevViewHeight;
  
      // 新图像高度
      const newHeight = prevViewport.height * scaleFactor;
  
      // 是否会下移越界
      const newBottomEdge = this.imageViewport.y + newHeight;
  
      if (newBottomEdge > 1) {
        const overflow = newBottomEdge - 1;
        const adjustedHeight = 1 - this.imageViewport.y;
  
        // 根据新高度和比例，计算应有的图像宽度
        const adjustedWidth = viewWidth / ((viewHeight / adjustedHeight) * aspectRatio);
  
        // 水平方向偏移（居中）
        const deltaX = (prevViewport.width - adjustedWidth) / 2;
  
        this.imageViewport.x = clamp(0, prevViewport.x + deltaX, 1);
        this.imageViewport.width = clamp(0, adjustedWidth, 1 - this.imageViewport.x);
        this.imageViewport.height = adjustedHeight;
  
        // 更新缩放比例
        this.imageScale = this.preImageScale * newBottomEdge;
      } else {
        this.imageViewport.height = newHeight;
      }
    }
  
    // === 处理上边（middle-top）被拉伸 ===
    else if (edge === "mt") {
      // 当前像素高度对应图像单位高度的比例
      const scale = prevViewHeight / prevViewport.height;
  
      // 将像素高度差转换为图像坐标偏移
      const deltaY = (viewHeight - prevViewHeight) / scale;
  
      // 新的顶部位置
      const newY = prevViewport.y - deltaY;
  
      if (newY < 0) {
        const adjustedHeight = 1 - newY;
  
        // 根据新高度计算图像应有宽度
        const adjustedWidth = viewWidth / ((viewHeight / this.imageViewport.height) * aspectRatio);
  
        // 水平居中
        const deltaX = (prevViewport.width - adjustedWidth) / 2;
  
        this.imageViewport.x = clamp(0, prevViewport.x + deltaX, 1);
        this.imageViewport.width = clamp(0, adjustedWidth, 1 - this.imageViewport.x);
        this.imageViewport.y = 0;
  
        this.imageScale = this.preImageScale * adjustedHeight;
      } else {
        this.imageViewport.y = newY;
        this.imageViewport.height = prevViewport.height + (prevViewport.y - newY);
      }
    }
  
    // 调用节流的 setImageStrokeDirty 方法，避免频繁刷新描边
    // Object(ve.throttle)(this.setImageStrokeDirty.bind(this), 200)();
    throttle(this.setImageStrokeDirty.bind(this), 200)();
  }
  

  updateSize(e) {
    if (!this.initialImageSize || !this.imageViewport)
      return (
        (this.width = e.width), (this.height = e.height), void this.setCoords()
      );
    this._beforeChangeSize();
    var t = this.width,
      a = this.height,
      n =
        (this.initialImageSize.width,
        this.initialImageSize.height,
        A(e.width, e.height, t, a)),
      i = t * n,
      r = a * n,
      o = i / this.previousImageViewport.width / e.width,
      c = r / this.previousImageViewport.height / e.height,
      s = (e.width - i) / e.width / o,
      l = (e.height - r) / e.height / c,
      u = 1 - this.previousImageViewport.width,
      h = 1 - this.previousImageViewport.height,
      d = 0 === u ? 0.5 : this.previousImageViewport.x / u,
      p = 0 === h ? 0.5 : this.previousImageViewport.y / h,
      g = s * d,
      f = l * p,
      m = this.imageViewport.width + s,
      v = this.imageViewport.height + l,
      b = Math.max(this.imageViewport.x - g, 0),
      _ = Math.max(this.imageViewport.y - f, 0);
    if (b + m > 1 || _ + v > 1)
      if (m > v) {
        (this.imageViewport.x = b), (this.imageViewport.width = 1 - b);
        var y = v * (this.imageViewport.width / m),
          E = (this.imageViewport.height - y) * p;
        (this.imageViewport.y += E), (this.imageViewport.height = y);
      } else {
        (this.imageViewport.y = _), (this.imageViewport.height = 1 - _);
        var C = m * (this.imageViewport.height / v),
          O = (this.imageViewport.width - C) * d;
        (this.imageViewport.x += O), (this.imageViewport.width = C);
      }
    else
      (this.imageViewport.x = b),
        (this.imageViewport.y = _),
        (this.imageViewport.width = m),
        (this.imageViewport.height = v);
    (this.width = e.width), (this.height = e.height), this.setCoords();
  }

  _showOrHideGridlines(e) {
    fabric.util.fire(xe.FTGRIDLINE_STATUS_CHANGED, {
      show: e,
    });
  }

  toObject(extraProps) {
    // 合并要序列化的字段（默认 + 额外）
    const fieldsToInclude = this.constructor.needInitFields.concat(extraProps);
  
    // 调用父类的 toObject，传入字段
    const baseObject = super.toObject(fieldsToInclude);
  
    // 如果有 imageViewport，则序列化相关尺寸数据
    if (this.imageViewport) {
      baseObject.originalImageSize = mergeObjects({}, this.originalImageSize);
      baseObject.initialViewSize = mergeObjects({}, this.initialViewSize);
      baseObject.initialImageSize = mergeObjects({}, this.initialImageSize);
      baseObject.imageViewport = mergeObjects({}, this.imageViewport);
      baseObject.hdImageSize = mergeObjects({}, this.hdImageSize);
    }
  
    // 如果是库存图信息，则也序列化
    if (this.stockPhotoInfo) {
      baseObject.stockPhotoInfo = mergeObjects({}, this.stockPhotoInfo);
    }
  
    // 如果没有 src，但有加载失败的 imageUrl，则设置为 imageUrl
    if (!baseObject.src && this.imageUrl && this.loadError) {
      baseObject.src = this.imageUrl;
    }
  
    // 删除不需要序列化的属性
    delete baseObject.filters;
    delete baseObject.resizeFilter;
  
    // 深拷贝 imgStyles
    return mergeObjects({}, baseObject, { imgStyles: deepClone(baseObject.imgStyles) });
  }
  

  requestRenderCanvas() {
    fabric.isLikelyNode ||
      ((this.dirty = !0),
      this.group && (this.group.dirty = !0),
      this.clipPath && (this.clipPath.dirty = !0),
      this.canvas &&
        (this.canvas.requestRenderAll()
        // ,Ke.contentReady({ pageId: this._pageId })
        )
      );
  }

  hasSource() {
    return this.isImageReady();
  }

  updateEffect(e, t) {
    var a = e.effectId,
      n = e.strength;
    this.filters || (this.filters = []);
    var i = this.filters[ImageEffectType.EFFECT];
    i
      ? i.updateEffect(a, n)
      : ((i = new Ge(a, n)), (this.filters[ImageEffectType.EFFECT] = i)),
      (this.effectId = a),
      (this.effectBrightness = n || 0),
      t ||
        (this.applyFilters(),
        0 !== a && this.handleBackLuts(),
        this.requestRenderCanvas());
  }

  updateBrightness(e, t) {
    if ((this.filters || (this.filters = []), void 0 === e))
      delete this.filters[ImageEffectType.BRIGHTNESS];
    else {
      var a = this.filters[ImageEffectType.BRIGHTNESS];
      a ||
        ((a = new fabric.Image.filters.Brightness({
          brightness: e,
        })),
        (this.filters[ImageEffectType.BRIGHTNESS] = a)),
        (a.brightness = e);
    }
    (this.brightness = e),
      t || (this.applyFilters(), this.requestRenderCanvas());
  }

  createNewEngine(e) {
    var t = He.canvas(),
      a = new fabric.Plugin.BigWrap(t, 1, "");
    if (e) {
      if (fabric.isLikelyNode) {
        var n = fabric.util.createCanvasElement();
        (n.width = e.width),
          (n.height = e.height),
          n.getContext("2d").drawImage(e, 0, 0),
          a.set_image(n, e.width, e.height);
      } else a.set_image(e, e.width, e.height);
      t.proportion = e.proportion;
    }
    return { newEngine: a, newCanvas: t };
  }

  updateTint(e) {
    var t = this.tint;
    (t = e),
      (this.tint = t),
      (this.temperatureAndTintChanged = !0),
      (this.imageChanged = !0),
      this.requestRenderCanvas();
  }

  updateTemperature(e) {
    var t = this.tempereature;
    (t = e),
      (this.tempereature = t),
      (this.temperatureAndTintChanged = !0),
      (this.imageChanged = !0),
      this.requestRenderCanvas();
  }

  handleBackLuts() {
    (this.effectFilterId = void 0),
      (this.effectFilterStrength = void 0),
      (this.effectFilterIsPro = void 0),
      (this.effectFilterSize = void 0),
      (this.effectFilterDefalStrength = void 0),
      (this.filtert_txt = void 0),
      (this.eventCanvasFilter = void 0);
  }

  upDateFilter(e, t) {
    "reduction" === e
      ? (this.handleBackLuts(),
        this.updateEffect({ effectId: 0, strength: NaN }, !1))
      : ((this.filtert_txt = e && e.txt),
        (this.effectFilterId = e && e.id),
        (this.effectFilterSize = e && e.size),
        (this.effectFilterIsPro = e && e.isPro),
        (this.effectFilterDefalStrength = e && e.defaultStrength),
        (this.effectFilterStrength = e && e.strength),
        (this.effectFilterName = e && e.name),
        (this.effectFilterGroupName = e && e.groupName),
        this.updateEffect({ effectId: 0, strength: NaN }, !1),
        (this.filtersChanged = !0));
  }

  updateSaturation(e, t) {
    if ((this.filters || (this.filters = []), void 0 === e))
      delete this.filters[ImageEffectType.SATURATION];
    else {
      var a = this.filters[ImageEffectType.SATURATION];
      a ||
        ((a = new fabric.Image.filters.Saturation({
          saturation: e,
        })),
        (this.filters[ImageEffectType.SATURATION] = a)),
        (a.saturation = e);
    }
    (this.saturation = e),
      t || (this.applyFilters(), this.requestRenderCanvas());
  }

  updateContrast(e, t) {
    if ((this.filters || (this.filters = []), void 0 === e))
      delete this.filters[ImageEffectType.CONTRAST];
    else {
      var a = this.filters[ImageEffectType.CONTRAST];
      a ||
        ((a = new fabric.Image.filters.Contrast({ contrast: e })),
        (this.filters[ImageEffectType.CONTRAST] = a)),
        (a.contrast = e);
    }
    (this.contrast = e), t || (this.applyFilters(), this.requestRenderCanvas());
  }

  updateSharpen(e, t) {
    if ((this.filters || (this.filters = []), void 0 === e))
      delete this.filters[ImageEffectType.SHARPEN];
    else {
      var a = this.filters[ImageEffectType.SHARPEN];
      a ||
        ((a = new fabric.Image.filters.Convolute({
          matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0],
        })),
        (this.filters[ImageEffectType.SHARPEN] = a));
      var n = e,
        i = 1 - 8 * n;
      a.matrix = [n, n, n, n, i, n, n, n, n];
    }
    (this.sharpen = e), t || (this.applyFilters(), this.requestRenderCanvas());
  }

  updateBlur(e, t) {
    if ((this.filters || (this.filters = []), void 0 === e))
      delete this.filters[ImageEffectType.BLUR];
    else {
      var a = this.filters[ImageEffectType.BLUR];
      a ||
        ((a = new fabric.Image.filters.Blur()),
        (this.filters[ImageEffectType.BLUR] = a)),
        (a.blur = e);
    }
    (this.blur = e), t || (this.applyFilters(), this.requestRenderCanvas());
  }

  applyFilters(filters) {
    // 条件：图片已准备好或强制渲染开启
    if (this.isImageReady() || this.forceRenderImage) {
      // 重置 fabric 的 filter 后端（防止缓存）
      fabric.filterBackend = void 0;
  
      // 调用父类的 applyFilters 方法
      super.applyFilters(filters);
  
      // 标记状态：图像相关已发生变化
      this.imageChanged = true;
      this.temperatureAndTintChanged = true;
      this.filtersChanged = true;
  
      // 如果该对象有父组件，且类型是 GRID，则标记父组件需更新
      if (this.parent && this.parent.type === f.i.GRID) {
        this.parent.needsUpdate = true;
      }
    }
  
    // 支持链式调用
    return this;
  }
  

  onDeselect(e) {
    return (
      (e && e.object && e.object === this.clipChild) ||
        (this.isEditing && this.closeClipBounds(!1)),
      !1
    );
  }

  _isSameUrl(e, t) {
    return (
      !e ||
      !t ||
      ((e = processImageUrl(e)),
      (t = processImageUrl(t)),
      (e = (e = e.replace(/https:/g, "")).replace(/http:/g, "")),
      (t = (t = t.replace(/https:/g, "")).replace(/http:/g, "")),
      (t = removeTimestampParam(t)),
      (e = removeTimestampParam(e)) === t || t.indexOf(e) >= 0 || e.indexOf(t) >= 0)
    );
  }

  isImageReady() {
    var e = this._originalElement,
      t = this.getElement().naturalWidth || this.getElement().width,
      a = !1;
    return (
      (e && this._isSameUrl(this.imageUrl, e.src)) || (a = !0),
      this.sourceType === 'imageUrl' && t > 0 && !a
    );
  }

  exitEditing() {
    this.isEditing && this.closeClipBounds(!1);
  }

  resetFilters() {
    (this.effectId = 0),
      (this.effectBrightness = 0),
      (this.brightness = void 0),
      (this.saturation = void 0),
      (this.contrast = void 0),
      (this.sharpen = void 0),
      (this.blur = void 0),
      (this.filters = []),
      this.applyFilters();
  }

  clone(e, t) {
    var a = this.toObject(t);
    this.constructor.fromObject
      ? this.constructor.fromObject(a, e, !0)
      : fabric.Object._fromObject("Object", a, e);
  }

  setElement(imageElement, options) {
    // 如果图片与当前 imageUrl 不同，忽略这次设置
    if (imageElement && !this._isSameUrl(imageElement.src, this.imageUrl)) {
      return this;
    }
  
    // 若需要删除旧 DOM 元素，则执行清除
    if (options.needDeleteElement) {
      delete this._element;
    }
  
    // 调用父类 setElement 方法
    super.setElement(imageElement, options);
  
    // 如果传入了新图像元素，更新尺寸和样式
    if (imageElement) {
      const width = imageElement.naturalWidth || imageElement.width;
      const height = imageElement.naturalHeight || imageElement.height;
  
      // 记录原始图像尺寸
      this.originalImageSize = { width, height };
  
      // 设置描边为需要更新
      this.setImageStrokeDirty();
  
      // 如果指定了滤镜缩放类型，则创建并应用滤镜
      if (this.resizeFilterType) {
        this.resizeFilter = new fabric.Image.filters.Resize({
          resizeType: this.resizeFilterType,
        });
  
        this.applyFilters(); // 应用滤镜后需重绘
      }
    }
  
    return this;
  }
  

  isValidResolution(e) {
    if (this.isImageReady() && this.imageViewport && this.originalImageSize) {
      var t = this.hdImageSize;
      (!t ||
        t.width < this.originalImageSize.width ||
        t.height < this.originalImageSize.height) &&
        (t = mergeObjects({}, this.originalImageSize));
      var a = this.imageViewport.width * t.width,
        n = this.imageViewport.height * t.height,
        i = this.getScaledWidth(),
        r = this.getScaledHeight();
      return (
        this.group && ((i *= this.group.scaleX), (r *= this.group.scaleY)),
        !(i / a > e || r / n > e)
      );
    }
    return !0;
  }

  getElementColors() {
    var e = [];
    return (
      this.openShadow && this.shadow && e.push(this.shadow.color),
      this.imgStyles &&
        this.imgStyles.length &&
        this.imgStyles.forEach(function (t) {
          t.stroke && t.stroke.stroke
            ? e.push(t.stroke.stroke)
            : t.shadow && t.shadow.color && e.push(t.shadow.color);
        }),
      e
    );
  }

  copyStyle() {
    // 调用父类的 copyStyle，然后合并自己的样式
    return mergeObjects(
      {},
      super.copyStyle(),      // 父类方法
      {},
      this.cloneStyles()      // 当前类扩展的样式
    );
  }

  pasteStyle(style) {
    super.pasteStyle(style);  // 调用父类的 pasteStyle
    this.extendStyles(style); // 当前类扩展的处理
  }

  clonePropsFromSource() {
    return {
      stockPhotoInfo: deepClone(this.stockPhotoInfo),
      vip: this.vip,
      cutoutKey: this.cutoutKey,
      skinKey: this.skinKey,
      carToonKey: this.carToonKey,
      originInfo: deepClone(this.originInfo),
      hdImageSize: deepClone(this.hdImageSize),
    };
  }

  cloneStyles(e) {
    var t = Math.max(this.get("scaleX") || 1, this.get("scaleY") || 1),
      a = {};
    return (
      e &&
        (a = {
          cutoutKey: this.cutoutKey,
          skinKey: this.skinKey,
          carToonKey: this.carToonKey,
          cutoutUrl: this.cutoutUrl,
          cutoutUrlObj: this.cutoutUrlObj,
          skinUrl: this.skinUrl,
          cutoutLoadindKey: this.cutoutLoadindKey,
        }),
      mergeObjects(
        {
          imageVip: {
            elementId: this.elementId,
            vip: this.isVip(),
          },
          effectId: this.effectId,
          effectBrightness: this.effectBrightness,
          brightness: this.brightness,
          contrast: this.contrast,
          saturation: this.saturation,
          blur: this.blur,
          imgStyles: deepClone(this.imgStyles),
          imgStylesKey: this.imgStylesKey,
          imgStylesVip: this.imgStylesVip,
          tint: this.tint,
          tempereature: this.tempereature,
          effectFilterId: this.effectFilterId,
          effectFilterStrength: this.effectFilterStrength,
          effectFilterIsPro: this.effectFilterIsPro,
          effectFilterSize: this.effectFilterSize,
          effectFilterDefalStrength: this.effectFilterDefalStrength,
          filtert_txt: this.filtert_txt,
          fitScale: t,
          sourceChannel: this.sourceChannel,
        },
        a
      )
    );
  }

  extendStyles(e) {
    var t = e.imgStyles,
      a = e.imgStylesKey,
      n = e.imgStylesVip,
      i = e.fitScale,
      r =
        (e.type,
        e.path,
        Object(le.a)(e, [
          "imgStyles",
          "imgStylesKey",
          "imgStylesVip",
          "fitScale",
          "type",
          "path",
        ]));
    if (
      (this.setOptions(r),
      (this.filtersChanged = !0),
      (this.imageChanged = !0),
      t && t.length)
    ) {
      var o = i / Math.max(this.get("scaleX") || 1, this.get("scaleY") || 1);
      t.forEach(function (e) {
        e.stroke
          ? (e.stroke.strokeWidth *= o)
          : e.shadow && ((e.shadow.offsetX *= o), (e.shadow.offsetY *= o));
      }),
        this.changeImgStyles({
          imgStyles: t,
          imgStylesKey: a,
          imgStylesVip: n,
        });
    }
    this.applyStyles(r);
  }

  applyStyles(e) {
    var t = e.effectId,
      a = e.effectBrightness,
      n = e.brightness,
      i = e.contrast,
      r = e.saturation,
      o = e.blur,
      c = e.tint,
      s = e.temperature;
    (this.filters = []),
      void 0 !== o && 0 !== o && this.updateBlur(o, !0),
      void 0 !== t && 0 !== t
        ? this.updateEffect({ effectId: t, strength: a }, !0)
        : void 0 !== a &&
          0 !== a &&
          this.updateEffect({ effectId: t, strength: a }, !0),
      void 0 !== n && 0 !== n && this.updateBrightness(n, !0),
      void 0 !== i && 0 !== i && this.updateContrast(i, !0),
      void 0 !== r && 0 !== r && this.updateSaturation(r, !0),
      void 0 !== c && 0 !== c && this.updateTint(c),
      void 0 !== s && 0 !== s && this.updateTemperature(s),
      this.applyFilters(),
      this.requestRenderCanvas();
  }

  backEditOrigin(e) {
    var t = e.effectId,
      a = e.effectBrightness,
      n = e.brightness,
      i = e.contrast,
      r = e.saturation,
      o = e.blur,
      c = e.tint,
      s = e.temperature;
    this.updateBlur(o, !0),
      this.updateEffect({ effectId: t, strength: a }, !0),
      this.updateBrightness(n, !0),
      this.updateContrast(i, !0),
      this.updateSaturation(r, !0),
      this.updateTint(c),
      this.updateTemperature(s),
      this.applyFilters(),
      this.requestRenderCanvas();
  }

  saveState(options) {
    // 调用父类的 saveState 方法
    super.saveState(options);
  
    // 将当前的 imageUrl 保存到对应的状态属性里
    const key = `_${(options && options.propertySet) || "stateProperties"}`;
    this[key].imageUrl = this.imageUrl;
  
    return this;
  }
  
  getSrc() {
    // 如果 sourceType 是 'imageUrl'，调用父类的 getSrc 方法
    if (this.sourceType === "imageUrl") {
      return super.getSrc();
    } else {
      return "";
    }
  }

  isCutout() {
    return this.sourceChannel === f.c.SC_CUTOUT;
  }

  isSticker() {
    return (
      this.type === f.i.IMAGE &&
      [
        f.c.SC_CUTOUT,
        f.c.SC_STICKER,
        f.c.SC_STICKER_CCO,
        f.c.SC_STICKER_BG,
      ].includes(this.sourceChannel)
    );
  }

  isNormalSticker() {
    return (
      this.type === f.i.IMAGE &&
      [f.c.SC_CUTOUT, f.c.SC_STICKER].includes(this.sourceChannel)
    );
  }

  isVip() {
    return this.stockPhotoInfo
      ? Boolean(this.stockPhotoInfo.vip === f.h.vip)
      : Boolean(
          this.vip ||
            this.cutoutKey ||
            this.imgStylesVip ||
            this.effectFilterIsPro ||
            this.skinKey
        );
  }

  isSvip() {
    return Boolean(this.stockPhotoInfo && this.stockPhotoInfo.vip === f.h.svip);
  }

  srcIsBlob() {
    return /^blob/.test(this.getSrc());
  }

  srcIsBase64() {
    return /^data:image\//.test(this.getSrc());
  }

  needWaterMark() {
    if (this.loadError) return !1;
    if (
      (this.stockPhotoInfo && this.stockPhotoInfo.status) ||
      Boolean(this.loadError)
    )
      return !1;
    var e = !!this.canvas && this.canvas.getPxbeeVip(),
      t = !!this.canvas && this.canvas.getVip(),
      a = this.isSvip(),
      n = this.isVip();
    return !(e || !a) || !(e || t || (!a && !n));
  }

  _limitCacheSize(e) {
    var t = this.callSuper("_limitCacheSize", e);
    if (fabric.isLikelyNode && fabric.hasOwnProperty("fotorExportHD")) {
      var a = 1;
      this.originalImageSize
        ? (a = Math.min(
            this.originalImageSize.width / t.width,
            this.originalImageSize.height / t.height
          ))
        : this.placeHolderImage &&
          (a = Math.min(
            this.placeHolderImage.width / t.width,
            this.placeHolderImage.height / t.height
          )),
        (this._cacheZoom *= a),
        (t.width *= a),
        (t.height *= a),
        (t.zoomX *= a),
        (t.zoomY *= a);
    }
    return t;
  }

  checkDisableClipChild() {
    return !!(
      this.group ||
      (this.mappingOriginalObject && this.mappingOriginalObject.group)
    );
  }

  saveOriginInfo() {
    if (!this.skinKey || !this.originInfo) {
      var e = this.toObject([]),
        t = e.src,
        a = e.stockPhotoInfo,
        n = e.skinKey,
        i = e.carToonKey,
        r = e.sourceChannel;
      this.originInfo = {
        src: t,
        stockPhotoInfo: a,
        skinKey: n,
        carToonKey: i,
        sourceChannel: r,
      };
    }
  }

  resetOriginInfo() {
    this.originInfo = void 0;
  }

  getOriginInfo() {
    return this.originInfo;
  }

  getImageSourceInfo() {
    return {
      id: this.elementId,
      url: this.getSrc(),
      imageWidth: this.hdImageSize && this.hdImageSize.width,
      imageHeight: this.hdImageSize && this.hdImageSize.height,
      stockPhotoInfo: deepClone(this.stockPhotoInfo),
      imageVip: this.imageVip,
    };
  }

  handleTintTemperature(e) {
    if (e) {
      if (!isPluginFeatureEnabled(PluginType.IMAGE_TEMPEREATURE_TINT)) return e;
      if (0 === this.tempereature && 0 === this.tint) return e;
      e = this.handleImageWidth(e);
      var t = Ye.temperatureAndTint(this.tempereature || 0, this.tint || 0);
      if (t) {
        var a = this.createNewEngine(e),
          n = a.newEngine,
          i = a.newCanvas;
        return n.process_rule(t, !0), fabric.isLikelyNode && i.toDataURL(), i;
      }
      return e;
    }
  }

  saveCutoutUrl(e, t) {
    e && e.url
      ? ((this.cutoutUrl = e.url),
        (this.cutoutKey = e.cutoutKey),
        this.loadCutoutUrl(t))
      : this.orignCutoutUrl(t);
  }

  loadCutoutUrl(e) {
    if (this.cutoutUrl) {
      var t = new Image();
      t.setAttribute("crossOrigin", "anonymous"), (t.src = this.cutoutUrl);
      var a = this;
      t.onload = function () {
        (a.cutoutUrlObj = t),
          a._resetInfo(),
          (a.cutoutLoadindKey = void 0),
          a._fireDataChanged(!0),
          a.requestRenderCanvas(),
          e && e();
      };
    }
  }

  orignCutoutUrl(e) {
    (this.cutoutUrl = void 0),
      (this.cutoutUrlObj = void 0),
      (this.cutoutKey = void 0),
      this._resetInfo(),
      this._fireDataChanged(!0),
      this.requestRenderCanvas(),
      e && e();
  }

  getMaxShadowOffset() {
    var e = this,
      t = { maxOffsetX: 0, maxOffsetY: 0 };
    return (
      this.imgStyles &&
        this.imgStyles.length &&
        this.imgStyles.forEach(function (a) {
          var n;
          a.shadow &&
            ((n = a.shadow.nonScaling
              ? { scaleX: 1, scaleY: 1 }
              : e.getObjectScaling()),
            (t.maxOffsetX = Math.max(
              t.maxOffsetX,
              Math.round(Math.abs(a.shadow.offsetX) + a.shadow.blur) *
                Math.abs(n.scaleX)
            )),
            (t.maxOffsetY = Math.max(
              t.maxOffsetY,
              Math.round(Math.abs(a.shadow.offsetY) + a.shadow.blur) *
                Math.abs(n.scaleY)
            )));
        }),
      t
    );
  }
}

fabric.EnhancedImage = EnhancedImage;
