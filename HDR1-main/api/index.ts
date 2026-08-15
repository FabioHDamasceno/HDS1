import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

// ---------------------------------------------------------------------------
// Gemini client helpers
// ---------------------------------------------------------------------------

function getGeminiApiKey(): string | undefined {
  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.API_KEY_GEMINI ||
    process.env.NEXT_PUBLIC_API_KEY_GEMINI ||
    process.env.API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.API_GEMINI_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.VITE_API_KEY_GEMINI ||
    process.env.VITE_GOOGLE_API_KEY;

  if (!rawKey) return undefined;
  const cleaned = rawKey.trim().replace(/^["']|["']$/g, '').trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

// Lazy singleton – re-instantiates only if the key changes between hot-reloads
let aiClient: GoogleGenAI | null = null;
let lastApiKey: string | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      'A chave da API Gemini não foi encontrada. Configure a variável GEMINI_API_KEY nas Environment Variables do Vercel e faça um novo Redeploy.'
    );
  }
  if (!aiClient || lastApiKey !== apiKey) {
    lastApiKey = apiKey;
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Model priority list – uses stable, existing model names
const FALLBACK_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}): Promise<{ text: string; modelUsed: string }> {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return { text: response.text || '{}', modelUsed: model };
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || err?.details || '');
      const isRetryable =
        err?.status === 503 ||
        err?.status === 429 ||
        errMsg.includes('503') ||
        errMsg.includes('429') ||
        errMsg.includes('high demand') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('temporarily unavailable') ||
        errMsg.includes('RESOURCE_EXHAUSTED');

      if (isRetryable) {
        console.warn(`[Gemini Fallback] Modelo ${model} indisponível (${err?.status ?? 'timeout'}). A tentar próximo...`);
        await new Promise((r) => setTimeout(r, 300));
        continue;
      }
      // Non-retryable error (e.g. invalid key) – fail fast
      throw err;
    }
  }

  throw lastError;
}

function cleanAndParseJson(text: string): any {
  if (!text) return {};
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// CORS helper
// ---------------------------------------------------------------------------

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handleHealth(_req: VercelRequest, res: VercelResponse) {
  res.json({ status: 'ok', service: 'OficinaAuto PT Engine' });
}

async function handleAiStatus(_req: VercelRequest, res: VercelResponse) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return res.json({
      configured: false,
      message:
        'Chave GEMINI_API_KEY não configurada nas Environment Variables do Vercel. Adicione-a em Settings → Environment Variables e faça Redeploy.',
    });
  }

  try {
    const { modelUsed } = await generateContentWithFallback({
      contents: 'ping: responda apenas OK em JSON: {"status":"OK"}',
      config: { responseMimeType: 'application/json' },
    });
    res.json({
      configured: true,
      model: modelUsed,
      status: 'online',
      message: `Assistente Gemini (${modelUsed}) ativo e operacional!`,
    });
  } catch (error: any) {
    console.error('Erro ao validar GEMINI_API_KEY:', error);
    const errMsg = String(error?.message || '');
    const is503 =
      errMsg.includes('503') ||
      errMsg.includes('high demand') ||
      errMsg.includes('UNAVAILABLE');

    if (is503) {
      return res.json({
        configured: true,
        model: 'gemini-2.0-flash',
        status: 'busy',
        message: 'Chave configurada. Servidores Google com tráfego elevado — tente novamente.',
      });
    }

    res.json({
      configured: false,
      model: 'gemini-2.0-flash',
      status: 'error',
      message: error.message || 'Erro ao conectar à API do Gemini.',
    });
  }
}

async function handleGemini(req: VercelRequest, res: VercelResponse) {
  const prompt = req.body?.prompt || req.body?.message || req.body?.contents;
  if (!prompt) {
    return res.status(400).json({ error: "O campo 'prompt' é obrigatório no corpo do pedido." });
  }

  try {
    const { text, modelUsed } = await generateContentWithFallback({
      contents: String(prompt),
    });
    return res.status(200).json({ output: text, text, model: modelUsed });
  } catch (error: any) {
    console.error('Erro no endpoint /api/gemini:', error);
    return res.status(500).json({ error: error.message || 'Erro ao processar prompt com Gemini.' });
  }
}

async function handleDiagnose(req: VercelRequest, res: VercelResponse) {
  const { dtcCode, symptoms, vehicleInfo } = req.body ?? {};

  const prompt = `Atue como um Engenheiro Mecânico Automóvel e Mestre Mecânico em Portugal com especialização em diagnóstico OBD-II, eletrónica automóvel e mecânica geral.
Análise solicitada para o seguinte veículo e sintomatologia:
Veículo: ${vehicleInfo || 'Não especificado'}
Código DTC / OBD-II: ${dtcCode || 'Nenhum código fornecido'}
Sintomas / Descrição do Cliente: ${symptoms || 'Sem sintomas detalhados'}

Forneça uma resposta estritamente em JSON no seguinte formato:
{
  "diagnosticoResumo": "Breve resumo técnico claro em Português de Portugal",
  "nivelGravidade": "Baixa" | "Média" | "Alta" | "Crítica",
  "causasProvaveis": ["Causa 1", "Causa 2", "Causa 3"],
  "passosDiagnostico": ["Passo 1 para verificar", "Passo 2", "Passo 3"],
  "pecasRecomendadas": [
    { "nome": "Nome da peça", "referenciaProvavel": "Ref OEM ex: 03L115561", "estimativaPrecoEur": 25.50 }
  ],
  "tempoMaoDeObraHoras": 1.5,
  "recomendacoesCliente": "Recomendações amigáveis e claras para transmitir ao cliente da oficina"
}`;

  try {
    const { text } = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosticoResumo: { type: Type.STRING },
            nivelGravidade: { type: Type.STRING },
            causasProvaveis: { type: Type.ARRAY, items: { type: Type.STRING } },
            passosDiagnostico: { type: Type.ARRAY, items: { type: Type.STRING } },
            pecasRecomendadas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  nome: { type: Type.STRING },
                  referenciaProvavel: { type: Type.STRING },
                  estimativaPrecoEur: { type: Type.NUMBER },
                },
                required: ['nome', 'estimativaPrecoEur'],
              },
            },
            tempoMaoDeObraHoras: { type: Type.NUMBER },
            recomendacoesCliente: { type: Type.STRING },
          },
          required: [
            'diagnosticoResumo', 'nivelGravidade', 'causasProvaveis',
            'passosDiagnostico', 'pecasRecomendadas', 'tempoMaoDeObraHoras',
            'recomendacoesCliente',
          ],
        },
      },
    });

    res.json(cleanAndParseJson(text));
  } catch (error: any) {
    console.error('Erro no diagnóstico AI:', error);
    res.status(500).json({ error: 'Falha ao gerar diagnóstico assistido.', details: error.message || String(error) });
  }
}

async function handlePreventivePlan(req: VercelRequest, res: VercelResponse) {
  const { make, model, year, fuelType, currentKm } = req.body ?? {};

  const prompt = `Como perito automóvel no mercado europeu/português, crie o plano de manutenção preventiva recomendado para um ${make} ${model} (${year}), motorização ${fuelType || 'Gasóleo'}, com ${currentKm} km registados.

Formato do JSON de resposta:
{
  "planoResumo": "Resumo do estado recomendado para esta quilometragem",
  "itensObrigatorios": [
    { "item": "Mudar Óleo 5W30 + Filtro", "motivo": "Intervalo de 15.000km / 1 ano atingido", "custoEstimadoPecas": 45.0 }
  ],
  "itensRecomendadosVerificacao": [
    { "item": "Verificação de travões e calços", "urgencia": "Média" }
  ],
  "alertaCorreiaDistribuição": "Informação sobre troca de correia/corrente de distribuição para este modelo e Km",
  "proximaInspecaoKm": ${Number(currentKm) + 15000}
}`;

  try {
    const { text } = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planoResumo: { type: Type.STRING },
            itensObrigatorios: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  motivo: { type: Type.STRING },
                  custoEstimadoPecas: { type: Type.NUMBER },
                },
                required: ['item', 'motivo', 'custoEstimadoPecas'],
              },
            },
            itensRecomendadosVerificacao: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  urgencia: { type: Type.STRING },
                },
                required: ['item', 'urgencia'],
              },
            },
            alertaCorreiaDistribuição: { type: Type.STRING },
            proximaInspecaoKm: { type: Type.NUMBER },
          },
          required: [
            'planoResumo', 'itensObrigatorios', 'itensRecomendadosVerificacao',
            'alertaCorreiaDistribuição', 'proximaInspecaoKm',
          ],
        },
      },
    });

    res.json(cleanAndParseJson(text));
  } catch (error: any) {
    console.error('Erro no plano preventivo AI:', error);
    res.status(500).json({ error: 'Falha ao gerar plano preventivo.', details: error.message || String(error) });
  }
}

async function handleParseDocument(req: VercelRequest, res: VercelResponse) {
  const { text, imageBase64, mimeType } = req.body ?? {};

  const contentsParts: any[] = [];
  if (imageBase64) {
    contentsParts.push({
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
      },
    });
  }
  contentsParts.push({
    text: `Extraia as informações desta fatura/orçamento ou nota de oficina em formato JSON:
${text || 'Analise o documento fornecido em anexo.'}

JSON schema:
{
  "fornecedor": "Nome da empresa/oficina",
  "nifFornecedor": "NIF com 9 dígitos se disponível",
  "dataDocumento": "YYYY-MM-DD",
  "matricula": "AA-00-AA ou similar se identificada",
  "itens": [
    { "descricao": "Nome da peça ou serviço", "quantidade": 1, "precoUnitarioEur": 12.5, "taxaIva": 23 }
  ],
  "totalComIva": 0.00
}`,
  });

  try {
    const { text: textRes } = await generateContentWithFallback({
      contents: { parts: contentsParts },
      config: { responseMimeType: 'application/json' },
    });
    res.json(cleanAndParseJson(textRes));
  } catch (error: any) {
    console.error('Erro no parser de documento:', error);
    res.status(500).json({ error: 'Falha ao ler documento com IA.', details: error.message || String(error) });
  }
}

async function handlePartCompatibility(req: VercelRequest, res: VercelResponse) {
  const { partCode, partName, brand, category, stockQty, locationInWorkshop } = req.body ?? {};

  const prompt = `Como Especialista em Catálogo de Peças Automóveis e Referências OEM no Mercado Europeu / Português:

Analise a seguinte peça em stock ou código fornecido:
- Código / Referência OEM ou EAN: ${partCode || 'Não especificado'}
- Nome da Peça: ${partName || 'Não especificado'}
- Marca / Fabricante: ${brand || 'Desconhecida'}
- Categoria Técnica: ${category || 'Geral'}
- Quantidade em Stock: ${stockQty !== undefined && stockQty !== null ? stockQty : 'Desconhecida'}
- Localização na Oficina: ${locationInWorkshop || 'Não indicada'}

Retorne a lista detalhada de modelos de veículos compatíveis (marcas, modelos, anos, motorizações e códigos de motor) que esta peça atende, juntamente com referências cruzadas e notas de montagem técnica.

Formato estrito do JSON:
{
  "nomePeca": "Nome técnico completo da peça",
  "codigoRef": "Código de referência OEM ou Aftermarket principal",
  "marca": "Marca/Fabricante identificada",
  "categoria": "Categoria técnica",
  "resumoCompatibilidade": "Resumo sintético do grupo de veículos e motorizações compatíveis",
  "veiculosCompativeis": [
    {
      "marca": "Marca do Veículo",
      "modelos": "Modelos aplicáveis ex: Golf VII, Passat B8, A3",
      "anos": "Anos ex: 2012-2020",
      "motorizacao": "Motorizações ex: 1.6 TDI (105cv) / 2.0 TDI (150cv)",
      "codigosMotor": "Códigos de motor ex: CXXB, CLHA, CRLB",
      "observacoes": "Observações de encaixe ou variantes"
    }
  ],
  "referenciasCruzadas": [
    { "fabricante": "OEM VAG / BMW / Mercedes / etc", "codigo": "Ref equivalente" }
  ],
  "instrucoesMontagem": ["Recomendação de montagem 1", "Recomendação de montagem 2"],
  "alertaTecnico": "Aviso técnico opcional ou incompatibilidades conhecidas"
}`;

  try {
    const { text: textRes } = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nomePeca: { type: Type.STRING },
            codigoRef: { type: Type.STRING },
            marca: { type: Type.STRING },
            categoria: { type: Type.STRING },
            resumoCompatibilidade: { type: Type.STRING },
            veiculosCompativeis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  marca: { type: Type.STRING },
                  modelos: { type: Type.STRING },
                  anos: { type: Type.STRING },
                  motorizacao: { type: Type.STRING },
                  codigosMotor: { type: Type.STRING },
                  observacoes: { type: Type.STRING },
                },
                required: ['marca', 'modelos', 'anos', 'motorizacao'],
              },
            },
            referenciasCruzadas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  fabricante: { type: Type.STRING },
                  codigo: { type: Type.STRING },
                },
                required: ['fabricante', 'codigo'],
              },
            },
            instrucoesMontagem: { type: Type.ARRAY, items: { type: Type.STRING } },
            alertaTecnico: { type: Type.STRING },
          },
          required: [
            'nomePeca', 'codigoRef', 'resumoCompatibilidade',
            'veiculosCompativeis', 'referenciasCruzadas', 'instrucoesMontagem',
          ],
        },
      },
    });

    res.json(cleanAndParseJson(textRes));
  } catch (error: any) {
    console.error('Erro na consulta de compatibilidade de peça AI:', error);
    res.status(500).json({ error: 'Falha ao consultar compatibilidade de peças com IA.', details: error.message || String(error) });
  }
}

// ---------------------------------------------------------------------------
// Main Vercel Serverless Handler
// Routes all /api/* requests from vercel.json rewrite
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Normalise path: strip leading /api so we match "/health", "/ai/status", etc.
  const rawPath = (req.url ?? '/').split('?')[0];
  const path = rawPath.replace(/^\/api/, '') || '/';

  try {
    // GET routes
    if (req.method === 'GET') {
      if (path === '/health' || path === '/' || path === '') return handleHealth(req, res);
      if (path === '/ai/status') return handleAiStatus(req, res);
    }

    // POST routes
    if (req.method === 'POST') {
      if (path === '/gemini' || path === '/api/gemini') return handleGemini(req, res);
      if (path === '/ai/diagnose') return handleDiagnose(req, res);
      if (path === '/ai/preventive-plan') return handlePreventivePlan(req, res);
      if (path === '/ai/parse-document') return handleParseDocument(req, res);
      if (path === '/ai/part-compatibility') return handlePartCompatibility(req, res);
    }

    // 404 for unknown routes
    res.status(404).json({ error: 'Rota da API não encontrada.', path: rawPath });
  } catch (err: any) {
    console.error('Erro inesperado no handler:', err);
    res.status(500).json({ error: 'Erro interno no servidor.', message: err?.message || String(err) });
  }
}
