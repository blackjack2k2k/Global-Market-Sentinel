import { GoogleGenAI } from "@google/genai";
import { MarketEvent, StockTicker, ImpactType, Severity } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Improved JSON cleaner that handles markdown blocks and ignores citations like [1]
const cleanJsonString = (str: string): string => {
  // 1. Try to extract from markdown code block first
  const jsonBlockMatch = str.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1];
  }

  // 2. Find the start of the JSON array.
  // We look for a '[' that is followed closely by a '{' to distinguish it from citations like [1] or [Source].
  let startIndex = -1;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '[') {
        // Look ahead for the next non-whitespace character
        let j = i + 1;
        while (j < str.length && /\s/.test(str[j])) j++;
        
        // If we find a '{', this is definitely our JSON array of objects
        if (j < str.length && str[j] === '{') {
            startIndex = i;
            break;
        }
    }
  }

  const endIndex = str.lastIndexOf(']');
  
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    return str.substring(startIndex, endIndex + 1);
  }
  
  // 3. Fallback: If strict `[{` pattern fails (e.g. empty array or weird formatting), try simple bracket finding
  const simpleStart = str.indexOf('[');
  if (simpleStart !== -1 && endIndex !== -1 && endIndex > simpleStart) {
      return str.substring(simpleStart, endIndex + 1);
  }

  return str;
};

// Retry helper to handle 500 errors by switching models
async function generateWithRetry(
  prompt: string, 
  primaryModel: string, 
  fallbackModel: string
): Promise<any> {
    const config = { tools: [{ googleSearch: {} }] };
    
    try {
        const response = await ai.models.generateContent({
            model: primaryModel,
            contents: prompt,
            config: config
        });
        return response;
    } catch (error: any) {
        // Check for server errors (500 Internal, 503 Unavailable)
        if (error.status === 500 || error.code === 500 || error.message?.includes('Internal error') || error.status === 503) {
            console.warn(`Primary model ${primaryModel} failed with 500/503. Retrying with ${fallbackModel}...`);
             const response = await ai.models.generateContent({
                model: fallbackModel,
                contents: prompt,
                config: config
            });
            return response;
        }
        throw error;
    }
}

export const fetchMarketIntelligence = async (keywords: string[]): Promise<MarketEvent[]> => {
  try {
    const keywordString = keywords.length > 0 ? keywords.join(", ") : "宏观经济, 地缘政治";
    
    // Use gemini-3-pro-preview for deep reasoning, fallback to gemini-2.5-flash for stability
    const primaryModel = 'gemini-3-pro-preview';
    const fallbackModel = 'gemini-2.5-flash';

    const prompt = `
      你是一位资深金融分析师。
      任务：搜索过去24小时内对美股市场有重大影响的国际新闻、地缘政治事件或宏观经济变化。
      关注领域：${keywordString}。
      
      对于发现的每个事件：
      1. 分析其对美股市场的影响严重程度。
      2. 找出直接受影响的美股代码（或ETF）。
      3. 判断是利好（BULLISH）还是利空（BEARISH）。
      4. 用中文提供简明的理由。

      输出格式：
      严格返回一个有效的 JSON 对象数组。
      **不要包含任何开场白（如"根据最新消息..."）或结尾语。直接以 "[" 开始。**
      
      JSON 结构必须是：
      [
        {
          "title": "事件标题（中文）",
          "summary": "2句话摘要（中文）",
          "region": "来源地区（如：中国、欧洲、中东）",
          "severity": "HIGH" | "MEDIUM" | "LOW",
          "affectedStocks": [
            {
              "symbol": "AAPL",
              "name": "Apple Inc.",
              "impact": "BULLISH" | "BEARISH" | "NEUTRAL",
              "reasoning": "为什么受影响（中文）"
            }
          ]
        }
      ]
    `;

    const response = await generateWithRetry(prompt, primaryModel, fallbackModel);

    return parseResponse(response.text, response.candidates?.[0]?.groundingMetadata?.groundingChunks);

  } catch (error) {
    console.error("Gemini Service Error (fetchMarketIntelligence):", error);
    throw error;
  }
};

export const fetchGlobalTrends = async (): Promise<MarketEvent[]> => {
  try {
    const primaryModel = 'gemini-3-pro-preview';
    const fallbackModel = 'gemini-2.5-flash';

    const prompt = `
      你是一位全球宏观策略师。
      任务：识别当前世界上影响全球金融市场的“十大关键趋势”（Top 10 Global Trends）。
      这些趋势可以是长期的（如人工智能革命、能源转型）或短期的剧烈变化（如某地战争升级）。

      输出格式：
      严格返回一个包含10个对象的有效 JSON 数组。全部使用简体中文。
      **不要包含任何开场白或结尾语。直接以 "[" 开始。**
      
      JSON 结构必须是：
      [
        {
          "title": "趋势名称（中文）",
          "summary": "趋势描述及其对全球经济的影响（中文）",
          "region": "全球",
          "severity": "HIGH",
          "affectedStocks": [
            {
              "symbol": "相关的代表性股票代码",
              "name": "公司名称",
              "impact": "BULLISH" | "BEARISH",
              "reasoning": "为何该标的受此趋势影响（中文）"
            }
          ]
        }
      ]
    `;

    const response = await generateWithRetry(prompt, primaryModel, fallbackModel);

    return parseResponse(response.text, response.candidates?.[0]?.groundingMetadata?.groundingChunks);
  } catch (error) {
    console.error("Gemini Trends Error (fetchGlobalTrends):", error);
    throw error;
  }
};

const parseResponse = (text: string, groundingChunks: any[] | undefined): MarketEvent[] => {
    // Extract grounding metadata if available (source links)
    const sources = (groundingChunks || [])
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web !== undefined)
      .map((web: any) => ({ title: web!.title || '来源', uri: web!.uri || '#' }));

    // Parse the JSON content
    let parsedData: any[] = [];
    const cleanedText = cleanJsonString(text);
    
    if (!cleanedText) {
       console.error("Empty response text after cleaning");
       throw new Error("Empty response from AI model.");
    }

    try {
      parsedData = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse Gemini JSON response. Raw:", text, "Cleaned:", cleanedText);
      throw new Error("Failed to parse market intelligence data.");
    }

    // Map to our strictly typed interface
    return parsedData.map((item: any, index: number) => ({
      id: `evt-${Date.now()}-${index}`,
      title: item.title,
      summary: item.summary,
      region: item.region || "Global",
      timestamp: new Date().toISOString(),
      severity: (item.severity as Severity) || Severity.MEDIUM,
      sources: sources.slice(0, 3), 
      affectedStocks: Array.isArray(item.affectedStocks) ? item.affectedStocks.map((stock: any) => ({
        symbol: stock.symbol,
        name: stock.name,
        impact: (stock.impact as ImpactType) || ImpactType.NEUTRAL,
        reasoning: stock.reasoning
      })) : []
    }));
}

export const generateEmailContent = async (event: MarketEvent, userEmail: string): Promise<string> => {
  // Use flash for simple text generation tasks
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    起草一封发送给 ${userEmail} 的专业且紧急的金融快讯邮件。
    语言：简体中文。
    
    主题: ${event.title}
    严重程度: ${event.severity}
    摘要: ${event.summary}
    受影响资产: ${event.affectedStocks.map(s => `${s.symbol} (${s.impact})`).join(', ')}.
    
    语气应客观、专业且具有可操作性。
    请使用 HTML 标签进行排版（使用 <b>, <br>, <ul>, <li> 等）。
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text;
};