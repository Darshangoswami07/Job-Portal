import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Load .env if GROQ_API_KEY is not already in process.env
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
          const [key, ...valParts] = trimmed.split('=');
          const k = key.trim();
          const v = valParts.join('=').trim().replace(/^["']|["']$/g, '');
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
    'llama-3.3-70b-versatile',
    'mixtral-8x7b-32768'
  ],
  temperature: 0.2,
  maxTokens: 8192,
  retries: 3,
  timeoutMs: 120000
};

// System prompt defining the Groq Terminal Agent
const SYSTEM_PROMPT = {
  role: 'system',
  content: `You are an expert AI Engineer, Software Architect, and Terminal Agent powered by Groq.
You assist developers with software development, debugging, shell tasks, code generation, and system architecture.
Always provide clear, concise, accurate, and high quality technical responses.`
};

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'run_terminal_command',
      description: 'Execute a shell command in the local environment and return stdout/stderr.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'The exact terminal command to execute.' }
        },
        required: ['command']
      }
    }
  }
];

async function fetchWithRetry(url, options = {}, retries = CONFIG.retries) {
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
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

let activeModel = null;

async function resolveActiveModel() {
  if (!CONFIG.apiKey) {
    throw new Error("GROQ_API_KEY is not defined. Set GROQ_API_KEY in your environment or backend/.env.");
  }

  // Check models endpoint first
  try {
    const modelsRes = await fetchWithRetry(`${CONFIG.baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (modelsRes.ok) {
      const data = await modelsRes.json();
      const catalog = (data.data || []).map(m => m.id);

      for (const pref of CONFIG.preferredModels) {
        if (catalog.includes(pref)) {
          activeModel = pref;
          return activeModel;
        }
      }

      if (catalog.length > 0) {
        activeModel = catalog[0];
        return activeModel;
      }
    }
  } catch (e) {
    // Fallback to testing preferred models directly
  }

  // Direct test loop across fallback models
  for (const pref of CONFIG.preferredModels) {
    try {
      const res = await fetchWithRetry(`${CONFIG.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: pref,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5
        })
      }, 1);

      if (res.ok) {
        activeModel = pref;
        return activeModel;
      }
    } catch (err) {}
  }

  throw new Error("Unable to connect to any Groq model. Verify GROQ_API_KEY and network access.");
}

async function runGroqAgent() {
  console.clear();
  console.log('===========================================================');
  console.log('              ⚡ GROQ TERMINAL AI AGENT ⚡                 ');
  console.log('===========================================================');

  if (!CONFIG.apiKey) {
    console.error('\n❌ Missing GROQ_API_KEY environment variable.');
    console.error('Please set GROQ_API_KEY in system environment or backend/.env');
    console.error('Example: $env:GROQ_API_KEY="your_api_key_here"\n');
    process.exit(1);
  }

  console.log('Resolving active Groq model from fallback list...');
  try {
    const modelName = await resolveActiveModel();
    console.log(`\n✓ Active Model: \x1b[32m${modelName}\x1b[0m`);
    console.log(`✓ Endpoint:     ${CONFIG.baseUrl}`);
    console.log(`✓ Default Params: temp=${CONFIG.temperature}, max_tokens=${CONFIG.maxTokens}, timeout=120s`);
    console.log('\nType your message below (or type "exit" / "quit" to leave):');
    console.log('-----------------------------------------------------------\n');
  } catch (err) {
    console.error(`\n❌ Failed to initialize Groq Agent: ${err.message}\n`);
    process.exit(1);
  }

  const conversationHistory = [SYSTEM_PROMPT];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\x1b[36mGroqAgent>\x1b[0m '
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const userInput = line.trim();

    if (userInput.toLowerCase() === 'exit' || userInput.toLowerCase() === 'quit') {
      console.log('\nGoodbye!');
      process.exit(0);
    }

    if (!userInput) {
      rl.prompt();
      return;
    }

    conversationHistory.push({ role: 'user', content: userInput });

    try {
      process.stdout.write('\x1b[33mGroq>\x1b[0m ');
      
      const res = await fetchWithRetry(`${CONFIG.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: activeModel,
          messages: conversationHistory,
          temperature: CONFIG.temperature,
          max_tokens: CONFIG.maxTokens,
          stream: true,
          tools: TOOLS,
          tool_choice: 'auto'
        })
      });

      if (!res.ok) {
        const errorMsg = await res.text();
        console.error(`\n❌ API Error (${res.status}): ${errorMsg}`);
        rl.prompt();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullAssistantContent = '';
      let toolCallAccumulator = [];
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const rawLine of lines) {
          const trimmed = rawLine.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta || {};

              if (delta.content) {
                process.stdout.write(delta.content);
                fullAssistantContent += delta.content;
              }

              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index || 0;
                  if (!toolCallAccumulator[idx]) {
                    toolCallAccumulator[idx] = { id: tc.id, type: 'function', function: { name: tc.function?.name || '', arguments: '' } };
                  }
                  if (tc.function?.arguments) {
                    toolCallAccumulator[idx].function.arguments += tc.function.arguments;
                  }
                }
              }
            } catch (e) {}
          }
        }
      }

      console.log(''); // newline after stream

      // Handle assistant response history
      if (fullAssistantContent) {
        conversationHistory.push({ role: 'assistant', content: fullAssistantContent });
      }

      // Handle tool call execution if requested by model
      if (toolCallAccumulator.length > 0) {
        for (const tc of toolCallAccumulator) {
          if (tc.function.name === 'run_terminal_command') {
            try {
              const args = JSON.parse(tc.function.arguments);
              console.log(`\n\x1b[35m[Tool Call Request]: Executing "${args.command}"\x1b[0m`);
              const { stdout, stderr } = await execAsync(args.command);
              const toolOutput = stdout || stderr || '(no output)';
              console.log(`\x1b[32m[Tool Output]:\x1b[0m\n${toolOutput.trim()}`);

              conversationHistory.push({
                role: 'assistant',
                content: null,
                tool_calls: [tc]
              });
              conversationHistory.push({
                role: 'tool',
                tool_call_id: tc.id,
                content: toolOutput
              });
            } catch (cmdErr) {
              console.error(`\x1b[31m[Tool Execution Error]: ${cmdErr.message}\x1b[0m`);
            }
          }
        }
      }

    } catch (err) {
      console.error(`\n❌ Request Exception: ${err.message}`);
    }

    console.log('');
    rl.prompt();
  });
}

runGroqAgent();
