import { ref, computed } from 'vue';
import {
  type WarpResult,
  type WarpState,
  type WarpConfig,
  type SimulationStats,
  type BatchSimulationStats,
  type DistributionItem,
  type SingleSimulationResult,
  type InitialPityState,
  type InitialPityProgress,
  Rarity,
  WarpType,
  ItemType,
  WARP_CONFIGS
} from '@/types/warp';

// 常驻池五星角色
const STANDARD_FIVE_STAR_CHARACTERS = [
  '姬子', '瓦尔特', '布洛妮娅', '杰帕德', '克拉拉', '彦卿', '白露'
];

// 常驻池五星光锥
const STANDARD_FIVE_STAR_LIGHT_CONES = [
  '银河铁道之夜', '以世界之名', '但战斗还未结束', '制胜的瞬间',
  '无可取代的东西', '如泥酣眠', '时节不居'
];

// 常驻池四星角色
const STANDARD_FOUR_STAR_CHARACTERS = [
  '黑塔', '三月七', '丹恒', '娜塔莎', '希露瓦', '佩拉', '艾丝妲',
  '桑博', '虎克', '青雀', '停云', '素裳', '阿兰', '驭空', '玲可', '卢卡', '桂乃芬'
];

// 常驻池四星光锥
const STANDARD_FOUR_STAR_LIGHT_CONES = [
  '记一位星神的陨落', '星海巡航', '记忆的质料', '余生的第一天',
  '此时恰好', '唯有沉默', '与行星相会', '舞！舞！舞！', '朗道的选择',
  '汪！散步时间！', '睡颜', '一场术后对话', '猎物的视线',
  '秘密誓心', '别让世界静下来', '延长记号', '我们是地火', '春水初生',
  '过往未来', '鼹鼠党欢迎你', '决心如汗珠般闪耀', '晚安与睡颜',
  '同一种心情', '点个关注吧！', '宇宙市场趋势', '这就是我啦！',
  '重返幽冥', '她已闭上双眼', '此时恰好', '何物为真', '最后的赢家',
  '在火的远处', '织造命运之线', '两个人的演唱会'
];

// 三星光锥
const THREE_STAR_LIGHT_CONES = [
  '物穰', '天倾', '幽邃', '齐颂', '睿见', '开疆', '琥珀', '戍御',
  '渊环', '轮契', '相抗', '俱殁', '灵感', '调和', '俱殁', '嘉果',
  '乐圮', '离弦', '匿影', '锋镝', '延 ancient', '难舍梦乡', '戍御',
  '睿见', '开疆', '琥珀'
];

// 角色UP池五星UP角色（示例）
const CHARACTER_UP_FIVE_STAR = '当期UP五星角色';

// 角色UP池四星UP角色（示例，每次有3个）
const CHARACTER_UP_FOUR_STARS = ['UP四星角色1', 'UP四星角色2', 'UP四星角色3'];

// 光锥UP池五星UP光锥（示例）
const LIGHT_CONE_UP_FIVE_STAR = '当期UP五星光锥';

// 光锥UP池四星UP光锥（示例，每次有3个）
const LIGHT_CONE_UP_FOUR_STARS = ['UP四星光锥1', 'UP四星光锥2', 'UP四星光锥3'];

export function useWarpSimulator(warpType: WarpType) {
  const config = WARP_CONFIGS[warpType];
  
  // 跃迁状态
  const state = ref<WarpState>({
    totalPulls: 0,
    fiveStarPity: 0,
    fourStarPity: 0,
    fiveStarGuaranteed: false,
    fourStarGuaranteed: false,
    fiveStarCount: 0,
    fourStarCount: 0,
    threeStarCount: 0,
    upFiveStarCount: 0,
    upFourStarCount: 0,
    lostFiftyFiftyCount: 0
  });

  // 历史记录（用于计算平均保底）
  const fiveStarPities = ref<number[]>([]);
  const currentFiveStarPity = ref(0);

  // 重置状态
  const resetState = () => {
    state.value = {
      totalPulls: 0,
      fiveStarPity: 0,
      fourStarPity: 0,
      fiveStarGuaranteed: false,
      fourStarGuaranteed: false,
      fiveStarCount: 0,
      fourStarCount: 0,
      threeStarCount: 0,
      upFiveStarCount: 0,
      upFourStarCount: 0,
      lostFiftyFiftyCount: 0
    };
    fiveStarPities.value = [];
    currentFiveStarPity.value = 0;
  };

  // 设置初始保底进度（垫池子）
  const setInitialPity = (initialPity: InitialPityState) => {
    state.value.fiveStarPity = initialPity.fiveStarPity;
    state.value.fourStarPity = initialPity.fourStarPity;
    state.value.fiveStarGuaranteed = initialPity.fiveStarGuaranteed;
    state.value.fourStarGuaranteed = initialPity.fourStarGuaranteed;
  };

  // 获取随机元素
  const getRandomElement = <T>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)]!;
  };

  // 判断是否获得五星
  const rollFiveStar = (pity: number, config: WarpConfig): boolean => {
    // 保底必出
    if (pity >= config.fiveStarPityLimit - 1) return true;
    
    // 基础概率 + 软保底（73抽后概率提升）
    let rate = config.fiveStarRate;
    if (pity >= 73) {
      rate += (pity - 72) * 0.06;  // 每抽增加6%
    }
    
    return Math.random() < rate;
  };

  // 判断是否获得四星
  const rollFourStar = (pity: number, config: WarpConfig): boolean => {
    // 保底必出
    if (pity >= config.fourStarPityLimit - 1) return true;
    
    // 基础概率 + 软保底（9抽后概率提升）
    let rate = config.fourStarRate;
    if (pity >= 9) {
      rate += (pity - 8) * 0.05;
    }
    
    return Math.random() < rate;
  };

  // 单次抽卡
  const singlePull = (): WarpResult => {
    state.value.totalPulls++;
    state.value.fiveStarPity++;
    state.value.fourStarPity++;
    currentFiveStarPity.value++;

    const isFiveStar = rollFiveStar(state.value.fiveStarPity, config);
    
    if (isFiveStar) {
      // 出五星
      fiveStarPities.value.push(currentFiveStarPity.value);
      currentFiveStarPity.value = 0;
      
      state.value.fiveStarCount++;
      state.value.fiveStarPity = 0;
      state.value.fourStarPity = 0;
      
      let isUp = false;
      let name = '';
      
      if (warpType === WarpType.STANDARD) {
        // 常驻池：角色和光锥各50%
        const isCharacter = Math.random() < 0.5;
        name = isCharacter 
          ? getRandomElement(STANDARD_FIVE_STAR_CHARACTERS)
          : getRandomElement(STANDARD_FIVE_STAR_LIGHT_CONES);
        return {
          rarity: Rarity.FIVE,
          itemType: isCharacter ? ItemType.CHARACTER : ItemType.LIGHT_CONE,
          name,
          isUp: false,
          isGuaranteed: false
        };
      } else {
        // 限定池
        if (state.value.fiveStarGuaranteed) {
          // 大保底
          isUp = true;
          state.value.fiveStarGuaranteed = false;
        } else {
          // 小保底
          isUp = Math.random() < config.fiveStarUpRate;
          if (!isUp) {
            state.value.fiveStarGuaranteed = true;
            state.value.lostFiftyFiftyCount++;
          }
        }
        
        if (isUp) {
          state.value.upFiveStarCount++;
          name = warpType === WarpType.CHARACTER 
            ? CHARACTER_UP_FIVE_STAR 
            : LIGHT_CONE_UP_FIVE_STAR;
          return {
            rarity: Rarity.FIVE,
            itemType: warpType === WarpType.CHARACTER ? ItemType.CHARACTER : ItemType.LIGHT_CONE,
            name,
            isUp: true,
            isGuaranteed: state.value.fiveStarGuaranteed === false
          };
        } else {
          // 歪了 - 从常驻池随机
          if (warpType === WarpType.CHARACTER) {
            name = getRandomElement(STANDARD_FIVE_STAR_CHARACTERS);
            return {
              rarity: Rarity.FIVE,
              itemType: ItemType.CHARACTER,
              name,
              isUp: false,
              isGuaranteed: false
            };
          } else {
            name = getRandomElement(STANDARD_FIVE_STAR_LIGHT_CONES);
            return {
              rarity: Rarity.FIVE,
              itemType: ItemType.LIGHT_CONE,
              name,
              isUp: false,
              isGuaranteed: false
            };
          }
        }
      }
    }

    const isFourStar = rollFourStar(state.value.fourStarPity, config);
    
    if (isFourStar) {
      // 出四星
      state.value.fourStarCount++;
      state.value.fourStarPity = 0;
      
      let isUp = false;
      let name = '';
      
      if (warpType === WarpType.STANDARD) {
        // 常驻池：角色和光锥各50%
        const isCharacter = Math.random() < 0.5;
        name = isCharacter
          ? getRandomElement(STANDARD_FOUR_STAR_CHARACTERS)
          : getRandomElement(STANDARD_FOUR_STAR_LIGHT_CONES);
        return {
          rarity: Rarity.FOUR,
          itemType: isCharacter ? ItemType.CHARACTER : ItemType.LIGHT_CONE,
          name,
          isUp: false,
          isGuaranteed: false
        };
      } else {
        // 限定池
        if (state.value.fourStarGuaranteed) {
          // 大保底
          isUp = true;
          state.value.fourStarGuaranteed = false;
        } else {
          // 小保底
          isUp = Math.random() < config.fourStarUpRate;
          if (!isUp) {
            state.value.fourStarGuaranteed = true;
          }
        }
        
        if (isUp) {
          state.value.upFourStarCount++;
          name = getRandomElement(warpType === WarpType.CHARACTER 
            ? CHARACTER_UP_FOUR_STARS 
            : LIGHT_CONE_UP_FOUR_STARS);
          return {
            rarity: Rarity.FOUR,
            itemType: warpType === WarpType.CHARACTER ? ItemType.CHARACTER : ItemType.LIGHT_CONE,
            name,
            isUp: true,
            isGuaranteed: state.value.fourStarGuaranteed === false
          };
        } else {
          // 歪了 - 从常驻池随机（角色UP池四星角色不出黑塔，光锥池可以出所有）
          if (warpType === WarpType.CHARACTER) {
            // 角色池：50%角色，50%光锥，但角色中排除黑塔
            const isCharacter = Math.random() < 0.5;
            if (isCharacter) {
              // 从常驻四星角色中随机（不包括黑塔）
              const nonHertaCharacters = STANDARD_FOUR_STAR_CHARACTERS.filter(c => c !== '黑塔');
              name = getRandomElement(nonHertaCharacters);
              return {
                rarity: Rarity.FOUR,
                itemType: ItemType.CHARACTER,
                name,
                isUp: false,
                isGuaranteed: false
              };
            } else {
              name = getRandomElement(STANDARD_FOUR_STAR_LIGHT_CONES);
              return {
                rarity: Rarity.FOUR,
                itemType: ItemType.LIGHT_CONE,
                name,
                isUp: false,
                isGuaranteed: false
              };
            }
          } else {
            // 光锥池：50%光锥，50%角色
            const isLightCone = Math.random() < 0.5;
            if (isLightCone) {
              name = getRandomElement(STANDARD_FOUR_STAR_LIGHT_CONES);
              return {
                rarity: Rarity.FOUR,
                itemType: ItemType.LIGHT_CONE,
                name,
                isUp: false,
                isGuaranteed: false
              };
            } else {
              // 可以出黑塔
              name = getRandomElement(STANDARD_FOUR_STAR_CHARACTERS);
              return {
                rarity: Rarity.FOUR,
                itemType: ItemType.CHARACTER,
                name,
                isUp: false,
                isGuaranteed: false
              };
            }
          }
        }
      }
    }

    // 三星
    state.value.threeStarCount++;
    return {
      rarity: Rarity.THREE,
      itemType: ItemType.LIGHT_CONE,
      name: getRandomElement(THREE_STAR_LIGHT_CONES),
      isUp: false,
      isGuaranteed: false
    };
  };

  // 多次抽卡
  const multiPull = (count: number): WarpResult[] => {
    const results: WarpResult[] = [];
    for (let i = 0; i < count; i++) {
      results.push(singlePull());
    }
    return results;
  };

  // 获取统计信息
  const getStats = (): SimulationStats => {
    const avgPity = fiveStarPities.value.length > 0
      ? fiveStarPities.value.reduce((a, b) => a + b, 0) / fiveStarPities.value.length
      : 0;
    
    return {
      totalPulls: state.value.totalPulls,
      fiveStarCount: state.value.fiveStarCount,
      fourStarCount: state.value.fourStarCount,
      threeStarCount: state.value.threeStarCount,
      upFiveStarCount: state.value.upFiveStarCount,
      upFourStarCount: state.value.upFourStarCount,
      lostFiftyFiftyCount: state.value.lostFiftyFiftyCount,
      averageFiveStarPity: Math.round(avgPity * 100) / 100,
      results: []
    };
  };

  return {
    state,
    config,
    singlePull,
    multiPull,
    resetState,
    setInitialPity,
    getStats
  };
}

// 批量模拟：运行多次模拟，统计UP五星数量等分布
export function useBatchSimulation(warpType: WarpType) {
  const config = WARP_CONFIGS[warpType];
  
  // 运行单次模拟（抽取指定次数，统计结果）
  // enableFourStarBonus: 是否启用四星返抽（每抽到1个四星额外获得1抽）
  // initialPity: 初始保底进度（垫池子）
  const runSingleSimulation = (
    pullCount: number, 
    enableFourStarBonus: boolean = false,
    initialPity?: InitialPityState
  ): SingleSimulationResult => {
    let fiveStarPity = initialPity?.fiveStarPity ?? 0;
    let fourStarPity = initialPity?.fourStarPity ?? 0;
    let fiveStarGuaranteed = initialPity?.fiveStarGuaranteed ?? false;
    
    let upFiveStarCount = 0;
    let fiveStarCount = 0;
    let fourStarCount = 0;
    let lostFiftyFiftyCount = 0;
    let remainingPulls = pullCount;  // 剩余可抽次数（考虑四星返抽）
    let actualPullsUsed = 0;  // 实际消耗的抽数
    
    // 判断是否获得五星
    const rollFiveStar = (pity: number): boolean => {
      if (pity >= config.fiveStarPityLimit - 1) return true;
      let rate = config.fiveStarRate;
      if (pity >= 73) {
        rate += (pity - 72) * 0.06;
      }
      return Math.random() < rate;
    };
    
    // 判断是否获得四星
    const rollFourStar = (pity: number): boolean => {
      if (pity >= config.fourStarPityLimit - 1) return true;
      let rate = config.fourStarRate;
      if (pity >= 9) {
        rate += (pity - 8) * 0.05;
      }
      return Math.random() < rate;
    };
    
    while (remainingPulls > 0) {
      fiveStarPity++;
      fourStarPity++;
      actualPullsUsed++;
      
      const isFiveStar = rollFiveStar(fiveStarPity);
      
      if (isFiveStar) {
        fiveStarCount++;
        fiveStarPity = 0;
        fourStarPity = 0;
        
        let isUp = false;
        
        if (warpType === WarpType.STANDARD) {
          isUp = false;
        } else {
          if (fiveStarGuaranteed) {
            isUp = true;
            fiveStarGuaranteed = false;
          } else {
            isUp = Math.random() < config.fiveStarUpRate;
            if (!isUp) {
              fiveStarGuaranteed = true;
              lostFiftyFiftyCount++;
            }
          }
        }
        
        if (isUp) {
          upFiveStarCount++;
        }
      } else {
        const isFourStar = rollFourStar(fourStarPity);
        if (isFourStar) {
          fourStarCount++;
          fourStarPity = 0;
          // 如果启用四星返抽，每抽到1个四星额外获得1抽
          if (enableFourStarBonus) {
            remainingPulls++;
          }
        }
      }
      
      remainingPulls--;
    }
    
    return {
      upFiveStarCount,
      fiveStarCount,
      fourStarCount,
      lostFiftyFiftyCount,
      totalPulls: pullCount,
      actualPullsUsed
    };
  };
  
  // 计算分布
  const calculateDistribution = (values: number[]): DistributionItem[] => {
    const countMap = new Map<number, number>();
    for (const val of values) {
      countMap.set(val, (countMap.get(val) || 0) + 1);
    }
    
    const sortedKeys = Array.from(countMap.keys()).sort((a, b) => a - b);
    const total = values.length;
    
    return sortedKeys.map(key => ({
      value: key,
      count: countMap.get(key) || 0,
      percentage: total > 0 ? Math.round(((countMap.get(key) || 0) / total) * 10000) / 100 : 0
    }));
  };
  
  // 批量模拟
  // enableFourStarBonus: 是否启用四星返抽（每抽到1个四星额外获得1抽）
  // initialPity: 初始保底进度（垫池子）
  const runBatchSimulation = (
    simulationCount: number, 
    pullCountPerSim: number, 
    enableFourStarBonus: boolean = false,
    initialPity?: InitialPityState
  ): BatchSimulationStats => {
    const results: SingleSimulationResult[] = [];
    
    for (let i = 0; i < simulationCount; i++) {
      results.push(runSingleSimulation(pullCountPerSim, enableFourStarBonus, initialPity));
    }
    
    // 提取各维度数据
    const upFiveStarCounts = results.map(r => r.upFiveStarCount);
    const fiveStarCounts = results.map(r => r.fiveStarCount);
    const fourStarCounts = results.map(r => r.fourStarCount);
    const lostCounts = results.map(r => r.lostFiftyFiftyCount);
    
    // 计算分布
    const upFiveStarDistribution = calculateDistribution(upFiveStarCounts);
    const fiveStarDistribution = calculateDistribution(fiveStarCounts);
    const fourStarDistribution = calculateDistribution(fourStarCounts);
    const lostFiftyFiftyDistribution = calculateDistribution(lostCounts);
    
    // 计算平均值
    const avgUpFiveStar = upFiveStarCounts.reduce((a, b) => a + b, 0) / simulationCount;
    const avgFiveStar = fiveStarCounts.reduce((a, b) => a + b, 0) / simulationCount;
    const avgFourStar = fourStarCounts.reduce((a, b) => a + b, 0) / simulationCount;
    
    // 计算实际消耗抽数（四星返抽）
    const actualPullsUsedList = results.map(r => r.actualPullsUsed);
    const avgActualPullsUsed = actualPullsUsedList.reduce((a, b) => a + b, 0) / simulationCount;
    
    // 计算概率
    const probAtLeast1Up = results.filter(r => r.upFiveStarCount >= 1).length / simulationCount * 100;
    const probAtLeast2Up = results.filter(r => r.upFiveStarCount >= 2).length / simulationCount * 100;
    const probAtLeast3Up = results.filter(r => r.upFiveStarCount >= 3).length / simulationCount * 100;
    
    return {
      simulationCount,
      pullCountPerSim,
      upFiveStarDistribution,
      fiveStarDistribution,
      fourStarDistribution,
      lostFiftyFiftyDistribution,
      avgUpFiveStar: Math.round(avgUpFiveStar * 100) / 100,
      avgFiveStar: Math.round(avgFiveStar * 100) / 100,
      avgFourStar: Math.round(avgFourStar * 100) / 100,
      avgActualPullsUsed: Math.round(avgActualPullsUsed * 100) / 100,
      probAtLeast1Up: Math.round(probAtLeast1Up * 100) / 100,
      probAtLeast2Up: Math.round(probAtLeast2Up * 100) / 100,
      probAtLeast3Up: Math.round(probAtLeast3Up * 100) / 100
    };
  };
  
  return {
    runBatchSimulation
  };
}
