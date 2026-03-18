export default async function handler(req, res) {
  // CORS 헤더 설정 (기존 유지)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { keywords, level } = req.body;
  if (!keywords?.trim()) return res.status(400).json({ error: "키워드를 입력해주세요." });

  // Vercel 환경 변수에서 구글 API 키를 가져옵니다.
  const API_KEY = process.env.GOOGLE_API_KEY;
  
  // ✅ 할당량 오류를 피하기 위해 가장 안정적인 무료 모델로 변경했습니다.
  const MODEL_NAME = "gemini-1.5-flash"; 

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `당신은 대한민국 IT 교육 과정 기획 전문가입니다. 
                     KT DS 컨소시엄 수요조사용 교육 과정명 5개를 생성해주세요.

                     키워드: ${keywords}
                     수준: ${level}

                     조건:
                     - 실무에서 바로 쓸 수 있을 것 같은 매력적인 과정명
                     - 수준(${level})이 과정명에 자연스럽게 반영될 것
                     - 너무 길지 않게 (20자 내외)
                     - 다양한 각도로 5개 제안
                     - 시간(H) 표기 절대 포함하지 말 것

                     응답 형식:
                     반드시 다른 설명 없이 아래 JSON 배열 형식으로만 응답하세요:
                     ["과정명1","과정명2","과정명3","과정명4","과정명5"]`
            }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Gemini API 오류");

    // 제미나이 응답에서 텍스트 추출 및 파싱
    const text = data.candidates[0].content.parts[0].text;
    const titles = JSON.parse(text);

    if (!Array.isArray(titles) || titles.length === 0) throw new Error("데이터 형식이 올바르지 않습니다.");
    
    res.status(200).json({ titles });

  } catch (e) {
    res.status(500).json({ error: e.message || "서버 오류가 발생했습니다." });
  }
}
