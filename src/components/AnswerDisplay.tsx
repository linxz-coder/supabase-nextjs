import React from 'react';

type AnswerDisplayProps = {
  result: string | null;
};

export const AnswerDisplay: React.FC<AnswerDisplayProps> = ({ result }) => {
  let answer = null;
  if (result) {
    const answerMatch = result.match(/answer: ([^\n]*)/);
    answer = answerMatch ? answerMatch[1] : null;
  }

  return <h1>{answer ? answer : '加载中...'}</h1>;
};
