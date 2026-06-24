export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mood, lang } = req.body;

  if (!mood) {
    return res.status(400).json({ error: 'mood is required' });
  }

  const systemPrompt = lang === 'ko'
    ? `당신은 Moodtune이라는 감성적인 음악 추천 AI입니다. 사용자의 감정을 분석하여 어울리는 음악을 추천합니다.
반드시 아래 JSON 형식으로만 응답하세요 (코드블록, 설명 없이 순수 JSON만):
{
  "mood": "감정을 한 단어로",
  "message": "사용자 감정에 공감하는 따뜻한 메시지 2-3문장",
  "playlists": [
    {"platform": "youtube", "title": "플레이리스트 제목", "url": "https://www.youtube.com/results?search_query=키워드"},
    {"platform": "youtube", "title": "플레이리스트 제목2", "url": "https://www.youtube.com/results?search_query=키워드2"},
    {"platform": "spotify", "title": "플레이리스트 제목", "url": "https://open.spotify.com/search/키워드"},
    {"platform": "spotify", "title": "플레이리스트 제목2", "url": "https://open.spotify.com/search/키워드2"}
  ]
}`
    : `You are Moodtune, an empathetic music recommendation AI. Analyze the user's emotions and recommend fitting music.
Respond ONLY with raw JSON, no code blocks, no explanation:
{
  "mood": "one-word emotion",
  "message": "2-3 warm empathetic sentences",
  "playlists": [
    {"platform": "youtube", "title": "playlist title", "url": "https://www.youtube.com/results?search_query=keywords"},
    {"platform": "youtube", "title": "playlist title 2", "url": "https://www.youtube.com/results?search_query=keywords2"},
    {"platform": "spotify", "title": "playlist title", "url": "https://open.spotify.com/search/keywords"},
    {"platform": "spotify", "title": "playlist title 2", "url": "https://open.spotify.com/search/keywords2"}
  ]
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: lang === 'ko' ? `사용자 감정: ${mood}` : `User mood: ${mood}` }]
      })
    });

    const data = await response.json();
    const raw = data.content[0].text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(raw);
    return res.status(200).json(result);

  } catch (e) {
    return res.status(500).json({ error: 'API call failed' });
  }
}
