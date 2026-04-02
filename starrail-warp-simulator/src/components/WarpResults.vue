<script setup lang="ts">
import { computed, ref } from 'vue';
import html2canvas from 'html2canvas';
import { type SimulationStats, type DistributionItem, WarpType } from '@/types/warp';

const props = defineProps<{
  stats: SimulationStats;
  warpType: WarpType;
}>();

// 是否有限定池
const isLimitedPool = computed(() => {
  return props.warpType !== WarpType.STANDARD;
});

// 是否有批量模拟数据
const hasBatchStats = computed(() => {
  return props.stats.batchStats !== undefined;
});

// 计算直方图最大高度百分比
const getMaxPercentage = (distribution: DistributionItem[] | undefined): number => {
  if (!distribution?.length) return 0;
  return Math.max(...distribution.map(d => d.percentage));
};

// 当前选中的直方图类型
const activeHistogram = computed(() => {
  if (!props.stats.batchStats) return 'upFiveStar';
  // 默认显示UP五星分布，常驻池显示五星分布
  return isLimitedPool.value ? 'upFiveStar' : 'fiveStar';
});

// 导出状态
const isExporting = ref(false);
const exportMessage = ref('');

// 导出统计为图片到剪贴板
const exportStats = async () => {
  const batchStatsEl = document.querySelector('.batch-stats');
  if (!batchStatsEl) {
    exportMessage.value = '未找到统计内容';
    setTimeout(() => exportMessage.value = '', 2000);
    return;
  }

  isExporting.value = true;
  exportMessage.value = '';

  try {
    const canvas = await html2canvas(batchStatsEl as HTMLElement, {
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

    // 转换为 blob
    const blob = await new Promise<Blob>((resolve) => {
      newCanvas.toBlob((b) => resolve(b!), 'image/png');
    });

    // 复制到剪贴板
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);

    exportMessage.value = '已复制到剪贴板';
  } catch (error) {
    console.error('导出失败:', error);
    exportMessage.value = '导出失败';
  } finally {
    isExporting.value = false;
    setTimeout(() => exportMessage.value = '', 2000);
  }
};
</script>

<template>
  <div class="warp-results">
    <!-- 单次模拟统计概览 -->
    <div v-if="!hasBatchStats" class="stats-overview">
      <h3>统计概览</h3>
      <div class="stats-grid">
        <div class="stat-card five-star">
          <div class="stat-value">{{ stats.fiveStarCount }}</div>
          <div class="stat-label">五星总数</div>
        </div>
        
        <div class="stat-card four-star">
          <div class="stat-value">{{ stats.fourStarCount }}</div>
          <div class="stat-label">四星总数</div>
        </div>
        
        <div class="stat-card three-star">
          <div class="stat-value">{{ stats.threeStarCount }}</div>
          <div class="stat-label">三星总数</div>
        </div>
        
        <div class="stat-card total">
          <div class="stat-value">{{ stats.totalPulls }}</div>
          <div class="stat-label">总抽数</div>
        </div>
        
        <div v-if="isLimitedPool" class="stat-card up-five">
          <div class="stat-value">{{ stats.upFiveStarCount }}</div>
          <div class="stat-label">UP五星</div>
        </div>
        
        <div v-if="isLimitedPool" class="stat-card lost">
          <div class="stat-value">{{ stats.lostFiftyFiftyCount }}</div>
          <div class="stat-label">歪了次数</div>
        </div>
        
        <div class="stat-card avg-pity">
          <div class="stat-value">{{ stats.averageFiveStarPity || '-' }}</div>
          <div class="stat-label">平均保底</div>
        </div>
        
        <div class="stat-card rate">
          <div class="stat-value">
            {{ stats.totalPulls > 0 ? ((stats.fiveStarCount / stats.totalPulls) * 100).toFixed(2) : '0.00' }}%
          </div>
          <div class="stat-label">五星概率</div>
        </div>
      </div>
    </div>

    <!-- 批量模拟统计 -->
    <div v-if="hasBatchStats && stats.batchStats" class="batch-stats">
      <div class="batch-header">
        <h3>批量模拟统计</h3>
        <button
          class="export-btn"
          :disabled="isExporting"
          @click="exportStats"
        >
          <svg v-if="!isExporting" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinning">
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          </svg>
          {{ isExporting ? '导出中...' : '复制图片' }}
        </button>
      </div>
      <div v-if="exportMessage" class="export-message">{{ exportMessage }}</div>
      
      <!-- 基础信息 -->
      <div class="batch-info">
        <div class="batch-info-item">
          <span class="batch-info-label">模拟次数</span>
          <span class="batch-info-value">{{ stats.batchStats.simulationCount.toLocaleString() }} 次</span>
        </div>
        <div class="batch-info-item">
          <span class="batch-info-label">每次抽数</span>
          <span class="batch-info-value">{{ stats.batchStats.pullCountPerSim }} 抽</span>
        </div>
      </div>

      <!-- 平均值统计 -->
      <div class="avg-stats-grid">
        <div class="avg-stat-card">
          <div class="avg-stat-value">{{ stats.batchStats.avgUpFiveStar }}</div>
          <div class="avg-stat-label">平均UP五星</div>
        </div>
        <div class="avg-stat-card">
          <div class="avg-stat-value">{{ stats.batchStats.avgFiveStar }}</div>
          <div class="avg-stat-label">平均五星</div>
        </div>
        <div class="avg-stat-card">
          <div class="avg-stat-value">{{ stats.batchStats.avgFourStar }}</div>
          <div class="avg-stat-label">平均四星</div>
        </div>
      </div>

      <!-- 实际消耗抽数（启用四星返抽时显示） -->
      <div v-if="stats.batchStats.avgActualPullsUsed > 0" class="actual-pulls-section">
        <div class="actual-pulls-card">
          <div class="actual-pulls-label">平均实际消耗抽数</div>
          <div class="actual-pulls-value">{{ stats.batchStats.avgActualPullsUsed }} 抽</div>
          <div class="actual-pulls-hint">每抽到1个四星返还1抽</div>
        </div>
      </div>

      <!-- 概率统计（限定池） -->
      <div v-if="isLimitedPool" class="prob-stats">
        <h4>UP五星获取概率</h4>
        <div class="prob-grid">
          <div class="prob-item">
            <span class="prob-value">{{ stats.batchStats.probAtLeast1Up }}%</span>
            <span class="prob-label">至少1个UP</span>
          </div>
          <div class="prob-item">
            <span class="prob-value">{{ stats.batchStats.probAtLeast2Up }}%</span>
            <span class="prob-label">至少2个UP</span>
          </div>
          <div class="prob-item">
            <span class="prob-value">{{ stats.batchStats.probAtLeast3Up }}%</span>
            <span class="prob-label">至少3个UP</span>
          </div>
        </div>
      </div>

      <!-- UP五星数量分布直方图（限定池） -->
      <div v-if="isLimitedPool" class="histogram-section">
        <h4>UP五星数量分布</h4>
        <div class="histogram-container">
          <div class="histogram-bars">
            <div
              v-for="item in stats.batchStats.upFiveStarDistribution"
              :key="item.value"
              class="histogram-bar-wrapper"
            >
              <div
                class="histogram-bar up-five-bar"
                :style="{ flex: getMaxPercentage(stats.batchStats.upFiveStarDistribution) > 0 ? (item.percentage / getMaxPercentage(stats.batchStats.upFiveStarDistribution)) : 0 }"
                :title="`${item.value}个: ${item.count}次 (${item.percentage}%)`"
              >
                <span class="bar-percentage">{{ item.percentage }}%</span>
              </div>
              <div class="bar-label">{{ item.value }}个</div>
            </div>
          </div>
          <div class="histogram-x-label">UP五星数量</div>
        </div>
      </div>

      <!-- 五星数量分布直方图 -->
      <div class="histogram-section">
        <h4>五星数量分布</h4>
        <div class="histogram-container">
          <div class="histogram-bars">
            <div
              v-for="item in stats.batchStats.fiveStarDistribution"
              :key="item.value"
              class="histogram-bar-wrapper"
            >
              <div
                class="histogram-bar five-star-bar"
                :style="{ flex: getMaxPercentage(stats.batchStats.fiveStarDistribution) > 0 ? (item.percentage / getMaxPercentage(stats.batchStats.fiveStarDistribution)) : 0 }"
                :title="`${item.value}个: ${item.count}次 (${item.percentage}%)`"
              >
                <span class="bar-percentage">{{ item.percentage }}%</span>
              </div>
              <div class="bar-label">{{ item.value }}个</div>
            </div>
          </div>
          <div class="histogram-x-label">五星数量</div>
        </div>
      </div>

      <!-- 四星数量分布直方图 -->
      <div class="histogram-section">
        <h4>四星数量分布</h4>
        <div class="histogram-container">
          <div class="histogram-bars">
            <div
              v-for="item in stats.batchStats.fourStarDistribution"
              :key="item.value"
              class="histogram-bar-wrapper"
            >
              <div
                class="histogram-bar four-star-bar"
                :style="{ flex: getMaxPercentage(stats.batchStats.fourStarDistribution) > 0 ? (item.percentage / getMaxPercentage(stats.batchStats.fourStarDistribution)) : 0 }"
                :title="`${item.value}个: ${item.count}次 (${item.percentage}%)`"
              >
                <span class="bar-percentage">{{ item.percentage }}%</span>
              </div>
              <div class="bar-label">{{ item.value }}个</div>
            </div>
          </div>
          <div class="histogram-x-label">四星数量</div>
        </div>
      </div>

      <!-- 歪的次数分布直方图（限定池） -->
      <div v-if="isLimitedPool && stats.batchStats.lostFiftyFiftyDistribution.length > 0" class="histogram-section">
        <h4>歪的次数分布</h4>
        <div class="histogram-container">
          <div class="histogram-bars">
            <div
              v-for="item in stats.batchStats.lostFiftyFiftyDistribution"
              :key="item.value"
              class="histogram-bar-wrapper"
            >
              <div
                class="histogram-bar lost-bar"
                :style="{ flex: getMaxPercentage(stats.batchStats.lostFiftyFiftyDistribution) > 0 ? (item.percentage / getMaxPercentage(stats.batchStats.lostFiftyFiftyDistribution)) : 0 }"
                :title="`歪${item.value}次: ${item.count}次 (${item.percentage}%)`"
              >
                <span class="bar-percentage">{{ item.percentage }}%</span>
              </div>
              <div class="bar-label">{{ item.value }}次</div>
            </div>
          </div>
          <div class="histogram-x-label">歪的次数</div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="stats.totalPulls === 0 && !hasBatchStats" class="empty-state">
      <div class="empty-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      </div>
      <p>还没有模拟数据</p>
      <p class="empty-hint">设置参数后点击"开始模拟"开始统计</p>
    </div>
  </div>
</template>

<style scoped>
.warp-results {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  color: #1f2937;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  max-height: 80vh;
  overflow-y: auto;
}

h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

/* 统计概览 */
.stats-overview {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
}

.stat-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.stat-card:hover {
  background: #f3f4f6;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

.stat-card.five-star .stat-value {
  color: #d97706;
}

.stat-card.four-star .stat-value {
  color: #7c3aed;
}

.stat-card.three-star .stat-value {
  color: #2563eb;
}

.stat-card.up-five .stat-value {
  color: #ea580c;
}

.stat-card.lost .stat-value {
  color: #dc2626;
}

/* 批量模拟统计 */
.batch-stats {
  margin-bottom: 24px;
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.batch-header h3 {
  margin: 0;
  color: #374151;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.export-btn:hover:not(:disabled) {
  background: #2563eb;
}

.export-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.export-btn svg {
  flex-shrink: 0;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.export-message {
  text-align: center;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: #dcfce7;
  color: #166534;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.batch-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.batch-info-item {
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px 16px;
  text-align: center;
  border: 1px solid #e5e7eb;
}

.batch-info-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.batch-info-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

/* 平均值统计 */
.avg-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.avg-stat-card {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  border: 1px solid #fcd34d;
}

.avg-stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #d97706;
  margin-bottom: 4px;
}

.avg-stat-label {
  font-size: 12px;
  color: #92400e;
}

/* 实际消耗抽数 */
.actual-pulls-section {
  margin-bottom: 24px;
}

.actual-pulls-card {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 1px solid #93c5fd;
}

.actual-pulls-label {
  font-size: 14px;
  color: #1e40af;
  margin-bottom: 8px;
  font-weight: 500;
}

.actual-pulls-value {
  font-size: 32px;
  font-weight: 700;
  color: #1d4ed8;
  margin-bottom: 4px;
}

.actual-pulls-hint {
  font-size: 12px;
  color: #3b82f6;
}

/* 概率统计 */
.prob-stats {
  background: #f0fdf4;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  border: 1px solid #bbf7d0;
}

.prob-stats h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #166534;
  text-align: center;
}

.prob-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.prob-item {
  text-align: center;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #86efac;
}

.prob-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #16a34a;
  margin-bottom: 4px;
}

.prob-label {
  font-size: 12px;
  color: #166534;
}

/* 直方图 */
.histogram-section {
  background: #f9fafb;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
}

.histogram-section h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #374151;
  text-align: center;
}

.histogram-container {
  position: relative;
}

.histogram-bars {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  height: 220px;
  padding-bottom: 24px;
  overflow-x: auto;
}

.histogram-bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-width: 24px;
  flex: 1;
  max-width: 40px;
  height: 180px;
}

.histogram-bar {
  width: 100%;
  background: linear-gradient(to top, #3b82f6, #60a5fa);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  position: relative;
  transition: all 0.2s ease;
  flex: 1;
}

.histogram-bar:hover {
  background: linear-gradient(to top, #2563eb, #3b82f6);
}

/* UP五星直方图 - 橙色 */
.histogram-bar.up-five-bar {
  background: linear-gradient(to top, #ea580c, #fb923c);
}

.histogram-bar.up-five-bar:hover {
  background: linear-gradient(to top, #c2410c, #ea580c);
}

/* 五星直方图 - 金色 */
.histogram-bar.five-star-bar {
  background: linear-gradient(to top, #d97706, #fbbf24);
}

.histogram-bar.five-star-bar:hover {
  background: linear-gradient(to top, #b45309, #d97706);
}

/* 四星直方图 - 紫色 */
.histogram-bar.four-star-bar {
  background: linear-gradient(to top, #7c3aed, #a78bfa);
}

.histogram-bar.four-star-bar:hover {
  background: linear-gradient(to top, #6d28d9, #7c3aed);
}

/* 歪了直方图 - 红色 */
.histogram-bar.lost-bar {
  background: linear-gradient(to top, #dc2626, #f87171);
}

.histogram-bar.lost-bar:hover {
  background: linear-gradient(to top, #b91c1c, #dc2626);
}

.bar-percentage {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #1f2937;
  font-weight: 600;
  white-space: nowrap;
}

.bar-label {
  margin-top: 6px;
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
}

.histogram-x-label {
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 8px;
}

/* 结果列表 */
.results-section {
  margin-bottom: 24px;
}

.results-section h3 {
  margin-bottom: 12px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid transparent;
}

.result-item.five-star-item {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.result-item.four-star-item {
  border-left-color: #a855f7;
  background: #faf5ff;
}

.result-item.is-up {
  background: #fff7ed;
}

.result-item.not-up {
  background: #fef2f2;
}

.item-type {
  font-size: 12px;
  color: #6b7280;
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.item-name {
  flex: 1;
  font-size: 14px;
  color: #1f2937;
}

.up-badge {
  background: #f59e0b;
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.up-badge.small {
  padding: 2px 8px;
  font-size: 10px;
}

.lost-badge {
  background: #ef4444;
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.guaranteed-badge {
  background: #10b981;
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.more-items {
  text-align: center;
  color: #6b7280;
  font-size: 14px;
  padding: 8px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-state p {
  color: #6b7280;
  margin: 0;
}

.empty-hint {
  font-size: 14px;
  margin-top: 8px !important;
}

/* 滚动条样式 */
.warp-results::-webkit-scrollbar {
  width: 6px;
}

.warp-results::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.warp-results::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.warp-results::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
