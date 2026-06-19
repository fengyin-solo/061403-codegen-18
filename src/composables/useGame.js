import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useGame() {
  const temperature = ref(80)
  const heat = ref(50)
  const wood = ref(10)
  const food = ref(5)
  const hide = ref(0)
  const tools = ref(0)
  const isDay = ref(true)
  const dayCount = ref(1)
  const isBlizzard = ref(false)
  const gameOver = ref(false)
  const gameOverReason = ref('')
  const actionLog = ref([])

  const memorialBook = ref({
    startTime: null,
    endTime: null,
    survivedDays: 0,
    deathReason: '',
    finalStats: {},
    peakResources: {
      wood: 0,
      food: 0,
      hide: 0,
      tools: 0,
      heat: 0,
      temperature: 0
    },
    keyEvents: [],
    dailyStats: [],
    totalActions: {
      chopWood: 0,
      hunt: 0,
      huntSuccess: 0,
      makeTools: 0,
      makeFire: 0,
      eatFood: 0
    },
    blizzardCount: 0
  })

  let hasHuntedSuccessfully = false
  let hasMadeTools = false
  let hasMadeFire = false
  let milestone5Days = false
  let milestone10Days = false
  let milestone20Days = false

  const DAY_DURATION = 30000
  const NIGHT_DURATION = 20000
  const HEAT_CONSUMPTION_RATE = 2
  const BLIZZARD_CHANCE = 0.15

  let dayNightTimer = null
  let nightConsumptionTimer = null
  let autoSaveTimer = null

  const isNight = computed(() => !isDay.value)
  const isDanger = computed(() => temperature.value < 30)
  const canMakeFire = computed(() => wood.value >= 3)
  const canHunt = computed(() => tools.value > 0)
  const huntSuccessRate = computed(() => 0.3 + tools.value * 0.15)

  function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString()
    actionLog.value.unshift({ message, type, timestamp })
    if (actionLog.value.length > 20) {
      actionLog.value.pop()
    }
  }

  function recordKeyEvent(description, type = 'event', icon = '📌') {
    memorialBook.value.keyEvents.push({
      day: dayCount.value,
      description,
      type,
      icon,
      timestamp: Date.now(),
      isDay: isDay.value
    })
  }

  function updatePeakResources() {
    if (wood.value > memorialBook.value.peakResources.wood) {
      memorialBook.value.peakResources.wood = wood.value
    }
    if (food.value > memorialBook.value.peakResources.food) {
      memorialBook.value.peakResources.food = food.value
    }
    if (hide.value > memorialBook.value.peakResources.hide) {
      memorialBook.value.peakResources.hide = hide.value
    }
    if (tools.value > memorialBook.value.peakResources.tools) {
      memorialBook.value.peakResources.tools = tools.value
    }
    if (heat.value > memorialBook.value.peakResources.heat) {
      memorialBook.value.peakResources.heat = Math.round(heat.value)
    }
    if (temperature.value > memorialBook.value.peakResources.temperature) {
      memorialBook.value.peakResources.temperature = temperature.value
    }
  }

  function recordDailyStats() {
    memorialBook.value.dailyStats.push({
      day: dayCount.value,
      endTemperature: temperature.value,
      endHeat: Math.round(heat.value),
      wood: wood.value,
      food: food.value,
      hide: hide.value,
      tools: tools.value,
      hadBlizzard: isBlizzard.value
    })
  }

  function checkMilestones() {
    if (dayCount.value >= 5 && !milestone5Days) {
      milestone5Days = true
      recordKeyEvent('成功存活 5 天！营地初具规模', 'milestone', '🏆')
    }
    if (dayCount.value >= 10 && !milestone10Days) {
      milestone10Days = true
      recordKeyEvent('存活 10 天！你是真正的生存专家', 'milestone', '🎖️')
    }
    if (dayCount.value >= 20 && !milestone20Days) {
      milestone20Days = true
      recordKeyEvent('传奇诞生！存活 20 天以上', 'milestone', '👑')
    }
  }

  function finalizeMemorialBook() {
    memorialBook.value.endTime = Date.now()
    memorialBook.value.survivedDays = dayCount.value
    memorialBook.value.deathReason = gameOverReason.value
    memorialBook.value.finalStats = {
      temperature: temperature.value,
      heat: Math.round(heat.value),
      wood: wood.value,
      food: food.value,
      hide: hide.value,
      tools: tools.value
    }
  }

  function checkGameOver() {
    if (temperature.value <= 20) {
      gameOver.value = true
      gameOverReason.value = '体温过低，你在严寒中失去了意识...'
      stopTimers()
      finalizeMemorialBook()
      addLog('游戏结束：体温过低！', 'danger')
    }
    if (temperature.value >= 100) {
      temperature.value = 100
    }
  }

  function consumeHeat() {
    if (gameOver.value) return
    
    const multiplier = isBlizzard.value ? 2 : 1
    const consumption = HEAT_CONSUMPTION_RATE * multiplier
    
    if (heat.value >= consumption) {
      heat.value -= consumption
      if (temperature.value < 80) {
        temperature.value = Math.min(80, temperature.value + 1)
      }
    } else {
      heat.value = 0
      temperature.value = Math.max(0, temperature.value - consumption)
      addLog('热量不足！体温正在下降...', 'warning')
    }
    
    checkGameOver()
  }

  function startNightCycle() {
    addLog(`夜幕降临，第 ${dayCount.value} 天结束`, 'info')
    recordDailyStats()
    nightConsumptionTimer = setInterval(() => {
      consumeHeat()
    }, 1000)
    
    if (Math.random() < BLIZZARD_CHANCE) {
      triggerBlizzard()
    }
  }

  function startDayCycle() {
    dayCount.value++
    addLog(`天亮了，第 ${dayCount.value} 天开始`, 'success')
    checkMilestones()
    isBlizzard.value = false
    if (nightConsumptionTimer) {
      clearInterval(nightConsumptionTimer)
      nightConsumptionTimer = null
    }
  }

  function toggleDayNight() {
    isDay.value = !isDay.value
    if (isDay.value) {
      startDayCycle()
    } else {
      startNightCycle()
    }
  }

  function triggerBlizzard() {
    isBlizzard.value = true
    memorialBook.value.blizzardCount++
    recordKeyEvent('暴风雪来袭！所有消耗加倍', 'danger', '🌨️')
    addLog('⚠️ 暴风雪来袭！所有消耗加倍！', 'danger')
  }

  function chopWood() {
    if (gameOver.value || isNight.value) return
    
    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 5 * multiplier
    
    temperature.value = Math.max(0, temperature.value - tempCost)
    const woodGained = Math.floor(Math.random() * 3) + 2
    wood.value += woodGained
    
    memorialBook.value.totalActions.chopWood++
    updatePeakResources()
    
    addLog(`砍柴：获得 ${woodGained} 木头，消耗 ${tempCost} 体温`, 'action')
    
    if (Math.random() < BLIZZARD_CHANCE * 0.5) {
      triggerBlizzard()
    }
    
    checkGameOver()
  }

  function hunt() {
    if (gameOver.value || isNight.value) return
    
    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 8 * multiplier
    
    temperature.value = Math.max(0, temperature.value - tempCost)
    
    memorialBook.value.totalActions.hunt++
    
    if (Math.random() < huntSuccessRate.value) {
      const foodGained = Math.floor(Math.random() * 3) + 2
      const hideGained = Math.floor(Math.random() * 2) + 1
      food.value += foodGained
      hide.value += hideGained
      
      memorialBook.value.totalActions.huntSuccess++
      updatePeakResources()
      
      if (!hasHuntedSuccessfully) {
        hasHuntedSuccessfully = true
        recordKeyEvent('首次狩猎成功！你证明了自己的生存能力', 'achievement', '🎯')
      }
      
      addLog(`狩猎成功：获得 ${foodGained} 食物，${hideGained} 兽皮，消耗 ${tempCost} 体温`, 'success')
    } else {
      addLog(`狩猎失败：消耗 ${tempCost} 体温，空手而归`, 'warning')
    }
    
    if (Math.random() < BLIZZARD_CHANCE * 0.5) {
      triggerBlizzard()
    }
    
    checkGameOver()
  }

  function makeTools() {
    if (gameOver.value || isNight.value) return
    if (wood.value < 2 || hide.value < 1) {
      addLog('材料不足：需要 2 木头和 1 兽皮', 'warning')
      return
    }
    
    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 6 * multiplier
    
    wood.value -= 2
    hide.value -= 1
    tools.value += 1
    temperature.value = Math.max(0, temperature.value - tempCost)
    
    memorialBook.value.totalActions.makeTools++
    updatePeakResources()
    
    if (!hasMadeTools) {
      hasMadeTools = true
      recordKeyEvent('首次制作工具！你的生存效率将大大提升', 'achievement', '🔧')
    }
    
    addLog(`制作工具：获得 1 工具，消耗 ${tempCost} 体温`, 'success')
    checkGameOver()
  }

  function makeFire() {
    if (gameOver.value || !canMakeFire.value) {
      addLog('木头不足：生火需要 3 木头', 'warning')
      return
    }
    
    wood.value -= 3
    const heatGained = Math.floor(Math.random() * 20) + 25
    heat.value = Math.min(100, heat.value + heatGained)
    temperature.value = Math.min(100, temperature.value + 10)
    
    memorialBook.value.totalActions.makeFire++
    updatePeakResources()
    
    if (!hasMadeFire) {
      hasMadeFire = true
      recordKeyEvent('首次生火成功！温暖重新回到了营地', 'achievement', '🔥')
    }
    
    addLog(`生火：获得 ${heatGained} 热量，体温上升 10`, 'success')
  }

  function eatFood() {
    if (gameOver.value || food.value < 1) {
      addLog('没有食物了！', 'warning')
      return
    }
    
    food.value -= 1
    const tempGained = Math.floor(Math.random() * 10) + 5
    temperature.value = Math.min(100, temperature.value + tempGained)
    
    memorialBook.value.totalActions.eatFood++
    updatePeakResources()
    
    addLog(`进食：体温恢复 ${tempGained}`, 'success')
  }

  function startTimers() {
    dayNightTimer = setInterval(() => {
      toggleDayNight()
    }, isDay.value ? DAY_DURATION : NIGHT_DURATION)
    
    autoSaveTimer = setInterval(() => {
      saveGame('auto')
    }, 10000)
  }

  function stopTimers() {
    if (dayNightTimer) {
      clearInterval(dayNightTimer)
      dayNightTimer = null
    }
    if (nightConsumptionTimer) {
      clearInterval(nightConsumptionTimer)
      nightConsumptionTimer = null
    }
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  function saveGame(slot = 'manual') {
    const gameState = {
      temperature: temperature.value,
      heat: heat.value,
      wood: wood.value,
      food: food.value,
      hide: hide.value,
      tools: tools.value,
      isDay: isDay.value,
      dayCount: dayCount.value,
      isBlizzard: isBlizzard.value,
      savedAt: Date.now()
    }
    localStorage.setItem(`snowSurvival_${slot}`, JSON.stringify(gameState))
    addLog(`游戏已保存到存档位：${slot === 'auto' ? '自动存档' : slot}`, 'info')
  }

  function loadGame(slot = 'auto') {
    const saved = localStorage.getItem(`snowSurvival_${slot}`)
    if (!saved) {
      addLog('没有找到存档', 'warning')
      return false
    }
    
    try {
      const gameState = JSON.parse(saved)
      temperature.value = gameState.temperature
      heat.value = gameState.heat
      wood.value = gameState.wood
      food.value = gameState.food
      hide.value = gameState.hide
      tools.value = gameState.tools
      isDay.value = gameState.isDay
      dayCount.value = gameState.dayCount
      isBlizzard.value = gameState.isBlizzard
      gameOver.value = false
      gameOverReason.value = ''
      actionLog.value = []
      
      stopTimers()
      startTimers()
      
      if (!isDay.value) {
        startNightCycle()
      }
      
      addLog(`成功加载存档：${slot === 'auto' ? '自动存档' : slot}`, 'success')
      return true
    } catch (e) {
      addLog('存档损坏，无法加载', 'danger')
      return false
    }
  }

  function getSaveSlots() {
    const slots = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('snowSurvival_')) {
        const slotName = key.replace('snowSurvival_', '')
        try {
          const data = JSON.parse(localStorage.getItem(key))
          slots.push({
            name: slotName,
            dayCount: data.dayCount,
            savedAt: data.savedAt
          })
        } catch (e) {}
      }
    }
    return slots
  }

  function deleteSave(slot) {
    localStorage.removeItem(`snowSurvival_${slot}`)
    addLog(`已删除存档：${slot}`, 'info')
  }

  function resetMemorialBook() {
    memorialBook.value = {
      startTime: Date.now(),
      endTime: null,
      survivedDays: 0,
      deathReason: '',
      finalStats: {},
      peakResources: {
        wood: 10,
        food: 5,
        hide: 0,
        tools: 0,
        heat: 50,
        temperature: 80
      },
      keyEvents: [],
      dailyStats: [],
      totalActions: {
        chopWood: 0,
        hunt: 0,
        huntSuccess: 0,
        makeTools: 0,
        makeFire: 0,
        eatFood: 0
      },
      blizzardCount: 0
    }
    hasHuntedSuccessfully = false
    hasMadeTools = false
    hasMadeFire = false
    milestone5Days = false
    milestone10Days = false
    milestone20Days = false
  }

  function restartGame() {
    temperature.value = 80
    heat.value = 50
    wood.value = 10
    food.value = 5
    hide.value = 0
    tools.value = 0
    isDay.value = true
    dayCount.value = 1
    isBlizzard.value = false
    gameOver.value = false
    gameOverReason.value = ''
    actionLog.value = []
    
    resetMemorialBook()
    recordKeyEvent('营地建立！开始你的雪地生存之旅', 'start', '🏕️')
    
    stopTimers()
    startTimers()
    
    addLog('新游戏开始！祝你好运！', 'success')
  }

  onMounted(() => {
    resetMemorialBook()
    recordKeyEvent('营地建立！开始你的雪地生存之旅', 'start', '🏕️')
    startTimers()
    addLog('欢迎来到雪地生存！白天收集资源，夜晚保持温暖。', 'info')
  })

  onUnmounted(() => {
    stopTimers()
  })

  return {
    temperature,
    heat,
    wood,
    food,
    hide,
    tools,
    isDay,
    isNight,
    dayCount,
    isBlizzard,
    gameOver,
    gameOverReason,
    actionLog,
    memorialBook,
    isDanger,
    canMakeFire,
    canHunt,
    huntSuccessRate,
    chopWood,
    hunt,
    makeTools,
    makeFire,
    eatFood,
    saveGame,
    loadGame,
    getSaveSlots,
    deleteSave,
    restartGame
  }
}
