// PUT update bookmark
export async function onRequestPut(context) {
  const { request, env, params } = context;
  const id = params.id;
  
  try {
    const { name, url, description, icon, category_id, is_private, tags, notes } = await request.json();
    const isPrivate = is_private ? 1 : 0;
    
    // 检查 URL 是否被其他书签使用（排除当前书签）
    const existingBookmark = await env.DB.prepare(
      `SELECT b.id, b.name, b.url, b.category_id, c.name as category_name 
       FROM bookmarks b 
       LEFT JOIN categories c ON b.category_id = c.id 
       WHERE b.url = ? AND b.id != ? 
       LIMIT 1`
    ).bind(url.trim(), id).first();
    
    if (existingBookmark) {
      return new Response(JSON.stringify({
        success: false,
        duplicate: true,
        error: '该 URL 已被其他书签使用',
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
    
    await env.DB.prepare(
      'UPDATE bookmarks SET name = ?, url = ?, description = ?, icon = ?, category_id = ?, is_private = ?, tags = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(name, url, description || null, icon || null, category_id, isPrivate, tags || '', notes || '', id).run();
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update bookmark' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE bookmark
export async function onRequestDelete(context) {
  const { env, params } = context;
  const id = params.id;
  
  try {
    await env.DB.prepare('DELETE FROM bookmarks WHERE id = ?').bind(id).run();
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete bookmark' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

