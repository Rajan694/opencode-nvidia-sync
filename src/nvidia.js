const BASE_URL = process.env.NVIDIA_BASE_URL;

export async function getModels() {
  const response = await fetch(`${BASE_URL}/models`, {
    headers: {
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error('Unable to fetch NVIDIA models.');
  }

  const json = await response.json();

  return json.data.map((m) => m.id).sort();
}
