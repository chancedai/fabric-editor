import { emitter,render } from "../../__common__/utils";
import fabric from "../fabric";
import { canvas} from "../canvas";
import lib from "../lib";
import { panel } from "../component/sidebar";
import elements from "../elements";

 // 复选框选项
 const filterChoices = {
  Brownie: 1126,
  Sepia: 1120,
  Kodachrome: 1127,
  Technicolor: 1128,
  Polaroid: 1129,
  BlackWhite: 1125,
  Grayscale: 1121,
  Convolute: 1123,
};


// 滑块控制
const sliderSettings = [
  { 
    name: '模糊度',
    key: "Blur", label: 1122, range: [0, 100], factor: 100 },
  { 
    name: '饱和度',
    key: "Saturation", label: 1130, range: [-100, 100], factor: 100 },
  { 
    name: '对比度',
    key: "Contrast", label: 1131, range: [-100, 100], factor: 100 },
  { 
    name: '亮度',
    key: "Brightness", label: 1116, range: [-100, 100], factor: 100 },
  { 
    name: '噪点',
    key: "Noise", label: 1117, range: [0, 200], factor: 1 },
  { 
    name: '像素化',
    key: "Pixelate", label: 1118, range: [0, 20], factor: 1 },
];

let refs = null;
let updates = {};
let currentImage = null;
let filters = {};
function padLabel(text, targetLength = 4) {
  return text.padStart(targetLength, "\u3000");
}
function renderUI(settings){
  if(refs){
    return;
  }
  refs = render('',()=>{
    return [
        `<div data-id="wrapper" class="text-sm h-full overflow-auto">`,
        render.section("", [
          // render.titleRow('滤镜', ""),
          render.row('', "filterChoices"),
        ]),
        render.section("参数", sliderSettings.map(({ key, name }) => {
          // name 不足 3 个，补齐空格
          name = padLabel(name, 3);
          return render.row(name, key.toLowerCase() + "Slider");
        })),
        `</div>`
    ];
  
  }, panel.content);

  // 遍历配置数组生成各个设置项
  settings.forEach((setting) => {
    const { update } = elements.getGui(
      refs[setting.id],
      setting.type,
      setting.guiProps
    );
    updates[setting.id] = update;
  });


}

  const updateUI = async () => {
    
    filters = {};
    if (currentImage.filters) {
      for (const filter of currentImage.filters) {
        filters[filter.type] = filter;
      }
    }
    
    const applyFilters = (image) => {
      image.filters = Object.values(filters);
      image.applyFilters();
    };

   

    // {
    //   a: checked
    // }

    const checkeds = Object.entries(filterChoices).reduce((acc, [name, label]) => {
      acc[name] = !!filters[name];
      return acc;
    }, {});
    const settings = [
      {
        id: "filterChoices",
        type: "checkbox",
        label: "选择滤镜",
        val: checkeds,
        guiProps: {
            class: "grid grid-cols-3 gap-2",
            choices: Object.entries(filterChoices).reduce((acc, [name, label]) => {
              acc[name] = {
                name,
                label: `
                  <div class="items-center p-1" title="${lib.word(label)}">
                    <img src="https://xiaomingyan.com/static/common/d.gif" data-src="https://xiaomingyan.com/static/v/design/filters/${name}.png" class="w-full rounded">
                  </div>
                `,
                checked: !!filters[name],
              };
              return acc;
            }, {}),
          onchange: (name, checked) => {
            canvas.apply(currentImage, (image) => {
              if (checked) {
                filters[name] = name === "Convolute" ?
                  new fabric.Image.filters.Convolute({ matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0] }) :
                  new fabric.Image.filters[name]();
              } else {
                delete filters[name];
              }
              applyFilters(image);
            });
          },
        },


      },
      ...sliderSettings.map(({ key, label, range, factor }) => ({
        id: key.toLowerCase() + "Slider",
        type: "slider",
        label: lib.word(label),
        val: filters[key] ? filters[key][key.toLowerCase()] * factor : 0,
        guiProps: {
          range,
          value: filters[key] ? filters[key][key.toLowerCase()] * factor : 0,
          onchange: (value) => {
            canvas.apply(currentImage, (image) => {
              filters[key] = value == 0 ? false : new fabric.Image.filters[key]({ [key.toLowerCase()]: value / factor });
              applyFilters(image);
            });
          },
        }
      })),
    ];

    if (refs) {
      settings.forEach((setting) => {
        const update = updates[setting.id];
        if(update){
          update(setting.val);
        }
      });
    } else {
      // 渲染UI
      renderUI(settings);
    }
    panel.show("filters",refs.wrapper, '滤镜');



  };


    async function edit (image) {
      currentImage = image;
      updateUI();
    }
  

emitter.on("operation:filter:edit", async (object) => {
  await edit(object, true);
  
});
emitter.on('operation:destroy', (operationType) => {
  if (operationType === 'filter') {
    destroy();
  }
});
// canvas.on('selection:cleared', destroy);
