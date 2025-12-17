const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Ensure body is parsed
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { name, email, message } = body;

  if (!process.env.NOTION_CONTACT_DB_ID) {
     return res.status(500).json({ error: '服务器配置错误: 缺少 NOTION_CONTACT_DB_ID 环境变量。' });
  }

  try {
    // Attempt to create the page
    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_CONTACT_DB_ID },
      properties: {
        // IMPORTANT: The keys here ('Name', 'Email', 'Message') MUST match 
        // the Column Names in your Notion Database exactly (Case Sensitive).
        
        // 1. Title Property (Usually the first column)
        Name: { 
          title: [{ text: { content: name || 'Anonymous' } }] 
        },
        // 2. Email Property (Type must be 'Email')
        Email: { 
          email: email || null 
        },
        // 3. Rich Text Property (Type must be 'Text')
        Message: { 
          rich_text: [{ text: { content: message || '' } }] 
        }
      },
    });

    console.log('[API/Contact] Success:', response.id);
    res.status(200).json({ success: true, id: response.id });

  } catch (error) {
    console.error('[API/Contact] Error:', JSON.stringify(error.body || error, null, 2));
    
    // --- INTELLIGENT DIAGNOSIS ---
    // If validation fails, let's fetch the DB schema to see what's actually there
    if (error.code === 'validation_error' || error.status === 400) {
        try {
            const db = await notion.databases.retrieve({ database_id: process.env.NOTION_CONTACT_DB_ID });
            const props = db.properties;
            const actualKeys = Object.keys(props);
            
            // Define what we expect
            const expectations = [
                { key: 'Name', type: 'title', label: 'Name (标题/Title)' },
                { key: 'Email', type: 'email', label: 'Email (邮箱/Email)' },
                { key: 'Message', type: 'rich_text', label: 'Message (文本/Text)' }
            ];

            const diagnosis = [];
            
            expectations.forEach(exp => {
                if (!props[exp.key]) {
                    // Check if it exists but with different case or localized name
                    const similar = actualKeys.find(k => k.toLowerCase() === exp.key.toLowerCase());
                    if (similar) {
                        diagnosis.push(`❌ 列名错误: 您的列名是 "${similar}"，代码需要 "${exp.key}" (注意首字母大写)。`);
                    } else {
                        // Check if user has default names like "Tags" or "Date"
                        if (exp.key === 'Message' && props['Tags']) {
                             diagnosis.push(`❌ 缺失 "${exp.key}" 列。建议将现有的 "Tags" 列改名为 "Message"。`);
                        } else {
                             diagnosis.push(`❌ 缺失 "${exp.key}" 列。`);
                        }
                    }
                } else if (props[exp.key].type !== exp.type) {
                    diagnosis.push(`⚠️ 类型错误: "${exp.key}" 列应该是 ${exp.type} 类型，当前是 ${props[exp.key].type} 类型。`);
                }
            });

            if (diagnosis.length > 0) {
                return res.status(400).json({
                    error: '数据库列名不匹配',
                    details: `您的 Notion 数据库设置与代码不一致:\n\n${diagnosis.join('\n')}\n\n请去 Notion 修改列名，必须完全一致。`
                });
            }
        } catch (diagErr) {
            console.error('Diagnosis failed:', diagErr);
        }
    }

    // Standard Error Handling
    if (error.code === 'object_not_found' || error.message.includes('accessible by this API bot')) {
        return res.status(500).json({ 
            error: '权限错误', 
            details: '机器人无法访问该数据库。请在 Notion 数据库页面右上角点击 ... -> Add connections -> 选择您的机器人。' 
        });
    }

    res.status(500).json({ 
        error: '提交失败', 
        details: error.message || '未知错误' 
    });
  }
}