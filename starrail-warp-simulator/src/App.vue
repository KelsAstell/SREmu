<script setup lang="ts">
import { ref, computed } from 'vue';
import { WarpType, type SimulationStats } from '@/types/warp';
import { useWarpSimulator, useBatchSimulation } from '@/composables/useWarpSimulator';
import WarpControls from '@/components/WarpControls.vue';
import WarpResults from '@/components/WarpResults.vue';
import StrategyCalculator from '@/components/StrategyCalculator.vue';

// 当前页面类型
const currentPage = ref<'simulator' | 'strategy'>('simulator');

// 当前跃迁类型
const currentWarpType = ref<WarpType>(WarpType.CHARACTER);

// 单次抽卡次数（每次模拟最多抽多少）
const pullCount = ref(90);

// 模拟次数
const simulationCount = ref(1000);

// 是否启用四星返抽
const enableFourStarBonus = ref(false);

// 是否启用垫池子
const enableInitialPity = ref(false);

// 初始保底进度
const initialPity = ref({
  fiveStarPity: 0,
  fourStarPity: 0,
  fiveStarGuaranteed: false,
  fourStarGuaranteed: false
});

// 统计数据
const stats = ref<SimulationStats>({
  totalPulls: 0,
  fiveStarCount: 0,
  fourStarCount: 0,
  threeStarCount: 0,
  upFiveStarCount: 0,
  upFourStarCount: 0,
  lostFiftyFiftyCount: 0,
  averageFiveStarPity: 0,
  results: []
});

// 使用组合式函数
const standardSimulator = useWarpSimulator(WarpType.STANDARD);
const characterSimulator = useWarpSimulator(WarpType.CHARACTER);
const lightConeSimulator = useWarpSimulator(WarpType.LIGHT_CONE);

const standardBatch = useBatchSimulation(WarpType.STANDARD);
const characterBatch = useBatchSimulation(WarpType.CHARACTER);
const lightConeBatch = useBatchSimulation(WarpType.LIGHT_CONE);

// 获取当前模拟器
const currentSimulator = computed(() => {
  switch (currentWarpType.value) {
    case WarpType.STANDARD:
      return standardSimulator;
    case WarpType.CHARACTER:
      return characterSimulator;
    case WarpType.LIGHT_CONE:
      return lightConeSimulator;
    default:
      return characterSimulator;
  }
});

// 获取当前批量模拟器
const currentBatchSimulator = computed(() => {
  switch (currentWarpType.value) {
    case WarpType.STANDARD:
      return standardBatch;
    case WarpType.CHARACTER:
      return characterBatch;
    case WarpType.LIGHT_CONE:
      return lightConeBatch;
    default:
      return characterBatch;
  }
});

// 执行模拟
const handleSimulate = () => {
  // 如果启用了垫池子，设置初始保底进度（用于单次模拟）
  if (enableInitialPity.value) {
    currentSimulator.value.setInitialPity(initialPity.value);
  }
  
  // 批量模拟：统计UP五星数量等分布
  const batchStats = currentBatchSimulator.value.runBatchSimulation(
    simulationCount.value,
    pullCount.value,
    enableFourStarBonus.value,
    enableInitialPity.value ? initialPity.value : undefined
  );
  
  stats.value = {
    totalPulls: simulationCount.value * pullCount.value,
    fiveStarCount: Math.round(batchStats.avgFiveStar * simulationCount.value),
    fourStarCount: Math.round(batchStats.avgFourStar * simulationCount.value),
    threeStarCount: 0,
    upFiveStarCount: Math.round(batchStats.avgUpFiveStar * simulationCount.value),
    upFourStarCount: 0,
    lostFiftyFiftyCount: 0,
    averageFiveStarPity: 0,
    results: [],
    batchStats
  };
};

// 重置
const handleReset = () => {
  currentSimulator.value.resetState();
  enableInitialPity.value = false;
  initialPity.value = {
    fiveStarPity: 0,
    fourStarPity: 0,
    fiveStarGuaranteed: false,
    fourStarGuaranteed: false
  };
  stats.value = {
    totalPulls: 0,
    fiveStarCount: 0,
    fourStarCount: 0,
    threeStarCount: 0,
    upFiveStarCount: 0,
    upFourStarCount: 0,
    lostFiftyFiftyCount: 0,
    averageFiveStarPity: 0,
    results: []
  };
};

// 跃迁类型名称
const warpTypeNames = {
  [WarpType.STANDARD]: '群星跃迁（常驻池）',
  [WarpType.CHARACTER]: '角色活动跃迁（角色限定池）',
  [WarpType.LIGHT_CONE]: '光锥活动跃迁（光锥限定池）'
};
</script>

<template>
  <div class="app-container">
    <!-- 导航栏 -->
    <nav class="app-nav">
      <div class="nav-content">
        <div class="nav-brand">星穹铁道跃迁模拟器</div>
        <div class="nav-links">
          <button 
            class="nav-link" 
            :class="{ active: currentPage === 'simulator' }"
            @click="currentPage = 'simulator'"
          >
            抽卡模拟
          </button>
          <button 
            class="nav-link" 
            :class="{ active: currentPage === 'strategy' }"
            @click="currentPage = 'strategy'"
          >
            策略计算
          </button>
        </div>
      </div>
    </nav>

    <main class="app-main">
      <!-- 模拟器页面 -->
      <div v-if="currentPage === 'simulator'" class="simulator-layout">
        <!-- 左侧控制面板 -->
        <div class="control-panel">
          <WarpControls
            v-model="currentWarpType"
            v-model:pullCount="pullCount"
            v-model:simulationCount="simulationCount"
            v-model:enableFourStarBonus="enableFourStarBonus"
            v-model:enableInitialPity="enableInitialPity"
            v-model:initialPity="initialPity"
            @simulate="handleSimulate"
            @reset="handleReset"
          />
        </div>

        <!-- 右侧结果面板 -->
        <div class="results-panel">
          <div class="current-type">
            当前池子：<span class="type-name">{{ warpTypeNames[currentWarpType] }}</span>
          </div>
          <WarpResults
            :stats="stats"
            :warpType="currentWarpType"
          />
        </div>
      </div>

      <!-- 策略计算页面 -->
      <StrategyCalculator 
        v-else 
        @back="currentPage = 'simulator'"
      />
    </main>

    <footer class="app-footer">
      <p>本模拟器仅供娱乐，概率基于游戏内机制模拟</p>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f3f4f6;
  min-height: 100vh;
  color: #1f2937;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 导航栏 */
.app-nav {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 24px;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.nav-brand {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.nav-links {
  display: flex;
  gap: 8px;
}

.nav-link {
  padding: 10px 20px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background: #f3f4f6;
  color: #374151;
}

.nav-link.active {
  background: #eff6ff;
  color: #3b82f6;
}

.app-header {
  text-align: center;
  padding: 32px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.app-header h1 {
  font-size: 28px;
  margin-bottom: 8px;
  color: #1f2937;
  font-weight: 700;
}

.subtitle {
  color: #6b7280;
  font-size: 15px;
}

.app-main {
  flex: 1;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.simulator-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 24px;
  align-items: start;
}

.control-panel {
  position: sticky;
  top: 24px;
}

.results-panel {
  min-height: 600px;
}

.current-type {
  background: #fff;
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.type-name {
  color: #1f2937;
  font-weight: 600;
}

.app-footer {
  text-align: center;
  padding: 24px;
  color: #9ca3af;
  font-size: 14px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .simulator-layout {
    grid-template-columns: 1fr;
  }

  .control-panel {
    position: static;
  }
}

@media (max-width: 640px) {
  .app-header h1 {
    font-size: 22px;
  }

  .app-main {
    padding: 16px;
  }

  .nav-content {
    padding: 0;
  }

  .nav-brand {
    font-size: 16px;
  }

  .nav-link {
    padding: 8px 14px;
    font-size: 14px;
  }
}
</style>
