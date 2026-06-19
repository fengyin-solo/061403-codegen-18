<template>
  <div class="memorial-book-overlay" @click.self="$emit('close')">
    <div class="memorial-book">
      <div class="book-header">
        <div class="book-title">
          <span class="book-icon">📖</span>
          <h2>营地纪念册</h2>
          <span class="book-subtitle">{{ memorial.survivedDays }} 天的生存历程</span>
        </div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="book-content">
        <div class="section overview-section">
          <div class="section-header">
            <span class="section-icon">📋</span>
            <h3>历程概览</h3>
          </div>
          <div class="overview-cards">
            <div class="overview-card death-card">
              <div class="card-icon">💀</div>
              <div class="card-label">死亡原因</div>
              <div class="card-value">{{ memorial.deathReason }}</div>
            </div>
            <div class="overview-card days-card">
              <div class="card-icon">📅</div>
              <div class="card-label">存活天数</div>
              <div class="card-value">{{ memorial.survivedDays }} 天</div>
            </div>
            <div class="overview-card time-card">
              <div class="card-icon">⏱️</div>
              <div class="card-label">生存时长</div>
              <div class="card-value">{{ formatDuration(memorial.endTime - memorial.startTime) }}</div>
            </div>
            <div class="overview-card blizzard-card">
              <div class="card-icon">🌨️</div>
              <div class="card-label">经历暴风雪</div>
              <div class="card-value">{{ memorial.blizzardCount }} 次</div>
            </div>
          </div>
        </div>

        <div class="section peaks-section">
          <div class="section-header">
            <span class="section-icon">📊</span>
            <h3>资源巅峰</h3>
          </div>
          <div class="peaks-grid">
            <div class="peak-item" v-for="(value, key) in memorial.peakResources" :key="key">
              <div class="peak-icon">{{ getResourceIcon(key) }}</div>
              <div class="peak-label">{{ getResourceName(key) }}</div>
              <div class="peak-value">{{ value }}</div>
            </div>
          </div>
        </div>

        <div class="section events-section">
          <div class="section-header">
            <span class="section-icon">📌</span>
            <h3>关键事件</h3>
          </div>
          <div class="timeline">
            <div 
              v-for="(event, index) in memorial.keyEvents" 
              :key="index" 
              class="timeline-item"
              :class="event.type"
            >
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-day">第 {{ event.day }} 天</span>
                  <span class="timeline-period">{{ event.isDay ? '☀️ 白天' : '🌙 夜晚' }}</span>
                </div>
                <div class="timeline-description">
                  <span class="event-icon">{{ event.icon }}</span>
                  {{ event.description }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="section actions-section">
          <div class="section-header">
            <span class="section-icon">🎯</span>
            <h3>行动统计</h3>
          </div>
          <div class="actions-grid">
            <div class="action-stat">
              <div class="action-icon">🪓</div>
              <div class="action-label">砍柴</div>
              <div class="action-value">{{ memorial.totalActions.chopWood }} 次</div>
            </div>
            <div class="action-stat">
              <div class="action-icon">🏹</div>
              <div class="action-label">狩猎</div>
              <div class="action-value">
                {{ memorial.totalActions.hunt }} 次
                <span class="success-rate" v-if="memorial.totalActions.hunt > 0">
                  (成功率 {{ Math.round(memorial.totalActions.huntSuccess / memorial.totalActions.hunt * 100) }}%)
                </span>
              </div>
            </div>
            <div class="action-stat">
              <div class="action-icon">🔧</div>
              <div class="action-label">制作工具</div>
              <div class="action-value">{{ memorial.totalActions.makeTools }} 次</div>
            </div>
            <div class="action-stat">
              <div class="action-icon">🔥</div>
              <div class="action-label">生火</div>
              <div class="action-value">{{ memorial.totalActions.makeFire }} 次</div>
            </div>
            <div class="action-stat">
              <div class="action-icon">🍖</div>
              <div class="action-label">进食</div>
              <div class="action-value">{{ memorial.totalActions.eatFood }} 次</div>
            </div>
            <div class="action-stat">
              <div class="action-icon">✅</div>
              <div class="action-label">狩猎成功</div>
              <div class="action-value">{{ memorial.totalActions.huntSuccess }} 次</div>
            </div>
          </div>
        </div>

        <div class="section daily-section" v-if="memorial.dailyStats.length > 0">
          <div class="section-header">
            <span class="section-icon">📆</span>
            <h3>每日记录</h3>
          </div>
          <div class="daily-list">
            <div 
              v-for="(day, index) in memorial.dailyStats" 
              :key="index" 
              class="daily-item"
              :class="{ 'blizzard-day': day.hadBlizzard }"
            >
              <div class="day-number">
                第 {{ day.day }} 天
                <span v-if="day.hadBlizzard" class="blizzard-badge">🌨️</span>
              </div>
              <div class="day-stats">
                <span class="day-stat">🌡️ {{ day.endTemperature }}°C</span>
                <span class="day-stat">🔥 {{ day.endHeat }}</span>
                <span class="day-stat">🪵 {{ day.wood }}</span>
                <span class="day-stat">🍖 {{ day.food }}</span>
                <span class="day-stat">🦊 {{ day.hide }}</span>
                <span class="day-stat">🔧 {{ day.tools }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="section final-section">
          <div class="section-header">
            <span class="section-icon">🏁</span>
            <h3>最终状态</h3>
          </div>
          <div class="final-stats">
            <div class="final-stat" v-for="(value, key) in memorial.finalStats" :key="key">
              <span class="final-icon">{{ getResourceIcon(key) }}</span>
              <span class="final-label">{{ getResourceName(key) }}</span>
              <span class="final-value">{{ value }}</span>
            </div>
          </div>
        </div>

        <div class="epitaph">
          <div class="epitaph-icon">🕯️</div>
          <p>愿这份记录见证你在雪地中不屈的生存意志</p>
          <p class="epitaph-dates">
            {{ formatDate(memorial.startTime) }} - {{ formatDate(memorial.endTime) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  memorial: {
    type: Object,
    required: true
  }
})

defineEmits(['close'])

function getResourceIcon(key) {
  const icons = {
    wood: '🪵',
    food: '🍖',
    hide: '🦊',
    tools: '🔧',
    heat: '🔥',
    temperature: '🌡️'
  }
  return icons[key] || '📦'
}

function getResourceName(key) {
  const names = {
    wood: '木头',
    food: '食物',
    hide: '兽皮',
    tools: '工具',
    heat: '热量',
    temperature: '体温'
  }
  return names[key] || key
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}小时 ${minutes % 60}分钟`
  }
  if (minutes > 0) {
    return `${minutes}分钟 ${seconds % 60}秒`
  }
  return `${seconds}秒`
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.memorial-book-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  backdrop-filter: blur(8px);
  padding: 20px;
}

.memorial-book {
  background: linear-gradient(135deg, #2c1810 0%, #1a0f0a 100%);
  border: 3px solid #8b4513;
  border-radius: 15px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 0 50px rgba(139, 69, 19, 0.5), inset 0 0 30px rgba(0, 0, 0, 0.3);
  animation: bookOpen 0.6s ease;
}

@keyframes bookOpen {
  from {
    opacity: 0;
    transform: scale(0.8) rotateY(-15deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotateY(0);
  }
}

.book-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 2px solid rgba(139, 69, 19, 0.5);
  background: linear-gradient(180deg, rgba(139, 69, 19, 0.3) 0%, transparent 100%);
  position: sticky;
  top: 0;
  z-index: 10;
}

.book-title {
  text-align: center;
  flex: 1;
}

.book-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 10px;
}

.book-title h2 {
  color: #d4a574;
  margin: 0 0 5px 0;
  font-size: 28px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.book-subtitle {
  color: rgba(212, 165, 116, 0.7);
  font-size: 14px;
}

.close-btn {
  background: rgba(139, 69, 19, 0.5);
  border: 2px solid #8b4513;
  color: #d4a574;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #8b4513;
  transform: rotate(90deg);
}

.book-content {
  padding: 30px;
}

.section {
  margin-bottom: 35px;
  animation: fadeInUp 0.5s ease backwards;
}

.section:nth-child(1) { animation-delay: 0.1s; }
.section:nth-child(2) { animation-delay: 0.2s; }
.section:nth-child(3) { animation-delay: 0.3s; }
.section:nth-child(4) { animation-delay: 0.4s; }
.section:nth-child(5) { animation-delay: 0.5s; }
.section:nth-child(6) { animation-delay: 0.6s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(139, 69, 19, 0.5);
}

.section-icon {
  font-size: 24px;
}

.section-header h3 {
  color: #d4a574;
  margin: 0;
  font-size: 20px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.overview-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 69, 19, 0.4);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: transform 0.3s;
}

.overview-card:hover {
  transform: translateY(-3px);
  border-color: rgba(212, 165, 116, 0.6);
}

.card-icon {
  font-size: 36px;
  margin-bottom: 10px;
}

.card-label {
  color: rgba(212, 165, 116, 0.7);
  font-size: 13px;
  margin-bottom: 5px;
}

.card-value {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  line-height: 1.4;
}

.death-card .card-value {
  color: #e74c3c;
}

.peaks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.peak-item {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  transition: all 0.3s;
}

.peak-item:hover {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%);
  transform: scale(1.05);
}

.peak-icon {
  font-size: 28px;
  margin-bottom: 5px;
}

.peak-label {
  color: rgba(212, 165, 116, 0.8);
  font-size: 12px;
  margin-bottom: 3px;
}

.peak-value {
  color: #ffd700;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.timeline {
  position: relative;
  padding-left: 30px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, #8b4513 0%, #d4a574 50%, #8b4513 100%);
}

.timeline-item {
  position: relative;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border-left: 3px solid #8b4513;
}

.timeline-item.start {
  border-left-color: #2ecc71;
}

.timeline-item.achievement {
  border-left-color: #f39c12;
}

.timeline-item.milestone {
  border-left-color: #9b59b6;
}

.timeline-item.danger {
  border-left-color: #e74c3c;
}

.timeline-dot {
  position: absolute;
  left: -28px;
  top: 20px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #8b4513;
  border: 2px solid #d4a574;
  box-shadow: 0 0 10px rgba(212, 165, 116, 0.5);
}

.timeline-item.start .timeline-dot {
  background: #2ecc71;
  border-color: #27ae60;
}

.timeline-item.achievement .timeline-dot {
  background: #f39c12;
  border-color: #e67e22;
}

.timeline-item.milestone .timeline-dot {
  background: #9b59b6;
  border-color: #8e44ad;
}

.timeline-item.danger .timeline-dot {
  background: #e74c3c;
  border-color: #c0392b;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.timeline-day {
  color: #d4a574;
  font-weight: bold;
  font-size: 14px;
}

.timeline-period {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.timeline-description {
  color: #fff;
  font-size: 14px;
  line-height: 1.5;
}

.event-icon {
  margin-right: 6px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.action-stat {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 69, 19, 0.4);
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  transition: all 0.3s;
}

.action-stat:hover {
  background: rgba(139, 69, 19, 0.2);
  transform: translateY(-2px);
}

.action-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.action-label {
  color: rgba(212, 165, 116, 0.8);
  font-size: 12px;
  margin-bottom: 5px;
}

.action-value {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}

.success-rate {
  color: #2ecc71;
  font-size: 12px;
  font-weight: normal;
}

.daily-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(139, 69, 19, 0.3);
  border-radius: 8px;
}

.daily-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid rgba(139, 69, 19, 0.2);
  transition: background 0.2s;
}

.daily-item:last-child {
  border-bottom: none;
}

.daily-item:hover {
  background: rgba(139, 69, 19, 0.2);
}

.daily-item.blizzard-day {
  background: rgba(52, 152, 219, 0.1);
}

.day-number {
  color: #d4a574;
  font-weight: bold;
  font-size: 14px;
  min-width: 100px;
}

.blizzard-badge {
  margin-left: 5px;
  font-size: 12px;
}

.day-stats {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.day-stat {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}

.final-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.final-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 8px;
  padding: 12px;
}

.final-icon {
  font-size: 20px;
}

.final-label {
  color: rgba(212, 165, 116, 0.8);
  font-size: 12px;
  flex: 1;
}

.final-value {
  color: #e74c3c;
  font-size: 18px;
  font-weight: bold;
}

.epitaph {
  text-align: center;
  padding: 30px;
  margin-top: 20px;
  border-top: 2px solid rgba(139, 69, 19, 0.5);
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
}

.epitaph-icon {
  font-size: 40px;
  margin-bottom: 15px;
  animation: flicker 2s infinite;
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.epitaph p {
  color: rgba(212, 165, 116, 0.8);
  font-size: 14px;
  line-height: 1.8;
  margin: 0 0 10px 0;
  font-style: italic;
}

.epitaph-dates {
  color: rgba(212, 165, 116, 0.5);
  font-size: 12px;
}

.memorial-book::-webkit-scrollbar {
  width: 8px;
}

.memorial-book::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.memorial-book::-webkit-scrollbar-thumb {
  background: #8b4513;
  border-radius: 4px;
}

.memorial-book::-webkit-scrollbar-thumb:hover {
  background: #a0522d;
}

.daily-list::-webkit-scrollbar {
  width: 6px;
}

.daily-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.daily-list::-webkit-scrollbar-thumb {
  background: rgba(139, 69, 19, 0.5);
  border-radius: 3px;
}

@media (max-width: 600px) {
  .book-header {
    padding: 15px;
  }
  
  .book-title h2 {
    font-size: 22px;
  }
  
  .book-content {
    padding: 20px 15px;
  }
  
  .day-stats {
    gap: 8px;
  }
  
  .day-stat {
    font-size: 11px;
  }
}
</style>
