import pLimit from 'p-limit';

const BASE_URL = process.env.NVIDIA_BASE_URL;

const TIMEOUT = Number(process.env.TIMEOUT || 12000);

const limit = pLimit(Number(process.env.CONCURRENCY || 5));

async function test(model) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, TIMEOUT);

  const start = performance.now();

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: 'Reply with OK',
          },
        ],
        temperature: 0,
        max_tokens: 5,
      }),
    });

    clearTimeout(timeout);

    return {
      model,
      ok: response.ok,
      latency: Math.round(performance.now() - start),
    };
  } catch (err) {
    clearTimeout(timeout);

    return {
      model,
      ok: false,
      latency: Math.round(performance.now() - start),
      error: err.name,
    };
  }
}

export async function testModels(models, onProgress) {
  const results = new Array(models.length);

  await Promise.all(
    models.map((model, index) =>
      limit(async () => {
        const result = await test(model);
        results[index] = result;

        if (onProgress) {
          onProgress(result, index, models.length);
        }

        return result;
      }),
    ),
  );

  return results;
}
