<script setup lang="ts">
import { ref, computed } from 'vue';
import html2canvas from 'html2canvas';
import { type StrategyInput, type StrategyResult } from '@/types/warp';
import { useStrategyCalculator } from '@/composables/useStrategyCalculator';

const emit = defineEmits<{
  (e: 'back'): void;
}>();

// 导出状态
const isExporting = ref(false);
const exportStatus = ref('');

// 输入参数
const totalPulls = ref(180);
const targetCharacters = ref(1);
const targetLightCones = ref(1);
const simulationCount = ref(10000);
const customSimulationCount = ref(100000); // 自定义模拟次数默认值
const enableFourStarBonus = ref(false);
const enableInitialPity = ref(false);
const characterPity = ref(0);
const characterGuaranteed = ref(false);
const lightConePity = ref(0);
const lightConeGuaranteed = ref(false);

// 使用策略计算器
const { isCalculating, progress, result, calculateBestStrategy, reset } = useStrategyCalculator();

// 计算策略
const handleCalculate = async () => {
  const input: StrategyInput = {
    totalPulls: totalPulls.value,
    targetCharacters: targetCharacters.value,
    targetLightCones: targetLightCones.value,
    enableFourStarBonus: enableFourStarBonus.value,
    initialPity: enableInitialPity.value ? {
      characterPity: characterPity.value,
      characterGuaranteed: characterGuaranteed.value,
      lightConePity: lightConePity.value,
      lightConeGuaranteed: lightConeGuaranteed.value
    } : undefined
  };
  
  // 使用自定义次数或预设次数
  const count = simulationCount.value === customSimulationCount.value 
    ? customSimulationCount.value 
    : simulationCount.value;
  
  await calculateBestStrategy(input, count);
};

// 重置
const handleReset = () => {
  totalPulls.value = 180;
  targetCharacters.value = 1;
  targetLightCones.value = 1;
  enableFourStarBonus.value = false;
  enableInitialPity.value = false;
  characterPity.value = 0;
  characterGuaranteed.value = false;
  lightConePity.value = 0;
  lightConeGuaranteed.value = false;
  reset();
};

// 快速设置
const quickSetPulls = (count: number) => {
  totalPulls.value = count;
};

// 自定义模拟次数变化处理
const onCustomCountChange = () => {
  // 限制范围
  if (customSimulationCount.value < 100) {
    customSimulationCount.value = 100;
  } else if (customSimulationCount.value > 1000000) {
    customSimulationCount.value = 1000000;
  }
};

// 格式化百分比
const formatPercent = (value: number) => {
  return value.toFixed(2) + '%';
};

// 获取成功率对应的颜色
const getSuccessRateColor = (rate: number) => {
  if (rate >= 80) return '#10b981'; // 绿色
  if (rate >= 50) return '#f59e0b'; // 黄色
  return '#ef4444'; // 红色
};

// 获取成功率对应的渐变背景
const getSuccessRateGradient = (rate: number) => {
  if (rate >= 80) return 'linear-gradient(135deg, #86efac 0%, #dcfce7 100%)'; // 淡绿色渐变
  if (rate >= 50) return 'linear-gradient(135deg, #fcd34d 0%, #fef3c7 100%)'; // 淡黄色渐变
  return 'linear-gradient(135deg, #fca5a5 0%, #fee2e2 100%)'; // 淡红色渐变
};

// 获取成功率对应的文字颜色
const getSuccessRateTextColor = (rate: number) => {
  if (rate >= 80) return '#166534'; // 深绿色
  if (rate >= 50) return '#92400e'; // 深黄色/棕色
  return '#991b1b'; // 深红色
};

// 获取成功率对应的标签
const getSuccessRateLabel = (rate: number) => {
  if (rate >= 80) return '高概率';
  if (rate >= 50) return '中等概率';
  if (rate >= 20) return '低概率';
  return '极低概率';
};

// 其他可行策略（排除最佳策略，按成功率排序取前5个）
const alternativeStrategies = computed(() => {
  if (!result.value) return [];
  return result.value.allStrategies.slice(1, 6);
});

// 导出结果为图片
const exportResult = async () => {
  if (!result.value) return;
  
  isExporting.value = true;
  exportStatus.value = '正在生成图片...';
  
  try {
    // 只导出结果面板，避免元素过大
    const element = document.querySelector('.results-panel') as HTMLElement;
    if (!element) {
      throw new Error('找不到导出区域');
    }
    
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false
    });
    
    // 创建带边距的新 canvas
    const padding = 24;
    const newCanvas = document.createElement('canvas');
    newCanvas.width = canvas.width + padding * 2;
    newCanvas.height = canvas.height + padding * 2;
    const ctx = newCanvas.getContext('2d')!;
    
    // 填充白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
    
    // 绘制原 canvas 内容
    ctx.drawImage(canvas, padding, padding);
    
    // 转换为 blob（使用 PNG 格式，兼容性更好）
    const blob = await new Promise<Blob>((resolve) => {
      newCanvas.toBlob((b) => resolve(b!), 'image/png');
    });
    
    // 复制到剪贴板
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    
    exportStatus.value = '已复制到剪贴板！';
    setTimeout(() => {
      exportStatus.value = '';
    }, 2000);
  } catch (error) {
    console.error('导出失败:', error);
    exportStatus.value = '导出失败，请重试';
    setTimeout(() => {
      exportStatus.value = '';
    }, 3000);
  } finally {
    isExporting.value = false;
  }
};
</script>

<template>
  <div class="strategy-calculator">
    <!-- 头部 -->
    <div class="calculator-header">
      <button class="back-btn" @click="$emit('back')">
        <span class="back-icon">←</span> 返回模拟器
      </button>
      <div class="header-center">
        <h2>最佳抽取策略计算器</h2>
        <p class="subtitle">输入你的总抽数和目标，计算最优分配策略</p>
      </div>
      <button 
        v-if="result" 
        class="export-btn" 
        @click="exportResult"
        :disabled="isExporting"
      >
        <span v-if="isExporting">{{ exportStatus }}</span>
        <span v-else>导出结果</span>
      </button>
      <div v-else class="export-placeholder"></div>
    </div>

    <div class="calculator-layout">
      <!-- 左侧输入面板 -->
      <div class="input-panel">
        <div class="input-section">
          <h3>总抽数</h3>
          <p class="input-desc">你拥有的总抽卡次数</p>
          
          <div class="slider-section">
            <div class="slider-header">
              <span class="slider-label">总抽数</span>
              <span class="slider-value">{{ totalPulls }} 抽</span>
            </div>
            <input
              type="range"
              v-model.number="totalPulls"
              min="10"
              max="1000"
              step="10"
              class="slider"
              :disabled="isCalculating"
            />
            <div class="slider-hints">
              <span>10</span>
              <span>250</span>
              <span>500</span>
              <span>750</span>
              <span>1000</span>
            </div>
          </div>

          <div class="number-input-wrapper">
            <label>精确输入：</label>
            <input
              type="number"
              v-model.number="totalPulls"
              min="1"
              max="10000"
              class="number-input"
              :disabled="isCalculating"
            />
          </div>

          <div class="quick-buttons">
            <button @click="quickSetPulls(90)" :disabled="isCalculating">90抽</button>
            <button @click="quickSetPulls(180)" :disabled="isCalculating">180抽</button>
            <button @click="quickSetPulls(270)" :disabled="isCalculating">270抽</button>
            <button @click="quickSetPulls(450)" :disabled="isCalculating">450抽</button>
          </div>
        </div>

        <div class="input-section">
          <h3>抽取目标</h3>
          <p class="input-desc">你想要获得的UP物品数量</p>
          
          <div class="target-inputs">
            <div class="target-item">
              <label>UP角色</label>
              <div class="target-control">
                <button 
                  class="target-btn" 
                  @click="targetCharacters = Math.max(0, targetCharacters - 1)"
                  :disabled="isCalculating || targetCharacters <= 0"
                >-</button>
                <span class="target-value">{{ targetCharacters }}</span>
                <button 
                  class="target-btn" 
                  @click="targetCharacters++"
                  :disabled="isCalculating"
                >+</button>
              </div>
            </div>
            
            <div class="target-item">
              <label>UP光锥</label>
              <div class="target-control">
                <button 
                  class="target-btn" 
                  @click="targetLightCones = Math.max(0, targetLightCones - 1)"
                  :disabled="isCalculating || targetLightCones <= 0"
                >-</button>
                <span class="target-value">{{ targetLightCones }}</span>
                <button 
                  class="target-btn" 
                  @click="targetLightCones++"
                  :disabled="isCalculating"
                >+</button>
              </div>
            </div>
          </div>
        </div>

        <div class="input-section">
          <h3>高级选项</h3>
          <p class="input-desc">额外的模拟参数设置</p>
          
          <div class="advanced-options">
            <label class="toggle-option">
              <input
                type="checkbox"
                v-model="enableFourStarBonus"
                :disabled="isCalculating"
              />
              <span class="toggle-slider"></span>
              <span class="toggle-label">
                <span class="toggle-title">四星返抽</span>
                <span class="toggle-desc">抽到4星额外获得1抽（模拟商店兑换）</span>
              </span>
            </label>
            
            <label class="toggle-option">
              <input
                type="checkbox"
                v-model="enableInitialPity"
                :disabled="isCalculating"
              />
              <span class="toggle-slider"></span>
              <span class="toggle-label">
                <span class="toggle-title">垫池子</span>
                <span class="toggle-desc">设置初始保底进度（已抽次数/大保底状态）</span>
              </span>
            </label>
            
            <!-- 垫池子详细设置 -->
            <div v-if="enableInitialPity" class="pity-settings">
              <div class="pity-pool">
                <div class="pity-pool-header">
                  <span class="pity-pool-title">角色池</span>
                  <label class="guaranteed-check">
                    <input 
                      type="checkbox" 
                      v-model="characterGuaranteed"
                      :disabled="isCalculating"
                    />
                    <span>大保底</span>
                  </label>
                </div>
                <div class="pity-slider-wrapper">
                  <span class="pity-label">已垫 {{ characterPity }} 抽</span>
                  <input
                    type="range"
                    v-model.number="characterPity"
                    min="0"
                    max="89"
                    class="pity-slider"
                    :disabled="isCalculating"
                  />
                  <div class="pity-hints">
                    <span>0</span>
                    <span>30</span>
                    <span>60</span>
                    <span>89</span>
                  </div>
                </div>
              </div>
              
              <div class="pity-pool">
                <div class="pity-pool-header">
                  <span class="pity-pool-title">光锥池</span>
                  <label class="guaranteed-check">
                    <input 
                      type="checkbox" 
                      v-model="lightConeGuaranteed"
                      :disabled="isCalculating"
                    />
                    <span>大保底</span>
                  </label>
                </div>
                <div class="pity-slider-wrapper">
                  <span class="pity-label">已垫 {{ lightConePity }} 抽</span>
                  <input
                    type="range"
                    v-model.number="lightConePity"
                    min="0"
                    max="79"
                    class="pity-slider"
                    :disabled="isCalculating"
                  />
                  <div class="pity-hints">
                    <span>0</span>
                    <span>26</span>
                    <span>53</span>
                    <span>79</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="input-section">
          <h3>模拟精度</h3>
          <p class="input-desc">模拟次数越多结果越精确，但计算时间更长</p>
          
          <div class="precision-options">
            <label class="precision-option">
              <input
                type="radio"
                v-model.number="simulationCount"
                :value="1000"
                :disabled="isCalculating"
              />
              <span class="option-label">快速 (1千次)</span>
            </label>
            <label class="precision-option">
              <input
                type="radio"
                v-model.number="simulationCount"
                :value="10000"
                :disabled="isCalculating"
              />
              <span class="option-label">标准 (1万次)</span>
            </label>
            <label class="precision-option">
              <input
                type="radio"
                v-model.number="simulationCount"
                :value="50000"
                :disabled="isCalculating"
              />
              <span class="option-label">精确 (5万次)</span>
            </label>
            <label class="precision-option">
              <input
                type="radio"
                v-model.number="simulationCount"
                :value="customSimulationCount"
                :disabled="isCalculating"
              />
              <span class="option-label">自定义</span>
            </label>
          </div>
          
          <!-- 自定义模拟次数输入 -->
          <div v-if="simulationCount === customSimulationCount" class="custom-simulation-input">
            <label>自定义次数：</label>
            <input
              type="number"
              v-model.number="customSimulationCount"
              min="100"
              max="1000000"
              step="100"
              class="number-input"
              :disabled="isCalculating"
              @change="onCustomCountChange"
            />
            <span class="input-hint">次 (100 - 1,000,000)</span>
          </div>
        </div>

        <div class="action-buttons">
          <button 
            class="calculate-btn" 
            @click="handleCalculate"
            :disabled="isCalculating || (targetCharacters === 0 && targetLightCones === 0)"
          >
            <span v-if="isCalculating">计算中... {{ Math.round(progress) }}%</span>
            <span v-else>计算最佳策略</span>
          </button>
          <button class="reset-btn" @click="handleReset" :disabled="isCalculating">
            重置
          </button>
        </div>
      </div>

      <!-- 右侧结果面板 -->
      <div class="results-panel">
        <div v-if="!result && !isCalculating" class="empty-state">
          <div class="empty-icon">📊</div>
          <h3>等待计算</h3>
          <p>在左侧输入参数后点击"计算最佳策略"</p>
        </div>

        <div v-else-if="isCalculating" class="calculating-state">
          <div class="progress-ring">
            <svg viewBox="0 0 100 100">
              <circle class="progress-bg" cx="50" cy="50" r="45" />
              <circle 
                class="progress-fill" 
                cx="50" 
                cy="50" 
                r="45" 
                :style="{ strokeDashoffset: 283 - (283 * progress / 100) }"
              />
            </svg>
            <div class="progress-text">{{ Math.round(progress) }}%</div>
          </div>
          <h3>正在计算...</h3>
          <p>正在模拟各种分配策略，请稍候</p>
        </div>

        <div v-else-if="result" class="results-content">
          <!-- 最佳策略卡片 -->
          <div 
            class="best-strategy-card" 
            v-if="result.bestStrategy"
            :style="{ 
              background: getSuccessRateGradient(result.bestStrategy.successRate),
              color: getSuccessRateTextColor(result.bestStrategy.successRate)
            }"
          >
            <div class="card-header">
              <span 
                class="best-badge"
                :style="{ 
                  background: getSuccessRateTextColor(result.bestStrategy.successRate),
                  color: '#ffffff'
                }"
              >最佳策略</span>
              <span 
                class="success-rate-badge"
                :style="{ 
                  backgroundColor: getSuccessRateColor(result.bestStrategy.successRate),
                  color: '#ffffff'
                }"
              >
                {{ getSuccessRateLabel(result.bestStrategy.successRate) }}
              </span>
            </div>
            
            <div class="allocation-display">
              <div class="allocation-item character">
                <div class="allocation-info">
                  <span class="allocation-label">角色池</span>
                  <span class="allocation-value">{{ result.bestStrategy.allocation.characterPulls }} 抽</span>
                  <span v-if="enableInitialPity && (characterPity > 0 || characterGuaranteed)" class="pity-status">
                    已垫{{ characterPity }}抽{{ characterGuaranteed ? '(大保底)' : '' }}
                  </span>
                </div>
              </div>
              <div class="allocation-divider">+</div>
              <div class="allocation-item lightcone">
                <div class="allocation-info">
                  <span class="allocation-label">光锥池</span>
                  <span class="allocation-value">{{ result.bestStrategy.allocation.lightConePulls }} 抽</span>
                  <span v-if="enableInitialPity && (lightConePity > 0 || lightConeGuaranteed)" class="pity-status">
                    已垫{{ lightConePity }}抽{{ lightConeGuaranteed ? '(大保底)' : '' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="success-rate-display">
              <span class="success-rate-label">成功率</span>
              <span 
                class="success-rate-value"
                :style="{ color: getSuccessRateTextColor(result.bestStrategy.successRate) }"
              >
                {{ formatPercent(result.bestStrategy.successRate) }}
              </span>
            </div>

            <div class="expected-results">
              <div class="expected-item">
                <span class="expected-label">期望获得角色</span>
                <span class="expected-value">{{ result.bestStrategy.expectedCharacters }} 个</span>
              </div>
              <div class="expected-item">
                <span class="expected-label">期望获得光锥</span>
                <span class="expected-value">{{ result.bestStrategy.expectedLightCones }} 个</span>
              </div>
            </div>
          </div>

          <!-- 其他可行策略 -->
          <div class="alternative-strategies" v-if="alternativeStrategies.length > 0">
            <div class="alternative-header">
              <h4>其他可行策略</h4>
              <span class="sort-hint">按成功率排序</span>
            </div>
            <div class="strategy-list">
              <div 
                v-for="(strategy, index) in alternativeStrategies" 
                :key="index"
                class="strategy-item"
                :style="{ borderLeftColor: getSuccessRateColor(strategy.successRate) }"
              >
                <div class="strategy-main">
                  <div class="strategy-allocation">
                    <span class="strategy-char">角色 {{ strategy.allocation.characterPulls }}抽</span>
                    <span class="strategy-divider">/</span>
                    <span class="strategy-lc">光锥 {{ strategy.allocation.lightConePulls }}抽</span>
                  </div>
                  <div class="strategy-expected">
                    <span class="expected-tag">期望: {{ strategy.expectedCharacters.toFixed(1) }}角色 / {{ strategy.expectedLightCones.toFixed(1) }}光锥</span>
                  </div>
                </div>
                <div class="strategy-stats">
                  <span 
                    class="strategy-rate"
                    :style="{ color: getSuccessRateColor(strategy.successRate) }"
                  >
                    {{ formatPercent(strategy.successRate) }}
                  </span>
                  <span class="confidence-interval">
                    95%CI: {{ formatPercent(strategy.confidenceInterval.lower) }} - {{ formatPercent(strategy.confidenceInterval.upper) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 提示信息 -->
          <div class="tips-section">
            <h4>💡 提示</h4>
            <ul>
              <li>角色池保底90抽，小保底50%概率UP</li>
              <li>光锥池保底80抽，小保底75%概率UP</li>
              <li>大保底必定获得UP物品</li>
              <li>计算结果基于蒙特卡洛模拟，实际结果可能有偏差</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.strategy-calculator {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.calculator-header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-center {
  flex: 1;
  text-align: center;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 16px;
}

.back-btn:hover {
  background: #e5e7eb;
}

.export-btn {
  padding: 10px 20px;
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: 120px;
}

.export-btn:hover:not(:disabled) {
  background: #059669;
}

.export-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.export-placeholder {
  width: 120px;
}

.back-icon {
  font-size: 16px;
}

.calculator-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.subtitle {
  color: #6b7280;
  font-size: 15px;
}

.calculator-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 24px;
  align-items: start;
}

/* 输入面板 */
.input-panel {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  position: sticky;
  top: 24px;
}

.input-section {
  margin-bottom: 24px;
}

.input-section:last-of-type {
  margin-bottom: 0;
}

.input-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}

.input-desc {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
}

/* 滑块样式 */
.slider-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.slider-label {
  font-size: 14px;
  color: #6b7280;
}

.slider-value {
  font-size: 18px;
  font-weight: 600;
  color: #3b82f6;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.slider:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.1s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.slider-hints {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.number-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.number-input-wrapper label {
  color: #6b7280;
  font-size: 14px;
}

.number-input {
  width: 100px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #1f2937;
  font-size: 15px;
  text-align: center;
  transition: border-color 0.2s ease;
}

.number-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.number-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.quick-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-buttons button {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.quick-buttons button:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.quick-buttons button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 目标输入 */
.target-inputs {
  display: flex;
  gap: 24px;
}

.target-item {
  flex: 1;
}

.target-item label {
  display: block;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.target-control {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f9fafb;
  border-radius: 8px;
  padding: 8px;
}

.target-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #3b82f6;
  color: #fff;
  border-radius: 6px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.target-btn:hover:not(:disabled) {
  background: #2563eb;
}

.target-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.target-value {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  min-width: 30px;
  text-align: center;
}

/* 高级选项 */
.advanced-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-option:hover {
  background: #f3f4f6;
}

.toggle-option input[type="checkbox"] {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background: #d1d5db;
  border-radius: 12px;
  transition: background 0.3s ease;
  flex-shrink: 0;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-option input[type="checkbox"]:checked + .toggle-slider {
  background: #3b82f6;
}

.toggle-option input[type="checkbox"]:checked + .toggle-slider::after {
  transform: translateX(20px);
}

.toggle-option input[type="checkbox"]:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.toggle-desc {
  font-size: 12px;
  color: #9ca3af;
}

/* 垫池子设置 */
.pity-settings {
  margin-top: 12px;
  padding: 16px;
  background: #f3f4f6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pity-pool {
  background: #fff;
  padding: 12px;
  border-radius: 8px;
}

.pity-pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.pity-pool-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.guaranteed-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
}

.guaranteed-check input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
  cursor: pointer;
}

.guaranteed-check input[type="checkbox"]:disabled {
  cursor: not-allowed;
}

.pity-slider-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pity-label {
  font-size: 14px;
  font-weight: 500;
  color: #3b82f6;
  text-align: center;
}

.pity-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.pity-slider:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.pity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pity-hints {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #9ca3af;
}

/* 精度选项 */
.precision-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.precision-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.precision-option:hover {
  background: #f3f4f6;
}

.precision-option input[type="radio"] {
  width: 18px;
  height: 18px;
  accent-color: #3b82f6;
}

.precision-option input[type="radio"]:disabled {
  cursor: not-allowed;
}

.option-label {
  font-size: 14px;
  color: #374151;
}

/* 自定义模拟次数输入 */
.custom-simulation-input {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.custom-simulation-input label {
  font-size: 14px;
  color: #6b7280;
  white-space: nowrap;
}

.custom-simulation-input .number-input {
  width: 120px;
}

.input-hint {
  font-size: 12px;
  color: #9ca3af;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.calculate-btn,
.reset-btn {
  flex: 1;
  padding: 14px 20px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.calculate-btn {
  background: #3b82f6;
  color: #fff;
}

.calculate-btn:hover:not(:disabled) {
  background: #2563eb;
}

.calculate-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.reset-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.reset-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 结果面板 */
.results-panel {
  min-height: 600px;
}

.empty-state,
.calculating-state {
  background: #ffffff;
  border-radius: 12px;
  padding: 60px 40px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3,
.calculating-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.empty-state p,
.calculating-state p {
  color: #6b7280;
  font-size: 15px;
}

/* 进度环 */
.progress-ring {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 24px;
}

.progress-ring svg {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.progress-bg {
  fill: none;
  stroke: #e5e7eb;
  stroke-width: 8;
}

.progress-fill {
  fill: none;
  stroke: #3b82f6;
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 283;
  transition: stroke-dashoffset 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  font-weight: 700;
  color: #3b82f6;
}

/* 结果内容 */
.results-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 最佳策略卡片 */
.best-strategy-card {
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.best-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.success-rate-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.allocation-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 28px;
}

.allocation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.4);
  padding: 16px 24px;
  border-radius: 12px;
}

.allocation-icon {
  font-size: 28px;
}

.allocation-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.allocation-label {
  font-size: 13px;
  opacity: 0.8;
}

.allocation-value {
  font-size: 20px;
  font-weight: 700;
}

.pity-status {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  margin-top: 4px;
  font-weight: 500;
}

.allocation-divider {
  font-size: 24px;
  font-weight: 300;
  opacity: 0.6;
}

.success-rate-display {
  text-align: center;
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 12px;
}

.success-rate-label {
  display: block;
  font-size: 14px;
  opacity: 0.7;
  margin-bottom: 8px;
}

.success-rate-value {
  font-size: 48px;
  font-weight: 700;
}

.expected-results {
  display: flex;
  gap: 16px;
}

.expected-item {
  flex: 1;
  background: rgba(255, 255, 255, 0.35);
  padding: 16px;
  border-radius: 10px;
  text-align: center;
}

.expected-label {
  display: block;
  font-size: 13px;
  opacity: 0.7;
  margin-bottom: 6px;
}

.expected-value {
  font-size: 20px;
  font-weight: 700;
}

/* 其他策略 */
.alternative-strategies {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.alternative-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.alternative-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.sort-hint {
  font-size: 12px;
  color: #9ca3af;
}

.strategy-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.strategy-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid transparent;
  transition: all 0.2s ease;
}

.strategy-item:hover {
  background: #f3f4f6;
}

.strategy-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.strategy-allocation {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.strategy-divider {
  color: #9ca3af;
}

.strategy-expected {
  font-size: 12px;
  color: #6b7280;
}

.expected-tag {
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 4px;
}

.strategy-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.strategy-rate {
  font-size: 18px;
  font-weight: 700;
}

.confidence-interval {
  font-size: 11px;
  color: #9ca3af;
}

/* 提示信息 */
.tips-section {
  background: #f0fdf4;
  border-radius: 12px;
  padding: 20px 24px;
  border: 1px solid #bbf7d0;
}

.tips-section h4 {
  font-size: 15px;
  font-weight: 600;
  color: #166534;
  margin-bottom: 12px;
}

.tips-section ul {
  margin: 0;
  padding-left: 20px;
}

.tips-section li {
  font-size: 14px;
  color: #166534;
  margin-bottom: 6px;
}

.tips-section li:last-child {
  margin-bottom: 0;
}

/* 响应式 */
@media (max-width: 1024px) {
  .calculator-layout {
    grid-template-columns: 1fr;
  }

  .input-panel {
    position: static;
  }
}

@media (max-width: 640px) {
  .strategy-calculator {
    padding: 16px;
  }

  .allocation-display {
    flex-direction: column;
    gap: 12px;
  }

  .allocation-divider {
    transform: rotate(90deg);
  }

  .expected-results {
    flex-direction: column;
  }

  .target-inputs {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
