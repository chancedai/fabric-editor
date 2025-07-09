// 1. 字段名映射：例如 { "width": "w", "height": "h" }
// 调试中，不使用 compressFields
let isDebug = true;

const fieldMapping = {
  "version": "a",
  "objects": "b",
  "canvasSize": "c",
  "type": "d",
  "originX": "e",
  "originY": "f",
  "left": "g",
  "top": "h",
  "width": "i",
  "height": "j",
  "fill": "k",
  "stroke": "l",
  "strokeWidth": "m",
  "strokeDashArray": "n",
  "strokeLineCap": "o",
  "strokeDashOffset": "p",
  "strokeLineJoin": "q",
  "strokeUniform": "r",
  "strokeMiterLimit": "s",
  "scaleX": "t",
  "scaleY": "u",
  "angle": "v",
  "flipX": "w",
  "flipY": "x",
  "opacity": "y",
  "shadow": "z",
  "visible": "{",
  "backgroundColor": "|",
  "fillRule": "}",
  "paintFirst": "~",
  "globalCompositeOperation": "",
  "skewX": "¡",
  "skewY": "¢",
  "rx": "£",
  "ry": "¤",
  "selectable": "¥",
  "numPoints": "¦",
  "innerRadius": "§",
  "outerRadius": "¨",
  "points": "©",
  "x": "ª",
  "y": "«",
  "cropX": "¬",
  "cropY": "®",
  "crossOrigin": "¯",
  "shape": "°",
  "orgWidth": "±",
  "orgHeight": "²",
  "ppColor": "³",
  "ppWidth": "´",
  "blurWidth": "µ",
  "zoomLevel": "¶",
  "cx": "·",
  "cy": "¸",
  "cw": "¹",
  "ch": "º",
  "src": "»",
  "filters": "¼",
  "fontFamily": "½",
  "fontWeight": "¾",
  "fontSize": "¿",
  "text": "À",
  "underline": "Á",
  "overline": "Â",
  "linethrough": "Ã",
  "textAlign": "Ä",
  "fontStyle": "Å",
  "lineHeight": "Æ",
  "textBackgroundColor": "Ç",
  "charSpacing": "È",
  "styles": "É",
  "direction": "Ê",
  "path": "Ë",
  "pathStartOffset": "Ì",
  "pathSide": "Í",
  "pathAlign": "Î",
  "bottomFill": "Ï",
  "bottomOffsetX": "Ð",
  "bottomOffsetY": "Ñ",
  "bottomStroke": "Ò",
  "bottomStrokeWidth": "Ó",
  "background": "Ô",
  "color": "Õ",
  "blur": "Ö",
  "offsetX": "×",
  "offsetY": "Ø",
  "affectStroke": "Ù",
  "nonScaling": "Ú",
  "backgroundImage": "Û",
  "radius": "Ü",
  "startAngle": "Ý",
  "endAngle": "Þ",
  "x1": "ß",
  "x2": "à",
  "y1": "á",
  "y2": "â",
  "fillWeight": "ã",
  "fillStyle": "ä",
  "hachureGap": "å",
  "hachureAngle": "æ",
  "roughness": "ç",
  "start": "è",
  "end": "é",
  "style": "ê",
  "flipped": "ë",
  "overlayImage": "ì",
  "sizeTop": "í",
  "sizeBottom": "î",
  "warpType": "ï",
  "scale": "ð",
  "bsrc": "ñ",
  "csrc": "ò",
  "size": "ó",
  "coords": "ô",
  "colorStops": "õ",
  "offset": "ö",
  "gradientUnits": "÷",
  "gradientTransform": "ø"
};

const reverseFieldMapping = Object.fromEntries(Object.entries(fieldMapping).map(([k, v]) => [v, k]));

// 2. 压缩字段和值（将字段转换为映射值）
function compressFields(json) {
  if (isDebug) {
    // 如果是调试模式，直接返回原始 JSON
    return json;
  }
  // 递归遍历所有层级
  if (Array.isArray(json)) {
    return json.map(item => compressFields(item)); // 对数组中的每个项递归压缩
  } else if (typeof json === 'object' && json !== null) {
    return Object.fromEntries(
      Object.entries(json).map(([key, value]) => {
        const newKey = fieldMapping[key] || key; // 映射字段名
        const newValue = compressFields(value); // 递归压缩字段值
        return [newKey, newValue];  // 返回压缩后的字段名和值
      })
    );
  } else {
    return json;  // 如果是基本数据类型，直接返回
  }
}

// 3. 解压缩字段（将映射的字段名恢复为原始值）
function decompressFields(json) {
  // 递归遍历所有层级
  if (Array.isArray(json)) {
    return json.map(item => decompressFields(item)); // 对数组中的每个项递归解压
  } else if (typeof json === 'object' && json !== null) {
    return Object.fromEntries(
      Object.entries(json).map(([key, value]) => {
        const originalKey = reverseFieldMapping[key] || key; // 解映射字段名
        const newValue = decompressFields(value); // 递归解压字段值
        return [originalKey, newValue];  // 返回解压后的字段名和值
      })
    );
  } else {
    return json;  // 如果是基本数据类型，直接返回
  }
}

// 4. JSON 压缩（包括字段名映射）
export function compressJSON(json) {
  try {
    if (typeof json !== 'object') {
      json = JSON.parse(json); // 如果是字符串，解析 JSON
    }
    const compressedFields = compressFields(json); // 压缩字段名和值
    const str = JSON.stringify(compressedFields, null, 0); // 去掉空格和换行
    return str; // 返回压缩后的 JSON 字符串
  } catch (err) {
    console.error("压缩失败:", err);
    return null;
  }
}

// 5. JSON 解压（包括字段名解映射）
export function decompressJSON(compressedStr) {
  try {
    // 如果是字符串，解析 JSON 字符串
    let parsed;
    if (typeof compressedStr === 'string') {
      parsed = JSON.parse(compressedStr);
    } else {
      parsed = compressedStr; // 如果是对象，直接使用
    }
    return decompressFields(parsed); // 解压字段名
  } catch (err) {
    console.error("解压失败:", err);
    return null;
  }
}

// 示例数据
// const jsonData = {
//   version: "5.3.0",
//   objects: [
//     {
//       type: "image",
//       version: "5.3.0",
//       originX: "left",
//       originY: "top",
//       left: 608.65,
//       top: 194.67,
//       width: 1024,
//       height: 751,
//       fill: "rgb(0,0,0)",
//       stroke: null,
//       strokeWidth: 0,
//       strokeDashArray: null,
//       strokeLineCap: "butt",
//       strokeDashOffset: 0,
//       strokeLineJoin: "miter",
//       strokeUniform: false,
//       strokeMiterLimit: 4,
//       scaleX: 0.57,
//       scaleY: 0.57,
//       angle: 0,
//       flipX: false,
//       flipY: false,
//       opacity: 1,
//       shadow: null,
//       visible: true,
//       backgroundColor: "",
//       fillRule: "nonzero",
//       paintFirst: "fill",
//       globalCompositeOperation: "source-over",
//       skewX: 0,
//       skewY: 0,
//       cropX: 0,
//       cropY: 0,
//       selectable: true,
//       src: "/assets/images/party/1.png",
//       crossOrigin: null,
//       filters: []
//     },
//     {
//       type: "textasset",
//       version: "5.3.0",
//       originX: "left",
//       originY: "top",
//       left: 577.08,
//       top: 324.94,
//       width: 77.2,
//       height: 226,
//       fill: "rgba(255, 255, 255, 1)",
//       stroke: "rgba(0,0,0,1)",
//       strokeWidth: 0,
//       strokeDashArray: null,
//       strokeLineCap: "butt",
//       strokeDashOffset: 0,
//       strokeLineJoin: "miter",
//       strokeUniform: false,
//       strokeMiterLimit: 4,
//       scaleX: 1.62,
//       scaleY: 1.62,
//       angle: -1.97,
//       flipX: false,
//       flipY: false,
//       opacity: 1,
//       shadow: {
//         color: "rgba(130, 94, 28, 0.95)",
//         blur: 18,
//         offsetX: -5,
//         offsetY: -8,
//         affectStroke: false,
//         nonScaling: false
//       },
//       visible: true,
//       backgroundColor: "",
//       fillRule: "nonzero",
//       paintFirst: "fill",
//       globalCompositeOperation: "source-over",
//       skewX: 0,
//       skewY: 0,
//       fontFamily: "Bebas Neue",
//       fontWeight: 400,
//       fontSize: 200,
//       text: "P",
//       underline: false,
//       overline: false,
//       linethrough: false,
//       textAlign: "left",
//       fontStyle: "normal",
//       lineHeight: 1.16,
//       textBackgroundColor: ""
//     }
//   ]
// };

// // 压缩和解压
// const compressed = compressJSON(jsonData);
// console.log("压缩后的数据：", compressed);

// const decompressed = decompressJSON(compressed);
// console.log("解压后的数据：", decompressed);
