"use client"
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseClient } from "@supabase/supabase-js";

const privateKey = process.env.NEXT_PUBLIC_SUPABASE_PRIVATE_KEY;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const run = async (callback: (chunk: string) => void) => {
  console.log("run start");
  const client = new SupabaseClient(url, privateKey);
  const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });

  const store = new SupabaseVectorStore(embeddings, {
    client,
    tableName: "documents",
    queryName: 'match_documents',
  });

  const query = "得了抑郁症怎么办？";
  const match_documents = await store.similaritySearch(query);
  const searchResult = match_documents[0].pageContent;
  const answerMatch = searchResult.match(/answer: ([^\n]*)/);
  const answer = answerMatch[1];
  console.log(answer);
  // console.log(searchResult);

  // 调用OpenAI函数并等待结果
  await generateOpenAIResponse(query, answer, callback);
  console.log("genterateOpenAIResponse done");
  console.log("run end");
};

const generateOpenAIResponse = async (query: string, answer: string, callback: (chunk: string) => void) => {
  const API_URL = "https://api.openai.com/v1/chat/completions";
  const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  const prompt = `
    根据用户的问题和参考答案，最终输出回答。要求简短切题，且尽可能有趣地回复。用户问题和参考答案会用{}来表示。
    用户问题：${query}, 参考答案：${answer}
  `;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      stream: true,
    }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let resultText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");
    const parsedLines = lines
      .map((line) => line.replace(/^data: /, "").trim())
      .filter((line) => line !== "" && line !== "[DONE]")
      .map((line) => JSON.parse(line));

    for (const parsedLine of parsedLines) {
      const { choices } = parsedLine;
      const { delta } = choices[0];
      if (delta && delta.content) {
        // resultText += delta.content;
        callback(delta.content);
      }
    }
  }

  // return resultText;
};
