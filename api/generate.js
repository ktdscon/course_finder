export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { keywords, level } = req.body;
  const API_KEY = process.env.GOOGLE_API_KEY;

  if (!API_KEY) return res.status(500).json({ error: "API 키 설정 필요" });

  // ✅ 따옴표 오타 방지를 위해 가장 확실한 '더하기' 방식을 사용합니다.
  const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + API_KEY;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "IT 교육 전문가로서 " + keywords + " 키워드와 " + level + " 수준에 맞는 교육 과정명 5개를 생성하세요. 다른 설명 없이 ['과정명1', '과정명2', '과정명3', '과정명4', '과정명5'] 형식의 JSON 배열로만 답변하세요."
          }]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API 호출 실패");

    let text = data.candidates[0].content.parts[0].text;
    
    // AI가 마크다운(```json)을 붙여주더라도 리스트만 쏙 뽑아냅니다.
    const jsonMatch = text.match(/\[.*\]/s); 
    if (!jsonMatch) throw new Error("결과 형식이 올바르지 않습니다.");
    
    const titles = JSON.parse(jsonMatch[0]);
    res.status(200).json({ titles });

  } catch (e) {
    res.status(500).json({ error: "데이터 처리 오류: " + e.message });
  }
}
