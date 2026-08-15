/**
 * Helper to execute API requests and safely parse JSON responses,
 * preventing 'Unexpected token < / T in JSON' syntax errors when a proxy or server returns an HTML page.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options?.headers || {}),
      },
    });

    const contentType = res.headers.get('content-type') || '';
    const rawText = await res.text();

    // Check if the response is an HTML page (e.g. 404, Vite fallback, server error)
    const trimmed = rawText.trim();
    if (
      !contentType.includes('application/json') &&
      (trimmed.startsWith('<') ||
        trimmed.startsWith('<!DOCTYPE') ||
        trimmed.startsWith('The page') ||
        trimmed.includes('<html'))
    ) {
      return {
        ok: false,
        status: res.status,
        error:
          'O servidor retornou uma página HTML em vez de dados JSON. Se estiver a rodar fora do Google AI Studio, certifique-se de que o backend Node.js (Express) está a correr (`npm start` ou `npm run dev`) para responder às rotas /api.',
      };
    }

    let parsedData: any = {};
    if (trimmed.length > 0) {
      try {
        parsedData = JSON.parse(trimmed);
      } catch (parseErr) {
        return {
          ok: false,
          status: res.status,
          error: `Resposta do servidor inválida (não é JSON): ${trimmed.slice(0, 120)}...`,
        };
      }
    }

    if (!res.ok) {
      const rawErr =
        parsedData?.details ||
        parsedData?.error ||
        parsedData?.message;

      let errorMessage = `Erro do servidor (Código HTTP ${res.status})`;
      if (typeof rawErr === 'string') {
        errorMessage = rawErr;
      } else if (rawErr && typeof rawErr === 'object') {
        errorMessage =
          rawErr.message ||
          rawErr.details ||
          (typeof rawErr.code !== 'undefined'
            ? `Erro ${rawErr.code}: ${rawErr.message || 'Falha na resposta'}`
            : JSON.stringify(rawErr));
      }

      return {
        ok: false,
        status: res.status,
        data: parsedData,
        error: errorMessage,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: parsedData as T,
    };
  } catch (networkErr: any) {
    return {
      ok: false,
      status: 0,
      error: networkErr?.message || 'Falha de ligação à rede ou ao servidor backend.',
    };
  }
}
