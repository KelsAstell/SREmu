// 星穹铁道抽卡模拟器类型定义

// 稀有度
export enum Rarity {
  THREE = 3,
  FOUR = 4,
  FIVE = 5
}

// 跃迁类型
export enum WarpType {
  STANDARD = 'standard',     // 群星跃迁（常驻池）
  CHARACTER = 'character',   // 角色活动跃迁
  LIGHT_CONE = 'light_cone'  // 光锥活动跃迁
}

// 物品类型
export enum ItemType {
  CHARACTER = 'character',
  LIGHT_CONE = 'light_cone'
}

// 抽卡结果
export interface WarpResult {
  rarity: Rarity;
  itemType: ItemType;
  name: string;
  isUp: boolean;  // 是否是UP物品
  isGuaranteed: boolean;  // 是否触发保底
}

// 跃迁状态
export interface WarpState {
  totalPulls: number;
  fiveStarPity: number;  // 五星保底计数
  fourStarPity: number;  // 四星保底计数
  fiveStarGuaranteed: boolean;  // 五星大保底
  fourStarGuaranteed: boolean;  // 四星大保底
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  upFiveStarCount: number;
  upFourStarCount: number;
  lostFiftyFiftyCount: number;  // 歪的次数
}

// 初始保底进度（用于垫池子）
export interface InitialPityState {
  fiveStarPity: number;
  fourStarPity: number;
  fiveStarGuaranteed: boolean;
  fourStarGuaranteed: boolean;
}

// 跃迁配置
export interface WarpConfig {
  type: WarpType;
  fiveStarPityLimit: number;  // 五星保底上限
  fourStarPityLimit: number;  // 四星保底上限（都是10）
  fiveStarRate: number;  // 五星基础概率
  fourStarRate: number;  // 四星基础概率
  fiveStarUpRate: number;  // 五星UP概率（小保底）
  fourStarUpRate: number;  // 四星UP概率（小保底）
}

// 跃迁配置常量
export const WARP_CONFIGS: Record<WarpType, WarpConfig> = {
  [WarpType.STANDARD]: {
    type: WarpType.STANDARD,
    fiveStarPityLimit: 90,
    fourStarPityLimit: 10,
    fiveStarRate: 0.006,
    fourStarRate: 0.051,
    fiveStarUpRate: 0,  // 常驻池没有UP
    fourStarUpRate: 0
  },
  [WarpType.CHARACTER]: {
    type: WarpType.CHARACTER,
    fiveStarPityLimit: 90,
    fourStarPityLimit: 10,
    fiveStarRate: 0.006,
    fourStarRate: 0.051,
    fiveStarUpRate: 0.5,  // 50%小保底
    fourStarUpRate: 0.5   // 50%小保底
  },
  [WarpType.LIGHT_CONE]: {
    type: WarpType.LIGHT_CONE,
    fiveStarPityLimit: 80,
    fourStarPityLimit: 10,
    fiveStarRate: 0.008,
    fourStarRate: 0.066,
    fiveStarUpRate: 0.75,  // 75%小保底
    fourStarUpRate: 0.75   // 75%小保底
  }
};

// 分布数据项
export interface DistributionItem {
  value: number;  // 数值（如UP五星数量、保底抽数等）
  count: number;  // 出现次数
  percentage: number;  // 占比(%)
}

// 单次模拟结果
export interface SingleSimulationResult {
  upFiveStarCount: number;  // UP五星数量
  fiveStarCount: number;  // 五星总数
  fourStarCount: number;  // 四星总数
  lostFiftyFiftyCount: number;  // 歪的次数
  totalPulls: number;  // 总抽数
  actualPullsUsed: number;  // 实际消耗的抽数（考虑四星返抽）
}

// 批量模拟统计
export interface BatchSimulationStats {
  simulationCount: number;  // 模拟次数
  pullCountPerSim: number;  // 每次模拟的抽卡数
  
  // UP五星数量分布（主要直方图）
  upFiveStarDistribution: DistributionItem[];
  
  // 五星数量分布
  fiveStarDistribution: DistributionItem[];
  
  // 四星数量分布
  fourStarDistribution: DistributionItem[];
  
  // 歪的次数分布（限定池）
  lostFiftyFiftyDistribution: DistributionItem[];
  
  // 统计摘要
  avgUpFiveStar: number;  // 平均UP五星数
  avgFiveStar: number;  // 平均五星数
  avgFourStar: number;  // 平均四星数
  avgActualPullsUsed: number;  // 平均实际消耗抽数（考虑四星返抽）
  
  // 概率数据
  probAtLeast1Up: number;  // 至少1个UP五星的概率
  probAtLeast2Up: number;  // 至少2个UP五星的概率
  probAtLeast3Up: number;  // 至少3个UP五星的概率
}

// 模拟结果统计
export interface SimulationStats {
  totalPulls: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  upFiveStarCount: number;
  upFourStarCount: number;
  lostFiftyFiftyCount: number;
  averageFiveStarPity: number;
  results: WarpResult[];
  batchStats?: BatchSimulationStats;  // 批量模拟统计
}

// 初始保底进度
export interface InitialPityProgress {
  characterPity: number;      // 角色池当前保底计数 (0-89)
  characterGuaranteed: boolean; // 角色池是否大保底
  lightConePity: number;      // 光锥池当前保底计数 (0-79)
  lightConeGuaranteed: boolean; // 光锥池是否大保底
}

// 策略计算输入参数
export interface StrategyInput {
  totalPulls: number;        // 总抽数
  targetCharacters: number;  // 目标UP角色数
  targetLightCones: number;  // 目标UP光锥数
  enableFourStarBonus?: boolean; // 是否启用四星返抽
  initialPity?: InitialPityProgress; // 初始保底进度（垫池子）
}

// 策略分配方案
export interface StrategyAllocation {
  characterPulls: number;    // 分配给角色池的抽数
  lightConePulls: number;    // 分配给光锥池的抽数
}

// 单次策略模拟结果
export interface StrategySimulationResult {
  success: boolean;          // 是否达成目标
  charactersObtained: number; // 实际获得角色数
  lightConesObtained: number; // 实际获得光锥数
  characterPullsUsed: number; // 角色池实际消耗抽数
  lightConePullsUsed: number; // 光锥池实际消耗抽数
}

// 策略计算结果
export interface StrategyResult {
  allocation: StrategyAllocation;  // 分配方案
  successRate: number;             // 成功率(%)
  expectedCharacters: number;      // 期望获得角色数
  expectedLightCones: number;      // 期望获得光锥数
  simulationCount: number;         // 模拟次数
  // 置信区间 (95%)
  confidenceInterval: {
    lower: number;   // 下限
    upper: number;   // 上限
  };
}

// 最佳策略分析结果
export interface BestStrategyAnalysis {
  input: StrategyInput;
  bestStrategy: StrategyResult | null;
  allStrategies: StrategyResult[];
}
