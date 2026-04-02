import { ref, computed } from 'vue';
import {
  type StrategyInput,
  type StrategyAllocation,
  type StrategySimulationResult,
  type StrategyResult,
  type BestStrategyAnalysis,
  type InitialPityProgress,
  WarpType,
  WARP_CONFIGS
} from '@/types/warp';

// 角色池配置
const CHARACTER_CONFIG = WARP_CONFIGS[WarpType.CHARACTER];
// 光锥池配置
const LIGHT_CONE_CONFIG = WARP_CONFIGS[WarpType.LIGHT_CONE];

// 运行单次策略模拟
function runSingleStrategySimulation(
  allocation: StrategyAllocation,
  targetCharacters: number,
  targetLightCones: number,
  enableFourStarBonus: boolean = false,
  initialPity?: InitialPityProgress
): StrategySimulationResult {
  // 模拟角色池
  let charPity = initialPity?.characterPity ?? 0;
  let charFourStarPity = 0;
  let charGuaranteed = initialPity?.characterGuaranteed ?? false;
  let charactersObtained = 0;
  let charPullsUsed = 0;
  let charRemainingPulls = allocation.characterPulls;
  
  while (charRemainingPulls > 0) {
    charPity++;
    charFourStarPity++;
    charPullsUsed++;
    charRemainingPulls--;
    
    // 判断是否出五星
    let fiveStarRate = CHARACTER_CONFIG.fiveStarRate;
    if (charPity >= 73) {
      fiveStarRate += (charPity - 72) * 0.06;
    }
    if (charPity >= 90) {
      fiveStarRate = 1;
    }
    
    let gotFiveStar = false;
    let gotFourStar = false;
    
    if (Math.random() < fiveStarRate) {
      // 出五星
      charPity = 0;
      charFourStarPity = 0;
      gotFiveStar = true;
      let isUp = false;
      
      if (charGuaranteed) {
        isUp = true;
        charGuaranteed = false;
      } else {
        isUp = Math.random() < CHARACTER_CONFIG.fiveStarUpRate;
        if (!isUp) {
          charGuaranteed = true;
        }
      }
      
      if (isUp) {
        charactersObtained++;
      }
    } else {
      // 判断是否出四星
      let fourStarRate = CHARACTER_CONFIG.fourStarRate;
      if (charFourStarPity >= 9) {
        fourStarRate = 1;
      }
      if (Math.random() < fourStarRate) {
        charFourStarPity = 0;
        gotFourStar = true;
      }
    }
    
    // 四星返抽：抽到四星额外获得1抽
    if (enableFourStarBonus && gotFourStar) {
      charRemainingPulls++;
    }
  }
  
  // 模拟光锥池
  let lcPity = initialPity?.lightConePity ?? 0;
  let lcFourStarPity = 0;
  let lcGuaranteed = initialPity?.lightConeGuaranteed ?? false;
  let lightConesObtained = 0;
  let lcPullsUsed = 0;
  let lcRemainingPulls = allocation.lightConePulls;
  
  while (lcRemainingPulls > 0) {
    lcPity++;
    lcFourStarPity++;
    lcPullsUsed++;
    lcRemainingPulls--;
    
    // 判断是否出五星
    let fiveStarRate = LIGHT_CONE_CONFIG.fiveStarRate;
    if (lcPity >= 65) {
      fiveStarRate += (lcPity - 64) * 0.06;
    }
    if (lcPity >= 80) {
      fiveStarRate = 1;
    }
    
    let gotFiveStar = false;
    let gotFourStar = false;
    
    if (Math.random() < fiveStarRate) {
      // 出五星
      lcPity = 0;
      lcFourStarPity = 0;
      gotFiveStar = true;
      let isUp = false;
      
      if (lcGuaranteed) {
        isUp = true;
        lcGuaranteed = false;
      } else {
        isUp = Math.random() < LIGHT_CONE_CONFIG.fiveStarUpRate;
        if (!isUp) {
          lcGuaranteed = true;
        }
      }
      
      if (isUp) {
        lightConesObtained++;
      }
    } else {
      // 判断是否出四星
      let fourStarRate = LIGHT_CONE_CONFIG.fourStarRate;
      if (lcFourStarPity >= 9) {
        fourStarRate = 1;
      }
      if (Math.random() < fourStarRate) {
        lcFourStarPity = 0;
        gotFourStar = true;
      }
    }
    
    // 四星返抽：抽到四星额外获得1抽
    if (enableFourStarBonus && gotFourStar) {
      lcRemainingPulls++;
    }
  }
  
  return {
    success: charactersObtained >= targetCharacters && lightConesObtained >= targetLightCones,
    charactersObtained,
    lightConesObtained,
    characterPullsUsed: charPullsUsed,
    lightConePullsUsed: lcPullsUsed
  };
}

// 评估一种分配策略
function evaluateStrategy(
  allocation: StrategyAllocation,
  input: StrategyInput,
  simulationCount: number = 10000
): StrategyResult {
  let successCount = 0;
  let totalCharacters = 0;
  let totalLightCones = 0;
  const successResults: boolean[] = [];
  
  for (let i = 0; i < simulationCount; i++) {
    const result = runSingleStrategySimulation(
      allocation,
      input.targetCharacters,
      input.targetLightCones,
      input.enableFourStarBonus,
      input.initialPity
    );
    
    if (result.success) {
      successCount++;
    }
    successResults.push(result.success);
    totalCharacters += result.charactersObtained;
    totalLightCones += result.lightConesObtained;
  }
  
  const successRate = successCount / simulationCount;
  
  // 计算95%置信区间 (使用正态近似)
  const stdError = Math.sqrt((successRate * (1 - successRate)) / simulationCount);
  const zScore = 1.96; // 95%置信水平
  const marginOfError = zScore * stdError;
  
  const lowerBound = Math.max(0, (successRate - marginOfError) * 100);
  const upperBound = Math.min(100, (successRate + marginOfError) * 100);
  
  return {
    allocation,
    successRate: Math.round(successRate * 10000) / 100,
    expectedCharacters: Math.round((totalCharacters / simulationCount) * 100) / 100,
    expectedLightCones: Math.round((totalLightCones / simulationCount) * 100) / 100,
    simulationCount,
    confidenceInterval: {
      lower: Math.round(lowerBound * 100) / 100,
      upper: Math.round(upperBound * 100) / 100
    }
  };
}

// 生成所有可能的分配方案
function generateAllocations(totalPulls: number): StrategyAllocation[] {
  const allocations: StrategyAllocation[] = [];
  // 步长为10，减少计算量
  const step = 10;
  
  for (let charPulls = 0; charPulls <= totalPulls; charPulls += step) {
    allocations.push({
      characterPulls: charPulls,
      lightConePulls: totalPulls - charPulls
    });
  }
  
  // 确保包含全部给光锥池的情况
  if (allocations[allocations.length - 1]?.characterPulls !== totalPulls) {
    allocations.push({
      characterPulls: totalPulls,
      lightConePulls: 0
    });
  }
  
  return allocations;
}

export function useStrategyCalculator() {
  const isCalculating = ref(false);
  const rawProgress = ref(0); // 实际计算进度
  const displayProgress = ref(0); // 显示的平滑进度
  const result = ref<BestStrategyAnalysis | null>(null);
  let progressAnimationId: number | null = null;

  // 对外暴露的进度（平滑动画后的）
  const progress = computed(() => displayProgress.value);

  // 平滑更新进度动画
  const animateProgress = (targetProgress: number) => {
    if (progressAnimationId !== null) {
      cancelAnimationFrame(progressAnimationId);
    }

    const step = () => {
      const diff = targetProgress - displayProgress.value;
      if (Math.abs(diff) < 1) {
        displayProgress.value = targetProgress;
        return;
      }
      // 使用缓动函数，让进度条移动更平滑（速度更快一些）
      displayProgress.value += diff * 0.3;
      progressAnimationId = requestAnimationFrame(step);
    };
    progressAnimationId = requestAnimationFrame(step);
  };

  // 计算最佳策略
  const calculateBestStrategy = async (
    input: StrategyInput,
    simulationCount: number = 10000
  ): Promise<BestStrategyAnalysis> => {
    isCalculating.value = true;
    rawProgress.value = 0;
    displayProgress.value = 0;
    
    const allocations = generateAllocations(input.totalPulls);
    const allStrategies: StrategyResult[] = [];
    
    // 逐个评估每种分配方案
    for (let i = 0; i < allocations.length; i++) {
      const strategy = evaluateStrategy(allocations[i]!, input, simulationCount);
      allStrategies.push(strategy);
      rawProgress.value = Math.round(((i + 1) / allocations.length) * 100);
      
      // 更新平滑进度（但比实际进度慢）
      animateProgress(rawProgress.value);
      
      // 让出主线程，避免UI卡顿
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    // 确保最终进度达到100%
    animateProgress(100);
    
    // 按成功率排序，成功率相同则按期望总和排序
    allStrategies.sort((a, b) => {
      if (b.successRate !== a.successRate) {
        return b.successRate - a.successRate;
      }
      const aExpected = a.expectedCharacters + a.expectedLightCones;
      const bExpected = b.expectedCharacters + b.expectedLightCones;
      return bExpected - aExpected;
    });
    
    const bestStrategy = allStrategies[0] || null;
    
    const analysis: BestStrategyAnalysis = {
      input,
      bestStrategy,
      allStrategies
    };
    
    result.value = analysis;
    isCalculating.value = false;
    
    return analysis;
  };

  // 重置
  const reset = () => {
    isCalculating.value = false;
    rawProgress.value = 0;
    displayProgress.value = 0;
    if (progressAnimationId !== null) {
      cancelAnimationFrame(progressAnimationId);
      progressAnimationId = null;
    }
    result.value = null;
  };

  return {
    isCalculating,
    progress,
    result,
    calculateBestStrategy,
    reset
  };
}
