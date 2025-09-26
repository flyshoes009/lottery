// 全局变量
let isLotteryActive = false;
let drawnNumbers = new Set();
let participants = [];
let totalNumbers = 23; // 默认号码个数
let isConfigLocked = false; // 配置是否被锁定

// DOM元素
const elements = {
    statusText: document.getElementById('statusText'),
    participantCount: document.getElementById('participantCount'),
    totalNumbers: document.getElementById('totalNumbers'),
    configButton: document.getElementById('configButton'),
    configStatus: document.getElementById('configStatus'),
    classNumber: document.getElementById('classNumber'),
    drawButton: document.getElementById('drawButton'),
    result: document.getElementById('result'),
    numbersGrid: document.getElementById('numbersGrid'),
    resultsBody: document.getElementById('resultsBody'),
    exportButton: document.getElementById('exportButton'),
    resetButton: document.getElementById('resetButton'),
    resetModal: document.getElementById('resetModal'),
    resetPassword: document.getElementById('resetPassword'),
    confirmReset: document.getElementById('confirmReset'),
    cancelReset: document.getElementById('cancelReset')
};

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    loadConfig(); // 先加载配置
    loadLotteryState();
    bindEvents();
});

// 加载配置
async function loadConfig() {
    try {
        const response = await fetch('/.netlify/functions/config');
        const data = await response.json();
        
        if (data.success && data.config) {
            totalNumbers = data.config.totalNumbers || 23;
            isConfigLocked = data.config.isLocked || false;
            
            // 更新配置界面
            elements.totalNumbers.value = totalNumbers;
            updateConfigUI();
            
            // 初始化号码网格
            initializeNumbersGrid();
            
            showConfigStatus(`当前号码个数: ${totalNumbers}`, 'success');
        } else {
            // 使用默认配置
            initializeNumbersGrid();
        }
    } catch (error) {
        console.error('加载配置失败:', error);
        // 使用默认配置
        initializeNumbersGrid();
    }
}

// 更新配置界面
function updateConfigUI() {
    elements.configButton.disabled = isConfigLocked;
    elements.totalNumbers.disabled = isConfigLocked;
    
    if (isConfigLocked) {
        elements.configButton.textContent = '已锁定';
        showConfigStatus('抽签已开始，无法修改配置', 'error');
    } else {
        elements.configButton.textContent = '确认配置';
    }
}

// 显示配置状态
function showConfigStatus(message, type) {
    elements.configStatus.textContent = message;
    elements.configStatus.className = `config-status ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            if (elements.configStatus.textContent === message) {
                elements.configStatus.textContent = '';
                elements.configStatus.className = 'config-status';
            }
        }, 3000);
    }
}

// 处理配置更新
async function handleConfigUpdate() {
    const newTotalNumbers = parseInt(elements.totalNumbers.value);
    
    if (!newTotalNumbers || newTotalNumbers < 1 || newTotalNumbers > 100) {
        showConfigStatus('号码个数必须在1-100之间', 'error');
        return;
    }
    
    if (newTotalNumbers === totalNumbers) {
        showConfigStatus('配置没有变化', 'error');
        return;
    }
    
    elements.configButton.disabled = true;
    elements.configButton.textContent = '配置中...';
    
    try {
        const response = await fetch('/.netlify/functions/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ totalNumbers: newTotalNumbers })
        });
        
        const data = await response.json();
        
        if (data.success) {
            totalNumbers = newTotalNumbers;
            initializeNumbersGrid();
            updateStatus();
            showConfigStatus(data.message, 'success');
        } else {
            showConfigStatus(data.message || '配置失败', 'error');
            elements.totalNumbers.value = totalNumbers; // 恢复原值
        }
    } catch (error) {
        console.error('配置更新错误:', error);
        showConfigStatus('网络错误，请重试', 'error');
        elements.totalNumbers.value = totalNumbers; // 恢复原值
    } finally {
        elements.configButton.disabled = false;
        elements.configButton.textContent = '确认配置';
    }
}

// 初始化号码网格
function initializeNumbersGrid() {
    elements.numbersGrid.innerHTML = '';
    for (let i = 1; i <= totalNumbers; i++) {
        const cell = document.createElement('div');
        cell.className = 'number-cell available';
        cell.textContent = i;
        cell.id = `number-${i}`;
        elements.numbersGrid.appendChild(cell);
    }
}

// 绑定事件
function bindEvents() {
    elements.configButton.addEventListener('click', handleConfigUpdate);
    elements.drawButton.addEventListener('click', handleDraw);
    elements.exportButton.addEventListener('click', exportToCSV);
    elements.resetButton.addEventListener('click', showResetModal);
    elements.confirmReset.addEventListener('click', confirmReset);
    elements.cancelReset.addEventListener('click', hideResetModal);
    
    // 回车键支持
    elements.classNumber.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleDraw();
        }
    });
    
    elements.totalNumbers.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleConfigUpdate();
        }
    });
    
    elements.resetPassword.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            confirmReset();
        }
    });
    
    // 点击模态框外部关闭
    elements.resetModal.addEventListener('click', function(e) {
        if (e.target === elements.resetModal) {
            hideResetModal();
        }
    });
}

// 处理抽签
async function handleDraw() {
    const classNumber = elements.classNumber.value.trim();
    
    if (!classNumber) {
        showResult('请先输入班级号！', 'error');
        return;
    }
    
    // 检查是否已经抽完
    if (drawnNumbers.size >= totalNumbers) {
        showResult('所有号码已被抽完！', 'error');
        return;
    }
    
    elements.drawButton.disabled = true;
    elements.drawButton.textContent = '抽签中...';
    
    try {
        const response = await fetch('/.netlify/functions/draw', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ classNumber })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 检查是否需要更新配置
            if (data.totalNumbers && data.totalNumbers !== totalNumbers) {
                totalNumbers = data.totalNumbers;
                elements.totalNumbers.value = totalNumbers;
                initializeNumbersGrid();
            }
            
            // 更新本地状态
            drawnNumbers.add(data.number);
            participants.push({
                classNumber: data.classNumber,
                number: data.number,
                timestamp: data.timestamp
            });
            
            // 更新界面
            updateNumbersGrid();
            updateResultsTable();
            updateStatus();
            updateConfigUI(); // 更新配置界面状态
            
            showResult(`恭喜！您抽到了 ${data.number} 号`, 'success');
            elements.classNumber.value = '';
        } else {
            showResult(data.message || '抽签失败，请重试', 'error');
        }
    } catch (error) {
        console.error('抽签错误:', error);
        showResult('网络错误，请检查连接后重试', 'error');
    } finally {
        elements.drawButton.disabled = false;
        elements.drawButton.textContent = '抽签';
    }
}

// 显示结果信息
function showResult(message, type) {
    elements.result.textContent = message;
    elements.result.className = `result ${type}`;
    
    // 3秒后清除结果
    setTimeout(() => {
        if (elements.result.textContent === message) {
            elements.result.textContent = '';
            elements.result.className = 'result';
        }
    }, 3000);
}

// 更新号码网格显示
function updateNumbersGrid() {
    for (let i = 1; i <= totalNumbers; i++) {
        const cell = document.getElementById(`number-${i}`);
        if (cell) {
            if (drawnNumbers.has(i)) {
                cell.className = 'number-cell taken';
                // 显示班级号
                const participant = participants.find(p => p.number === i);
                if (participant) {
                    cell.textContent = `${i}\n${participant.classNumber}`;
                    cell.style.fontSize = '0.9em';
                    cell.style.lineHeight = '1.2';
                }
            } else {
                cell.className = 'number-cell available';
                cell.textContent = i;
                cell.style.fontSize = '';
                cell.style.lineHeight = '';
            }
        }
    }
}

// 更新结果表格
function updateResultsTable() {
    elements.resultsBody.innerHTML = '';
    
    // 按班级和号码排序
    const sortedParticipants = [...participants].sort((a, b) => {
        if (a.classNumber !== b.classNumber) {
            return a.classNumber.localeCompare(b.classNumber);
        }
        return a.number - b.number;
    });
    
    sortedParticipants.forEach((participant, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${participant.classNumber}</td>
            <td>${participant.number}</td>
            <td>${new Date(participant.timestamp).toLocaleString('zh-CN')}</td>
        `;
        elements.resultsBody.appendChild(row);
    });
}

// 更新状态显示
function updateStatus() {
    if (participants.length === 0) {
        elements.statusText.textContent = '等待开始';
        isLotteryActive = false;
    } else if (participants.length >= totalNumbers) {
        elements.statusText.textContent = '抽签完成';
        isLotteryActive = false;
    } else {
        elements.statusText.textContent = '进行中';
        isLotteryActive = true;
    }
    
    elements.participantCount.textContent = `已抽签人数: ${participants.length}/${totalNumbers}`;
}

// 导出CSV
function exportToCSV() {
    if (participants.length === 0) {
        showResult('暂无数据可导出', 'error');
        return;
    }
    
    const headers = ['序号', '班级号', '抽中号码', '抽签时间'];
    const csvContent = [
        headers.join(','),
        ...participants
            .sort((a, b) => {
                if (a.classNumber !== b.classNumber) {
                    return a.classNumber.localeCompare(b.classNumber);
                }
                return a.number - b.number;
            })
            .map((participant, index) => [
                index + 1,
                `"${participant.classNumber}"`,
                participant.number,
                `"${new Date(participant.timestamp).toLocaleString('zh-CN')}"`
            ].join(','))
    ].join('\n');
    
    // 添加BOM以支持中文
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `抽签结果_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showResult('CSV文件已导出', 'success');
}

// 显示重置模态框
function showResetModal() {
    elements.resetModal.style.display = 'block';
    elements.resetPassword.value = '';
    elements.resetPassword.focus();
}

// 隐藏重置模态框
function hideResetModal() {
    elements.resetModal.style.display = 'none';
    elements.resetPassword.value = '';
}

// 确认重置
async function confirmReset() {
    const password = elements.resetPassword.value;
    
    if (password !== '12345678') {
        showResult('密码错误！', 'error');
        elements.resetPassword.value = '';
        elements.resetPassword.focus();
        return;
    }
    
    try {
        const response = await fetch('/.netlify/functions/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 重置本地状态
            drawnNumbers.clear();
            participants = [];
            
            // 重新加载配置和界面
            await loadConfig();
            updateResultsTable();
            updateStatus();
            hideResetModal();
            
            showResult('抽签已重新开始！', 'success');
        } else {
            showResult(data.message || '重置失败', 'error');
        }
    } catch (error) {
        console.error('重置错误:', error);
        showResult('网络错误，请重试', 'error');
    }
}

// 加载抽签状态
async function loadLotteryState() {
    try {
        const response = await fetch('/.netlify/functions/state');
        const data = await response.json();
        
        if (data.success && data.state) {
            // 恢复状态
            drawnNumbers = new Set(data.state.drawnNumbers || []);
            participants = data.state.participants || [];
            
            // 更新配置
            if (data.state.totalNumbers) {
                totalNumbers = data.state.totalNumbers;
                elements.totalNumbers.value = totalNumbers;
            }
            
            // 检查是否已开始抽签
            if (participants.length > 0) {
                isConfigLocked = true;
            }
            
            // 更新界面
            updateNumbersGrid();
            updateResultsTable();
            updateStatus();
            updateConfigUI();
        }
    } catch (error) {
        console.error('加载状态错误:', error);
        // 初始化为空状态
        drawnNumbers = new Set();
        participants = [];
        updateStatus();
    }
}

// 定期同步状态（可选，用于多用户同步）
setInterval(loadLotteryState, 30000); // 每30秒同步一次状态