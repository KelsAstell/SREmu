<script setup lang="ts">
import { computed } from 'vue';
import { WarpType } from '@/types/warp';

const props = defineProps<{
  modelValue: WarpType;
  pullCount: number;
  simulationCount: number;
  enableFourStarBonus?: boolean;
  enableInitialPity?: boolean;
  initialPity?: {
    fiveStarPity: number;
    fourStarPity: number;
    fiveStarGuaranteed: boolean;
    fourStarGuaranteed: boolean;
  };
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: WarpType): void;
  (e: 'update:pullCount', value: number): void;
  (e: 'update:simulationCount', value: number): void;
  (e: 'update:enableFourStarBonus', value: boolean): void;
  (e: 'update:enableInitialPity', value: boolean): void;
  (e: 'update:initialPity', value: { fiveStarPity: number; fourStarPity: number; fiveStarGuaranteed: boolean; fourStarGuaranteed: boolean }): void;
  (e: 'simulate'): void;
  (e: 'reset'): void;
}>();

const warpTypes = [
  { value: WarpType.STANDARD, label: '群星跃迁', desc: '常驻池', color: '#7c3aed' },
  { value: WarpType.CHARACTER, label: '角色活动跃迁', desc: '角色限定池', color: '#ea580c' },
  { value: WarpType.LIGHT_CONE, label: '光锥活动跃迁', desc: '光锥限定池', color: '#0284c7' }
];

const currentType = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// 单次抽卡数（手动输入不限制最大值）
const localPullCount = computed({
  get: () => props.pullCount,
  set: (val) => emit('update:pullCount', Math.max(1, val))
});

// 模拟次数
const localSimulationCount = computed({
  get: () => props.simulationCount,
  set: (val) => emit('update:simulationCount', Math.max(1, Math.min(100000, val)))
});

// 快速设置抽卡数
const quickSetPull = (count: number) => {
  localPullCount.value = count;
};

// 快速设置模拟次数
const quickSetSimulation = (count: number) => {
  localSimulationCount.value = count;
};

// 四星返抽开关
const localEnableFourStarBonus = computed({
  get: () => props.enableFourStarBonus ?? false,
  set: (val) => emit('update:enableFourStarBonus', val)
});

// 垫池子开关
const localEnableInitialPity = computed({
  get: () => props.enableInitialPity ?? false,
  set: (val) => emit('update:enableInitialPity', val)
});

// 初始保底进度
const localInitialPity = computed({
  get: () => props.initialPity ?? { fiveStarPity: 0, fourStarPity: 0, fiveStarGuaranteed: false, fourStarGuaranteed: false },
  set: (val) => emit('update:initialPity', val)
});

// 获取当前池子的保底上限
const getPityLimit = (type: WarpType) => {
  switch (type) {
    case WarpType.LIGHT_CONE:
      return 80;
    default:
      return 90;
  }
};
</script>

<template>
  <div class="warp-controls">
    <!-- 跃迁类型选择 -->
    <div class="warp-type-selector">
      <h3>选择跃迁类型</h3>
      <div class="type-buttons">
        <button
          v-for="type in warpTypes"
          :key="type.value"
          class="type-btn"
          :class="{ active: currentType === type.value }"
          @click="currentType = type.value"
        >
          <span class="type-label">{{ type.label }}</span>
          <span class="type-desc">{{ type.desc }}</span>
        </button>
      </div>
    </div>

    <!-- 抽数控制 -->
    <div class="pull-control">
      <h3>每次模拟抽数</h3>
      <p class="control-desc">每次模拟最多抽多少抽</p>
      <div class="pull-input-section">
        <div class="slider-section">
          <div class="slider-header">
            <span class="slider-label">抽卡次数</span>
            <span class="slider-value">{{ localPullCount }} 抽</span>
          </div>
          <input
            type="range"
            v-model.number="localPullCount"
            min="1"
            max="1000"
            class="slider"
          />
          <div class="slider-hints">
            <span>1</span>
            <span>250</span>
            <span>500</span>
            <span>750</span>
            <span>1000</span>
          </div>
        </div>

        <div class="input-section">
          <label>精确输入：</label>
          <input
            type="number"
            v-model.number="localPullCount"
            min="1"
            max="1000"
            class="pull-input"
          />
        </div>

        <div class="quick-buttons">
          <button @click="quickSetPull(1)">1抽</button>
          <button @click="quickSetPull(10)">10抽</button>
          <button @click="quickSetPull(90)">90抽</button>
          <button @click="quickSetPull(180)">180抽</button>
        </div>
      </div>
    </div>

    <!-- 模拟次数控制 -->
    <div class="simulation-control">
      <h3>模拟次数</h3>
      <p class="control-desc">总共进行多少次模拟</p>
      <div class="simulation-input-section">
        <div class="slider-section">
          <div class="slider-header">
            <span class="slider-label">模拟次数</span>
            <span class="slider-value">{{ localSimulationCount.toLocaleString() }} 次</span>
          </div>
          <input
            type="range"
            v-model.number="localSimulationCount"
            min="1"
            max="10000"
            step="100"
            class="slider"
          />
          <div class="slider-hints">
            <span>1</span>
            <span>2500</span>
            <span>5000</span>
            <span>7500</span>
            <span>10000</span>
          </div>
        </div>

        <div class="input-section">
          <label>精确输入：</label>
          <input
            type="number"
            v-model.number="localSimulationCount"
            min="1"
            max="100000"
            class="pull-input"
          />
        </div>

        <div class="quick-buttons">
          <button @click="quickSetSimulation(100)">100次</button>
          <button @click="quickSetSimulation(1000)">1000次</button>
          <button @click="quickSetSimulation(10000)">1万次</button>
        </div>
      </div>
    </div>

    <!-- 高级选项 -->
    <div class="advanced-options">
      <h3>高级选项</h3>
      <div class="option-item">
        <label class="toggle-label">
          <input
            type="checkbox"
            v-model="localEnableFourStarBonus"
            class="toggle-input"
          />
          <span class="toggle-slider"></span>
          <span class="toggle-text">
            <span class="toggle-title">四星返抽</span>
            <span class="toggle-desc">每抽到1个四星额外获得1抽（迭代计算）</span>
          </span>
        </label>
      </div>
      
      <div class="option-item">
        <label class="toggle-label">
          <input
            type="checkbox"
            v-model="localEnableInitialPity"
            class="toggle-input"
          />
          <span class="toggle-slider"></span>
          <span class="toggle-text">
            <span class="toggle-title">垫池子</span>
            <span class="toggle-desc">设置初始保底进度（已抽次数/大保底状态）</span>
          </span>
        </label>
      </div>
      
      <!-- 垫池子详细设置 -->
      <div v-if="localEnableInitialPity" class="pity-settings">
        <div class="pity-row">
          <div class="pity-field-label">五星保底进度</div>
          <div class="pity-slider-row">
            <input
              type="range"
              :value="localInitialPity.fiveStarPity"
              @input="localInitialPity = { ...localInitialPity, fiveStarPity: Number(($event.target as HTMLInputElement).value) }"
              min="0"
              :max="getPityLimit(props.modelValue) - 1"
              class="pity-slider"
            />
            <span class="pity-count">{{ localInitialPity.fiveStarPity }} / {{ getPityLimit(props.modelValue) - 1 }}</span>
          </div>
        </div>
        
        <div class="pity-row">
          <div class="pity-field-label">四星保底进度</div>
          <div class="pity-slider-row">
            <input
              type="range"
              :value="localInitialPity.fourStarPity"
              @input="localInitialPity = { ...localInitialPity, fourStarPity: Number(($event.target as HTMLInputElement).value) }"
              min="0"
              max="9"
              class="pity-slider"
            />
            <span class="pity-count">{{ localInitialPity.fourStarPity }} / 9</span>
          </div>
        </div>
        
        <div class="pity-checks">
          <label class="pity-check">
            <input
              type="checkbox"
              :checked="localInitialPity.fiveStarGuaranteed"
              @change="localInitialPity = { ...localInitialPity, fiveStarGuaranteed: ($event.target as HTMLInputElement).checked }"
            />
            <span>五星大保底</span>
          </label>
          <label class="pity-check" v-if="currentType !== WarpType.STANDARD">
            <input
              type="checkbox"
              :checked="localInitialPity.fourStarGuaranteed"
              @change="localInitialPity = { ...localInitialPity, fourStarGuaranteed: ($event.target as HTMLInputElement).checked }"
            />
            <span>四星大保底</span>
          </label>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button class="simulate-btn" @click="$emit('simulate')">
        开始模拟
      </button>
      <button class="reset-btn" @click="$emit('reset')">
        重置
      </button>
    </div>
  </div>
</template>

<style scoped>
.warp-controls {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  color: #1f2937;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.control-desc {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #6b7280;
}

/* 跃迁类型选择 */
.warp-type-selector {
  margin-bottom: 24px;
}

.type-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 14px 16px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #374151;
}

.type-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.type-btn.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.type-label {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 2px;
}

.type-desc {
  font-size: 13px;
  color: #6b7280;
}

/* 抽数控制 */
.pull-control {
  margin-bottom: 24px;
}

/* 模拟次数控制 */
.simulation-control {
  margin-bottom: 24px;
}

.simulation-input-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pull-input-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 滑块样式 */
.slider-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
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

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider-hints {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.input-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.input-section label {
  color: #6b7280;
  font-size: 14px;
}

.pull-input {
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

.pull-input:focus {
  outline: none;
  border-color: #3b82f6;
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

.quick-buttons button:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

/* 垫池子设置 */
.pity-settings {
  margin-top: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.pity-row {
  margin-bottom: 12px;
}

.pity-row:last-child {
  margin-bottom: 0;
}

.pity-field-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.pity-slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pity-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
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

.pity-count {
  font-size: 13px;
  font-weight: 600;
  color: #3b82f6;
  min-width: 60px;
  text-align: right;
}

.pity-checks {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.pity-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.pity-check input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
  cursor: pointer;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
}

.simulate-btn,
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

.simulate-btn {
  background: #3b82f6;
  color: #fff;
}

.simulate-btn:hover {
  background: #2563eb;
}

.reset-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.reset-btn:hover {
  background: #e5e7eb;
}

/* 高级选项 */
.advanced-options {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.advanced-options h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.option-item {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  width: 100%;
}

.toggle-input {
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

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle-input:checked + .toggle-slider {
  background: #3b82f6;
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-text {
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
  color: #6b7280;
}
</style>
