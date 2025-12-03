// GET all bookmarks
export async function onRequestGet(context) {
  const { env, request } = context;
  
  try {
    // 检查是否已登录
    const authHeader = request.headers.get('Authorization');
    const isAuthenticated = authHeader && authHeader.startsWith('Bearer ');
    
    // 获取 publicMode 设置
    const publicModeSetting = await env.DB.prepare(
      'SELECT value FROM settings WHERE key = ?'
    ).bind('publicMode').first();
    
    const publicMode = publicModeSetting?.value !== 'false';
    
    // 如果是非公开模式且未登录，返回空数组
    if (!publicMode && !isAuthenticated) {
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    let query = `
      SELECT b.*, c.name as category_name
      FROM bookmarks b
      LEFT JOIN categories c ON b.category_id = c.id
    `;
    
    // 未登录只能看到公开书签
    if (!isAuthenticated) {
      query += ` WHERE b.is_private = 0`;
    }
    
    query += ` ORDER BY b.category_id, b.position`;
    
    const { results } = await env.DB.prepare(query).all();
    
    return new Response(JSON.stringify({ data: results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch bookmarks' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST create bookmark
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { name, url, description, icon, category_id, is_private, tags, notes } = await request.json();
    
    // 检查 URL 是否已存在
    const existingBookmark = await env.DB.prepare(
      `SELECT b.id, b.name, b.url, b.category_id, c.name as category_name 
       FROM bookmarks b 
       LEFT JOIN categories c ON b.category_id = c.id 
       WHERE b.url = ? 
       LIMIT 1`
    ).bind(url.trim()).first();
    
    if (existingBookmark) {
      return new Response(JSON.stringify({
        success: false,
        duplicate: true,
        error: '该 URL 已存在',
        existingBookmark: {
          id: existingBookmark.id,
          name: existingBookmark.name,
          url: existingBookmark.url,
          category_id: existingBookmark.category_id,
          category_name: existingBookmark.category_name
        }
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 获取该分类下的最大position
    const { position: maxPosition } = await env.DB.prepare(
      'SELECT COALESCE(MAX(position), -1) as position FROM bookmarks WHERE category_id = ?'
    ).bind(category_id).first();
    
    const newPosition = (maxPosition || -1) + 1;
    const isPrivate = is_private ? 1 : 0;
    
    const result = await env.DB.prepare(
      'INSERT INTO bookmarks (name, url, description, icon, category_id, position, is_private, tags, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(name, url, description || null, icon || null, category_id, newPosition, isPrivate, tags || '', notes || '').run();
    
    return new Response(JSON.stringify({
      success: true,
      id: result.meta.last_row_id
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create bookmark' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

