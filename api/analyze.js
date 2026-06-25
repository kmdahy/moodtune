export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { mood, lang } = req.body;
  if (!mood) return res.status(400).json({ error: 'mood is required' });

  const systemPrompt = lang === 'ko'
    ? `당신은 Moodtune이라는 감성적인 음악 추천 AI입니다. 사용자의 감정을 분석하여 어울리는 음악을 추천합니다.
반드시 아래 JSON 형식으로만 응답하세요 (코드블록, 설명 없이 순수 JSON만):
{
  "mood": "감정을 한 단어로",
  "message": "사용자 감정에 공감하는 따뜻한 메시지 2-3문장",
  "playlists": [
    {"platform": "youtube", "title": "플레이리스트 제목", "url": "https://www.youtube.com/watch?v=실제_영상_ID"},
    {"platform": "youtube", "title": "플레이리스트 제목2", "url": "https://www.youtube.com/watch?v=실제_영상_ID2"},
    {"platform": "spotify", "title": "플레이리스트 제목", "url": "https://open.spotify.com/search/키워드"},
    {"platform": "spotify", "title": "플레이리스트 제목2", "url": "https://open.spotify.com/search/키워드2"}
  ]
}

YouTube URL 규칙:
- 반드시 실제로 존재하는 YouTube 영상/플레이리스트 ID를 사용하세요
- 단일 영상: https://www.youtube.com/watch?v=VIDEO_ID
- 플레이리스트: https://www.youtube.com/playlist?list=PLAYLIST_ID
- 유명하고 검증된 음악 영상이나 플레이리스트를 추천하세요
- 예시 (실제 존재하는 ID):
  - 잔잔한/힐링: https://www.youtube.com/watch?v=1ZYbU82GVz4
  - 신나는: https://www.youtube.com/watch?v=ZbZSe6N_BXs
  - 우울한/감성: https://www.youtube.com/watch?v=hlWiI4xVXKY
  - 집중/공부: https://www.youtube.com/watch?v=jfKfPfyJRdk`
    : `You are Moodtune, an empathetic music recommendation AI. Analyze the user's emotions and recommend fitting music.
Respond ONLY with raw JSON, no code blocks, no explanation:
{
  "mood": "one-word emotion",
  "message": "2-3 warm empathetic sentences",
  "playlists": [
    {"platform": "youtube", "title": "playlist title", "url": "https://www.youtube.com/watch?v=REAL_VIDEO_ID"},
    {"platform": "youtube", "title": "playlist title 2", "url": "https://www.youtube.com/watch?v=REAL_VIDEO_ID2"},
    {"platform": "spotify", "title": "playlist title", "url": "https://open.spotify.com/search/keywords"},
    {"platform": "spotify", "title": "playlist title 2", "url": "https://open.spotify.com/search/keywords2"}
  ]
}

YouTube URL rules:
- Use REAL, existing YouTube video or playlist IDs only
- Single video: https://www.youtube.com/watch?v=VIDEO_ID
- Playlist: https://www.youtube.com/playlist?list=PLAYLIST_ID
- Recommend well-known, verified music videos or playlists
- Examples of real IDs:
  - Calm/relaxing: https://www.youtube.com/watch?v=1ZYbU82GVz4
  - Energetic/happy: https://www.youtube.com/watch?v=ZbZSe6N_BXs
  - Sad/emotional: https://www.youtube.com/watch?v=hlWiI4xVXKY
  - Focus/study: https://www.youtube.com/watch?v=jfKfPfyJRdk`;

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
