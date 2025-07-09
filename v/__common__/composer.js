import { getRefs, delegator } from "./utils";
import { getParameters } from "codesandbox/lib/api/define";
import { showError, showSuccess, showInfo, showWarning } from "./utils";

// 获取 body 里面所有 node-type 属性的元素
const refs = getRefs("#composer", "node-type");

// 要分享或下载的 HTML
let shareHTML = "";

// 接口返回的代码

let chatCode = "";
let chartType = "";
let chartSubType = "";

const debug = true; // 是否开启调试模式
const host = debug
  ? "http://localhost:3103/"
  : "https://xmy-api-35366-7-1317185243.sh.run.tcloudbase.com/";

const presetData = {
  chart_lib: "ECharts",
  prompt_list: [
    {
      label: "销售数据柱状图",
      value:
        "使用 ECharts 生成柱状图\n产品\tQ1销售额\tQ2销售额\tQ3销售额\tQ4销售额\n产品A\t1500\t1800\t2000\t2100\n产品B\t1200\t1400\t1600\t1800\n产品C\t1800\t2000\t2100\t2200\n产品D\t1000\t1300\t1400\t1500",
      description: "展示各产品季度销售额，反映销售趋势。",
    },
    {
      label: "网站流量折线图",
      value:
        "使用 ECharts 生成折线图\n月份\t自然搜索\t付费搜索\t社交媒体\t邮件营销\n1月\t5000\t2200\t1300\t1000\n2月\t5400\t2300\t1500\t1100\n3月\t6000\t2700\t1700\t1300\n4月\t5800\t3000\t1900\t2000\n5月\t7000\t3500\t2000\t1500\n6月\t8000\t3800\t2100\t1600\n7月\t8500\t4000\t2500\t1800\n8月\t8800\t3900\t2300\t1900\n9月\t9500\t4200\t2100\t2200\n10月\t9800\t4500\t2400\t2500\n11月\t10200\t4600\t2300\t2800\n12月\t10500\t5000\t2600\t3000",
      description: "反映网站各流量渠道的月度波动趋势。",
    },
    {
      label: "部门员工分布饼图",
      value:
        "使用 ECharts 生成饼图\n销售部: 80\n技术部: 60\n人力资源部: 40\n财务部: 20\n市场部: 50\n客服部: 30\n运营部: 25",
      description: "展示公司各部门员工数量占比。",
    },
    {
      label: "学生成绩雷达图",
      value:
        "使用 ECharts 生成雷达图\n科目\t学生A\t学生B\t学生C\n数学\t95\t80\t85\n语文\t90\t75\t80\n英语\t88\t82\t78\n物理\t85\t90\t88\n化学\t80\t85\t90\n生物\t78\t88\t84",
      description: "对比不同学生在各科目的表现。",
    },
    {
      label: "产品市场份额饼图",
      value:
        "使用 ECharts 生成饼图\n产品A: 35%\n产品B: 25%\n产品C: 20%\n产品D: 10%\n其他产品: 10%",
      description: "展示各产品在市场中的份额比例。",
    },
    {
      label: "客户增长折线图",
      value:
        "使用 ECharts 生成折线图\n月份\t新增客户\n1月\t120\n2月\t135\n3月\t150\n4月\t160\n5月\t175\n6月\t180\n7月\t190\n8月\t210\n9月\t230\n10月\t250\n11月\t270\n12月\t300",
      description: "展示公司每月新增客户数量的增长趋势。",
    },
    {
      label: "天气变化折线图",
      value:
        "使用 ECharts 生成折线图\n日期\t最高温度\t最低温度\n2025-01-01\t8\t2\n2025-01-02\t10\t3\n2025-01-03\t12\t4\n2025-01-04\t11\t5\n2025-01-05\t9\t3",
      description: "展示连续五天的气温变化情况。",
    },
    {
      label: "股票价格K线图",
      value:
        "使用 ECharts 生成K线图\n日期\t开盘价\t收盘价\t最低价\t最高价\n2025-02-01\t10.5\t11.0\t10.3\t11.2\n2025-02-02\t11.0\t10.8\t10.6\t11.1\n2025-02-03\t10.8\t11.3\t10.7\t11.5\n2025-02-04\t11.3\t11.2\t10.9\t11.4",
      description: "展示股票在4个交易日内的价格波动情况。",
    },
    {
      label: "能耗热力图",
      value:
        "使用 ECharts 生成热力图\n区域\t周一\t周二\t周三\t周四\t周五\n区域A\t120\t130\t125\t140\t135\n区域B\t100\t105\t110\t115\t120\n区域C\t90\t95\t100\t105\t110",
      description: "反映不同区域在工作日内的能耗分布。",
    },
    {
      label: "公司层级树图",
      value:
        "使用 ECharts 生成树图\nCEO\n├─ 副总经理1\n│  ├─ 部门经理A\n│  └─ 部门经理B\n└─ 副总经理2\n   ├─ 部门经理C\n   └─ 部门经理D",
      description: "展示公司组织结构的层级关系。",
    },
    {
      label: "客户转化漏斗图",
      value:
        "使用 ECharts 生成漏斗图\n阶段\t数量\n访问网站\t10000\n注册账号\t2500\n添加购物车\t1200\n完成购买\t600",
      description: "展示客户从访问到购买的转化过程。",
    },
    {
      label: "地图数据散点图",
      value:
        "使用 ECharts 生成散点图（地图）\n城市\t经度\t纬度\t用户数\n北京\t116.4\t39.9\t5000\n上海\t121.5\t31.2\t4500\n广州\t113.3\t23.1\t4000\n深圳\t114.1\t22.5\t3800",
      description: "在地图上展示各城市用户分布情况。",
    },
    {
      label: "产品对比柱状图",
      value:
        "使用 ECharts 生成柱状图\n产品\t功能评分\t性价比评分\t用户满意度\n产品A\t85\t90\t88\n产品B\t80\t85\t82\n产品C\t88\t80\t84",
      description: "对比不同产品的多项指标评分。",
    },
    {
      label: "各地区收入柱状图",
      value:
        "使用 ECharts 生成柱状图\n地区\t收入（万元）\n华北\t500\n华东\t650\n华南\t480\n西南\t520\n西北\t310",
      description: "展示不同地区的收入水平。",
    },
    {
      label: "月度支出饼图",
      value:
        "使用 ECharts 生成饼图\n类别\t支出比例\n租金\t40%\n人工\t25%\n设备\t15%\n营销\t10%\n其他\t10%",
      description: "展示企业各项月度支出占比。",
    },
    {
      label: "供应链流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph TD;\n  原材料供应 --> 加工生产;\n  加工生产 --> 物流运输;\n  物流运输 --> 仓储;\n  仓储 --> 分销;\n  分销 --> 零售;",
      description: "描述供应链从原材料到零售的全流程。",
    },
    {
      label: "软件开发流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph LR;\n  需求分析 --> 系统设计;\n  系统设计 --> 开发编码;\n  开发编码 --> 测试;\n  测试 --> 部署;\n  部署 --> 维护;",
      description: "展示软件开发的主要流程。",
    },
    {
      label: "餐厅订座流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph TD;\n  顾客预订 --> 餐厅确认;\n  餐厅确认 --> 到店就座;\n  到店就座 --> 点餐;\n  点餐 --> 上菜;\n  上菜 --> 用餐结束;",
      description: "展示餐厅订座到用餐结束的流程。",
    },
    {
      label: "医院就诊流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph TD;\n  挂号 --> 分诊;\n  分诊 --> 候诊;\n  候诊 --> 看诊;\n  看诊 --> 检查或取药;\n  检查或取药 --> 取报告/出院;",
      description: "展示患者从挂号到出院的就诊流程。",
    },
    {
      label: "项目开发甘特图",
      value:
        "使用 Mermaid 生成甘特图\ngantt\n    dateFormat  YYYY-MM-DD\n    title 项目开发进度\n    section 需求阶段\n    需求分析       :a1, 2025-03-01, 10d\n    section 开发阶段\n    模块开发       :after a1, 20d\n    section 测试阶段\n    系统测试       :2025-04-01, 10d",
      description: "展示项目各阶段的任务和时间安排。",
    },
    {
      label: "产品发布甘特图",
      value:
        "使用 Mermaid 生成甘特图\ngantt\n    dateFormat  YYYY-MM-DD\n    title 产品发布计划\n    section 准备阶段\n    市场调研       :a1, 2025-05-01, 7d\n    section 开发阶段\n    产品开发       :after a1, 15d\n    section 上线阶段\n    系统部署       :2025-05-25, 5d",
      description: "展示产品从调研到上线的时间进度。",
    },
    {
      label: "市场推广流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph LR;\n  策略制定 --> 渠道选择;\n  渠道选择 --> 内容制作;\n  内容制作 --> 活动执行;\n  活动执行 --> 数据反馈;",
      description: "描述市场推广活动的各个环节。",
    },
    {
      label: "员工入职流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph TD;\n  发放offer --> 签署合同;\n  签署合同 --> 入职培训;\n  入职培训 --> 分配部门;\n  分配部门 --> 正式上岗;",
      description: "展示新员工从接收 offer 到正式上岗的流程。",
    },
    {
      label: "订单处理流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph LR;\n  客户下单 --> 订单审核;\n  订单审核 --> 库存检查;\n  库存检查 --> 发货;\n  发货 --> 物流跟踪;\n  物流跟踪 --> 确认收货;",
      description: "描述订单从下单到收货的全流程。",
    },
    {
      label: "物流配送流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph TD;\n  仓库出货 --> 运输调度;\n  运输调度 --> 配送中心;\n  配送中心 --> 最后一公里配送;\n  最后一公里配送 --> 客户签收;",
      description: "展示物流配送过程中各环节的衔接。",
    },
    {
      label: "公司会议日程甘特图",
      value:
        "使用 Mermaid 生成甘特图\ngantt\n    dateFormat  HH:mm\n    title 公司会议安排\n    section 上午\n    部门例会       :09:00, 60min\n    section 下午\n    全体会议       :14:00, 90min",
      description: "展示公司一天内各会议的安排情况。",
    },
    {
      label: "产品生命周期甘特图",
      value:
        "使用 Mermaid 生成甘特图\ngantt\n    dateFormat  YYYY-MM-DD\n    title 产品生命周期\n    section 研发\n    设计与开发 :2025-01-10, 30d\n    section 推广\n    市场推广   :2025-02-15, 20d\n    section 维护\n    产品维护   :2025-03-10, 40d",
      description: "展示产品从研发到维护的各阶段时间规划。",
    },
    {
      label: "互联网服务流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph LR;\n  用户注册 --> 邮箱验证;\n  邮箱验证 --> 服务订阅;\n  服务订阅 --> 客户支持;\n  客户支持 --> 续费提醒;",
      description: "描述互联网服务用户使用的主要流程。",
    },
    {
      label: "客服服务流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph TD;\n  客户咨询 --> 问题分类;\n  问题分类 --> 指派客服;\n  指派客服 --> 解决问题;\n  解决问题 --> 客户反馈;",
      description: "展示客服处理客户问题的流程。",
    },
    {
      label: "系统维护流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph LR;\n  定期检测 --> 发现故障;\n  发现故障 --> 分析原因;\n  分析原因 --> 制定修复计划;\n  制定修复计划 --> 实施修复;\n  实施修复 --> 系统恢复;",
      description: "描述系统从检测到恢复的维护流程。",
    },
    {
      label: "社交网络关系图",
      value:
        "使用 Vega 生成关系散点图\n节点\t用户ID\t粉丝数\nA\t001\t500\nB\t002\t300\nC\t003\t450\nD\t004\t600",
      description: "展示社交网络中各用户之间的关系和影响力。",
    },
    {
      label: "数据关联散点图",
      value:
        "使用 Vega 生成散点图\n指标\t数值\nA\t15\nB\t22\nC\t18\nD\t25\nE\t30",
      description: "展示多维数据间的关联关系。",
    },
    {
      label: "天气数据交互图",
      value:
        "使用 Vega 生成交互图\n日期\t温度\t湿度\n2025-06-01\t28\t65\n2025-06-02\t30\t60\n2025-06-03\t32\t55\n2025-06-04\t31\t58",
      description: "提供交互功能，分析天气数据的温湿度关系。",
    },
    {
      label: "销售额热力图",
      value:
        "使用 Vega 生成热力图\n地区\t一月\t二月\t三月\t四月\n北区\t120\t130\t125\t140\n南区\t100\t110\t105\t115\n东区\t90\t95\t100\t105\n西区\t80\t85\t80\t90",
      description: "展示各地区在不同月份的销售额热度。",
    },
    {
      label: "电影票房散点图",
      value:
        "使用 Vega 生成散点图\n电影\t票房（百万）\n电影A\t80\n电影B\t65\n电影C\t50\n电影D\t95",
      description: "展示不同电影票房表现的散点对比。",
    },
    {
      label: "用户行为分布图",
      value:
        "使用 Vega 生成散点图\n行为\t发生次数\n点击\t1500\n浏览\t3500\n购买\t500\n分享\t300",
      description: "反映用户在网站上的主要行为分布。",
    },
    {
      label: "交互式地图热图",
      value:
        "使用 Vega 生成热力图\n城市\t活跃用户数\n北京\t5000\n上海\t4500\n广州\t4000\n深圳\t3800",
      description: "在地图上展示城市用户活跃度分布。",
    },
    {
      label: "投资组合散点图",
      value:
        "使用 Vega 生成散点图\n资产\t预期收益率\t风险指数\n股票\t8%\t5\n债券\t4%\t2\n基金\t6%\t3\n房地产\t7%\t4",
      description: "对比不同投资产品的收益与风险。",
    },
    {
      label: "人口统计交互图",
      value:
        "使用 Vega 生成交互图\n地区\t人口（万）\n东区\t1200\n西区\t800\n南区\t950\n北区\t1100",
      description: "展示各地区人口数量及其动态变化。",
    },
    {
      label: "网络流量关系图",
      value:
        "使用 Vega 生成关系图\n节点\t流量（GB）\n节点1\t50\n节点2\t70\n节点3\t65\n节点4\t80",
      description: "展示网络中各节点之间的数据流量分布。",
    },
    {
      label: "创业公司增长图",
      value:
        "使用 Vega 生成柱状图\n年份\t用户数（万）\n2018\t5\n2019\t12\n2020\t20\n2021\t35\n2022\t50",
      description: "展示创业公司历年用户增长情况。",
    },
    {
      label: "科技趋势柱状图",
      value:
        "使用 Vega 生成柱状图\n年份\tAI投入（亿）\t区块链投入（亿）\n2018\t2\t1\n2019\t3\t1.5\n2020\t4\t2\n2021\t5\t2.5\n2022\t6\t3",
      description: "展示科技领域主要趋势的资金投入变化。",
    },
    {
      label: "学术引用散点图",
      value:
        "使用 Vega 生成散点图\n论文\t引用次数\n论文A\t120\n论文B\t150\n论文C\t100\n论文D\t180",
      description: "展示各论文在学术界的引用情况。",
    },
    {
      label: "环保数据热力图",
      value:
        "使用 Vega 生成热力图\n区域\tPM2.5\tPM10\tNO2\tSO2\n区域1\t80\t100\t45\t20\n区域2\t70\t90\t40\t18\n区域3\t60\t80\t35\t15",
      description: "反映各区域主要污染物的浓度分布。",
    },
    {
      label: "金融风险雷达图",
      value:
        "使用 ECharts 生成雷达图\n风险项\t信用风险\t市场风险\t操作风险\t流动性风险\n评分\t70\t65\t80\t75",
      description: "展示金融机构各项风险指标的评分。",
    },
    {
      label: "项目团队结构树图",
      value:
        "使用 ECharts 生成树图\n团队\n├─ 项目经理\n│  ├─ 技术组\n│  └─ 测试组\n└─ 产品经理\n   └─ UI/UX组",
      description: "展示项目团队内部的组织结构。",
    },
    {
      label: "生产计划进度甘特图",
      value:
        "使用 ECharts 生成甘特图\n任务\t开始日期\t结束日期\n原材料采购\t2025-03-01\t2025-03-05\n生产加工\t2025-03-06\t2025-03-20\n质检包装\t2025-03-21\t2025-03-25",
      description: "展示生产计划中各环节的时间安排。",
    },
    {
      label: "产品缺陷分布散点图",
      value:
        "使用 ECharts 生成散点图\n缺陷类型\t数量\n设计缺陷\t15\n制造缺陷\t10\n装配缺陷\t8\n包装缺陷\t5",
      description: "展示产品在不同阶段出现的缺陷数量。",
    },
    {
      label: "促销活动热力图",
      value:
        "使用 ECharts 生成热力图\n日期\t点击率\t转化率\n2025-04-01\t5%\t2%\n2025-04-02\t6%\t2.5%\n2025-04-03\t7%\t3%\n2025-04-04\t6.5%\t2.8%",
      description: "反映促销活动期间各天的用户互动数据。",
    },
    {
      label: "能源消耗趋势折线图",
      value:
        "使用 ECharts 生成折线图\n月份\t电力消耗（万kWh）\n1月\t150\n2月\t160\n3月\t155\n4月\t165\n5月\t170\n6月\t175",
      description: "展示企业每月电力消耗的趋势。",
    },
    {
      label: "教育资源分布饼图",
      value:
        "使用 ECharts 生成饼图\n类型\t比例\n小学\t30%\n初中\t25%\n高中\t25%\n大学\t20%",
      description: "展示某地区教育资源的分布情况。",
    },
    {
      label: "交通流量统计柱状图",
      value:
        "使用 ECharts 生成柱状图\n路段\t早高峰\t午间\t晚高峰\n路段A\t500\t300\t700\n路段B\t450\t280\t650\n路段C\t600\t350\t800",
      description: "反映不同路段在各时段的交通流量。",
    },
    {
      label: "酒店入住率折线图",
      value:
        "使用 ECharts 生成折线图\n日期\t入住率\n2025-07-01\t80%\n2025-07-02\t85%\n2025-07-03\t78%\n2025-07-04\t90%",
      description: "展示酒店连续几日的入住率变化。",
    },
    {
      label: "手机市场占有率饼图",
      value:
        "使用 ECharts 生成饼图\n品牌\t占有率\n品牌A\t40%\n品牌B\t30%\n品牌C\t20%\n品牌D\t10%",
      description: "展示手机市场中各品牌的占有率分布。",
    },
    {
      label: "电商购物漏斗图",
      value:
        "使用 ECharts 生成漏斗图\n步骤\t数量\n浏览\t10000\n点击\t3000\n加入购物车\t1500\n下单\t800\n支付\t600",
      description: "反映电商平台上从浏览到支付的用户转化过程。",
    },
    {
      label: "社交媒体互动热力图",
      value:
        "使用 ECharts 生成热力图\n时间\t互动数\n09:00\t120\n12:00\t300\n15:00\t250\n18:00\t400",
      description: "展示社交媒体平台不同时间段的互动热度。",
    },
    {
      label: "健康数据雷达图",
      value:
        "使用 ECharts 生成雷达图\n指标\t心率\t血压\t血糖\t体温\n数值\t72\t120/80\t5.5\t36.8",
      description: "展示人体健康的各项指标。",
    },
    {
      label: "投票结果饼图",
      value:
        "使用 ECharts 生成饼图\n选项\t票数\n选项A\t350\n选项B\t150\n选项C\t100\n选项D\t50",
      description: "展示某次投票中各选项的得票比例。",
    },
    {
      label: "企业资产分布饼图",
      value:
        "使用 ECharts 生成饼图\n资产类型\t比例\n现金\t20%\n固定资产\t40%\n流动资产\t30%\n无形资产\t10%",
      description: "展示企业内部各类资产的占比。",
    },
    {
      label: "个人支出柱状图",
      value:
        "使用 ECharts 生成柱状图\n月份\t餐饮\t交通\t娱乐\t其他\n1月\t500\t200\t150\t100\n2月\t550\t210\t160\t120\n3月\t530\t205\t155\t110",
      description: "展示个人在不同月份的各项支出情况。",
    },
    {
      label: "学生考试成绩折线图",
      value:
        "使用 ECharts 生成折线图\n考试科目\t语文\t数学\t英语\t物理\n成绩\t85\t90\t78\t88",
      description: "展示学生在各科目考试中的成绩趋势。",
    },
    {
      label: "工程项目进度甘特图",
      value:
        "使用 Mermaid 生成甘特图\ngantt\n    dateFormat  YYYY-MM-DD\n    title 工程项目进度\n    section 设计阶段\n    方案设计       :a1, 2025-04-01, 15d\n    section 施工阶段\n    主体施工       :after a1, 30d\n    section 竣工验收\n    工程验收       :2025-05-25, 5d",
      description: "展示工程项目从设计到竣工的进度安排。",
    },
    {
      label: "软件测试流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph TD;\n  编写测试用例 --> 执行测试;\n  执行测试 --> 缺陷反馈;\n  缺陷反馈 --> 修复验证;\n  修复验证 --> 回归测试;",
      description: "展示软件测试中各环节的流程。",
    },
    {
      label: "数据分析流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph LR;\n  数据采集 --> 数据清洗;\n  数据清洗 --> 数据分析;\n  数据分析 --> 结果展示;\n  结果展示 --> 决策支持;",
      description: "描述数据分析的基本步骤。",
    },
    {
      label: "内容发布流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph TD;\n  内容创作 --> 审核编辑;\n  审核编辑 --> 发布上线;\n  发布上线 --> 用户反馈;",
      description: "展示从内容创作到发布的全流程。",
    },
    {
      label: "市场活动甘特图",
      value:
        "使用 Mermaid 生成甘特图\ngantt\n    dateFormat  YYYY-MM-DD\n    title 市场活动计划\n    section 前期准备\n    策划及调研       :2025-06-01, 7d\n    section 执行阶段\n    活动执行         :2025-06-08, 10d\n    section 后期总结\n    数据分析         :2025-06-19, 5d",
      description: "展示市场活动从策划到总结的时间进程。",
    },
    {
      label: "物流运输流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph TD;\n  订单生成 --> 仓库拣货;\n  仓库拣货 --> 配送中心;\n  配送中心 --> 运输车辆;\n  运输车辆 --> 目的地配送;",
      description: "描述物流运输各环节的衔接流程。",
    },
    {
      label: "客户服务流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph TD;\n  客户反馈 --> 问题记录;\n  问题记录 --> 指派处理;\n  指派处理 --> 解决反馈;",
      description: "展示客户服务处理问题的标准流程。",
    },
    {
      label: "酒店预订流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph TD;\n  客户查询 --> 在线预订;\n  在线预订 --> 订单确认;\n  订单确认 --> 入住;\n  入住 --> 退房;",
      description: "展示酒店预订到退房的全过程。",
    },
    {
      label: "产品退换货流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph TD;\n  客户申请退换货 --> 审核申请;\n  审核申请 --> 退货处理;\n  退货处理 --> 新产品发货;\n  新产品发货 --> 完成退换;",
      description: "展示产品退换货的处理流程。",
    },
    {
      label: "会议安排甘特图",
      value:
        "使用 Mermaid 生成甘特图\ngantt\n    dateFormat  HH:mm\n    title 会议日程\n    section 上午\n    部门会议       :09:00, 60min\n    section 下午\n    战略会议       :14:00, 90min",
      description: "展示一天内各会议的安排。",
    },
    {
      label: "公司年会流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph TD;\n  策划准备 --> 嘉宾邀请;\n  嘉宾邀请 --> 活动彩排;\n  活动彩排 --> 正式晚会;\n  正式晚会 --> 总结反馈;",
      description: "展示公司年会从策划到反馈的流程。",
    },
    {
      label: "企业文化推广流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph LR;\n  文化调研 --> 制定方案;\n  制定方案 --> 内部宣导;\n  内部宣导 --> 外部推广;",
      description: "描述企业文化推广的各个步骤。",
    },
    {
      label: "节日促销活动甘特图",
      value:
        "使用 Mermaid 生成甘特图\ngantt\n    dateFormat  YYYY-MM-DD\n    title 节日促销计划\n    section 策划阶段\n    活动策划       :2025-11-01, 7d\n    section 执行阶段\n    活动执行       :2025-11-08, 10d\n    section 收尾阶段\n    数据统计       :2025-11-19, 3d",
      description: "展示节日促销活动的整体时间规划。",
    },
    {
      label: "用户体验流程图",
      value:
        "使用 Mermaid 生成流程图\ngraph TD;\n  用户调研 --> 产品原型设计;\n  产品原型设计 --> 用户测试;\n  用户测试 --> 反馈改进;\n  反馈改进 --> 产品优化;",
      description: "描述提升用户体验的各个关键环节。",
    },
    {
      label: "创意发散思维导图",
      value:
        "使用 jsMind 生成思维导图\n中心主题: 创意发散\n- 市场调研\n- 技术突破\n- 用户需求\n- 竞品分析",
      description: "展示创意发散过程中的多角度思考。",
    },
    {
      label: "项目规划思维导图",
      value:
        "使用 jsMind 生成思维导图\n中心主题: 项目规划\n- 目标设定\n- 资源分配\n- 风险评估\n- 时间进度",
      description: "梳理项目规划的各个关键要素。",
    },
    {
      label: "企业战略思维导图",
      value:
        "使用 jsMind 生成思维导图\n中心主题: 企业战略\n- 市场定位\n- 产品战略\n- 渠道策略\n- 竞争分析",
      description: "展示企业战略制定过程中的各方面考虑。",
    },
    {
      label: "产品设计思维导图",
      value:
        "使用 jsMind 生成思维导图\n中心主题: 产品设计\n- 用户需求\n- 功能规划\n- UI设计\n- 技术实现",
      description: "展示产品设计从需求到实现的思考流程。",
    },
    {
      label: "个人成长思维导图",
      value:
        "使用 jsMind 生成思维导图\n中心主题: 个人成长\n- 学习规划\n- 职业目标\n- 技能提升\n- 人际关系",
      description: "展示个人成长规划的各个方面。",
    },
    {
      label: "学习计划思维导图",
      value:
        "使用 jsMind 生成思维导图\n中心主题: 学习计划\n- 课程安排\n- 复习计划\n- 考试目标\n- 自我反馈",
      description: "展示制定系统学习计划的流程。",
    },
    {
      label: "市场分析思维导图",
      value:
        "使用 jsMind 生成思维导图\n中心主题: 市场分析\n- 行业趋势\n- 竞争格局\n- 消费者行为\n- SWOT分析",
      description: "展示进行市场分析时需要考虑的多个方面。",
    },
    {
      label: "创业构想思维导图",
      value:
        "使用 jsMind 生成思维导图\n中心主题: 创业构想\n- 商业模式\n- 产品定位\n- 市场需求\n- 风险评估",
      description: "展示创业前期对商业构想的全盘思考。",
    },
    {
      label: "旅行计划思维导图",
      value:
        "使用 jsMind 生成思维导图\n中心主题: 旅行计划\n- 目的地选择\n- 交通安排\n- 住宿预订\n- 行程安排",
      description: "展示制定旅行计划时的各项细节。",
    },
    {
      label: "阅读笔记思维导图",
      value:
        "使用 jsMind 生成思维导图\n中心主题: 阅读笔记\n- 书籍概要\n- 重要观点\n- 启示\n- 应用反思",
      description: "展示阅读笔记的逻辑结构。",
    },
    {
      label: "软件架构思维导图",
      value:
        "使用 jsMind 生成思维导图\n中心主题: 软件架构\n- 分层设计\n- 模块划分\n- 接口定义\n- 技术选型",
      description: "展示软件架构设计中的关键考量。",
    },
    {
      label: "团队建设思维导图",
      value:
        "使用 jsMind 生成思维导图\n中心主题: 团队建设\n- 组织架构\n- 职责分配\n- 沟通机制\n- 激励方案",
      description: "展示团队建设过程中需要协调的各方面。",
    },
    {
      label: "生活目标思维导图",
      value:
        "使用 jsMind 生成思维导图\n中心主题: 生活目标\n- 职业发展\n- 健康管理\n- 家庭生活\n- 兴趣爱好",
      description: "展示个人生活规划与目标设定。",
    },
    {
      label: "投资决策思维导图",
      value:
        "使用 jsMind 生成思维导图\n中心主题: 投资决策\n- 市场分析\n- 风险评估\n- 收益预测\n- 投资组合",
      description: "展示投资决策过程中考虑的主要因素。",
    },
    {
      label: "健康管理思维导图",
      value:
        "使用 jsMind 生成思维导图\n中心主题: 健康管理\n- 饮食规划\n- 锻炼计划\n- 体检记录\n- 心理健康",
      description: "展示个人健康管理的全面规划。",
    },
    {
      label: "客户关系ER图",
      value:
        "使用 PlantUML 生成ER图\n实体: 客户, 订单\n关系: 一个客户可拥有多个订单",
      description: "展示客户与订单之间的实体关系。",
    },
    {
      label: "供应链ER图",
      value:
        "使用 PlantUML 生成ER图\n实体: 供应商, 产品, 仓库\n关系: 供应商供货给仓库，仓库存储产品",
      description: "展示供应链中主要实体之间的关系。",
    },
    {
      label: "员工管理ER图",
      value:
        "使用 PlantUML 生成ER图\n实体: 员工, 部门\n关系: 一个部门包含多个员工",
      description: "描述员工与部门之间的基本关系。",
    },
    {
      label: "学校管理ER图",
      value:
        "使用 PlantUML 生成ER图\n实体: 学生, 教师, 课程\n关系: 学生选修课程，教师授课",
      description: "展示学校管理系统中主要实体的关系。",
    },
    {
      label: "医院管理ER图",
      value:
        "使用 PlantUML 生成ER图\n实体: 病人, 医生, 预约\n关系: 病人与医生通过预约建立联系",
      description: "描述医院管理中病人、医生和预约之间的关系。",
    },
    {
      label: "金融系统ER图",
      value:
        "使用 PlantUML 生成ER图\n实体: 账户, 交易, 客户\n关系: 一个客户可拥有多个账户，账户进行多笔交易",
      description: "展示金融系统中各实体之间的关系。",
    },
    {
      label: "物流管理ER图",
      value:
        "使用 PlantUML 生成ER图\n实体: 订单, 物流, 车辆\n关系: 一个订单对应一个物流记录，物流由车辆配送",
      description: "展示物流管理系统中主要实体的关系。",
    },
    {
      label: "酒店管理ER图",
      value:
        "使用 PlantUML 生成ER图\n实体: 酒店, 房间, 预订\n关系: 酒店拥有多个房间，房间可被预订",
      description: "描述酒店管理系统中房间预订的关系。",
    },
    {
      label: "政府部门ER图",
      value:
        "使用 PlantUML 生成ER图\n实体: 部门, 员工, 项目\n关系: 部门下属多个员工，负责多个项目",
      description: "展示政府部门内部的组织关系。",
    },
    {
      label: "电商系统ER图",
      value:
        "使用 PlantUML 生成ER图\n实体: 用户, 商品, 订单, 评价\n关系: 用户下订单、对商品进行评价",
      description: "展示电商系统中主要实体之间的关系。",
    },
  ],
  show_description: true,
};

function renderPrompts() {
  const fragment = document.createDocumentFragment();
  presetData.prompt_list.forEach((item, index) => {
    const div = document.createElement("div");
    div.setAttribute("node-type", "prompt");
    div.className =
      "rounded-xl border bg-card text-card-foreground shadow group cursor-pointer transition-all duration-300 ease-in-out hover:bg-muted/50";
    div.innerHTML = `
    <div class="flex flex-col space-y-1.5 p-6">
        <div class="flex items-start justify-between">
            <div class="space-y-2">
                <div class="font-semibold tracking-tight text-sm text-muted-foreground">${item.label}</div>
                <p class="text-sm line-clamp-5">${item.description}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right size-4 shrink-0 text-muted-foreground transition-all duration-300 ease-in-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground">
                <path d="M7 7h10v10"></path>
                <path d="M7 17 17 7"></path>
            </svg>
        </div>
    </div>
    `;
    fragment.appendChild(div);
  });
  refs.prompts.innerHTML = "";
  refs.prompts.appendChild(fragment);
}

renderPrompts();

// 点击 refs.prompts 下的 [node-type=prompt]元素时，把 presetData.prompt_list 的数据渲染到 refs.input 元素中,，使用事件委托，而且保证[node-type=prompt] 里面的元素被点击时，也会触发事件

delegator.on(
  refs.prompts,
  "click",
  "[node-type=prompt]",
  function (e, target) {
    var index = Array.from(target.parentNode.children).indexOf(target);
    var prompt = presetData.prompt_list[index];
    refs.input.value = prompt.value;
    checkInput();
    // 顺滑并在固定时间里（200ms）滚动到输入框位置
    refs.input.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });
  },
  false
);

// 判断refs.input是否有内容，如果有内容，refs.submit 移除 disabled 类，否则添加 disabled 类
function checkInput() {
  let value = refs.input.value;
  value = value.trim();
  if (value) {
    enableSubmit();
  } else {
    disableSubmit();
  }
}

function enableSubmit() {
  refs.submit.classList.remove("disabled");
  refs.submit.disabled = false;
}

function disableSubmit() {
  refs.submit.classList.add("disabled");
  refs.submit.disabled = true;
}

function cleanJSStr(str) {
  if (!str) {
    return "";
  }
  // 去掉最前面和最后面的换行符
  let jsStr = str.replace(/^\n+/, "").replace(/\n+$/, "");

  // 匹配```javascript 或 ```js 和其之间的内容
  const reg = /```(javascript|js)[\s\S]*?```/;
  const match = jsStr.match(reg);
  if (match) {
    // 提取第一个匹配的 JavaScript 代码段
    jsStr = match[0].replace(/^```(javascript|js)/, "").replace(/```$/, "");
  } else {
    // 如果没有匹配到代码块，返回空字符串
    jsStr = "";
  }
  // 去掉前后的空格
  jsStr = jsStr.trim();

  jsStr = jsStr.replace(/^\"/, "").replace(/\"$/, "");
  jsStr = jsStr.replace(/^```javascript/, "").replace(/```$/, "");
  jsStr = jsStr.replace(/^```js/, "").replace(/```$/, "");
  jsStr = jsStr.replace(/\\n/g, "\n").replace(/\\\"/g, '"');
  jsStr = jsStr.replace(/`;$/, "");
  jsStr = jsStr.replace(/^\n+/, "").replace(/\n+$/, "");
  // 去掉最后的```
  jsStr = jsStr.replace(/```$/, "");
  jsStr = jsStr.replace(/`;$/, "");
  return jsStr;
}

const getChartJS = async (content, type) => {
  try {
    // const response = await fetch('http://127.0.0.1:3000/chart/gen-js', {
    const response = await fetch(host + "chart/gen-js", {
      method: "POST", // 请求方法
      headers: {
        "Content-Type": "application/json", // 请求体类型为 JSON
      },
      body: JSON.stringify({ content, type }), // 将传递的内容转为 JSON 字符串
    });

    // 解析返回的 JSON 数据
    const data = await response.json();

    if (response.ok) {
      const { type, subType, code } = data.data;
      if (code === "") {
        console.error("Error:", "生成代码失败");
        return null;
      }
      let jsStr = cleanJSStr(code);
      console.log(jsStr);

      return {
        type,
        subType,
        code: jsStr,
      };
    } else {
      console.error("Error:", data.message);

      return null; // 返回 null 表示请求失败
    }
  } catch (error) {
    console.error("Network Error:", error);
    return null;
  }
};

// chart/adjust-js
const getAdjustJS = async (content) => {
  try {
    const response = await fetch(host + "chart/adjust-js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content, code: chatCode }),
    });

    const data = await response.json();

    if (response.ok) {
      const { code } = data.data;
      let jsStr = cleanJSStr(code);
      return {
        code: jsStr,
      };
    }
    console.error("Error:", data.message);
    return null;
  } catch (error) {
    console.error("Network Error:", error);
    return null;
  }
};

// 显示 refs.preview 并给 refs.iframe 注入页面代码
// 监听 子窗口的高度变化，然后调整 iframe 的高度
window.addEventListener(
  "message",
  function (e) {
    if (e.data.height) {
      refs.iframe.style.height = e.data.height + "px";
    }
    if (e.data.error) {
      console.log("iframe error:", e.data.error);
      showError(e.data.error, 3600e3);
    }
    if (e.data.render) {
      console.log("iframe render success");
      
    }

    if (e.data.error || e.data.render) {
      // hidden 类
      refs.buttonWrapper.classList.remove("hidden");
      // 按钮可用
      enableSubmit();
      enableAdjustSubmit();
    }
  },
  false
);

function showIframeLoading() {
  // 去掉 hidden 类
  refs.result.classList.remove("hidden");
  refs.buttonWrapper.classList.add("hidden");
  refs.adjustWrapper.classList.add("hidden");

  // 禁用按钮
  refs.submit.classList.add("disabled");
  refs.submit.disabled = true;
  refs.adjustSubmit.classList.add("disabled");
  refs.adjustSubmit.disabled = true;

  const doc = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ECharts Renderer</title>
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; font-family: "Microsoft YaHei",sans-serif;}
    body { background-color: #fff; }
    #chart { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
    .loading{display:flex;flex-direction:column;justify-content:center;align-items:center;height:100%;color:#64748b;}
    .loading p{margin-top:20px;font-size:14px;font-family:Arial,Helvetica,sans-serif;}
    /* 旋转动画 */
    .loading svg{animation:spin 1s linear infinite;width: 32px;height: 32px;}
    @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
  </style>
</head>
<body>
  <div id="chart">
    <div node-type="loading" class="loading"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader-circle size-8 animate-spin text-muted-foreground"> <path d="M21 12a9 9 0 1 1-6.219-8.56"></path> </svg> <p class="text-sm text-muted-foreground">正在分析...</p> </div>
  </div>
</body>
</html>
    `;
  refs.iframe.srcdoc = doc;
}

const codes = {
  echarts: `
    <script src="/v/js/echarts.min.js"></script>
    `,
  mermaid: `
    <style>.mermaid { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;} .mermaid svg { width: 100%; height: 100%; }</style>
    <script src="/v/js/mermaid.min.js"></script>
    `,
  vega: `
    <script src="/v/js/vega.min.js"></script>
    `,
  cytoscape: `
    <script src="/v/js/cytoscape.min.js"></script>
    <script src="/v/js/layout-base.js"></script>
    <script src="/v/js/cose-base.js"></script>
    <script src="/v/js/cytoscape-fcose.js"></script>
    `,
  jsmind: `
     <link type="text/css" rel="stylesheet" href="/v/css/jsmind.css" />
    <script type="text/javascript" src="/v/js/jsmind.js"></script>
    <script type="text/javascript" src="/v/js/dom-to-image.min.js" ></script>
    <script type="text/javascript" src="/v/js/jsmind.screenshot.js"></script>
    `,
  plantuml: `
    <style>#chart img{margin:0 auto; display:block; max-width: 100%;}</style>
    <script src="/v/js/plantuml-encoder.min.js"></script>
    `,
  d3: `
  <script src="/v/js/d3.v7.min.js"></script>
  `,
};
function showIframe(jsStr, type, subType) {
  chatCode = jsStr;
  chartType = type;
  chartSubType = subType;
  refs.iframe.style.display = "";

  const functions = {
    echarts: `// 使用 ECharts 的 API 下载图片
    function downloadImage() {
      const base64 = chart.getDataURL({ pixelRatio: 2 });
      let name = 'echarts.png';
      if(config && config.title && config.title.text) {
        name = config.title.text + '.png';
      }
      const a = document.createElement('a');
      a.href = base64;
      a.download = name;
      a.click();
    }
    // 让图表随窗口大小自适应，使用定时器，要预防频繁调用 resize 方法
    let timer = null;
    window.addEventListener('resize', () => {
      if (timer) {
        clearTimeout(timer);
      }
      if(chart){
        timer = setTimeout(() => {
          chart.resize();
        }, 800);
      }
      
    });`,
    mermaid: `
    // 使用 Mermaid 的 API 下载图片
function downloadImage() {
  const svg = document.querySelector('.mermaid svg');
  const base64 = 'data:image/svg+xml;base64,' + window.btoa(svg.outerHTML);
  const a = document.createElement('a');
  a.href = base64;
  a.download = 'mermaid.svg';
  a.click();
}
// 让图表随窗口大小自适应，使用定时器，要预防频繁调用 resize 方法
let timer = null;
window.addEventListener('resize', () => {
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    mermaid.init(undefined, document.querySelectorAll('.mermaid'));
  }, 800);
});
        `,
    vega: `
// 使用 Vega 的 API 下载图片
    function downloadImage() {
      const canvas = document.querySelector('canvas');
      const base64 = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = base64;
      a.download = 'vega.png';
      a.click();
    }
        `,
    cytoscape: `
// 使用 Cytoscape 的 API 下载图片
    function downloadImage() {
      const base64 = cy.png();
      const a = document.createElement('a');
      a.href = base64;
      a.download = 'cytoscape.png';
      a.click();
    }
    // 让图表随窗口大小自适应，使用定时器，要预防频繁调用 resize 方法
    let timer = null;
    window.addEventListener('resize', () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        cy.resize();
        cy.fit();
      }, 800);
    });
        `,
    jsmind: `
        function downloadImage() {
        jm.shoot();
    }

    let timer = null;
    window.addEventListener('resize', () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        jm.resize();
      }, 800);
    });
        `,
    plantuml: `
        function downloadImage() {
          const a = document.createElement('a');
          a.href = plantUMLUrl;
          a.download = 'plantuml.png';
          a.click();
        }
        `,
    d3: `
  function downloadImage() {
  const svgNode = document.querySelector('svg');
  
  // 获取 SVG 的宽度和高度
  const svgWidth = svgNode.clientWidth;
  const svgHeight = svgNode.clientHeight;

  // 将 SVG 序列化为字符串
  const svgData = new XMLSerializer().serializeToString(svgNode);

  // 创建 canvas 元素
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // 设置 canvas 大小与 SVG 匹配
  canvas.width = svgWidth;
  canvas.height = svgHeight;

  const img = new Image();
  img.onload = function() {
    // 当图片加载完成后，绘制到 canvas 上
    ctx.drawImage(img, 0, 0);

    // 获取图片的 base64 数据
    const base64 = canvas.toDataURL('image/png');

    // 创建一个下载链接并触发点击下载
    const a = document.createElement('a');
    a.href = base64;
    a.download = 'd3.png';
    a.click();
  };

  // 将 SVG 转换为图片
  img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgData)));
}`,
  };

  const doc = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ECharts Renderer</title>
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
    body { background-color: #fff; }
    #chart { width: 100%; min-height: 100%; display: flex; justify-content: center; align-items: center; }
    .loading{display:flex;flex-direction:column;justify-content:center;align-items:center;height:100%;color:#64748b;}
    .loading p{margin-top:20px;font-size:14px;font-family:Arial,Helvetica,sans-serif;}
    /* 旋转动画 */
    .loading svg{animation:spin 1s linear infinite;width: 32px;height: 32px;}
    @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
  </style>
</head>
<body>
  <div id="chart">
    <div node-type="loading" class="loading"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader-circle size-8 animate-spin text-muted-foreground"> <path d="M21 12a9 9 0 1 1-6.219-8.56"></path> </svg> <p class="text-sm text-muted-foreground">正在渲染...</p> </div>
  </div>
  ${codes[type] ? codes[type] : ""}
  <script>
  try {
      setTimeout(() => {
        const chartNode = document.getElementById('chart');
      document.getElementById('chart').innerHTML = '';
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          entry.target.style.height = height + 'px';
          window.parent.postMessage({ height:height }, '*');
        }
      });
      resizeObserver.observe(chartNode);

      // 退出全屏后，重新计算高度
      function isFullscreen() {
        return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      }
      
      window.addEventListener('resize', function () {
          if (!isFullscreen()) {
              const height = 600;
              chartNode.style.height = height + 'px';
              window.parent.postMessage({ height: height }, '*');
          }
      });
      

      
      ${jsStr}
      
      ${functions[type] ? functions[type] : ""}

      // 提醒渲染完成
      window.parent.postMessage({ render: true }, '*');

      window.addEventListener('message', function (e) {
          console.log('iframe message:', e.data);
          if (e.data === 'download') {
              downloadImage();
          }
      }, false);
      }, 100);
  } catch (error) {
      window.parent.postMessage({ error: '图表渲染失败：'+ error.message }, '*');
  }

  </script>
</body>
</html>
    `;
  refs.iframe.srcdoc = doc;

  shareHTML = doc;
}

function hideIframe() {
  refs.result.classList.remove("hidden");
  refs.iframe.style.display = "none";
}

refs.input.addEventListener(
  "input",
  function (e) {
    // class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
    // 有内容 class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
    checkInput();
  },
  false
);

refs.input.addEventListener(
  "change",
  function (e) {
    checkInput();
  },
  false
);

refs.input.addEventListener(
  "focus",
  function (e) {
    refs.input.classList.add("focus");
  },
  false
);

refs.submit.addEventListener(
  "click",
  function (e) {
    if (refs.submit.disabled) {
      return;
    }

    showIframeLoading();
    // refs.iframe.style.display = 'none';

    const content = refs.input.value;
    // const type = refs.chartType.value;
    // const type = 'echarts';
    // const type = 'mermaid';
    // const type = 'vega';
    const type = "";
    getChartJS(content, type).then((res) => {
      if (res) {
        if (res.code) {
          showIframe(res.code, res.type, res.subType);
        } else {
          console.error("getChartJS error", res);
          showError("生成代码失败");
          // 恢复按钮
          enableSubmit();
          hideIframe();
        }
        showIframe(res.code, res.type, res.subType);
      } else {
        console.error("getChartJS error");
        showError("生成代码失败");
        // 恢复按钮
        enableSubmit();
        hideIframe();
      }
    });
  },
  false
);

function checkAdjustInput() {
  let value = refs.adjustInput.value;
  value = value.trim();
  if (value) {
    enableAdjustSubmit();
  } else {
    disableAdjustSubmit();
  }
}

function enableAdjustSubmit() {
  refs.adjustSubmit.classList.remove("disabled");
  refs.adjustSubmit.disabled = false;
}

function disableAdjustSubmit() {
  refs.adjustSubmit.classList.add("disabled");
  refs.adjustSubmit.disabled = true;
}

refs.adjustInput.addEventListener(
  "input",
  function (e) {
    checkAdjustInput();
  },
  false
);

refs.adjustInput.addEventListener(
  "change",
  function (e) {
    checkAdjustInput();
  },
  false
);

refs.adjustInput.addEventListener(
  "focus",
  function (e) {
    refs.adjustInput.classList.add("focus");
  },
  false
);

refs.adjustButton.addEventListener(
  "click",
  function (e) {
    refs.adjustWrapper.classList.toggle("hidden");
  },
  false
);

// 微调输入框 refs.adjustInput, 微调按钮 refs.adjustSubmit
// 返回的代码展示图表后，用户觉得需要细调一下，可以通过 refs.adjustInput 输入微调需求，然后点击 refs.adjustSubmit 按钮，将接口返回的微调的代码注入到 iframe 中，重新渲染图表
refs.adjustSubmit.addEventListener(
  "click",
  function (e) {
    showIframeLoading();
    const content = refs.adjustInput.value;
    getAdjustJS(content).then((res) => {
      if (res) {
        if (res.code) {
          showIframe(res.code, chartType, chartSubType);
        } else {
          console.error("getAdjustJS error", res);
          showError("生成代码失败");
          // 恢复按钮
          enableAdjustSubmit();
          hideIframe();
        }
      } else {
        console.error("getAdjustJS error");
        showError("生成代码失败");
        // 恢复按钮
        enableAdjustSubmit();
        hideIframe();
      }
    });
  },
  false
);

// refs.buttonWrapper 下有以下几个按钮，node-type 分别为，给它们委派事件
// shareToCodePen
// shareToCodeSandbox
// downloadCode
// captureScreenshot

// 为按钮添加事件委派
delegator.on(
  refs.buttonWrapper,
  "click",
  "[node-type]",
  function (e, target) {
    const nodeType = target.getAttribute("node-type");
    switch (nodeType) {
      case "shareToCodePen":
        shareToCodePen(shareHTML);
        break;
      case "shareToCodeSandbox":
        shareToCodeSandbox(shareHTML);
        break;
      case "downloadCode":
        downloadCode(shareHTML);
        break;
      case "captureScreenshot":
        captureScreenshot();
        break;
      case "fullscreen":
        // 让 iframe 节点 全屏
        refs.iframe.requestFullscreen();
        break;
      default:
        console.warn("未处理的按钮事件:", nodeType);
    }
  }
);

// 将代码分享到 CodePen
function shareToCodePen(html) {
  const data = {
    title: "智绘 示例",
    html: html,
    editors: "1",
  };
  const form = document.createElement("form");
  form.action = "https://codepen.io/pen/define";
  form.method = "POST";
  form.target = "_blank";
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "data";
  input.value = JSON.stringify(data);
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

/**
 * 将 HTML 内容分享至 CodeSandbox
 * @param {string} html - 要分享的 HTML 内容
 */
function shareToCodeSandbox(html) {
  // Create parameters for CodeSandbox API
  const parameters = getParameters({
    files: {
      "index.html": {
        content: html,
      },
    },
  });

  // Create a dynamic form to send the data to CodeSandbox
  const form = document.createElement("form");
  form.action = "https://codesandbox.io/api/v1/sandboxes/define";
  form.method = "POST";
  form.target = "_blank";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "parameters";
  input.value = parameters;

  form.appendChild(input);
  document.body.appendChild(form);

  // Submit the form and clean up
  form.submit();
  document.body.removeChild(form);
}

// 下载代码为文件
function downloadCode(html) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = ".html";
  a.click();
  URL.revokeObjectURL(url);
}

// 捕获当前图表的截图
function captureScreenshot() {
  refs.iframe.contentWindow.postMessage("download", "*");
}
