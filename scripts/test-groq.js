import fs from 'fs';
import path from 'path';

// Helper to load .env file if GROQ_API_KEY is not set in environment
function loadEnv() {
  if (process.env.GROQ_API_KEY) return;
  
  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend', '.env'),
    path.resolve(process.cwd(), '..', 'backend', '.env')
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const k = key.trim();
          const v = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          if (k && v && !process.env[k]) {
            process.env[k] = v;
          }
        }
      }
    }
  }
}

loadEnv();

const CONFIG = {
  baseUrl: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
  preferredModels: [
    'openai/gpt-oss-120b',
    'qwen/qwen3.6-27b',
    'openai/gpt-oss-20b',
    'llama-3.3-70b',
    'llama-3.3-70b-versatile'
  ],
  temperature: 0.2,
  maxTokens: 8192,
  retries: 3,
  timeoutMs: 120000
};

async function fetchWithTimeoutAndRetry(url, options = {}, retries = CONFIG.retries) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === retries) throw err;
      console.log(`[Attempt ${attempt}/${retries} failed: ${err.message}. Retrying...]`);
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

async function validateGroq() {
  console.log('====================================================');
  console.log('            GROQ API INTEGRATION TESTER             ');
  console.log('====================================================\n');

  if (!CONFIG.apiKey) {
    console.error('❌ ERROR: GROQ_API_KEY environment variable is missing.');
    console.error('Please set GROQ_API_KEY in your system environment or in backend/.env:');
    console.error('  export GROQ_API_KEY="your_groq_api_key"  (Linux/macOS)');
    console.error('  $env:GROQ_API_KEY="your_groq_api_key"      (PowerShell)\n');
    return false;
  }

  console.log('✓ API Key detected (hidden for security)');
  console.log(`✓ Base URL: ${CONFIG.baseUrl}`);
  console.log(`✓ Preferred Fallback Sequence: ${CONFIG.preferredModels.join(' -> ')}`);
  console.log(`✓ Parameters: temperature=${CONFIG.temperature}, max_tokens=${CONFIG.maxTokens}, timeout=${CONFIG.timeoutMs / 1000}s, retries=${CONFIG.retries}\n`);

  // Step 1: List Available Models from Groq API
  console.log('--- Step 1: Verifying API Connection & Fetching Available Models ---');
  let availableModels = [];
  try {
    const modelsRes = await fetchWithTimeoutAndRetry(`${CONFIG.baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!modelsRes.ok) {
      const errText = await modelsRes.text();
      console.error(`❌ Authentication/Connection Failed (${modelsRes.status}): ${errText}`);
      return false;
    }

    const modelsData = await modelsRes.json();
    availableModels = (modelsData.data || []).map(m => m.id);
    console.log(`✓ Connection successful! Found ${availableModels.length} models on Groq endpoint.`);
  } catch (err) {
    console.error(`❌ Network error while connecting to ${CONFIG.baseUrl}:`, err.message);
    return false;
  }

  // Step 2: Select Model with Fallback Logic
  console.log('\n--- Step 2: Selecting Model from Fallback Chain ---');
  let selectedModel = null;
  for (const candidate of CONFIG.preferredModels) {
    if (availableModels.includes(candidate)) {
      selectedModel = candidate;
      console.log(`✓ Matched model in Groq catalog: "${selectedModel}"`);
      break;
    }
  }

  if (!selectedModel) {
    console.log('ℹ Testing preferred candidates directly against chat completions API...');
    for (const candidate of CONFIG.preferredModels) {
      try {
        const testRes = await fetchWithTimeoutAndRetry(`${CONFIG.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CONFIG.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: candidate,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 5
          })
        }, 1);

        if (testRes.ok) {
          selectedModel = candidate;
          console.log(`✓ Candidate model "${selectedModel}" responded successfully!`);
          break;
        } else {
          console.log(`  - Candidate "${candidate}" unavailable (${testRes.status}). Trying next fallback...`);
        }
      } catch (e) {
        console.log(`  - Candidate "${candidate}" error: ${e.message}`);
      }
    }
  }

  if (!selectedModel && availableModels.length > 0) {
    selectedModel = availableModels[0];
    console.log(`⚠ Defaulting to active available Groq model: "${selectedModel}"`);
  }

  if (!selectedModel) {
    console.error('❌ Could not select a valid model from Groq API.');
    return false;
  }

  console.log(`⭐ Active Selected Model: "${selectedModel}"`);

  // Step 3: Test Standard Prompt Response
  console.log('\n--- Step 3: Testing Standard Response ("Hello from Groq") ---');
  try {
    const chatRes = await fetchWithTimeoutAndRetry(`${CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: 'Hello from Groq' }],
        temperature: CONFIG.temperature,
        max_tokens: 100
      })
    });

    if (!chatRes.ok) {
      console.error(`❌ Chat Completion failed (${chatRes.status}):`, await chatRes.text());
      return false;
    }

    const chatData = await chatRes.json();
    const reply = chatData.choices?.[0]?.message?.content;
    console.log(`✓ Response received from model (${selectedModel}):`);
    console.log(`  "${reply.trim()}"`);
  } catch (err) {
    console.error(`❌ Standard prompt failed:`, err.message);
    return false;
  }

  // Step 4: Test Streaming Response
  console.log('\n--- Step 4: Testing Streaming Output ---');
  try {
    const streamRes = await fetchWithTimeoutAndRetry(`${CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: 'Count from 1 to 5 briefly.' }],
        temperature: CONFIG.temperature,
        stream: true
      })
    });

    if (!streamRes.ok) {
      console.error(`❌ Streaming request failed (${streamRes.status}):`, await streamRes.text());
    } else {
      process.stdout.write('  Stream output: ');
      const reader = streamRes.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              const chunk = parsed.choices?.[0]?.delta?.content || '';
              process.stdout.write(chunk);
            } catch (e) {
              // Ignore parse error on partial lines
            }
          }
        }
      }
      console.log('\n✓ Streaming test complete!');
    }
  } catch (err) {
    console.error(`❌ Streaming failed:`, err.message);
  }

  // Step 5: Test Tool / Function Calling
  console.log('\n--- Step 5: Testing Tool Calling ---');
  try {
    const toolRes = await fetchWithTimeoutAndRetry(`${CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: 'What is the weather in Tokyo?' }],
        tools: [{
          type: 'function',
          function: {
            name: 'get_current_weather',
            description: 'Get current weather for a given city',
            parameters: {
              type: 'object',
              properties: {
                location: { type: 'string', description: 'City name' }
              },
              required: ['location']
            }
          }
        }],
        tool_choice: 'auto'
      })
    });

    if (toolRes.ok) {
      const toolData = await toolRes.json();
      const toolCalls = toolData.choices?.[0]?.message?.tool_calls;
      if (toolCalls && toolCalls.length > 0) {
        console.log(`✓ Tool calling supported! Model requested tool call: "${toolCalls[0].function.name}" with args: ${toolCalls[0].function.arguments}`);
      } else {
        console.log('ℹ Tool calling supported by API endpoint, model answered directly.');
      }
    } else {
      console.log(`ℹ Tool calling response status (${toolRes.status}).`);
    }
  } catch (err) {
    console.log(`ℹ Tool calling error:`, err.message);
  }

  console.log('\n====================================================');
  console.log('✓ GROQ API INTEGRATION VALIDATION COMPLETED!');
  console.log('====================================================\n');
  return true;
}

validateGroq();
