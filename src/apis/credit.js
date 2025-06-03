import request from '../utils/request'

/**
 * 获取代理商下拉选项（支持名称模糊搜索）
 * @param {Object} params 请求参数
 * @param {string} [params.name] 代理商名称关键字
 * @param {number} [params.id] 代理商ID
 * @returns {Promise} 返回请求Promise
 */
export function getAgentOptions(params) {
  return request({
    url: '/admin/agent/options',
    method: 'get',
    params
  })
}

/**
 * 为代理商充值信用额度
 * @param {Object} data 充值信息
 * @param {number} data.agentId 代理商ID
 * @param {number} data.amount 充值金额
 * @param {string} data.note 备注
 * @returns {Promise} 返回请求Promise
 */
export function topupAgentCredit(data) {
  // 确保agentId是数字类型
  if (!data || !data.agentId) {
    console.error('充值缺少必要参数:', data);
    return Promise.reject(new Error('缺少必要参数：代理商ID'));
  }
  
  const agentId = parseInt(data.agentId);
  
  if (isNaN(agentId)) {
    console.error('无效的代理商ID:', data.agentId);
    return Promise.reject(new Error('无效的代理商ID'));
  }
  
  if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
    console.error('无效的充值金额:', data.amount);
    return Promise.reject(new Error('请输入有效的充值金额'));
  }
  
  console.log('发起充值请求:', {
    agentId,
    amount: data.amount,
    note: data.note || '管理员充值'
  });
  
  return request({
    url: `/admin/credits/topup/${agentId}`,
    method: 'post',
    params: {
      amount: data.amount,
      note: data.note || '管理员充值'
    }
  }).then(response => {
    console.log('充值响应:', response);
    if (response.code !== 1) {
      // 处理后端业务逻辑错误
      if (response.msg && response.msg.includes('不存在')) {
        throw new Error('代理商信用额度信息不存在，请联系管理员先创建信用额度记录');
      } else {
        throw new Error(response.msg || '充值失败');
      }
    }
    return response;
  }).catch(error => {
    console.error('充值请求失败:', error);
    throw error;
  });
}

/**
 * 获取代理商列表（用于充值时选择）
 * @returns {Promise} 返回请求Promise
 */
export function getAgentList() {
  return request({
    url: '/admin/agent/list',
    method: 'get'
  })
}

/**
 * 获取信用交易记录
 * @param {Object} params 请求参数
 * @param {number} [params.page] 页码
 * @param {number} [params.pageSize] 每页记录数
 * @param {string} [params.transactionType] 交易类型
 * @param {number} [params.agentId] 代理商ID
 * @param {string} [params.startDate] 开始日期
 * @param {string} [params.endDate] 结束日期
 * @returns {Promise} 返回请求Promise
 */
export function getCreditTransactions(params) {
  return request({
    url: '/admin/credits/transactions',
    method: 'get',
    params
  })
}

/**
 * 获取所有代理商的信用额度信息
 * @param {Object} params 请求参数
 * @param {number} [params.page] 页码
 * @param {number} [params.pageSize] 每页记录数
 * @param {string} [params.agentName] 代理商名称（模糊查询）
 * @returns {Promise} 返回请求Promise
 */
export function getAllAgentCredits(params) {
  return request({
    url: '/admin/credits/agents',
    method: 'get',
    params
  })
}

/**
 * 获取代理商信用额度详情
 * @param {number} agentId 代理商ID
 * @returns {Promise} 返回请求Promise
 */
export function getAgentCreditDetail(agentId) {
  // 确保agentId是数字类型
  if (!agentId) {
    console.error('获取代理商信用额度详情缺少必要参数:', agentId);
    return Promise.reject(new Error('缺少必要参数：代理商ID'));
  }
  
  const validAgentId = parseInt(agentId);
  
  if (isNaN(validAgentId)) {
    console.error('无效的代理商ID:', agentId);
    return Promise.reject(new Error('无效的代理商ID'));
  }
  
  console.log('获取代理商信用额度详情，ID:', validAgentId);
  
  return request({
    url: `/admin/credits/agents/${validAgentId}`,
    method: 'get'
  }).then(response => {
    console.log('获取代理商信用额度详情响应:', response);
    if (response.code !== 1) {
      // 处理后端业务逻辑错误
      if (response.msg && response.msg.includes('不存在')) {
        throw new Error('代理商信用额度信息不存在，请联系管理员先创建信用额度记录');
      } else {
        throw new Error(response.msg || '获取代理商信用额度详情失败');
      }
    }
    return response;
  }).catch(error => {
    console.error('获取代理商信用额度详情失败:', error);
    throw error;
  });
}

/**
 * 获取信用交易记录统计数据
 * @param {Object} params 请求参数
 * @param {string} [params.startDate] 开始日期
 * @param {string} [params.endDate] 结束日期
 * @param {string} [params.groupBy] 分组方式(day/month/year)
 * @returns {Promise} 返回请求Promise
 */
export function getCreditTransactionStats(params) {
  return request({
    url: '/admin/credits/transactions/stats',
    method: 'get',
    params
  })
}

/**
 * 导出信用交易记录
 * @param {Object} params 请求参数
 * @param {string} [params.transactionType] 交易类型
 * @param {number} [params.agentId] 代理商ID
 * @param {string} [params.startDate] 开始日期
 * @param {string} [params.endDate] 结束日期
 * @returns {Promise} 返回请求Promise
 */
export function exportCreditTransactions(params) {
  console.log('导出参数:', params);
  return request({
    url: '/admin/credits/transactions/export',
    method: 'get',
    params,
    responseType: 'blob',
    // 临时取消拦截器，以便能够直接获取到Excel二进制数据
    headers: {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  });
}

/**
 * 更新代理商信用额度信息
 * @param {Object} data 更新信息
 * @param {number} data.agentId 代理商ID
 * @param {number} data.totalCredit 总信用额度
 * @param {string} data.creditRating 信用评级
 * @param {number} data.interestRate 信用利率
 * @param {number} data.billingCycleDay 账单周期日
 * @param {string} data.lastSettlementDate 最后结算日期
 * @param {number} data.overdraftCount 透支次数
 * @param {boolean} data.isFrozen 是否冻结
 * @param {string} data.note 修改备注
 * @returns {Promise} 返回请求Promise
 */
export function updateAgentCredit(data) {
  // 确保agentId是数字类型
  if (!data || !data.agentId) {
    console.error('更新信用额度缺少必要参数:', data);
    return Promise.reject(new Error('缺少必要参数：代理商ID'));
  }
  
  const agentId = parseInt(data.agentId);
  
  if (isNaN(agentId)) {
    console.error('无效的代理商ID:', data.agentId);
    return Promise.reject(new Error('无效的代理商ID'));
  }
  
  console.log('发起更新信用额度请求:', data);
  
  return request({
    url: `/admin/credits/update/${agentId}`,
    method: 'put',
    data
  }).then(response => {
    console.log('更新信用额度响应:', response);
    if (response.code !== 1) {
      // 处理后端业务逻辑错误
      if (response.msg && response.msg.includes('不存在')) {
        throw new Error('代理商信用额度信息不存在，无法更新');
      } else {
        throw new Error(response.msg || '更新信用额度信息失败');
      }
    }
    return response;
  }).catch(error => {
    console.error('更新信用额度信息失败:', error);
    throw error;
  });
} 