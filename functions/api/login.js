export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { username, password, rememberMe } = await request.json();
    
    // 验证基本输入
    if (!username || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: '用户名和密码不能为空'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 速率限制：同一用户名 1 分钟内最多 5 次尝试
    const rateLimitKey = `rate_limit_${username}`;
    const windowMs = 60 * 1000; // 1 分钟窗口
    const maxAttempts = 5;
    
    if (env.RATE_LIMIT_STORAGE) {
      const rateLimitSetting = await env.RATE_LIMIT_STORAGE.get(rateLimitKey);
      const now = Date.now();
      
      let recentAttempts = [];
      
      if (rateLimitSetting) {
        // 过滤掉过期的尝试记录
        recentAttempts = JSON.parse(rateLimitSetting).filter(t => now - t < windowMs);
      }
      
      if (recentAttempts.length >= maxAttempts) {
        const oldestAttempt = recentAttempts[0];
        const retryAfter = Math.ceil((oldestAttempt + windowMs - now) / 1000);
        return new Response(JSON.stringify({
          success: false,
          error: '尝试次数过多，请等待 ' + retryAfter + ' 秒后再试'
        }), {
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter)
          }
        });
      }
      
      // 记录本次尝试
      recentAttempts.push(now);
      await env.RATE_LIMIT_STORAGE.put(rateLimitKey, JSON.stringify(recentAttempts), {
        expirationTtl: windowMs
      });
    }
    
    // 验证用户名和密码
    if (username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD) {
      // 登录成功，清除速率限制记录
      if (env.RATE_LIMIT_STORAGE) {
        await env.RATE_LIMIT_STORAGE.delete(rateLimitKey);
      }
      
      // 生成token
      const timestamp = Date.now();
      // 如果选择了"记住我"，标记token类型
      const tokenType = rememberMe ? 'long' : 'short';
      const tokenData = timestamp + '_' + tokenType + '_' + env.JWT_SECRET;
      const encoder = new TextEncoder();
      const data = encoder.encode(tokenData);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
      const token = timestamp + '.' + tokenType + '.' + hash;
      
      return new Response(JSON.stringify({
        success: true,
        token: token,
        username: username
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid credentials'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Bad request'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

