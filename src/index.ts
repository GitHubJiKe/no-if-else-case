type CaseType = "A" | "B" | "N" | "";

/**
 * 通过if else 解决大量的case
 * @param {*} type
 */
function handleType(type: CaseType) {
  if (type === "") {
    throw new Error("param type is not valid");
  }

  if (type === "A") {
    // 处理A的逻辑
    confirm("I am A case");
    return;
  }

  if (type === "B") {
    // 处理B的逻辑
    confirm("I am B case");
    return;
  }

  // ......

  if (type === "N") {
    // 处理N的逻辑
    confirm("I am N case");
    return;
  }
}

/**
 * 使用switch 解决大量的 case 写法
 * @param {*} type
 */
function handleTypeBySwitch(type: CaseType) {
  if (type === "") {
    throw new Error("param type is not valid");
  }

  switch (type) {
    case "A":
      // 处理A的逻辑
      confirm("I am A case");
      break;
    case "B":
      // 处理B的逻辑
      confirm("I am B case");
      break;
    // case "xxx":
    //   break;
    case "N":
      // 处理B的逻辑
      confirm("I am N case");
      break;

    default:
      console.warn("type is not handled");
      break;
  }
}

/**
 * 复杂一些的场景
 * @param {*} types
 */
function complicatedHandle(types: CaseType[]) {
  if (types.includes("A")) {
    // 处理A的逻辑
    return;
  }

  if (!!types.filter((v) => (["B", "C"] as CaseType[]).includes(v)).length) {
    // 处理 B or C的逻辑
    return;
  }
  // ......  无数个case写下去
}

// 以上的案例可以看出，当case数量有限的时候，代码量还是可控的，再加上如果每个case的逻辑不是很复杂，直白的写下去还是很容易理解的
// 但是当case 真的很多，逻辑处理真的比较复杂的时候，那么在这样平铺直叙的写下去，一是代码量会急剧增加，阅读困难，而且一旦有逻辑变更，就要更改整个函数体内的代码
// 有改动就有风险，为了降低改动带来的风险，我们可以采用策略模式（Strategy Pattern）解决问题

const typeCaseMap: Record<Exclude<CaseType, "">, Function> = {
  A: function (params) {
    // 处理A相关逻辑
  },
  B: function (params) {
    // 处理B相关逻辑
  },
  // ...
  N: function (params) {
    // 处理N的逻辑
  },
};

/**
 * 策略模式下的处理 代码量减少了 更改迁移到了typeCaseMap里的每一个对应的函数
 * 但是这种方式有他的局限性  那就是当判断条件复杂度高的时候，就不太好实施了
 * 试想一下，假如你的入参不是type，而是数组types，那么该怎么处理caseMap呢，事情就没那么简单了
 * @param {*} type
 */
function handleType2(type: CaseType) {
  const caseFunc = typeCaseMap[type];

  if (!caseFunc) {
    throw new Error("param type is not valid");
  }

  caseFunc();
}

// 插件化处理case

interface CasePlugin {
  condition: (params: unknown) => boolean;
  action: (params: unknown) => void;
  targetTypes: CaseType | CaseType[];
}

// 定义case plugin

const casePluginA: CasePlugin = {
  condition: (type: CaseType) => casePluginA.targetTypes === type,
  action: (params) => confirm("I am A case"),
  targetTypes: "A",
};

const casePluginBOrC: CasePlugin = {
  condition: (types: CaseType[]) =>
    !!types.filter((v) => casePluginBOrC.targetTypes.includes(v)).length,

  action: (params) => confirm("I am B Or C case"),
  targetTypes: ["B", "C"] as CaseType[],
};

const casePluginN: CasePlugin = {
  condition: (type: CaseType) => casePluginN.targetTypes === type,
  action: (params) => confirm("I am N case"),
  targetTypes: "N",
};

class PluginController {
  private readonly pluginMap = new Map();

  use(plugin: CasePlugin) {
    this.pluginMap.set(plugin.targetTypes, plugin);
  }

  installPlugins(plugins: CasePlugin[]) {
    plugins.forEach((p) => this.use(p));
  }

  run(types: CaseType | CaseType[], params?: unknown) {
    const plugin = this.pluginMap.get(types) as CasePlugin;
    if (plugin) {
      if (plugin.condition(types)) {
        plugin.action(params);
      }
    } else {
      throw new Error("types not exist in plugin map");
    }
  }

  unuse(types: CaseType[]) {
    this.pluginMap.delete(types);
  }

  clearPlugins() {
    this.pluginMap.clear();
  }
}

const pluginController = new PluginController();

function Demo() {
  pluginController.installPlugins([casePluginA, casePluginBOrC, casePluginN]);

  const handleClick = (types: CaseType | CaseType[]) => {
    pluginController.run(types);
  };

  handleClick("A");

  handleClick("B");

  handleClick(["B", "C"] as CaseType[]);

  handleClick("N");

  // 卸载是调用：

  pluginController.clearPlugins();
}
