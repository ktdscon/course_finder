export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { keywords, level } = req.body;
  if (!keywords?.trim()) return res.status(400).json({ error: "키워드를 입력해주세요." });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: "You are an IT education curriculum expert in Korea. Output ONLY a valid JSON array of strings. No markdown, no code blocks, no explanation. Just raw JSON.",
        messages: [{
          role: "user",
          content: `KT DS 컨소시엄 수요조사용 교육 과정명 5개를 생성해주세요.

키워드: ${keywords}
수준: ${level}
시도: ${Math.floor(Math.random() * 10000)}

조건:
- 실무에서 바로 쓸 수 있을 것 같은 매력적인 과정명
- 수준(${level})이 과정명에 자연스럽게 반영될 것
- 너무 길지 않게 (20자 내외)
- 다양한 각도로 5개 제안
- 시간(H) 표기 절대 포함하지 말 것

아래 JSON 배열 형식으로만 응답하세요:
["과정명1","과정명2","과정명3","과정명4","과정명5"]`
        }],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Claude API 오류");

    const text = (data.content?.[0]?.text || "").trim().replace(/```json|```/g, "").trim();
    let titles;
    try { titles = JSON.parse(text); }
    catch { const m = text.match(/\[[\s\S]*\]/); titles = m ? JSON.parse(m[0]) : null; }

    if (!Array.isArray(titles) || titles.length === 0) throw new Error("파싱 실패");
    res.status(200).json({ titles });

  } catch (e) {
    res.status(500).json({ error: e.message || "서버 오류" });
  }
}