export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { username, password, rememberMe } = await request.json();
    
    // 验证用户名和密码
    if (username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD) {
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

