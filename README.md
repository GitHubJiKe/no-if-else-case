# 大量 if else 业务场景下 去 if else 的探索

## case 元素

```typescript
type CaseType = "A" | "B" | "N" | "";
```

## 常规操作

```typescript
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
```

## switch 替换

```typescript
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
```

## 复杂场景

```typescript
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
```

以上的案例可以看出，当 case 数量有限的时候，代码量还是可控的，再加上如果每个 case 的逻辑不是很复杂，直白的写下去还是很容易理解的。

但是当 case 真的很多，逻辑处理真的比较复杂的时候，那么在这样平铺直叙的写下去，一是代码量会急剧增加，阅读困难，而且一旦有逻辑变更，就要更改整个函数体内的代码。

有改动就有风险，为了降低改动带来的风险，我们可以采用策略模式（Strategy Pattern）解决问题。

## 策略模式

### 初代

```typescript
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

function handleType2(type: CaseType) {
  const caseFunc = typeCaseMap[type];

  if (!caseFunc) {
    throw new Error("param type is not valid");
  }

  caseFunc();
}
```

策略模式下的处理，代码量减少了，更改迁移到了 typeCaseMap 里的每一个对应的函数。

但是这种方式有他的局限性，那就是当判断条件复杂度高的时候，就不太好实施了。

试想一下，假如你的入参不是 type，而是数组 types，那么该怎么处理 caseMap 呢？

### 插件思维

> 插件化解决大量 if else case 的思路 总体说还是策略模式。把每一个 case 抽象为一个独立的插件，插件分为目标类型（targetTypes），执行条件（condition）和执行的行为（action）三部分。
> 既然存在插件，那就存在使用插件的宿主 PluginController，本质上就是一个 Map 对象存储某个场景下需要 use 的所有插件集合，然后在具体的业务场景下调用 run 某个目标类型的 case 即可。

#### 好处在于

1. 业务逻辑的隔离
2. 代码层面的隔离
3. 逻辑的高内聚和与调用端的解耦
4. 减少了改动带来的错误风险（每个业务case 变化，只需要修改 case 对应的 plugin 即可，不会影响其他地方的代码）
5. 易扩展 添加 case 写心得 plugin 就行了，在需要的地方 use 即可

#### 坏处在于：

1. 抽象带来的理解困难
2. 代码拆到各处 难以一眼观全局
3. 阅读代码需要反复跳转才能读懂业务逻辑，对于新人介入不够友好

一下是代码模拟实现：

```typescript
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
```

以上代码仅代表思路的展示和场景的模拟，具体情况还是要根据具体业务具体对待。
